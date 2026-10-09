/* Bills and receipts: A4 / 58 mm / 80 mm layouts, print, PDF, WhatsApp. All free, all on the phone. */
import { h, toast, fdate, g3, busy } from './ui.js';
import { htmlPagesToPdf } from './pdf.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const m2 = (n) => Calc.inr(n, 2);
const m0 = (n) => Calc.inr(n);

/* ---------- GST bill / quotation ---------- */

/** Words printed on the bill, in the bill language chosen in Settings. */
const L = {
  en: { name: 'Name', village: 'Village', mob: 'Mob.', date: 'Date', no: 'No.', sr: '#', desc: 'Description', gross: 'Gross wt', net: 'Net wt',
    purity: 'Purity', hsn: 'HSN', huid: 'HUID', rate: 'Rate', making: 'Making', makingAmt: 'Making ₹', metal: 'Metal value', amount: 'Amount ₹',
    amountQ: 'Amount with making', taxable: 'Taxable value', round: 'Round off', total: 'Total', lessOld: 'Less: old', netPay: 'Net payable',
    paidToCust: 'Paid to customer', paid: 'Paid', bal: 'Balance', words: 'Amount in words', sign: 'Authorised signatory', custSign: 'Customer signature',
    note: 'Note', gstin: 'GSTIN', lno: 'L.No.', state: 'State', cut: 'cut', fine: 'fine', per10: '/10 g', perg: '/g', taxTitle: 'TAX INVOICE',
    cancelled: 'CANCELLED', for: 'For', cash: 'Cash', upi: 'UPI', baki: 'Baki' },
  mr: { name: 'नांव', village: 'गांव', mob: 'मो.', date: 'दि.', no: 'नं.', sr: 'अ.क्र.', desc: 'विवरण', gross: 'पूर्ण वजन', net: 'नेट वजन',
    purity: 'शुद्धता', hsn: 'HSN', huid: 'HUID', rate: 'दर', making: 'मजुरी', makingAmt: 'मजुरी रु.', metal: 'किंमत', amount: 'रुपये पैसे',
    amountQ: 'मजुरी सहीत', taxable: 'करपात्र रक्कम', round: 'राउंड ऑफ', total: 'एकूण', lessOld: 'वजा: जुने', netPay: 'देय रक्कम',
    paidToCust: 'ग्राहकाला दिले', paid: 'जमा', bal: 'बाकी', words: 'अक्षरी रक्कम', sign: 'सही', custSign: 'ग्राहकाची सही',
    note: 'टीप', gstin: 'GST No.', lno: 'L.No.', state: 'राज्य', cut: 'घट', fine: 'शुद्ध', per10: '/10 ग्रॅ.', perg: '/ग्रॅ.', taxTitle: 'TAX INVOICE',
    cancelled: 'रद्द', for: '', cash: 'रोख', upi: 'UPI', baki: 'बाकी' },
  hi: { name: 'नाम', village: 'गाँव', mob: 'मो.', date: 'दि.', no: 'नं.', sr: 'क्र.', desc: 'विवरण', gross: 'कुल वजन', net: 'नेट वजन',
    purity: 'शुद्धता', hsn: 'HSN', huid: 'HUID', rate: 'भाव', making: 'मजदूरी', makingAmt: 'मजदूरी रु.', metal: 'कीमत', amount: 'रुपये पैसे',
    amountQ: 'मजदूरी सहित', taxable: 'कर योग्य राशि', round: 'राउंड ऑफ', total: 'कुल', lessOld: 'घटाएं: पुराना', netPay: 'देय राशि',
    paidToCust: 'ग्राहक को दिया', paid: 'जमा', bal: 'बाकी', words: 'शब्दों में', sign: 'हस्ताक्षर', custSign: 'ग्राहक के हस्ताक्षर',
    note: 'नोट', gstin: 'GST No.', lno: 'L.No.', state: 'राज्य', cut: 'कटौती', fine: 'शुद्ध', per10: '/10 ग्रा.', perg: '/ग्रा.', taxTitle: 'TAX INVOICE',
    cancelled: 'रद्द', for: '', cash: 'नकद', upi: 'UPI', baki: 'बाकी' }
};

