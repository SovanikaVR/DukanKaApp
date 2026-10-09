/* A saved bill (preview + send/print) and the bills list. */
import { call } from '../api.js';
import { isOwner } from '../state.js';
import { h, screen, field, busy, toast, inr, fdate, empty, go, confirmBox, seg } from '../ui.js';
import { invoiceHtml, docActions, billText, docCss } from '../bill.js';
import { t } from '../i18n.js';

export async function render({ id }, query) {
  const b = await call('sale.get', { id, fy: query.fy || '' });
  const preview = h('div', { class: 'paper' });
  const wrap = h('div', { class: 'paper-wrap' }, preview);
  let size = 'a4';
  const fit = () => {
    preview.style.zoom = '1';
    const avail = wrap.clientWidth - 24;
    if (avail > 0 && preview.scrollWidth > avail) preview.style.zoom = String(avail / preview.scrollWidth);
  };
  const draw = () => { preview.innerHTML = `<style>${docCss()}</style>` + invoiceHtml(b, size); requestAnimationFrame(fit); };
  draw();
  window.addEventListener('resize', fit);
  const sizeSeg = seg([{ value: 'a4', label: 'A4' }, { value: '58', label: '58 mm' }, { value: '80', label: '80 mm' }], size, (v) => {
    size = v; draw();
    if (v !== 'a4') try { localStorage.setItem('dk_thermal', v); } catch (e) { /* ignore */ }
  });
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
  return screen(b.status === 'void' ? 'Cancelled bill' : 'Bill saved', (b.type === 'GST' ? 'Tax invoice ' : 'Estimate ') + b.billNo + ' · ' + fdate(b.date),
    [actions, h('div', { class: 'sec' }, 'PREVIEW'), sizeSeg, wrap, cancel],
    h('a', { class: 'btn2', href: '#/home' }, 'Done · back to home'), { back: '#/bills' });
}

export async function list(params, query) {
  const q = field('Search name, bill no, mobile', { value: query.q || '' });
  const from = field('From', { type: 'date', value: query.from || '' });
  const to = field('To', { type: 'date', value: query.to || '' });
  const fy = field('Old year (e.g. 25-26)', { value: query.fy || '' });
  const out = h('div', { class: 'list' });
  async function run() {
    out.replaceChildren(h('div', { class: 'hint' }, 'Loading…'));
    try {
      const rows = await call('sale.list', { q: q.input.value.trim(), from: from.input.value, to: to.input.value, fy: fy.input.value.trim() });
      out.replaceChildren(...(rows.length ? rows.map((b) => h('a', { class: 'row-card', href: '#/bill/' + b.id + (fy.input.value.trim() ? '?fy=' + fy.input.value.trim() : '') },
        h('div', { class: 'kv' }, h('b', null, b.customerName), h('b', null, inr(b.net))),
        h('div', { class: 'kv muted' }, h('span', null, b.billNo + ' · ' + fdate(b.date)),
          h('span', null, b.status === 'void' ? 'Cancelled' : (b.udhaar ? 'Baki ' + inr(b.udhaar) : (b.type === 'GST' ? 'GST' : 'Estimate')))))) : [empty('No bills found')]));
    } catch (e) { out.replaceChildren(h('div', { class: 'error-box' }, e.message)); }
  }
  let timer;
  q.input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 300); });
  [from, to].forEach((f) => f.input.addEventListener('change', run));
  fy.input.addEventListener('change', run);
  run();
  return screen('Bills', 'Newest first', [q, h('div', { class: 'grid g3' }, from, to, fy), out],
    h('a', { class: 'btn', href: '#/sale' }, '+ New sale'));
}
