/* Baki (dues): everyone who still owes the shop money, in one list. Paid in full = removed from the list. */
import { call } from '../api.js';
import { isOwner, isViewer } from '../state.js';
import { h, screen, card, busy, toast, inr, fdate, empty, go, ask, field, todayStr } from '../ui.js';
import { t } from '../i18n.js';
import { exportCsvButton } from './exports.js';

const FROM = { sale: 'Bill', order: 'Order', repair: 'Repair', loan: 'Girvi', payment: 'Paid', adjust: 'Adjusted', 'sale-cancel': 'Bill cancelled' };

/** "Bill GST/26-27/0004", "Paid", "Written off: reason" — without repeating words or internal ids. */
function noteOf(x) {
  const n = String(x.notes || '').replace(/\s*\(C\w+\)/, '').trim();
  if (['sale', 'order', 'repair', 'loan'].includes(x.refType) && n) return n;
  return t(FROM[x.refType] || x.refType) + (n && n !== 'Received' ? ' · ' + n : '');
}

export async function render(params, query) {
  const d = await call('dues.list', { q: query.q || '' });
  const q = field(t('Search name or mobile'), { value: query.q || '' });
  q.input.addEventListener('change', () => go('dues?q=' + encodeURIComponent(q.input.value.trim()), { replace: true }));

  const rows = d.list.map((r) => {
    const open = h('div', { class: 'stack hidden' },
      r.items.map((x) => h('div', { class: 'kv small' },
        h('span', { class: 'muted' }, fdate(x.date) + ' · ' + noteOf(x)),
        h('span', { class: x.amount < 0 ? 'good' : '' }, (x.amount < 0 ? '− ' : '+ ') + inr(Math.abs(x.amount))))),
      h('div', { class: 'row-actions' },
        isViewer() ? null : h('button', { class: 'btn small', onclick: () => pay(r) }, t('Payment received')),
        h('a', { class: 'btn2 small', href: '#/customer/' + r.customerId }, t('Open customer')),
        r.mobile ? h('a', { class: 'btn2 small', href: 'tel:' + r.mobile }, t('Call')) : null,
        isOwner() ? h('button', { class: 'btn2 small', onclick: () => adjust(r) }, t('Write off / correct')) : null));
    return h('div', { class: 'card' },
      h('div', { class: 'due-row', style: { border: 0, padding: 0 }, onclick: () => open.classList.toggle('hidden') },
        h('div', { class: 'who' }, h('b', null, r.customerName), h('span', { class: 'hint' },
          [r.mobile, r.village, t('since') + ' ' + fdate(r.since)].filter(Boolean).join(' · '))),
        h('div', { class: 'amt' }, inr(r.due))),
      open);
  });

  return screen(t('Baki (dues)'), d.count + ' ' + t('customers') + ' · ' + inr(d.total), [
    h('div', { class: 'hint' }, t('Everyone who still has to pay the shop. Money left unpaid on a bill, order, repair or girvi comes here by itself. When the full amount is paid, the name goes off this list.')),
    q,
    card(h('div', { class: 'due-total' }, h('span', { class: 'muted' }, t('Total baki')), h('span', { class: 'big bad' }, inr(d.total)))),
    rows.length ? rows : empty(t('Nobody owes anything. 👍'))
  ], null, { right: exportCsvButton('dues', () => ({})) });
}

async function pay(r) {
  const v = await ask(t('Payment received') + ' · ' + r.customerName, [
    { key: 'amount', label: t('Amount received (₹)') + ' · ' + t('baki') + ' ' + inr(r.due), type: 'num', value: String(Math.round(r.due)) },
    { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' },
    { key: 'date', label: t('Date'), type: 'date', value: todayStr() }]);
  if (!v) return;
  await busy(null, async () => {
    const res = await call('dues.pay', { customerId: r.customerId, amount: v.amount, mode: v.mode, date: v.date });
    toast(res.udhaar > 0.5 ? t('Saved. Still baki') + ' ' + inr(res.udhaar) : t('Fully paid — removed from the list'));
    go('dues');
  });
}

async function adjust(r) {
  const v = await ask(t('Write off / correct') + ' · ' + r.customerName, [
    { key: 'dir', label: t('What to do'), options: [{ value: 'less', label: 'Reduce baki' }, { value: 'more', label: 'Add baki' }], value: 'less' },
    { key: 'amount', label: 'Amount (₹)', type: 'num', value: '' },
    { key: 'notes', label: t('Reason'), type: 'text', value: '' }]);
  if (!v) return;
  await busy(null, async () => {
    const amt = Math.abs(parseFloat(v.amount) || 0) * (v.dir === 'less' ? -1 : 1);
    await call('dues.adjust', { customerId: r.customerId, amount: amt, notes: v.notes });
    toast('Saved');
    go('dues');
  });
}