/** Fields shown on this bill: shop defaults (Settings) changed by the choices saved on the bill. */
export function billFields(b) {
  const base = { billNo: true, gross: true, net: true, purity: b.type === 'GST', purityInName: false, hsn: b.type === 'GST', huid: false,
    rate: true, making: true, makingAmt: false, metalValue: false, words: b.type === 'GST', payment: true, oldGold: true, sign: true };
  return Object.assign(base, (b.shop && b.shop.fields) || {}, b.printOpts || {});
}
export const FIELD_LABELS = [
  ['billNo', 'Bill number'], ['gross', 'Gross weight'], ['net', 'Net weight'], ['purity', 'Purity column'], ['purityInName', 'Purity after item name'],
  ['hsn', 'HSN'], ['huid', 'HUID'], ['rate', 'Rate'], ['making', 'Making (₹/g or %)'], ['makingAmt', 'Making amount'], ['metalValue', 'Metal value'],
  ['words', 'Amount in words'], ['payment', 'Cash / UPI / baki'], ['oldGold', 'Old gold details'], ['sign', 'Signature']
];

const mkLabel = (l, t) => (l.makingType === 'pct' ? (+l.makingPct || 0) + '%' : l.makingType === 'fixed' ? m2(l.making)
  : (+l.makingPerG ? m0(l.makingPerG) + t.perg : '—'));

function head(b, t, f) {
  const shop = b.shop || {};
  const gst = b.type === 'GST';
  const phones = String(shop.phones || shop.mobile || '').split(/\n|,/).map((x) => x.trim()).filter(Boolean);
  return `<div class="bh">
    ${shop.logo ? `<img class="logo" src="${esc(shop.logo)}" alt="">` : ''}
    <div class="bh-mid">
      <div class="bh-shop">${esc(shop.name)}</div>
      ${shop.tagline ? `<div class="bh-tag">${esc(shop.tagline)}</div>` : ''}
      ${shop.address ? `<div class="bh-addr">${esc(shop.address)}</div>` : ''}
    </div>
    <div class="bh-right">
      <div class="bh-title">${esc(gst ? t.taxTitle : (shop.title || 'QUOTATION'))}</div>
      ${gst && shop.gstin ? `<div><b>${t.gstin}: ${esc(shop.gstin)}</b></div>` : ''}
      ${phones.map((p) => `<div>${esc(p)}</div>`).join('')}
      ${shop.bis ? `<div>${t.lno}: ${esc(shop.bis)}</div>` : ''}
    </div>
  </div>`;
}

function custRow(b, t, f) {
  const cust = b.customer || { name: b.customerName, mobile: b.mobile, village: b.village };
  const no = f.billNo ? `<span class="fill"><span class="lb">${t.no}</span> <b>${esc(b.billNo)}</b></span>` : '';
  return `<div class="cust">
    <div class="crow"><span class="fill grow"><span class="lb">${t.name}:</span> <b>${esc(cust.name)}</b></span>${no}</div>
    <div class="crow"><span class="fill grow"><span class="lb">${t.village}:</span> ${esc(cust.village || cust.address || '')}</span>
      <span class="fill"><span class="lb">${t.mob}:</span> ${esc(cust.mobile || '')}</span>
      <span class="fill"><span class="lb">${t.date}:</span> ${esc(String(b.date).split('-').reverse().join('/'))}</span></div>
  </div>`;
}

