/* Bills and receipts: A4 / 58 mm / 80 mm layouts, print, PDF, WhatsApp. All free, all on the phone. */
import { h, toast, fdate, g3, busy } from './ui.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const m2 = (n) => Calc.inr(n, 2);
const m0 = (n) => Calc.inr(n);

/* ---------- invoice / estimate ---------- */

export function invoiceHtml(b, size) {
  return size === 'a4' ? invoiceA4(b) : invoiceThermal(b, size === '80' ? 80 : 58);
}

function invoiceA4(b) {
  const gst = b.type === 'GST';
  const shop = b.shop || {};
  const cust = b.customer || { name: b.customerName, mobile: b.mobile, village: b.village };
  const lines = b.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.name)}${l.purityPct ? ' (' + esc(l.purityPct) + '%)' : ''}${l.tag ? '<br><small>Tag ' + esc(l.tag) + '</small>' : ''}</td>
    ${gst ? `<td>${esc(shop.hsn || '7113')}</td><td>${esc(l.huid || '')}</td>` : ''}
    <td class="n">${g3(l.weight)} g</td><td class="n">${m2(l.rate)}</td><td class="n">${m2(l.metalValue)}</td><td class="n">${m2(l.making)}</td><td class="n">${m2(l.amount)}</td></tr>`).join('');
  const olds = b.oldGold.map((g) => `<div class="kv"><span>Less: old ${esc(g.metal)} — ${esc(g.item)} ${g3(g.weight)} g, cut ${esc(g.cutPct)}%, fine ${g3(g.customerFine)} g × ${m0(g.rate)}</span><span>−${m2(g.amount)}</span></div>`).join('');
  const half = Math.round(b.tax / 2 * 100) / 100; // CGST; SGST = tax − CGST so the two always add up
  return `<div class="doc a4">
  <div class="hd"><div><div class="shop">${esc(shop.name)}</div>
    <div class="muted">${esc(shop.address || '')}</div>
    <div class="muted">${[shop.mobile ? 'Ph: ' + esc(shop.mobile) : '', gst && shop.gstin ? '<b>GSTIN: ' + esc(shop.gstin) + '</b>' : '',
      gst && shop.state ? 'State: ' + esc(shop.state) : ''].filter(Boolean).join(' · ')}</div></div>
    <div class="r"><div class="title">${gst ? 'TAX INVOICE' : 'ESTIMATE'}</div><div>No: <b>${esc(b.billNo)}</b></div><div>Date: ${fdate(b.date)}</div></div></div>
  <div class="two"><div><div class="cap">BILL TO</div><b>${esc(cust.name)}</b><div>${esc([cust.village, cust.mobile ? 'Mob ' + cust.mobile : ''].filter(Boolean).join(' · '))}</div>${cust.address ? '<div>' + esc(cust.address) + '</div>' : ''}</div>
    <div><div class="cap">RATE USED (per gram)</div><div>${b.rate ? '24K ' + m0(b.rate.g24) + ' · 22K ' + m0(b.rate.g22) : ''}</div>${gst && shop.state ? '<div>Place of supply: ' + esc(shop.state) + '</div>' : ''}</div></div>
  <table><tr><th>#</th><th>Description</th>${gst ? '<th>HSN</th><th>HUID</th>' : ''}<th class="n">Net wt</th><th class="n">Rate/g</th><th class="n">Metal value</th><th class="n">Making</th><th class="n">${gst ? 'Taxable' : 'Amount'}</th></tr>${lines}</table>
  <div class="sum">
    <div class="kv"><span>${gst ? 'Taxable value' : 'Items total'}</span><span>${m2(b.subtotal)}</span></div>
    ${gst ? `<div class="kv"><span>CGST @ ${b.gstPct / 2}%</span><span>${m2(half)}</span></div><div class="kv"><span>SGST @ ${b.gstPct / 2}%</span><span>${m2(b.tax - half)}</span></div>` : ''}
    ${b.roundOff ? `<div class="kv"><span>Round off</span><span>${m2(b.roundOff)}</span></div>` : ''}
    <div class="kv bold line"><span>${gst ? 'Invoice total' : 'Total'}</span><span>${m2(b.invoiceTotal)}</span></div>
    ${olds}
    <div class="kv net"><span>${b.net >= 0 ? 'Net payable' : 'Paid to customer'}</span><span>₹${m2(Math.abs(b.net))}</span></div>
    <div class="kv"><span>Paid: ${[b.cash ? 'Cash ' + m0(b.cash) : '', b.upi ? 'UPI ' + m0(b.upi) : ''].filter(Boolean).join(' · ') || '—'}</span><span>${b.udhaar ? 'Udhaar ' + m0(b.udhaar) : 'Balance 0'}</span></div>
  </div>
  <div><b>Amount in words:</b> Rupees ${Calc.inWords(Math.abs(b.net))} only</div>
  ${b.status === 'void' ? '<div class="void">CANCELLED</div>' : ''}
  <div class="ft"><div class="muted">${esc(shop.terms || '')}${gst ? '' : '<br>This is an estimate, not a tax invoice.'}</div>
    <div class="sign">For ${esc(shop.name)}<br><br><br>Authorised signatory</div></div>
