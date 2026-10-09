/* Exports: all bills of a period as PDF (one tap), and any list as an Excel (.xlsx) file or a PDF. */
import { call } from '../api.js';
import { S, isViewer } from '../state.js';
import { h, screen, field, card, seg, busy, toast, inr, fdate, todayStr, modal, icon } from '../ui.js';
import { xlsxBlob, xlsxBook } from '../xlsx.js';
import { invoiceHtml, pdfBlob, manyDocs } from '../bill.js';
import { t } from '../i18n.js';

/* ---------- files: share on the phone, else download ---------- */

async function shareFiles(files, text) {
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files, text, title: files[0].name }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  files.forEach((f) => {
    const a = h('a', { href: URL.createObjectURL(f), download: f.name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  });
  toast(t('Saved to Downloads'));
}

/* ---------- lists as Excel (.xlsx) or PDF ---------- */

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fileBase = (r) => (S.settings.shop_name || 'shop').replace(/[^\wऀ-ॿ]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) + '-' + r.title.replace(/\s+/g, '-').toLowerCase() +
  (r.from ? '-' + r.from : '') + (r.to ? '-to-' + r.to : '');

function listHtml(r, wide) {
  const num = (v) => typeof v === 'number';
  const head = `<div class="lhd"><b>${esc(S.settings.shop_name || '')}</b> · ${esc(t(r.title))}` +
    `${r.from || r.to ? ' · ' + esc(fdate(r.from || '')) + ' – ' + esc(fdate(r.to || todayStr())) : ''} · ${r.rows.length} ${esc(t('rows'))}</div>`;
  const per = wide ? 30 : 44; // rows on one page, so no row is ever cut between pages
  const pages = [];
  for (let i = 0; i < Math.max(r.rows.length, 1); i += per) {
    pages.push(`<div class="doc listdoc ${wide ? 'wide' : ''}">${head}<table class="ltab"><thead><tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>` +
      r.rows.slice(i, i + per).map((row) => `<tr>${row.map((v) => `<td class="${num(v) ? 'n' : ''}">${esc(num(v) ? Calc.inr(v, Number.isInteger(v) ? 0 : 2) : v)}</td>`).join('')}</tr>`).join('') +
      `</tbody></table><div class="lft">${Math.floor(i / per) + 1} / ${Math.ceil(r.rows.length / per) || 1}</div></div>`);
  }
  return manyDocs(pages);
}

/** Gets a list from the shop and gives it as an Excel file or a PDF (wide lists print sideways). */
export async function exportList(module, params = {}, kind = 'xlsx') {
  const r = await call('export.list', Object.assign({ module }, params));
  if (!r.rows.length) return 0;
  let file;
  if (kind === 'pdf') {
    const wide = r.columns.length > 8;
    const blob = await pdfBlob(listHtml(r, wide), wide ? 'a4l' : 'a4', 1.6);
    file = new File([blob], fileBase(r) + '.pdf', { type: 'application/pdf' });
  } else {
    file = new File([xlsxBlob(r.title, r.columns, r.rows)], fileBase(r) + '.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  await shareFiles([file], t(r.title) + ' · ' + r.rows.length + ' ' + t('rows'));
  return r.rows.length;
}
export const exportCsv = (module, params) => exportList(module, params, 'xlsx');

/** "⬇" button for a list screen: asks Excel or PDF. getParams() gives {from, to, status…} at the moment of tapping. */
export function exportCsvButton(module, getParams) {
  if (isViewer() && module === 'stock') return null;
  return h('button', { class: 'help-btn', type: 'button', 'aria-label': t('Export'), title: t('Export'), onclick: async () => {
    const kind = await modal(t('Export this list'), h('div', { class: 'hint' }, t('Excel opens in Excel / Google Sheets. PDF is for printing or sending.')),
      [{ label: 'Excel', value: 'xlsx' }, { label: 'PDF', value: 'pdf' }]);
    if (!kind) return;
    await busy(null, async () => {
      const n = await exportList(module, getParams ? getParams() : {}, kind);
      if (!n) toast(t('Nothing to export in this period'));
    }, kind === 'pdf' ? 'Making PDF…' : 'Making the file…');
  } }, icon('pdf'));
}

/* ---------- all bills of a period as PDF ---------- */

export async function bills(params, query) {
  const today = todayStr();
  const monthStart = today.slice(0, 8) + '01';
  const from = field(t('From'), { type: 'date', value: query.from || monthStart });
  const to = field(t('To'), { type: 'date', value: query.to || today });
  let type = 'all';
  const typeSeg = seg([{ value: 'all', label: 'All bills' }, { value: 'GST', label: 'GST bills' }, { value: 'EST', label: 'Quotations' }], type, (v) => { type = v; });
  let paper = (() => { try { return localStorage.getItem('dk_paper') || 'a4'; } catch (e) { return 'a4'; } })();
  const paperSeg = seg([{ value: 'a4', label: 'A4' }, { value: 'a5', label: 'A5' }], paper, (v) => { paper = v; });
  let withCancelled = false;
  const cancelledSeg = seg([{ value: false, label: 'Leave out cancelled' }, { value: true, label: 'Include cancelled' }], withCancelled, (v) => { withCancelled = v; });
  const quick = (label, f, tt) => h('button', { class: 'chip', type: 'button', onclick: () => { from.input.value = f; to.input.value = tt; } }, t(label));
  const d = new Date(today);
  const lastMonthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
  const lastMonthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)).toISOString().slice(0, 10);
  const fyStart = (d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1) + '-04-01';
  const status = h('div', { class: 'stack' });

  const run = h('button', { class: 'btn', onclick: () => busy(run, async () => {
    status.replaceChildren(h('div', { class: 'hint' }, t('Getting the bills…')));
    const r = await call('sale.export', { from: from.input.value, to: to.input.value, type, withCancelled });
    if (!r.bills.length) { status.replaceChildren(h('div', { class: 'hint' }, t('No bills in this period'))); return; }
    // Big periods are split into a few PDFs so the phone does not run out of memory.
    const per = paper === 'a5' ? 60 : 40;
    const files = [];
    const bar = h('div');
    status.replaceChildren(h('div', { class: 'hint' }, r.bills.length + ' ' + t('bills') + ' · ' + t('making PDF…')), h('div', { class: 'progress' }, bar));
    for (let i = 0; i < r.bills.length; i += per) {
      const part = r.bills.slice(i, i + per);
      const blob = await pdfBlob(manyDocs(part.map((b) => invoiceHtml(b, paper))), paper, 1.6);
      const label = (type === 'GST' ? 'gst-bills' : type === 'EST' ? 'quotations' : 'bills') + '-' + r.from + '-to-' + r.to +
        (r.bills.length > per ? '-part' + (i / per + 1) : '') + '.pdf';
      files.push(new File([blob], label, { type: 'application/pdf' }));
      bar.style.width = Math.round(Math.min(i + per, r.bills.length) / r.bills.length * 100) + '%';
    }
    status.replaceChildren(card(
      h('div', { class: 'kv strong' }, h('span', null, r.bills.length + ' ' + t('bills')), h('span', null, inr(r.totals.total))),
      r.totals.tax ? h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'GST'), h('span', null, inr(r.totals.tax, 2))) : null,
      h('div', { class: 'hint' }, fdate(r.from) + ' → ' + fdate(r.to) + ' · ' + files.length + ' PDF')));
    await shareFiles(files, (S.settings.shop_name || '') + ' · ' + t('bills') + ' ' + fdate(r.from) + ' – ' + fdate(r.to));
  }, 'Making PDF…') }, t('Make PDF & share'));

  const csv = h('button', { class: 'btn2', onclick: () => busy(csv, async () => {
    const n = await exportList('bills', { from: from.input.value, to: to.input.value, type }, 'xlsx');
    if (!n) toast(t('No bills in this period'));
  }, 'Making the file…') }, '⬇ ' + t('Excel list of these bills'));

  return screen(t('Export bills'), t('All bills of a period in one tap'), [
    card(h('div', { class: 'chips wrap' }, quick('This month', monthStart, today), quick('Last month', lastMonthStart, lastMonthEnd),
      quick('This year', fyStart, today)), h('div', { class: 'grid g2' }, from, to)),
    typeSeg, paperSeg, cancelledSeg, status,
    h('div', { class: 'hint' }, t('One PDF with every bill (one bill per page). Share it on WhatsApp or e-mail to your accountant, or save it.'))
  ], [run, csv], { back: '#/bills', help: 'sale' });
}

