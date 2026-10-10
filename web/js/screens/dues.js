/* Baki (dues): everyone who still owes the shop money, in one list. Paid in full = removed from the list. */
import { call } from '../api.js';
import { isOwner, isViewer } from '../state.js';
import { h, screen, card, busy, toast, inr, fdate, empty, go, ask, field, todayStr, chips, confirmBox } from '../ui.js';
import { t } from '../i18n.js';
import { exportCsvButton } from './exports.js';
import { sendBakiReminder } from '../baki.js';

const FROM = { sale: 'Bill', order: 'Order', repair: 'Repair', loan: 'Girvi', payment: 'Paid', adjust: 'Adjusted', 'sale-cancel': 'Bill cancelled' };

/** "Bill GST/26-27/0004", "Paid", "Written off: reason" — without repeating words or internal ids. */
function noteOf(x) {
  const n = String(x.notes || '').replace(/\s*\(C\w+\)/, '').trim();
  if (['sale', 'order', 'repair', 'loan'].includes(x.refType) && n) return n;
  return t(FROM[x.refType] || x.refType) + (n && n !== 'Received' ? ' · ' + n : '');
}

export async function render(params, query) {
  const limit = parseInt(query.limit, 10) || 100;
  const cleared = query.v === 'cleared';
  const d = await call('dues.list', Object.assign({ q: query.q || '' }, limit !== 100 ? { limit } : {}, cleared ? { cleared: true } : {}));
  const tabs = chips([{ label: t('Owing'), value: '', on: !cleared }, { label: t('Cleared (60 days)'), value: 'cleared', on: cleared }],
    (v) => go('dues' + (v ? '?v=' + v : ''), { replace: true }));
  const q = field(t('Search name or mobile'), { value: query.q || '' });
  q.input.addEventListener('change', () => go('dues?q=' + encodeURIComponent(q.input.value.trim()) + (cleared ? '&v=cleared' : ''), { replace: true }));

  const rows = d.list.map((r) => {
    const open = h('div', { class: 'stack hidden' },
      // Every change with who made it, so the owner can see how a baki went down. A wrong payment can be undone.
      r.items.map((x) => h('div', { class: 'due-item' },
        h('div', { class: 'kv small' },
          h('span', { class: 'muted' }, fdate(x.date) + ' · ' + noteOf(x) + (x.by ? ' · ' + t('by') + ' ' + x.by : '')),
          h('span', { class: x.undone ? 'muted strike' : x.amount < 0 ? 'good' : '' }, (x.amount < 0 ? '− ' : '+ ') + inr(Math.abs(x.amount)))),
        isOwner() && x.refType === 'payment' && x.amount < 0 && !x.undone
          ? h('button', { class: 'link small', onclick: () => undoPay(r, x) }, t('Not paid? Undo this payment')) : null)),
      h('div', { class: 'row-actions' },
        isViewer() || cleared ? null : h('button', { class: 'btn small', onclick: () => pay(r) }, t('Payment received')),
        h('a', { class: 'btn2 small', href: '#/customer/' + r.customerId }, t('Open customer')),
        r.mobile ? h('button', { class: 'btn2 small wa', onclick: () => sendBakiReminder(r) }, '💬 ' + t('WhatsApp reminder')) : null,
        r.mobile ? h('a', { class: 'btn2 small', href: 'tel:' + r.mobile }, t('Call')) : null,
        isOwner() ? h('button', { class: 'btn2 small', onclick: () => adjust(r) }, t('Write off / correct')) : null));
    return h('div', { class: 'card' },
      h('div', { class: 'due-row', style: { border: 0, padding: 0 }, onclick: () => open.classList.toggle('hidden') },
        h('div', { class: 'who' }, h('b', null, r.customerName), h('span', { class: 'hint' },
          [r.mobile, r.village, t('since') + ' ' + fdate(r.since)].filter(Boolean).join(' · '))),
        h('div', { class: 'amt' + (cleared ? ' good' : '') }, cleared ? t('Cleared') : inr(r.due)),
        r.mobile && !cleared ? h('button', { class: 'wa-mini', 'aria-label': 'WhatsApp', onclick: (ev) => { ev.stopPropagation(); sendBakiReminder(r); } }, '💬') : null),
      open);
  });

  return screen(t('Baki (dues)'), d.count + ' ' + t('customers') + ' · ' + inr(d.total), [
    h('div', { class: 'hint' }, t('Everyone who still has to pay the shop. Money left unpaid on a bill, order, repair or girvi comes here by itself. When the full amount is paid, the name goes off this list.')),
    tabs, q,
    cleared ? h('div', { class: 'hint' }, t('Customers whose baki became zero in the last 60 days. Tap one to see who entered the payment.'))
      : card(h('div', { class: 'due-total' }, h('span', { class: 'muted' }, t('Total baki')), h('span', { class: 'big bad' }, inr(d.total)))),
    rows.length ? rows : empty(cleared ? t('Nothing cleared in the last 60 days') : t('Nobody owes anything. 👍')),
    d.more ? h('button', { class: 'btn2', onclick: () => go('dues?limit=' + (limit + 200) + (query.q ? '&q=' + encodeURIComponent(query.q) : ''), { replace: true }) }, t('Show more') + ' (' + (d.count - d.list.length) + ')') : null
  ], null, { right: exportCsvButton('dues', () => ({})) });
}

async function pay(r) {
  // The amount is typed by hand (never filled in), and checked once more: a stray tap can never clear a baki.
  const v = await ask(t('Payment received') + ' · ' + r.customerName, [
    { key: 'amount', label: t('Amount received (₹)') + ' · ' + t('baki') + ' ' + inr(r.due), type: 'num', value: '' },
    { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' },
    { key: 'date', label: t('Date'), type: 'date', value: todayStr() }]);
  if (!v) return;
  const amt = parseFloat(v.amount) || 0;
  if (amt <= 0) { toast(t('Type the amount the customer gave'), 'err'); return; }
  if (amt > r.due + 0.5) { toast(t('More than the baki') + ' (' + inr(r.due) + ')', 'err'); return; }
  const left = Math.max(0, Math.round(r.due - amt));
  if (!await confirmBox(t('Payment received'), inr(amt) + ' ' + (v.mode === 'upi' ? 'UPI' : t('cash')) + ' ' + t('from') + ' ' + r.customerName + '. ' +
    (left ? t('Baki left') + ' ' + inr(left) : t('Baki will be fully cleared')) + '. ' + t('OK?'), t('Yes, received'))) return;
  await busy(null, async () => {
    const res = await call('dues.pay', { customerId: r.customerId, amount: v.amount, mode: v.mode, date: v.date });
    toast(res.udhaar > 0.5 ? t('Saved. Still baki') + ' ' + inr(res.udhaar) : t('Fully paid — removed from the list'));
    go('dues');
  });
}

async function undoPay(r, x) {
  const v = await ask(t('Undo this payment?'), [{ key: 'reason', label: inr(Math.abs(x.amount)) + ' · ' + fdate(x.date) + (x.by ? ' · ' + t('by') + ' ' + x.by : '') + ' — ' + t('Reason (optional)'), value: '' }], t('Undo payment'));
  if (!v) return;
  await busy(null, async () => {
    const res = await call('dues.undoPay', { id: x.id, reason: v.reason });
    toast(t('Payment undone. Baki is now') + ' ' + inr(res.udhaar));
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
