/* A saved bill (preview + send/print) and the bills list. */
import { call } from '../api.js';
import { isOwner, isViewer } from '../state.js';
import { h, screen, field, busy, toast, inr, fdate, empty, go, confirmBox, seg, card, miniLoading } from '../ui.js';
import { invoiceHtml, docActions, billText, docCss, billFields, FIELD_LABELS } from '../bill.js';
import { exportCsvButton } from './exports.js';
import { t } from '../i18n.js';

export async function render({ id }, query) {
  const b = await call('sale.get', { id, fy: query.fy || '' });
  const preview = h('div', { class: 'paper' });
  const wrap = h('div', { class: 'paper-wrap' }, preview);
  let size = (() => { try { return localStorage.getItem('dk_paper') || 'a4'; } catch (e) { return 'a4'; } })();
  const fit = () => {
    preview.style.zoom = '1';
    const avail = wrap.clientWidth - 24;
    if (avail > 0 && preview.scrollWidth > avail) preview.style.zoom = String(avail / preview.scrollWidth);
  };
  const draw = () => { preview.innerHTML = `<style>${docCss()}</style>` + invoiceHtml(b, size); requestAnimationFrame(fit); };
  draw();
  window.addEventListener('resize', fit);
  const sizeSeg = seg([{ value: 'a4', label: 'A4' }, { value: 'a5', label: 'A5' }, { value: '58', label: '58 mm' }, { value: '80', label: '80 mm' }], size, (v) => {
    size = v; draw();
    try { localStorage.setItem(v === 'a4' || v === 'a5' ? 'dk_paper' : 'dk_thermal', v); } catch (e) { /* ignore */ }
  });
  // What to print on this bill: tap to show / hide, then Save. Money never changes here.
  const opts = billFields(b);
  const note = field(t('Note on the bill'), { type: 'textarea', value: b.notes || '' });
  note.input.addEventListener('input', () => { b.notes = note.input.value; draw(); });
  const toggles = h('div', { class: 'chips' }, FIELD_LABELS.map(([k, label]) => {
    const c = h('button', { type: 'button', class: 'chip' + (opts[k] ? ' on' : ''), 'aria-pressed': String(!!opts[k]), onclick: () => {
      opts[k] = !opts[k]; c.classList.toggle('on', opts[k]); c.setAttribute('aria-pressed', String(opts[k]));
      b.printOpts = Object.assign({}, b.printOpts, { [k]: opts[k] }); draw();
    } }, t(label));
    return c;
  }));
  // Shop rule line (e.g. "मोडताना ___% घट"): the % for this bill.
  const rulePct = field(t('Cut % for the shop rule line'), { type: 'num', value: (b.printOpts && b.printOpts.rulePct) || '' });
  rulePct.input.addEventListener('input', () => { b.printOpts = Object.assign({}, b.printOpts, { rulePct: rulePct.input.value.trim() }); draw(); });
  const saveOpts = h('button', { class: 'btn2 small', onclick: () => busy(saveOpts, async () => {
    await call('sale.print', { id: b.id, printOpts: b.printOpts || {}, notes: note.input.value });
    toast('Saved');
  }) }, t('Save print choices'));
  const printCard = isViewer() ? null : h('details', { class: 'card fold' }, h('summary', null, t('What to print on this bill')),
    h('div', { class: 'stack' }, toggles, note, b.shop && b.shop.ruleLine ? rulePct : null, saveOpts,
      h('div', { class: 'hint' }, t('Default choices for every bill are in Settings → Bill design.'))));
  const actions = docActions((s) => invoiceHtml(b, s), {
    filename: b.billNo.replace(/\//g, '-') + '.pdf', text: billText(b), mobile: b.mobile
  });
  const cancel = isOwner() && b.status !== 'void' ? h('button', { class: 'btn2 danger', onclick: async () => {
    if (!await confirmBox('Cancel this bill?', 'Stock items go back to stock and the money is reversed in the cash book. This cannot be undone.', 'Cancel bill')) return;
    await busy(null, async () => {
      const r = await call('sale.void', { id: b.id });
      go('bill/' + b.id);
      if (r.returned) await confirmBox(t('Bill cancelled'), t('The customer had already paid baki on this bill. Give back') + ' ' + inr(r.returned) + ' ' + t('to the customer (written in the cash book).'), t('OK'));
      else toast('Bill cancelled');
    });
  } }, 'Cancel bill') : null;
  return screen(b.status === 'void' ? 'Cancelled bill' : 'Bill saved', t(b.type === 'GST' ? 'Tax invoice' : 'Quotation') + ' ' + b.billNo + ' · ' + fdate(b.date),
    [actions, printCard, h('div', { class: 'sec' }, 'PREVIEW'), sizeSeg, wrap, cancel],
    h('a', { class: 'btn2', href: '#/home' }, 'Done · back to home'), { back: '#/bills' });
}

export async function list(params, query) {
  const q = field('Search name, bill no, mobile', { value: query.q || '' });
  const from = field('From', { type: 'date', value: query.from || '' });
  const to = field('To', { type: 'date', value: query.to || '' });
  const fy = field('Old year (e.g. 25-26)', { value: query.fy || '' });
  const out = h('div', { class: 'list' }, miniLoading());
  async function run() {
    out.replaceChildren(h('div', { class: 'hint' }, 'Loading…'));
    try {
      const rows = await call('sale.list', { q: q.input.value.trim(), from: from.input.value, to: to.input.value, fy: fy.input.value.trim() });
      out.replaceChildren(...(rows.length ? rows.map((b) => h('a', { class: 'row-card', href: '#/bill/' + b.id + (fy.input.value.trim() ? '?fy=' + fy.input.value.trim() : '') },
        h('div', { class: 'kv' }, h('b', null, b.customerName), h('b', null, inr(b.net))),
        h('div', { class: 'kv muted' }, h('span', null, b.billNo + ' · ' + fdate(b.date)),
          h('span', null, b.status === 'void' ? 'Cancelled' : (b.udhaar ? 'Baki ' + inr(b.udhaar) : (b.type === 'GST' ? 'GST' : t('Quotation'))))))) : [empty('No bills found')]));
    } catch (e) { out.replaceChildren(h('div', { class: 'error-box' }, e.message)); }
  }
  let timer;
  q.input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 300); });
  [from, to].forEach((f) => f.input.addEventListener('change', run));
  fy.input.addEventListener('change', run);
  run();
  const exp = h('div', { class: 'grid g2' },
    h('a', { class: 'btn2 small', href: '#/bills-export' }, t('PDF of all bills')),
    exportCsvButton('bills', () => ({ from: from.input.value, to: to.input.value })));
  return screen('Bills', 'Newest first', [q, h('div', { class: 'grid g3' }, from, to, fy), exp, out],
    h('a', { class: 'btn', href: '#/sale' }, '+ New sale'));
}