/* ---------- everything in one Excel file (backup, accountant, or moving to another app) ---------- */

const ALL = [['customers', {}], ['dues', {}], ['bills', {}], ['girvi', { status: 'all' }], ['orders', {}], ['repairs', {}],
  ['oldgold', {}], ['stock', { status: 'all' }], ['cash', {}], ['parties', {}]];

export async function exportEverything() {
  const lists = [];
  for (const [m, p] of ALL) {
    try { lists.push(await call('export.list', Object.assign({ module: m }, p))); } catch (e) { /* module not in use */ }
  }
  const find = (title) => lists.find((l) => l.title === title);
  const sheets = lists.map((l) => ({ name: l.title, columns: l.columns, rows: l.rows }));
  // Ready-made tabs for moving to another billing app (Vyapar, Tally, Khatabook …): parties with balance, and items in stock.
  const cust = find('Customers');
  if (cust) {
    sheets.unshift({ name: 'For other apps - Parties', columns: ['Name', 'Phone', 'Address', 'Opening balance (to receive)', 'Type'],
      rows: cust.rows.map((r) => [((r[0] || '') + ' ' + (r[1] || '')).trim(), r[2] || '', [r[3], r[4]].filter(Boolean).join(', '), r[5] || 0, 'Customer']) });
  }
  const stock = find('Stock');
  if (stock) {
    const ci = (n) => stock.columns.indexOf(n);
    sheets.splice(1, 0, { name: 'For other apps - Items', columns: ['Item name', 'Item code', 'Category', 'Opening qty (pcs)', 'Weight (g)', 'Purity %', 'Cost price ₹'],
      rows: stock.rows.filter((r) => r[ci('Status')] === 'in').map((r) => [r[ci('Item')], r[ci('Tag')], r[ci('Category')], r[ci('Pieces')], r[ci('Net wt')], r[ci('Purity %')], ci('Our cost ₹') >= 0 ? r[ci('Our cost ₹')] : '']) });
  }
  const name = (S.settings.shop_name || 'shop').replace(/[^\wऀ-ॿ]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) + '-all-data-' + todayStr() + '.xlsx';
  await shareFiles([new File([xlsxBook(sheets)], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })], t('All shop data'));
  return sheets.length;
}