function invoicePaper(b, paper) {
  const gst = b.type === 'GST';
  const shop = b.shop || {};
  const t = L[shop.lang] || L.en;
  const f = billFields(b);
  const per10 = shop.rateUnit !== 'g';
  // Gold rate per 10 g (as shops write it); silver per kg.
  const rateTxt = (l) => (l.metal === 'silver' ? (per10 ? m0(l.rate * 1000) + '<span class="sm">/kg</span>' : m0(l.rate)) : m0(per10 ? l.rate * 10 : l.rate));
  const cols = [
    ['sr', t.sr, (l, i) => i + 1, 'c'],
    ['desc', t.desc, (l) => esc(l.name) + (f.purityInName && l.purityPct ? ' ' + esc(l.purityPct) + '%' : '') + (l.tag ? `<div class="sm">${esc(l.tag)}</div>` : ''), ''],
    f.hsn && gst ? ['hsn', t.hsn, () => esc(shop.hsn || '7113'), 'c'] : null,
    f.huid ? ['huid', t.huid, (l) => esc(l.huid || ''), 'c'] : null,
    f.gross ? ['gross', t.gross, (l) => g3(l.grossWt || l.weight), 'n'] : null,
    f.net ? ['net', t.net, (l) => g3(l.weight), 'n'] : null,
    f.purity ? ['purity', t.purity, (l) => (l.purityPct ? (+l.purityPct).toFixed(2) + '%' : ''), 'n'] : null,
    f.rate ? ['rate', t.rate + (per10 ? ' ' + t.per10 : ''), rateTxt, 'n'] : null,
    f.metalValue ? ['metal', t.metal, (l) => m2(l.metalValue), 'n'] : null,
    f.making ? ['making', t.making, (l) => mkLabel(l, t), 'n'] : null,
    f.makingAmt ? ['makingAmt', t.makingAmt, (l) => m2(l.making), 'n'] : null,
    ['amount', gst ? t.amount : t.amountQ, (l) => m2(l.amount), 'n']
  ].filter(Boolean);
  const span = cols.length - 1;
  const half = Math.round(b.tax / 2 * 100) / 100; // CGST; SGST = tax − CGST so the two always add up
  const sumRow = (label, val, cls) => `<tr class="${cls || ''}"><td colspan="${span}" class="n lbl">${label}</td><td class="n">${val}</td></tr>`;
  const olds = f.oldGold ? b.oldGold.map((g) => sumRow(`${t.lessOld} ${esc(g.item)} — ${g3(g.weight)} g, ${t.cut} ${esc(g.cutPct)}%, ${t.fine} ${g3(g.customerFine)} g × ${m0(g.rate)}`, '−' + m2(g.amount))).join('')
    : (b.oldValue ? sumRow(t.lessOld, '−' + m2(b.oldValue)) : '');
  const pay = [b.cash ? t.cash + ' ' + m0(b.cash) : '', b.upi ? t.upi + ' ' + m0(b.upi) : '', b.udhaar ? t.baki + ' ' + m0(b.udhaar) : ''].filter(Boolean).join(' · ');
  return `<div class="doc bill ${paper}">
  ${head(b, t, f)}
  ${custRow(b, t, f)}
  <table class="items"><thead><tr>${cols.map((c) => `<th class="${c[3]}">${c[1]}</th>`).join('')}</tr></thead>
  <tbody>${b.lines.map((l, i) => `<tr>${cols.map((c) => `<td class="${c[3]}">${c[2](l, i)}</td>`).join('')}</tr>`).join('')}
  <tr class="filler">${cols.map(() => '<td></td>').join('')}</tr></tbody>
  <tfoot>
    ${gst ? sumRow(t.taxable, m2(b.subtotal)) + sumRow('CGST @ ' + b.gstPct / 2 + '%', m2(half)) + sumRow('SGST @ ' + b.gstPct / 2 + '%', m2(b.tax - half)) : ''}
    ${b.roundOff ? sumRow(t.round, m2(b.roundOff)) : ''}
    ${sumRow(t.total, m2(b.invoiceTotal), 'strong')}
    ${olds}
    ${b.oldValue ? sumRow(b.net >= 0 ? t.netPay : t.paidToCust, '₹' + m2(Math.abs(b.net)), 'strong') : ''}
  </tfoot></table>
  ${f.payment && pay ? `<div class="pay">${t.paid}: ${pay}</div>` : ''}
  ${f.words ? `<div class="words"><b>${t.words}:</b> Rupees ${Calc.inWords(Math.abs(b.net))} only</div>` : ''}
  ${b.notes ? `<div class="note"><b>${t.note}:</b> ${esc(b.notes)}</div>` : ''}
  ${b.status === 'void' ? `<div class="void">${t.cancelled}</div>` : ''}
  ${f.sign ? `<div class="signs"><span>${t.custSign}</span><span>${t.for ? t.for + ' ' : ''}${esc(shop.name)}<br><br>${t.sign}</span></div>` : ''}
  ${shop.terms ? `<div class="terms">${esc(shop.terms).replace(/\n/g, '<br>')}</div>` : ''}
</div>`;
}

