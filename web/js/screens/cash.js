/* Cash book: opening, money in/out for a day, add expense. */
import { call } from '../api.js';
import { S, isOwner, isViewer } from '../state.js';
import { h, screen, field, busy, toast, inr, fdate, go, empty, ask } from '../ui.js';
import { t } from '../i18n.js';

const CAT = {
  'sale': 'Sale', 'sale-cancel': 'Bill cancelled', 'old-gold': 'Old gold bought', 'girvi-given': 'Girvi given',
  'girvi-interest': 'Girvi interest', 'girvi-received': 'Girvi payment', 'order-advance': 'Order payment',
  'order-refund': 'Order refund', 'repair-charge': 'Repair charge', 'repair-cost': 'Repair cost', 'melting': 'Melting charge',
  'wholesaler': 'Wholesaler', 'karigar-labour': 'Karigar labour', 'expense': 'Expense', 'other-income': 'Other income', 'udhaar': 'Udhaar received'
};

export async function render(params, query) {
  const date = query.d || S.today;
  const c = await call('cash.list', { from: date, to: date });
  const day = field(t('Date'), { type: 'date', value: date });
  day.input.addEventListener('change', () => go('cash?d=' + day.input.value));
  const add = (dir) => async () => {
    const v = await ask(dir === 'out' ? 'Add expense' : 'Add other income', [
      { key: 'amount', label: 'Amount (₹)', type: 'num', value: '' },
      { key: 'notes', label: dir === 'out' ? 'What for (rent, salary, electricity…)' : 'From', value: '' },
      { key: 'mode', label: 'Mode', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' }]);
    if (!v) return;
    await busy(null, async () => { await call('cash.add', Object.assign({ dir, date }, v)); toast('Saved'); go('cash?d=' + date); });
  };
  const opening = async () => {
    const v = await ask('Opening cash', [{ key: 'amount', label: 'Cash in drawer (₹)', type: 'num', value: '' }, { key: 'date', label: 'As of the start of', type: 'date', value: date }]);
    if (!v) return;
    await busy(null, async () => { await call('cash.opening', v); toast('Opening cash saved'); go('cash?d=' + date); });
  };
  return screen(t('Cash book'), fdate(date), [
    day,
    h('div', { class: 'card' },
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Opening'), h('span', null, inr(c.opening))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Cash in'), h('span', { class: 'good' }, '+ ' + inr(c.cashIn))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Cash out'), h('span', { class: 'bad' }, '− ' + inr(c.cashOut))),
      h('div', { class: 'kv strong' }, h('span', null, 'Should be in drawer'), h('span', null, inr(c.closing))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'UPI in / out'), h('span', null, inr(c.upiIn) + ' / ' + inr(c.upiOut)))),
    isViewer() ? null : h('div', { class: 'grid g2' },
      h('button', { class: 'btn2 small', onclick: add('out') }, '+ Expense'),
      h('button', { class: 'btn2 small', onclick: add('in') }, '+ Other income')),
    isOwner() ? h('button', { class: 'link', onclick: opening }, 'Set opening cash') : null,
    h('div', { class: 'sec' }, 'ENTRIES'),
    c.entries.length ? c.entries.map((e) => h('div', { class: 'row-card' },
      h('div', { class: 'kv' }, h('b', null, CAT[e.category] || e.category), h('b', { class: e.dir === 'in' ? 'good' : 'bad' }, (e.dir === 'in' ? '+ ' : '− ') + inr(e.amount))),
      h('div', { class: 'kv muted' }, h('span', null, (e.notes || '') + ' · ' + e.mode), h('span', null, e.by + ' ' + String(e.at).slice(11, 16))))) : empty('No entries this day')
  ]);
}
