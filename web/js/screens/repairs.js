/* Repair / polish: karigar cost vs customer charge = repair profit. */
import { call } from '../api.js';
import { S, isViewer, isOwner } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, num, inr, fdate, g3, sec, go, empty, chips, ask, confirmBox } from '../ui.js';
import { customerPicker } from '../picker.js';
import { receiptHtml, docActions } from '../bill.js';
import { t } from '../i18n.js';

const STATUS = { received: 'In shop', with_karigar: 'With karigar', ready: 'Ready', delivered: 'Given back' };

export async function list(params, query) {
  const status = query.s || 'pending';
  const rows = await call('repairs.list', { status });
  return screen(t('Repair'), '', [
    chips([{ label: 'Pending', value: 'pending', on: status === 'pending' }, { label: 'Ready', value: 'ready', on: status === 'ready' },
      { label: 'Given back', value: 'delivered', on: status === 'delivered' }], (v) => go('repairs?s=' + v)),
    rows.length ? rows.map((r) => h('a', { class: 'row-card', href: '#/repair/' + r.id },
      h('div', { class: 'kv' }, h('b', null, r.customerName), h('span', { class: 'tag' }, STATUS[r.status])),
      h('div', { class: 'kv muted' }, h('span', null, r.work + ': ' + r.item + ' · ' + g3(r.wtIn) + ' g'),
        h('span', null, r.deliveryDate ? fdate(r.deliveryDate) : '')))) : empty('Nothing here')
  ], isViewer() ? null : h('a', { class: 'btn', href: '#/repair-new' }, '+ New repair / polish'));
}

export async function create(params, query) {
  const picker = customerPicker(query);
  const karigars = await call('parties.list', { type: 'karigar' });
  let work = 'polish', kId = '', kType = 'perg', cType = 'perg';
  const workSeg = seg([{ value: 'polish', label: 'Polish' }, { value: 'repair', label: 'Repair' }, { value: 'resize', label: 'Resize' }], work, (v) => { work = v; });
  const item = field(t('Item'), {});
  const wt = field('Weight in (g)', { type: 'num' });
  const kSeg = karigars.length ? seg([{ value: '', label: 'Not yet' }, ...karigars.map((k) => ({ value: k.id, label: k.name }))], kId, (v) => { kId = v; })
    : h('div', { class: 'hint' }, 'No karigar added yet — you can add one in the Karigar screen.');
  const kRate = field('Karigar cost', { type: 'num', value: '60' });
  const cRate = field('Customer charge', { type: 'num', value: '150' });
  const kTypeSeg = seg([{ value: 'perg', label: '₹ per g' }, { value: 'fixed', label: 'Fixed ₹' }], kType, (v) => { kType = v; draw(); });
  const cTypeSeg = seg([{ value: 'perg', label: '₹ per g' }, { value: 'fixed', label: 'Fixed ₹' }], cType, (v) => { cType = v; draw(); });
  const delivery = field('Give back on', { type: 'date' });
  const calc = h('div', { class: 'card' });
  [wt, kRate, cRate].forEach((f) => f.input.addEventListener('input', draw));
  function amt(type, rate) { return type === 'fixed' ? num(rate) : num(rate) * num(wt.input.value); }
  function draw() {
    const k = amt(kType, kRate.input.value), c = amt(cType, cRate.input.value);
    calc.replaceChildren(h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Karigar cost'), h('span', null, inr(k))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Customer pays'), h('span', null, inr(c))),
      h('div', { class: 'kv strong good' }, h('span', null, 'Repair profit'), h('span', null, inr(c - k))));
  }
  draw();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const r = await call('repairs.create', Object.assign({}, picker.get(), {
      item: item.input.value, work, wtIn: wt.input.value, karigarId: kId, karigarRateType: kType, karigarRate: kRate.input.value,
      custRateType: cType, custRate: cRate.input.value, deliveryDate: delivery.input.value
    }));
    toast('Saved');
    go('repair/' + r.id + '?new=1');
  }) }, 'Save & send receipt');
  return screen('Repair / polish', fdate(S.today), [
    sec(t('Customer')), picker, workSeg, grid(2, item, wt), sec('KARIGAR'), kSeg,
    grid(2, h('div', { class: 'stack' }, kRate, kTypeSeg), h('div', { class: 'stack' }, cRate, cTypeSeg)), delivery, calc
  ], save, { back: '#/repairs' });
}