export function invoiceHtml(b, size) {
  if (size === 'a4' || size === 'a5') return invoicePaper(b, size);
  return invoiceThermal(b, size === '80' ? 80 : 58);
}

function invoiceThermal(b, mm) {
  const gst = b.type === 'GST';
  const shop = b.shop || {};
  const t = L[shop.lang] || L.en;
  const f = billFields(b);
  const cust = b.customer || { name: b.customerName, mobile: b.mobile, village: b.village };
  const per10 = shop.rateUnit !== 'g';
  const r = (a, v, cls) => `<div class="r ${cls || ''}"><span>${a}</span><span>${v}</span></div>`;
  const half = Math.round(b.tax / 2 * 100) / 100; // CGST; SGST = tax − CGST so the two always add up
  const phones = String(shop.phones || shop.mobile || '').split(/\n|,/).map((x) => x.trim()).filter(Boolean);
  return `<div class="doc th th${mm}">
  <div class="c b big">${esc(shop.name)}</div>
  ${shop.tagline ? `<div class="c">${esc(shop.tagline)}</div>` : ''}${shop.address ? `<div class="c">${esc(shop.address)}</div>` : ''}
  ${phones.length ? `<div class="c">${phones.map(esc).join(', ')}</div>` : ''}
  ${gst && shop.gstin ? `<div class="c b">${t.gstin}: ${esc(shop.gstin)}</div>` : ''}
  <div class="hr"></div><div class="c b">${esc(gst ? t.taxTitle : (shop.title || 'QUOTATION'))}</div>
  ${f.billNo ? `<div>${t.no} ${esc(b.billNo)}</div>` : ''}<div>${t.date} ${esc(String(b.date).split('-').reverse().join('/'))}</div>
  <div class="hr"></div><div>${esc(cust.name)}${cust.village ? ', ' + esc(cust.village) : ''}</div>${cust.mobile ? `<div>${t.mob} ${esc(cust.mobile)}</div>` : ''}
  <div class="hr"></div>
  ${b.lines.map((l) => `<div class="b">${esc(l.name)}${(f.purityInName || f.purity) && l.purityPct ? ' ' + esc(l.purityPct) + '%' : ''}</div>
    ${gst && (f.hsn || (f.huid && l.huid)) ? `<div>${f.hsn ? 'HSN ' + esc(shop.hsn || '7113') : ''}${f.huid && l.huid ? ' HUID ' + esc(l.huid) : ''}</div>` : ''}
    ${f.gross && l.grossWt && l.grossWt !== l.weight ? `<div>${t.gross} ${g3(l.grossWt)}</div>` : ''}
    ${r(t.net + ' ' + g3(l.weight) + (f.rate ? ' × ' + (l.metal === 'silver' ? (per10 ? m0(l.rate * 1000) + '/kg' : m0(l.rate)) : m0(per10 ? l.rate * 10 : l.rate) + (per10 ? t.per10 : '')) : ''), m2(l.metalValue || l.amount))}
    ${l.making && f.making ? r(t.making + ' ' + mkLabel(l, t), m2(l.making)) : ''}`).join('')}
  <div class="hr"></div>
  ${gst ? r(t.taxable, m2(b.subtotal)) + r('CGST ' + b.gstPct / 2 + '%', m2(half)) + r('SGST ' + b.gstPct / 2 + '%', m2(b.tax - half)) : ''}
  ${b.roundOff ? r(t.round, m2(b.roundOff)) : ''}${r(t.total, m2(b.invoiceTotal), 'b')}
  ${b.oldGold.length ? b.oldGold.map((g) => (f.oldGold ? `<div>${t.lessOld} ${esc(g.item)} ${g3(g.weight)}g, ${t.cut} ${esc(g.cutPct)}%</div>` : '') + r(f.oldGold ? t.fine + ' ' + g3(g.customerFine) + 'g × ' + m0(g.rate) : t.lessOld, '-' + m2(g.amount))).join('') : ''}
  ${b.oldValue ? '<div class="hr"></div>' + r(b.net >= 0 ? t.netPay : t.paidToCust, m0(Math.abs(b.net)), 'b big') : ''}
  ${f.payment ? (b.cash ? r(t.cash, m0(b.cash)) : '') + (b.upi ? r(t.upi, m0(b.upi)) : '') + (b.udhaar ? r(t.baki, m0(b.udhaar)) : '') : ''}
  ${b.notes ? `<div class="hr"></div><div>${t.note}: ${esc(b.notes)}</div>` : ''}
  ${b.status === 'void' ? `<div class="c b">*** ${t.cancelled} ***</div>` : ''}
  ${shop.terms ? `<div class="hr"></div><div class="c sm">${esc(shop.terms)}</div>` : ''}
</div>`;
}