</div>`;
}

function invoiceThermal(b, mm) {
  const gst = b.type === 'GST';
  const shop = b.shop || {};
  const cust = b.customer || { name: b.customerName, mobile: b.mobile, village: b.village };
  const r = (a, v, cls) => `<div class="r ${cls || ''}"><span>${a}</span><span>${v}</span></div>`;
  const half = Math.round(b.tax / 2 * 100) / 100; // CGST; SGST = tax − CGST so the two always add up
  return `<div class="doc th th${mm}">
  <div class="c b big">${esc(shop.name)}</div>
  ${shop.address ? `<div class="c">${esc(shop.address)}</div>` : ''}${shop.mobile ? `<div class="c">Ph: ${esc(shop.mobile)}</div>` : ''}
  ${gst ? `<div class="c b">GSTIN: ${esc(shop.gstin)}</div>${shop.state ? `<div class="c">State: ${esc(shop.state)}</div>` : ''}` : ''}
  <div class="hr"></div><div class="c b">${gst ? 'TAX INVOICE' : 'ESTIMATE'}</div>
  ${r('No: ' + esc(b.billNo), b.date.split('-').reverse().join('-'))}
  <div class="hr"></div><div>${esc(cust.name)}${cust.village ? ', ' + esc(cust.village) : ''}</div>${cust.mobile ? `<div>Mob: ${esc(cust.mobile)}</div>` : ''}
  <div class="hr"></div>
  ${b.lines.map((l) => `<div class="b">${esc(l.name)}${l.purityPct ? ' (' + esc(l.purityPct) + '%)' : ''}${l.tag ? ' ' + esc(l.tag) : ''}</div>
    ${gst ? `<div>HSN ${esc(shop.hsn || '7113')}${l.huid ? ' HUID ' + esc(l.huid) : ''}</div>` : ''}
    ${r('Wt ' + g3(l.weight) + 'g x ' + m0(l.rate), m2(l.metalValue))}${l.making ? r('Making ' + g3(l.weight) + 'g x ' + m0(l.makingPerG), m2(l.making)) : ''}`).join('')}
  <div class="hr"></div>
  ${r(gst ? 'Taxable value' : 'Item total', m2(b.subtotal))}
  ${gst ? r('CGST @ ' + b.gstPct / 2 + '%', m2(half)) + r('SGST @ ' + b.gstPct / 2 + '%', m2(b.tax - half)) : ''}
  ${b.roundOff ? r('Round off', m2(b.roundOff)) : ''}${gst ? r('Invoice total', m2(b.invoiceTotal), 'b') : ''}
  ${b.oldGold.length ? '<div class="b">Less: Old gold</div>' + b.oldGold.map((g) => `<div>${esc(g.item)} ${g3(g.weight)}g, cut ${esc(g.cutPct)}%</div>${r('Fine ' + g3(g.customerFine) + 'g x ' + m0(g.rate), '-' + m2(g.amount))}`).join('') : ''}
  <div class="hr"></div>
  ${r(b.net >= 0 ? (gst ? 'NET PAYABLE' : 'TO PAY') : 'PAID TO YOU', m0(Math.abs(b.net)), 'b big')}
  ${b.cash ? r('Cash', m0(b.cash)) : ''}${b.upi ? r('UPI', m0(b.upi)) : ''}${r('Balance', m0(b.udhaar || 0))}
  <div class="hr"></div>
  ${b.rate ? `<div class="c">Gold rate today: 24K ${m0(b.rate.g24)}/g</div><div class="c">22K ${m0(b.rate.g22)}/g</div><div class="hr"></div>` : ''}
  ${b.status === 'void' ? '<div class="c b">*** CANCELLED ***</div>' : ''}
  <div class="c">Thank you! Visit again.</div>${gst ? '' : '<div class="c">This is an estimate, not a tax invoice.</div>'}
