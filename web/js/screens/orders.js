/* Orders: book with advance (rate fixed now, or only deposit), track, deliver. */
import { call } from '../api.js';
import { S, setting, purityFor, rateFor, isViewer, isOwner } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, num, inr, fdate, g3, sec, go, empty, chips, ask, todayStr, remember, confirmBox } from '../ui.js';
import { customerPicker } from '../picker.js';
import { receiptHtml, docActions } from '../bill.js';
import { t } from '../i18n.js';

const STATUS = { booked: 'Booked', making: 'With karigar', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' };

export async function list(params, query) {
  const status = query.s || 'pending';
  const tabs = chips([{ label: 'Pending', value: 'pending', on: status === 'pending' }, { label: 'Ready', value: 'ready', on: status === 'ready' },
    { label: 'Delivered', value: 'delivered', on: status === 'delivered' }], (v) => go('orders?s=' + v));
  const rows = await call('orders.list', { status });
  const late = (o) => o.deliveryDate && o.deliveryDate < S.today && o.status !== 'delivered';
  const held = rows.reduce((a, o) => a + (o.status !== 'delivered' ? o.paid : 0), 0);
  return screen(t('Orders'), status === 'pending' ? 'By delivery date · late ones first' : '', [
    tabs,
    status !== 'delivered' ? h('div', { class: 'stat-row' }, h('div', { class: 'stat' }, h('span', null, rows.length + ' orders'), h('b', null, 'Advance ' + inr(held)))) : null,
    rows.length ? rows.map((o) => h('a', { class: 'row-card' + (late(o) ? ' old' : ''), href: '#/order/' + o.id },
      h('div', { class: 'kv' }, h('b', null, o.customerName), h('span', { class: 'tag' + (o.rateFixed ? '' : ' gold') }, o.rateFixed ? 'Rate fixed' : 'Rate not fixed')),
      h('div', { class: 'kv muted' }, h('span', null, o.item + ' · ~' + g3(o.estWt) + ' g · paid ' + inr(o.paid)),
        h('span', null, (o.deliveryDate ? fdate(o.deliveryDate) : 'no date') + ' · ' + STATUS[o.status])))) : empty('No orders')
  ], isViewer() ? null : h('a', { class: 'btn', href: '#/order-new' }, '+ Book order'));
}

export async function create(params, query) {
  const picker = customerPicker(query);
  let method = 'A', karat = '22K';
  const mseg = seg([{ value: 'A', label: 'Fix rate now' }, { value: 'B', label: 'Only deposit' }], method, (v) => { method = v; draw(); });
  const item = field(t('Item'), {});
  const wt = field('Weight (g, approx)', { type: 'num' });
  const purity = field(t('Purity %'), { type: 'num', value: purityFor(karat) });
  const kseg = seg([{ value: '24K', label: '24K' }, { value: '22K', label: '22K' }, { value: '18K', label: '18K' }, { value: 'Silver', label: 'Silver' }], karat,
    (v) => { karat = v; purity.input.value = v === 'Silver' ? '100' : purityFor(v); rate.input.value = rateFor(v); draw(); });
  const making = field('Making ₹/g (customer)', { type: 'num', value: remember('making') || setting('making_default_per_g', '150') });
  const karigar = field('Karigar ₹/g (shop only)', { type: 'num', value: remember('karigar_per_g') || '' });
  const rate = field('Rate ₹/g (fixed today)', { type: 'num', value: rateFor(karat) });
  const advance = field('Advance paid (₹)', { type: 'num' });
  const delivery = field(t('Delivery date'), { type: 'date' });
  let mode = 'cash';
  const modeSeg = seg([{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], mode, (v) => { mode = v; });
  const aBox = h('div', { class: 'stack' }, grid(2, rate, advance));
  const calcBox = h('div', { class: 'card' });
  const bNote = h('div', { class: 'card gold-card' }, 'No rate is fixed now. When the customer comes to pay the balance, that day\'s rate is used and the delivery date is set.');
  const footLabel = h('span', { class: 'muted' }), footValue = h('span', { class: 'big' });
  const advB = field('Amount deposited (₹)', { type: 'num' });
  [wt, making, rate, advance, advB].forEach((f) => f.input.addEventListener('input', draw));
  function total() {
    try { return Math.round(Calc.evalFormula(setting('formula_order_total'), { Weight: num(wt.input.value), Rate: num(rate.input.value), Making: num(making.input.value) })); }
    catch (e) { return 0; }
  }
  function draw() {
    const a = method === 'A';
    aBox.style.display = a ? '' : 'none';
    calcBox.style.display = a ? '' : 'none';
    bNote.style.display = a ? 'none' : '';
    advB.style.display = a ? 'none' : '';
    const w = num(wt.input.value);
    const tot = total();
    const adv = num(advance.input.value);
    calcBox.replaceChildren(
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Gold ' + g3(w) + ' g × ' + inr(rate.input.value)), h('span', null, inr(w * num(rate.input.value)))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Making ' + g3(w) + ' g × ' + inr(making.input.value)), h('span', null, inr(w * num(making.input.value)))),
      h('div', { class: 'kv strong' }, h('span', null, 'Fixed price'), h('span', null, inr(tot))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Advance' + (tot ? ' (' + Math.round(adv / tot * 100) + '%)' : '')), h('span', null, '− ' + inr(adv))));
    footLabel.textContent = a ? 'Balance at delivery' : 'Deposited with shop';
    footValue.textContent = a ? inr(tot - adv) : inr(advB.input.value);
  }
  draw();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    remember('making', making.input.value); remember('karigar_per_g', karigar.input.value);
    const r = await call('orders.create', Object.assign({}, picker.get(), {
      method, item: item.input.value, metal: karat === 'Silver' ? 'silver' : 'gold', purityPct: purity.input.value,
      estWt: wt.input.value, makingPerG: making.input.value, karigarPerG: karigar.input.value,
      rate: method === 'A' ? rate.input.value : '', advance: method === 'A' ? advance.input.value : advB.input.value,
      deliveryDate: delivery.input.value, mode
    }));
    toast('Order booked');
    go('order/' + r.id + '?new=1');
  }) }, 'Save order & send receipt');
  return screen('Book order', fdate(S.today), [
    sec(t('Customer')), picker, mseg, grid(2, item, wt), h('div', { class: 'karat-row' }, kseg, purity), grid(2, making, karigar),
    aBox, calcBox, advB, bNote, delivery, modeSeg
  ], [h('div', { class: 'kv foot-total' }, footLabel, footValue), save], { back: '#/orders' });
}