export async function view({ id }, query) {
  const rows = await call('repairs.list', { status: 'all' });
  const r = rows.find((x) => x.id === id);
  if (!r) throw new Error('Repair not found');
  const shop = { name: S.settings.shop_name, mobile: S.settings.shop_mobile, address: S.settings.shop_address };
  const doc = (size) => receiptHtml({
    title: r.status === 'delivered' ? 'REPAIR DELIVERED' : 'REPAIR RECEIPT', no: r.id.slice(-6), date: r.date, shop,
    customer: { name: r.customerName, mobile: r.mobile },
    rows: [['Work', r.work], ['Item', r.item], ['Weight in', g3(r.wtIn) + ' g'], ...(r.wtOut ? [['Weight out', g3(r.wtOut) + ' g']] : []),
      ['Give back on', r.deliveryDate ? fdate(r.deliveryDate) : '—']],
    total: ['Charge', '₹' + Calc.inr(r.custCharge || r.estCustCharge)]
  }, size);
  const run = (fn) => busy(null, async () => { await fn(); go('repair/' + id); });
  const back = async () => {
    const v = await ask('Back from karigar', [{ key: 'wtOut', label: 'Weight out (g)', type: 'num', value: String(r.wtIn) },
      { key: 'karigarCost', label: 'Karigar cost (₹)', type: 'num', value: String(r.estKarigarCost) }]);
    if (v) run(() => call('repairs.return', Object.assign({ id }, v)));
  };
  const give = async () => {
    const v = await ask('Give back to customer', [{ key: 'custCharge', label: t('Charge (₹)'), type: 'num', value: String(r.estCustCharge) },
      { key: 'amount', label: t('Amount received now (₹)'), type: 'num', value: String(r.estCustCharge) },
      { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' }], 'Given back');
    if (!v) return;
    const charge = num(v.custCharge), got = num(v.amount);
    if (got > charge + 1) { toast(t('Amount received is more than the charge'), 'err'); return; }
    if (got < charge - 1 && !await confirmBox(t('Less than charge'), inr(charge - got) + ' ' + t('will be added to Baki (dues) for this customer.'), t('OK'))) return;
    run(() => call('repairs.deliver', Object.assign({ id }, v)));
  };
  const edit = async () => {
    const v = await ask(t('Correct this repair'), [
      { key: 'item', label: t('Item'), type: 'text', value: r.item },
      { key: 'wtIn', label: 'Weight in (g)', type: 'num', value: String(r.wtIn) },
      { key: 'karigarRate', label: 'Karigar ' + (r.karigarRateType === 'fixed' ? '₹' : '₹/g'), type: 'num', value: String(r.karigarRate) },
      { key: 'custRate', label: 'Customer ' + (r.custRateType === 'fixed' ? '₹' : '₹/g'), type: 'num', value: String(r.custRate) },
      { key: 'deliveryDate', label: t('Delivery date'), type: 'date', value: r.deliveryDate || '' }]);
    if (v) run(() => call('repairs.edit', Object.assign({ id }, v)));
  };
  const loss = r.wtOut ? r.wtIn - r.wtOut : 0;
  return screen(r.work + ': ' + r.item, r.customerName + ' · ' + STATUS[r.status], [
    query.new ? h('div', { class: 'ok-box' }, 'Saved. Send the receipt below.') : null,
    card(h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Weight in / out'), h('span', null, g3(r.wtIn) + ' / ' + (r.wtOut ? g3(r.wtOut) : '—') + ' g')),
      loss > 0 ? h('div', { class: 'kv bad' }, h('span', null, 'Weight lost'), h('span', null, g3(loss) + ' g')) : null,
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Karigar cost'), h('span', null, inr(r.karigarCost || r.estKarigarCost))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Customer charge'), h('span', null, inr(r.custCharge || r.estCustCharge))),
      h('div', { class: 'kv strong good' }, h('span', null, 'Repair profit'), h('span', null, inr((r.custCharge || r.estCustCharge) - (r.karigarCost || r.estKarigarCost))))),
    r.status !== 'delivered' && r.status !== 'ready' && !isViewer() ? h('button', { class: 'btn2', onclick: back }, 'Back from karigar') : null,
    docActions(doc, { filename: 'repair-' + r.customerName.replace(/\s+/g, '-') + '.pdf', mobile: r.mobile,
      text: `${shop.name}\n${r.work}: ${r.item} (${g3(r.wtIn)} g)\nCharge: ₹${Calc.inr(r.custCharge || r.estCustCharge)}` + (r.deliveryDate ? `\nReady on: ${fdate(r.deliveryDate)}` : '') }),
    isOwner() && r.status !== 'delivered' ? card(h('div', { class: 'sec' }, t('Owner: correct a mistake')),
      h('div', { class: 'row-actions' }, h('button', { class: 'btn2 small', onclick: edit }, t('Edit details')))) : null
  ], r.status !== 'delivered' && !isViewer() ? h('button', { class: 'btn', onclick: give }, 'Give back & collect charge') : null, { back: '#/repairs' });
}
