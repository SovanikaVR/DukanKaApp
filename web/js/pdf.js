/* PDF maker built into the app (no download from the internet, so it is fast and works on slow networks).
 * Each document (bill, report, list page) is drawn as a picture and put on its own page, scaled to fit,
 * so nothing is ever cut on the right or split across two pages. */

const enc = new TextEncoder();

/** Draws html (with its <style>) to a canvas. The picture is exactly as wide as the document. */
export async function htmlToCanvas(html, scale = 2) {
  const box = document.createElement('div');
  box.setAttribute('style', 'position:fixed;left:-20000px;top:0;display:inline-block;background:#fff;');
  box.innerHTML = html;
  document.body.appendChild(box);
  try {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* ignore */ } }
    const w = Math.ceil(box.scrollWidth), hgt = Math.ceil(box.scrollHeight);
    const clone = box.cloneNode(true);
    clone.setAttribute('style', 'width:' + w + 'px;background:#fff;');
    const xhtml = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}"><foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject></svg>`;
    const img = new Image();
    img.decoding = 'sync';
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('Could not make the PDF picture'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
    const c = document.createElement('canvas');
    c.width = Math.round(w * scale); c.height = Math.round(hgt * scale);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { box.remove(); }
}

const PAGES = { a4: [595.28, 841.89], a5: [419.53, 595.28], a4l: [841.89, 595.28], thermal58: [164.4, 0], thermal80: [226.8, 0] };

/** pages: [{jpeg: Uint8Array, w, h}] -> PDF Blob. Each picture is fitted inside the page margins, top aligned. */
export function jpegsToPdf(pages, paper = 'a4', marginPt) {
  const [PW, PH0] = PAGES[paper] || PAGES.a4;
  if (marginPt === undefined) marginPt = PH0 ? (paper === 'a5' ? 14 : 22) : 6;
  const parts = [];
  const offsets = [];
  let length = 0;
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); length += b.length; };
  const obj = (n, body, stream) => {
    offsets[n] = length;
    push(`${n} 0 obj\n${body}\n`);
    if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); }
    push('endobj\n');
  };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = pages.length;
  // objects: 1 catalog, 2 pages, then per page: page, content, image
  const kids = pages.map((p, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Count ${n} /Kids [${kids}] >>`);
  pages.forEach((p, i) => {
    const pageN = 3 + i * 3, contN = pageN + 1, imgN = pageN + 2;
    const availW = PW - marginPt * 2;
    // Thermal paper: page as long as the receipt.
    const PH = PH0 || (p.h * availW / p.w + marginPt * 2);
    const availH = PH - marginPt * 2;
    const s = Math.min(availW / p.w, availH / p.h);
    const dw = p.w * s, dh = p.h * s;
    const x = marginPt + (availW - dw) / 2, y = PH - marginPt - dh;
    const content = enc.encode(`q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`);
    obj(pageN, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW.toFixed(2)} ${PH.toFixed(2)}] /Resources << /XObject << /Im0 ${imgN} 0 R >> >> /Contents ${contN} 0 R >>`);
    obj(contN, `<< /Length ${content.length} >>`, content);
    obj(imgN, `<< /Type /XObject /Subtype /Image /Width ${p.pw} /Height ${p.ph} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>`, p.jpeg);
  });
  const xref = length;
  const total = 3 + n * 3;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  push(x);
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}

async function canvasJpeg(c, quality) {
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', quality));
  return new Uint8Array(await blob.arrayBuffer());
}

/** htmlList: one html string per page (each includes its own <style>). onProgress(done, total) is optional. */
export async function htmlPagesToPdf(htmlList, paper = 'a4', { scale = 2, quality = 0.88, onProgress } = {}) {
  const pages = [];
  for (let i = 0; i < htmlList.length; i++) {
    const c = await htmlToCanvas(htmlList[i], scale);
    pages.push({ jpeg: await canvasJpeg(c, quality), w: c.width / scale, h: c.height / scale, pw: c.width, ph: c.height });
    c.width = c.height = 0; // free memory on phones
    if (onProgress) onProgress(i + 1, htmlList.length);
  }
  return jpegsToPdf(pages, paper);
}