/* ---------- simple receipts (girvi, orders, repair, old gold) ---------- */

/** doc: {title, no, date, shop, customer:{name,mobile,village}, rows:[[label,value]], total:[label,value], note} */
export function receiptHtml(d, size) {
  const shop = d.shop || {};
  const cust = d.customer || {};
  if (size === 'a4' || size === 'a5') {
    return `<div class="doc a4${size === 'a5' ? ' small' : ''}"><div class="hd"><div><div class="shop">${esc(shop.name)}</div><div class="muted">${esc(shop.address || '')}</div><div class="muted">${shop.mobile ? 'Ph: ' + esc(shop.mobile) : ''}</div></div>
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

const DOC_CSS = `.listdoc{font-family:'IBM Plex Sans','Noto Sans Devanagari',Arial,sans-serif;color:#111;font-size:10px}.listdoc{width:720px}.listdoc.wide{width:1060px}.listdoc .lhd{font-size:13px;margin-bottom:6px}.listdoc .lft{text-align:right;font-size:9px;color:#555;margin-top:4px}.ltab{width:100%;border-collapse:collapse}.ltab th,.ltab td{border:1px solid #9AA7B4;padding:3px 4px;text-align:left;vertical-align:top}.ltab th{background:#EEF2F6}.ltab td.n{text-align:right;white-space:nowrap}.ltab tr{page-break-inside:avoid}

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
.doc.a4.small{width:138mm;padding:5mm;font-size:10.5px}
.a4 .bold{font-weight:700}.a4 .line{border-top:1px solid #9AA7B4;padding-top:6px}
.a4 .net{font-weight:700;font-size:15px;background:#EEF2F6;padding:6px 8px;border-radius:4px}
.a4 .ft{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px}
.a4 .sign{text-align:center}.void{font-size:22px;font-weight:700;color:#A3360F;text-align:center;border:2px solid #A3360F;padding:6px}
.doc.th{font-family:'IBM Plex Mono','Courier New',monospace;font-size:11.5px;line-height:1.4;box-sizing:border-box}
.doc.bill{font-family:'IBM Plex Sans','IBM Plex Sans Devanagari','Noto Sans Devanagari',Arial,sans-serif;color:#111;background:#fff;box-sizing:border-box;display:flex;flex-direction:column;gap:8px}
.doc.bill.a4{width:190mm;padding:7mm;font-size:12.5px}.doc.bill.a5{width:138mm;padding:5mm;font-size:10.5px}
.bill .bh{display:flex;gap:10px;align-items:center;border:1.5px solid #6b4a1f;border-radius:6px;padding:8px 10px;background:#fbf6ea}
.bill .logo{width:64px;height:64px;object-fit:contain}.bill.a5 .logo{width:48px;height:48px}
.bill .bh-mid{flex:1;text-align:center}.bill .bh-shop{font-size:2em;font-weight:700;color:#5a3a12;line-height:1.15}
.bill .bh-tag,.bill .bh-addr{font-size:.95em;color:#3b2a14}.bill .bh-right{text-align:right;font-size:.9em;line-height:1.35;min-width:28%}
.bill .bh-title{font-weight:700;letter-spacing:.06em;font-size:1.05em;color:#5a3a12}
.bill .cust{display:flex;flex-direction:column;gap:4px}.bill .crow{display:flex;gap:14px}
.bill .fill{border-bottom:1px dotted #555;padding:0 2px 2px;white-space:nowrap}.bill .fill.grow{flex:1;white-space:normal}.bill .lb{color:#5a3a12}
.bill table.items{width:100%;border-collapse:collapse}.bill th,.bill td{border:1px solid #6b4a1f;padding:4px 5px;vertical-align:top}
.bill th{background:#efe4c8;font-size:.9em;font-weight:700;color:#3b2a14}.bill .n{text-align:right;white-space:nowrap}.bill .c{text-align:center}
.bill .sm{font-size:.85em;color:#555}.bill tr.filler td{height:60px}.bill.a5 tr.filler td{height:36px}
.bill tfoot td{border-top:1px solid #6b4a1f}.bill td.lbl{color:#3b2a14}.bill tr.strong td{font-weight:700;background:#f6efdc}
.bill .pay,.bill .words,.bill .note{font-size:.95em}.bill .signs{display:flex;justify-content:space-between;margin-top:22px;font-size:.95em}
.bill .signs span:last-child{text-align:center}.bill .terms{font-size:.8em;color:#3b2a14;border-top:1px solid #c9b48a;padding-top:4px}
.th .sm{font-size:.9em}

.th58{width:54mm;padding:2mm}.th80{width:76mm;padding:2mm;font-size:12.5px}
.th .c{text-align:center}.th .b{font-weight:700}.th .big{font-size:1.15em}
.th .r{display:flex;justify-content:space-between;gap:6px}.th .hr{border-top:1px dashed #111;margin:4px 0}
`;

export function docCss() { return DOC_CSS; }

export function printDoc(html, size) {
  const page = size === 'a4' ? '@page{size:A4;margin:10mm}' : size === 'a5' ? '@page{size:A5;margin:6mm}' : `@page{size:${size === '80' ? 80 : 58}mm auto;margin:0}`;
  const frame = h('iframe', { style: { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' }, 'aria-hidden': 'true' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Sans+Devanagari:wght@400;600;700&display=swap"><style>${page}body{margin:0}${DOC_CSS}</style></head><body>${html}</body></html>`);
  doc.close();
  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 60000);
  }, 600);
}

/** Makes a PDF from a document's html. Several documents joined by manyDocs() become one page each. */
export async function pdfBlob(html, paper = 'a4', scale = 2, onProgress) {
  const parts = String(html).split(PBREAK).filter((x) => x.trim());
  const size = paper === '58' ? 'thermal58' : paper === '80' ? 'thermal80' : paper;
  return htmlPagesToPdf(parts.map((x) => `<style>${DOC_CSS}</style>${x}`), size, { scale, onProgress });
}

const PBREAK = '<div class="pbreak"></div>';
/** Many bills in one PDF, one bill per page. */
export function manyDocs(htmlList) { return htmlList.join(PBREAK); }

export async function downloadPdf(html, filename, paper) {
  const blob = await pdfBlob(html, paper);
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

/** Shares the PDF through the phone's share sheet (pick WhatsApp, then the chat). */
export async function sharePdf(html, filename, text, paper) {
  const blob = await pdfBlob(html, paper);
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
  const paper = () => { try { return localStorage.getItem('dk_paper') || 'a4'; } catch (e) { return 'a4'; } };
  return h('div', { class: 'stack' },
    h('div', { class: 'sec' }, 'SEND'),
    btn('Send PDF on WhatsApp', 'Pick the customer\'s chat, PDF goes as a file', () => sharePdf(getHtml(paper()), filename, text, paper()), 'wa', true),
    mobile ? btn('Open customer\'s chat', 'Bill summary as a message, ready to send', () => openChat(mobile, text)) : null,
    h('div', { class: 'sec' }, 'PRINT'),
    h('div', { class: 'grid g2' },
      btn('Thermal ' + size() + ' mm', 'Bluetooth receipt printer', () => printDoc(getHtml(size()), size())),
      btn(paper().toUpperCase(), 'Normal printer', () => printDoc(getHtml(paper()), paper()))),
    btn('Download PDF', 'Save on this phone or computer', () => downloadPdf(getHtml(paper()), filename, paper()), '', true));
}
