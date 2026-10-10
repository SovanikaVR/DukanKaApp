/* Reads the first sheet of an Excel (.xlsx) file or a .csv file into rows of text, on the phone, without any library.
 * .xlsx is a zip of XML files; the phone's own DecompressionStream unpacks it. */

const dec = new TextDecoder();

async function inflate(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const out = new Response(new Blob([bytes]).stream().pipeThrough(ds));
  return new Uint8Array(await out.arrayBuffer());
}

/** name -> Uint8Array for the files we need from the zip. */
async function unzip(buf, want) {
  const v = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('This is not an Excel (.xlsx) file');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true);
    const nlen = v.getUint16(p + 28, true), elen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    if (!want(name)) continue;
    const lnlen = v.getUint16(local + 26, true), lelen = v.getUint16(local + 28, true);
    const start = local + 30 + lnlen + lelen;
    const data = u8.subarray(start, start + csize);
    files[name] = method === 0 ? data : await inflate(data);
  }
  return files;
}

const colIndex = (ref) => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

async function readXlsx(buf) {
  const files = await unzip(buf, (n) => /^xl\/(sharedStrings\.xml|workbook\.xml|_rels\/workbook\.xml\.rels|worksheets\/[^/]+\.xml)$/.test(n));
  const xml = (n) => (files[n] ? new DOMParser().parseFromString(dec.decode(files[n]), 'application/xml') : null);
  const ss = xml('xl/sharedStrings.xml');
  const strings = ss ? [...ss.getElementsByTagName('si')].map((si) => [...si.getElementsByTagName('t')].map((x) => x.textContent).join('')) : [];
  // First sheet in the workbook order.
  let path = 'xl/worksheets/sheet1.xml';
  const wb = xml('xl/workbook.xml'), rels = xml('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const first = wb.getElementsByTagName('sheet')[0];
    const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
    const rel = [...rels.getElementsByTagName('Relationship')].find((r) => r.getAttribute('Id') === rid);
    if (rel) path = 'xl/' + rel.getAttribute('Target').replace(/^\/?xl\//, '').replace(/^\//, '');
  }
  const sh = xml(path) || xml(Object.keys(files).find((n) => /worksheets\//.test(n)));
  if (!sh) throw new Error('No sheet found in this file');
  const rows = [];
  for (const r of sh.getElementsByTagName('row')) {
    const row = [];
    for (const c of r.getElementsByTagName('c')) {
      const tp = c.getAttribute('t');
      const vEl = c.getElementsByTagName('v')[0];
      let val = '';
      if (tp === 's') val = strings[+(vEl ? vEl.textContent : 0)] ?? '';
      else if (tp === 'inlineStr') val = [...c.getElementsByTagName('t')].map((x) => x.textContent).join('');
      else val = vEl ? vEl.textContent : '';
      // Big numbers (mobiles) can come as 9.822041127E9
      if (/^\d(\.\d+)?E\+?\d+$/i.test(val)) val = String(Math.round(Number(val)));
      row[c.getAttribute('r') ? colIndex(c.getAttribute('r')) : row.length] = String(val).trim();
    }
    rows.push(Array.from(row, (x) => x ?? ''));
  }
  return rows;
}

function readCsv(text) {
  text = text.replace(/^﻿/, '');
  const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur.trim()); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur.trim()); rows.push(row); row = []; cur = '';
    } else cur += ch;
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows;
}

/** file (from <input type=file>) -> rows: [[cell, cell…], …] with empty rows removed. */
export async function readTable(file) {
  const buf = await file.arrayBuffer();
  const isZip = new Uint8Array(buf.slice(0, 2)).join(',') === '80,75';
  if (/\.xls$/i.test(file.name) && !isZip) throw new Error('Old .xls files cannot be read. In Excel use File → Save As → .xlsx (or .csv).');
  const rows = isZip ? await readXlsx(buf) : readCsv(dec.decode(buf));
  return rows.filter((r) => r.some((c) => String(c || '').trim()));
}
