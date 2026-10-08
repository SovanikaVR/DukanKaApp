/* Buy old gold / silver for cash (outside a sale). */
import { call } from '../api.js';
import { S } from '../state.js';
import { h, screen, seg, busy, toast, inr, fdate, g3, sec, go } from '../ui.js';
import { customerPicker } from '../picker.js';
import { oldEditor } from './sale.js';
import { receiptHtml, docActions } from '../bill.js';
import { t } from '../i18n.js';

export async function render(params, query) {
  const picker = customerPicker(query);
  const items = [];
  const box = h('div', { class: 'stack' });
  const totalEl = h('span', { class: 'big' });
  let mode = 'cash';
  const modeSeg = seg([{ value: 'cash', label: 'Paid in cash' }, { value: 'upi', label: 'Paid by UPI' }], mode, (v) => { mode = v; });
  const recalc = () => { totalEl.textContent = inr(items.reduce((a, i) => a + i.amount(), 0)); };
  const add = () => {
    const o = oldEditor(recalc, () => { items.splice(items.indexOf(o), 1); o.el.remove(); recalc(); });
    items.push(o); box.appendChild(o.el); recalc();
  };
  add();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const r = await call('oldgold.buy', Object.assign({}, picker.get(), { items: items.map((i) => i.get()), mode }));
    toast('Saved · ' + inr(r.total) + ' paid');
    const content = h('div', { class: 'stack' }, h('div', { class: 'card' },
      h('div', { class: 'kv strong' }, h('span', null, r.customer.name), h('span', null, inr(r.total))),
      ...r.items.map((g) => h('div', { class: 'kv' }, h('span', null, g.item + ' ' + g3(g.weight) + ' g, cut ' + g.cutPct + '%'), h('span', null, inr(g.amount))))),
    docActions((size) => receiptHtml({
      title: 'OLD GOLD PURCHASE', no: '', date: r.date, shop: r.shop, customer: r.customer,
      rows: r.items.map((g) => [g.item + ' ' + g3(g.weight) + 'g, cut ' + g.cutPct + '% = ' + g3(g.customerFine) + 'g fine', '₹' + Calc.inr(g.amount)]),
      total: ['Paid', '₹' + Calc.inr(r.total)]
    }, size), { filename: 'old-gold-' + r.date + '.pdf', mobile: r.customer.mobile,
      text: `${r.shop.name}\nOld gold bought on ${fdate(r.date)}\n` + r.items.map((g) => `${g.item} ${g3(g.weight)} g → ₹${Calc.inr(g.amount)}`).join('\n') + `\nPaid: ₹${Calc.inr(r.total)}` }));
    document.querySelector('#app .body').replaceChildren(content);
    document.querySelector('#app .foot').replaceChildren(h('a', { class: 'btn2', href: '#/home' }, 'Done'));
  }) }, 'Save & pay');
  return screen(t('Buy Old Gold'), fdate(S.today) + (S.rate ? ' · 24K ' + inr(S.rate.g24) + '/g' : ''),
    [sec(t('Customer')), picker, sec('OLD ITEMS'), box,
      h('button', { class: 'add gold', type: 'button', onclick: add }, '+ Add another old item'), modeSeg],
    [h('div', { class: 'kv foot-total' }, h('span', { class: 'muted' }, t('Pay to customer')), totalEl), save]);
}