</div>`;
}

/* ---------- simple receipts (girvi, orders, repair, old gold) ---------- */

/** doc: {title, no, date, shop, customer:{name,mobile,village}, rows:[[label,value]], total:[label,value], note} */
export function receiptHtml(d, size) {
  const shop = d.shop || {};
  const cust = d.customer || {};
  if (size === 'a4') {
    return `<div class="doc a4"><div class="hd"><div><div class="shop">${esc(shop.name)}</div><div class="muted">${esc(shop.address || '')}</div><div class="muted">${shop.mobile ? 'Ph: ' + esc(shop.mobile) : ''}</div></div>
      <div class="r"><div class="title">${esc(d.title)}</div>${d.no ? '<div>No: <b>' + esc(d.no) + '</b></div>' : ''}<div>Date: ${fdate(d.date)}</div></div></div>
      <div><div class="cap">CUSTOMER</div><b>${esc(cust.name)}</b><div>${esc([cust.village, cust.mobile ? 'Mob ' + cust.mobile : ''].filter(Boolean).join(' · '))}</div></div>
      <div class="sum wide">${d.rows.map(([a, v]) => `<div class="kv"><span>${esc(a)}</span><span>${esc(v)}</span></div>`).join('')}
      ${d.total ? `<div class="kv net"><span>${esc(d.total[0])}</span><span>${esc(d.total[1])}</span></div>` : ''}</div>
      ${d.note ? `<div class="muted">${esc(d.note)}</div>` : ''}
      <div class="ft"><div></div><div class="sign">For ${esc(shop.name)}<br><br><br>Authorised signatory</div></div></div>`;
  }
  const mm = size === '80' ? 80 : 58;
  return `<div class="doc th th${mm}"><div class="c b big">${esc(shop.name)}</div>${shop.mobile ? `<div class="c">Ph: ${esc(shop.mobile)}</div>` : ''}
    <div class="hr"></div><div class="c b">${esc(d.title)}</div>
    <div class="r"><span>${d.no ? 'No: ' + esc(d.no) : ''}</span><span>${esc(String(d.date).split('-').reverse().join('-'))}</span></div>
    <div class="hr"></div><div>${esc(cust.name)}${cust.village ? ', ' + esc(cust.village) : ''}</div>${cust.mobile ? `<div>Mob: ${esc(cust.mobile)}</div>` : ''}
    <div class="hr"></div>${d.rows.map(([a, v]) => `<div class="r"><span>${esc(a)}</span><span>${esc(v)}</span></div>`).join('')}
    ${d.total ? `<div class="hr"></div><div class="r b big"><span>${esc(d.total[0])}</span><span>${esc(d.total[1])}</span></div>` : ''}
    <div class="hr"></div>${d.note ? `<div class="c">${esc(d.note)}</div>` : ''}<div class="c">Thank you!</div></div>`;
}

/* ---------- print / PDF / share ---------- */

const DOC_CSS = `
.doc{font-family:'IBM Plex Sans',Arial,sans-serif;color:#111;background:#fff}
.doc.a4{width:190mm;padding:8mm;box-sizing:border-box;font-size:12px;display:flex;flex-direction:column;gap:12px}
.a4 .hd{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #1F3A5F;padding-bottom:10px}
.a4 .shop{font-size:20px;font-weight:700;color:#1F3A5F}.a4 .title{font-size:17px;font-weight:700;letter-spacing:.06em}
.a4 .r{text-align:right}.a4 .muted{color:#4A5763}.a4 .cap{font-size:10px;font-weight:600;color:#4A5763;letter-spacing:.06em}
.a4 .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.a4 table{width:100%;border-collapse:collapse}.a4 th,.a4 td{border:1px solid #9AA7B4;padding:5px;text-align:left;vertical-align:top}
.a4 th{background:#EEF2F6;font-size:10px}.a4 .n{text-align:right}
.a4 .sum{margin-left:auto;width:62%}.a4 .sum.wide{width:100%;margin:0}
.a4 .kv{display:flex;justify-content:space-between;gap:12px;padding:3px 0}
.a4 .bold{font-weight:700}.a4 .line{border-top:1px solid #9AA7B4;padding-top:6px}
.a4 .net{font-weight:700;font-size:15px;background:#EEF2F6;padding:6px 8px;border-radius:4px}
.a4 .ft{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px}
.a4 .sign{text-align:center}.void{font-size:22px;font-weight:700;color:#A3360F;text-align:center;border:2px solid #A3360F;padding:6px}
.doc.th{font-family:'IBM Plex Mono','Courier New',monospace;font-size:11.5px;line-height:1.4;box-sizing:border-box}
.th58{width:54mm;padding:2mm}.th80{width:76mm;padding:2mm;font-size:12.5px}
.th .c{text-align:center}.th .b{font-weight:700}.th .big{font-size:1.15em}
.th .r{display:flex;justify-content:space-between;gap:6px}.th .hr{border-top:1px dashed #111;margin:4px 0}
`;

export function docCss() { return DOC_CSS; }

export function printDoc(html, size) {
  const page = size === 'a4' ? '@page{size:A4;margin:10mm}' : `@page{size:${size === '80' ? 80 : 58}mm auto;margin:0}`;
  const frame = h('iframe', { style: { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' }, 'aria-hidden': 'true' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap"><style>${page}body{margin:0}${DOC_CSS}</style></head><body>${html}</body></html>`);
  doc.close();
  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 60000);
  }, 600);
}

let html2pdfReady = null;
function loadHtml2pdf() {
  if (window.html2pdf) return Promise.resolve();
  if (!html2pdfReady) {
    html2pdfReady = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.onload = res; s.onerror = () => { html2pdfReady = null; rej(new Error('Could not load the PDF maker. Check internet.')); };
      document.head.appendChild(s);
    });
  }
  return html2pdfReady;
}

/** Makes an A4 PDF blob from a document's html. */
export async function pdfBlob(html) {
  await loadHtml2pdf();
  // Rendered at full A4 width, at the top-left of the page (behind the "Making PDF" cover).
  // On a phone the screen is narrower than A4: without this the right side (amounts) was cut off.
  const holder = h('div', { style: { position: 'absolute', left: '0', top: '0', width: '760px', background: '#fff', zIndex: '-1' } });
  holder.innerHTML = `<style>${DOC_CSS}</style>${html}`;
  document.body.appendChild(holder);
  const y = window.scrollY;
  window.scrollTo(0, 0);
  try {
    const el = holder.lastElementChild;
    return await window.html2pdf().set({
      margin: 8, image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1000, width: el.scrollWidth, scrollX: 0, scrollY: 0, x: 0, y: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(el).outputPdf('blob');
  } finally { holder.remove(); window.scrollTo(0, y); }
}

export async function downloadPdf(html, filename) {
  const blob = await pdfBlob(html);
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

/** Shares the PDF through the phone's share sheet (pick WhatsApp, then the chat). */
export async function sharePdf(html, filename, text) {
  const blob = await pdfBlob(html);
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text, title: filename }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  toast('PDF downloaded. Attach it in WhatsApp from Downloads.');
  return false;
}

/** Opens the customer's WhatsApp chat with a ready message (user taps Send). */
export function openChat(mobile, text) {
  const digits = String(mobile || '').replace(/\D/g, '').slice(-10);
  const url = 'https://wa.me/' + (digits ? '91' + digits : '') + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener');
}

export function billText(b) {
  const shop = (b.shop && b.shop.name) || '';
  const lines = b.lines.map((l) => `${l.name} ${g3(l.weight)} g — ₹${m0(l.amount)}`).join('\n');
  const old = b.oldGold.length ? `\nLess old gold: −₹${m0(b.oldValue)}` : '';
  if (b.status === 'void') return `${shop}\n${b.type === 'GST' ? 'Tax invoice' : 'Estimate'} ${b.billNo} · ${fdate(b.date)}\nThis bill is CANCELLED.`;
  return `${shop}\n${b.type === 'GST' ? 'Tax invoice' : 'Estimate'} ${b.billNo} · ${fdate(b.date)}\n${lines}${b.tax ? `\nGST: ₹${m2(b.tax)}` : ''}${old}\n${b.net >= 0 ? 'Total' : 'Paid to you'}: ₹${m0(Math.abs(b.net))}${b.udhaar ? `\nBalance due: ₹${m0(b.udhaar)}` : ''}\nThank you!`;
}

/** Row of share / print buttons for any document. */
export function docActions(getHtml, opts) {
  const { filename, text, mobile } = opts;
  const btn = (label, sub, fn, cls, slow) => h('button', { class: 'opt ' + (cls || ''), type: 'button', onclick: () =>
    busy(null, fn, slow ? 'Making PDF…' : 'Please wait…') }, h('span', null, label, h('small', null, sub)));
  const size = () => { try { return localStorage.getItem('dk_thermal') || '58'; } catch (e) { return '58'; } };
  return h('div', { class: 'stack' },
    h('div', { class: 'sec' }, 'SEND'),
    btn('Send PDF on WhatsApp', 'Pick the customer\'s chat, PDF goes as a file', () => sharePdf(getHtml('a4'), filename, text), 'wa', true),
    mobile ? btn('Open customer\'s chat', 'Bill summary as a message, ready to send', () => openChat(mobile, text)) : null,
    h('div', { class: 'sec' }, 'PRINT'),
    h('div', { class: 'grid g2' },
      btn('Thermal ' + size() + ' mm', 'Bluetooth receipt printer', () => printDoc(getHtml(size()), size())),
      btn('A4 / A5', 'Normal printer', () => printDoc(getHtml('a4'), 'a4'))),
    btn('Download PDF', 'Save on this phone or computer', () => downloadPdf(getHtml('a4'), filename), '', true));
}