export async function view({ id }, query) {
  const o = await call('orders.get', { id });
  const closed = o.status === 'delivered' || o.status === 'cancelled';
  const karigars = (o.status === 'booked' && !isViewer()) ? await call('parties.list', { type: 'karigar' }) : [];
  const doc = (size) => receiptHtml({
    title: o.status === 'delivered' ? 'ORDER DELIVERED' : 'ORDER RECEIPT', no: o.id.slice(-6), date: o.date, shop: o.shop,
    customer: { name: o.customerName, mobile: o.mobile },
    rows: [['Item', o.item + (o.purityPct ? ' (' + o.purityPct + '%)' : '')], ['Approx weight', g3(o.estWt) + ' g'],
      ['Making', '₹' + o.makingPerG + ' per g'], ['Rate', o.rateFixed ? '₹' + Calc.inr(o.rate) + '/g (fixed)' : 'Not fixed — rate of the day you pay the balance'],
      ...(o.rateFixed && !o.finalTotal ? [['Price (approx)', '₹' + Calc.inr(o.estTotal)]] : []),
      ...(o.finalTotal ? [['Final weight', g3(o.finalWt) + ' g'], ['Final price', '₹' + Calc.inr(o.finalTotal)]] : []),
      ...o.payments.map((p) => ['Paid ' + fdate(p.date), '₹' + Calc.inr(p.amount)]),
      ['Delivery', o.deliveryDate ? fdate(o.deliveryDate) : 'To be fixed']],
    total: ['Total paid', '₹' + Calc.inr(o.paid)],
    note: o.balance ? 'Balance ₹' + Calc.inr(o.balance) + ' at delivery.' : ''
  }, size);
  const acts = docActions(doc, { filename: 'order-' + o.customerName.replace(/\s+/g, '-') + '.pdf', mobile: o.mobile,
    text: `${o.shop.name}\nOrder: ${o.item} ~${g3(o.estWt)} g\nPaid: ₹${Calc.inr(o.paid)}` + (o.rateFixed ? `\nRate fixed ₹${Calc.inr(o.rate)}/g` : '\nRate not fixed') +
      (o.deliveryDate ? `\nDelivery: ${fdate(o.deliveryDate)}` : '') });

  const run = (fn) => busy(null, async () => { await fn(); go('order/' + id); });
  const payMore = async () => {
    const fields = [{ key: 'amount', label: 'Amount received (₹)', type: 'num' },
      { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' }];
    if (!o.rateFixed) fields.push({ key: 'fixRate', label: 'Fix rate now ₹/g (leave blank to keep open)', type: 'num', value: '' });
    fields.push({ key: 'deliveryDate', label: t('Delivery date'), type: 'date', value: o.deliveryDate || '' });
    const v = await ask('Payment', fields);
    if (v) run(() => call('orders.pay', Object.assign({ orderId: id }, v)));
  };
  const toKarigar = async () => {
    if (!karigars.length) { toast('Add a karigar first (Karigar screen)', 'err'); return; }
    const v = await ask('Give to karigar', [
      { key: 'karigarId', label: 'Karigar', options: karigars.map((k) => ({ value: k.id, label: k.name })), value: karigars[0].id },
      { key: 'issueFineG', label: 'Fine gold given (g) — from fine stock, optional', type: 'num', value: '' }]);
    if (v) run(() => call('orders.status', { orderId: id, status: 'making', karigarId: v.karigarId, issueFineG: v.issueFineG }));
  };
  const ready = async () => {
    const v = await ask('Item ready', [
      { key: 'finalWt', label: 'Final weight (g)', type: 'num', value: String(o.estWt) },
      ...(o.karigarId ? [{ key: 'fineUsed', label: 'Fine gold used by karigar (g)', type: 'num', value: '' },
        { key: 'labour', label: 'Karigar labour (₹)', type: 'num', value: String(Math.round(o.estWt * o.karigarPerG)) }] : [])]);
    if (v) run(() => call('orders.status', Object.assign({ orderId: id, status: 'ready' }, v)));
  };
  const deliver = async () => {
    const fw = o.finalWt || o.estWt;
    const rate = o.rateFixed ? o.rate : (S.rate ? (o.purityPct >= 99 ? S.rate.g24 : o.purityPct >= 90 ? S.rate.g22 : S.rate.g18) : 0);
    const v = await ask('Deliver', [
      { key: 'finalWt', label: 'Final weight (g)', type: 'num', value: String(fw) },
      ...(o.rateFixed ? [] : [{ key: 'rate', label: 'Today\'s rate ₹/g', type: 'num', value: String(rate || '') }]),
      { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' }], 'Next');
    if (!v) return;
    const r = num(v.rate || o.rate);
    let total = 0;
    try { total = Math.round(Calc.evalFormula(setting('formula_order_total'), { Weight: num(v.finalWt), Rate: r, Making: o.makingPerG })); } catch (e) { /* ignore */ }
    const balance = total - o.paid;
    if (balance <= 0) {
      const ok = await confirmBox(t('Deliver'), t('Price') + ' ' + inr(total) + ' − ' + t('paid') + ' ' + inr(o.paid) + '. ' +
        (balance < 0 ? t('Customer paid extra. Return') + ' ' + inr(-balance) + ' ' + t('to the customer.') : t('Nothing more to collect.')), t('Deliver'));
      if (ok) run(() => call('orders.deliver', { orderId: id, finalWt: v.finalWt, rate: r, amount: 0, mode: v.mode }));
      return;
    }
    const c = await ask(t('Collect balance'), [{ key: 'amount', label: t('Price') + ' ' + inr(total) + ' − ' + t('paid') + ' ' + inr(o.paid) + ' = ' + t('balance') + ' ' + inr(balance) + '. ' + t('Amount received now (₹)'), type: 'num', value: String(balance) }], t('Deliver'));
    if (!c) return;
    const got = num(c.amount);
    if (got > balance + 1) { toast(t('Balance is only') + ' ' + inr(balance), 'err'); return; }
    if (got < balance - 1 && !await confirmBox(t('Less than balance'), inr(balance - got) + ' ' + t('will be added to Baki (dues) for this customer.'), t('OK, deliver'))) return;
    run(() => call('orders.deliver', { orderId: id, finalWt: v.finalWt, rate: r, amount: got, mode: v.mode }));
  };
  const editOrder = async () => {
    const v = await ask(t('Correct this order'), [
      { key: 'item', label: t('Item'), type: 'text', value: o.item },
      { key: 'estWt', label: 'Approx weight (g)', type: 'num', value: String(o.estWt) },
      ...(o.rateFixed ? [{ key: 'rate', label: t('Rate ₹/g'), type: 'num', value: String(o.rate) }] : []),
      { key: 'makingPerG', label: t('Making ₹/g'), type: 'num', value: String(o.makingPerG) },
      { key: 'karigarPerG', label: 'Karigar ₹/g', type: 'num', value: String(o.karigarPerG || '') },
      { key: 'deliveryDate', label: t('Delivery date'), type: 'date', value: o.deliveryDate || '' },
      { key: 'notes', label: 'Notes', type: 'text', value: o.notes || '' }]);
    if (v) run(() => call('orders.edit', Object.assign({ id }, v)));
  };
  const cancel = async () => {
    const v = await ask('Cancel order', [{ key: 'refund', label: t('Advance returned (₹)') + ' · ' + t('paid') + ' ' + inr(o.paid), type: 'num', value: String(o.paid) }], 'Cancel order');
    if (v && num(v.refund) > o.paid) { toast(t('Customer paid only') + ' ' + inr(o.paid), 'err'); return; }
    if (v) run(() => call('orders.status', { orderId: id, status: 'cancelled', refund: v.refund }));
  };

  return screen(o.item + ' · ' + STATUS[o.status], o.customerName + ' · booked ' + fdate(o.date), [
    query.new ? h('div', { class: 'ok-box' }, 'Order booked. Send the receipt below.') : null,
    card(
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Approx weight'), h('span', null, g3(o.estWt) + ' g')),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Rate'), h('span', null, o.rateFixed ? inr(o.rate) + '/g fixed' : 'Not fixed yet')),
      o.rateFixed ? h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Price'), h('span', null, inr(o.finalTotal || o.estTotal))) : null,
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Making / karigar ₹/g'), h('span', null, o.makingPerG + ' / ' + (o.karigarPerG || '—'))),
      h('div', { class: 'kv strong' }, h('span', null, 'Paid'), h('span', null, inr(o.paid))),
      o.balance !== null && !closed ? h('div', { class: 'kv' }, h('span', { class: 'muted' }, t('Balance')), h('span', null, inr(o.balance))) : null,
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, t('Delivery date')), h('span', null, o.deliveryDate ? fdate(o.deliveryDate) : '—'))),
    o.payments.length ? card(h('div', { class: 'sec' }, 'PAYMENTS'), o.payments.map((p) => h('div', { class: 'kv' }, h('span', null, fdate(p.date) + ' · ' + p.mode), h('span', null, inr(p.amount))))) : null,
    !closed && !isViewer() ? h('div', { class: 'grid g2' },
      h('button', { class: 'btn2 small', onclick: payMore }, o.rateFixed ? '+ Payment' : '+ Payment / fix rate'),
      o.status === 'booked' ? h('button', { class: 'btn2 small', onclick: toKarigar }, 'Give to karigar') : null,
      o.status === 'booked' || o.status === 'making' ? h('button', { class: 'btn2 small', onclick: ready }, 'Item ready') : null,
      h('button', { class: 'btn2 small danger', onclick: cancel }, 'Cancel order')) : null,
    acts,
    isOwner() && !closed ? card(h('div', { class: 'sec' }, t('Owner: correct a mistake')),
      h('div', { class: 'row-actions' }, h('button', { class: 'btn2 small', onclick: editOrder }, t('Edit details')))) : null
  ], !closed && !isViewer() ? h('button', { class: 'btn', onclick: deliver }, 'Deliver & collect balance') : null, { back: '#/orders' });
}
void todayStr;
