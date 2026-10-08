/* Girvi: list, new loan, view / release with month-by-month interest. */
import { call } from '../api.js';
import { S, setting, purityFor, isViewer } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, num, inr, fdate, g3, sec, go, empty, remember, todayStr, chips, ask } from '../ui.js';
import { customerPicker } from '../picker.js';
import { receiptHtml, docActions } from '../bill.js';
import { t } from '../i18n.js';

export async function list(params, query) {
  let status = query.s || 'open';
  const q = field('Search name, mobile, item', { value: query.q || '' });
  const out = h('div', { class: 'list' });
  const summary = h('div', { class: 'stat-row' });
  const tabs = chips([{ label: 'Open', value: 'open', on: status === 'open' }, { label: 'Closed', value: 'closed', on: status === 'closed' }],
    (v) => go('loans?s=' + v));
  async function run() {
    try {
      const rows = await call('loans.list', { status, q: q.input.value.trim() });
      const yearAgo = String(+S.today.slice(0, 4) - 1) + S.today.slice(4);
      summary.replaceChildren(
        h('div', { class: 'stat' }, h('span', null, rows.length + ' loans'), h('b', null, inr(rows.reduce((a, l) => a + l.principal, 0)))),
        h('div', { class: 'stat' }, h('span', null, 'Interest due'), h('b', null, inr(rows.reduce((a, l) => a + l.interestDue, 0)))));
      out.replaceChildren(...(rows.length ? rows.map((l) => h('a', { class: 'row-card' + (status === 'open' && l.date <= yearAgo ? ' old' : ''), href: '#/loan/' + l.id },
        h('div', { class: 'kv' }, h('b', null, l.customerName), h('b', null, inr(l.totalDue))),
        h('div', { class: 'kv muted' }, h('span', null, l.item + ' · ' + g3(l.netWt) + ' g · ' + inr(l.principal) + ' @ ₹' + l.ratePct),
          h('span', null, status === 'open' ? l.days + ' days' : 'Closed ' + fdate(l.closedAt))))) : [empty('No loans')]));
    } catch (e) { out.replaceChildren(h('div', { class: 'error-box' }, e.message)); }
  }
  let timer;
  q.input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 300); });
  run();
  return screen(t('Girvi Loan'), 'Oldest first · shaded = over 12 months', [tabs, q, summary, out],
    isViewer() ? null : h('a', { class: 'btn', href: '#/loan-new' }, '+ New girvi loan'));
}

export async function create(params, query) {
  const picker = customerPicker(query);
  let karat = '22K';
  const item = field(t('Item'), {});
  const purity = field(t('Purity %'), { type: 'num', value: purityFor(karat) });
  const kseg = seg([{ value: '24K', label: '24K' }, { value: '22K', label: '22K' }, { value: '18K', label: '18K' }, { value: 'Silver', label: 'Silver' }], karat,
    (v) => { karat = v; purity.input.value = v === 'Silver' ? '100' : purityFor(v); draw(); });
  const gross = field('Gross weight (g)', { type: 'num' });
  const net = field('Net weight (g)', { type: 'num' });
  const amount = field(t('Loan amount (₹)'), { type: 'num' });
  const rate = field(t('Interest ₹ per 100 / month'), { type: 'num', value: remember('loan_rate') || setting('interest_default_rate', '2') });
  const date = field(t('Date'), { type: 'date', value: todayStr() });
  let mode = 'cash';
  const modeSeg = seg([{ value: 'cash', label: 'Given in cash' }, { value: 'upi', label: 'Given by UPI' }], mode, (v) => { mode = v; });
  const valueBox = h('div', { class: 'card gold-card' });
  const perMonth = h('div', { class: 'hint center' });
  let netTouched = false;
  net.input.addEventListener('input', () => { netTouched = true; draw(); });
  gross.input.addEventListener('input', () => { if (!netTouched) net.input.value = gross.input.value; draw(); });
  [amount, rate, purity].forEach((f) => f.input.addEventListener('input', draw));
  function draw() {
    const r = S.rate || {};
    const w = num(net.input.value);
    const value = karat === 'Silver' ? w * num(r.silver) : w * num(r.g24) * num(purity.input.value) / 100;
    const ltv = value ? Math.round(num(amount.input.value) / value * 100) : 0;
    valueBox.replaceChildren(h('div', { class: 'sec gold' }, 'ITEM VALUE TODAY'), h('div', { class: 'big' }, inr(value)),
      h('div', { class: ltv > 75 ? 'bad' : 'muted' }, value ? 'Loan is ' + ltv + '% of value' + (ltv > 75 ? ' — high' : '') : 'Set today\'s rate to see value'));
    let m = 0;
    try { m = Calc.evalFormula(setting('formula_interest'), { Principal: num(amount.input.value), Rate: num(rate.input.value), Days: 30 }); } catch (e) { /* ignore */ }
    perMonth.textContent = 'Interest ' + inr(m) + ' per month · ' + inr(m / 30) + ' per day';
  }
  draw();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    remember('loan_rate', rate.input.value);
    const r = await call('loans.create', Object.assign({}, picker.get(), {
      item: item.input.value, metal: karat === 'Silver' ? 'silver' : 'gold', purityPct: purity.input.value,
      grossWt: gross.input.value, netWt: net.input.value, principal: amount.input.value, ratePct: rate.input.value,
      date: date.input.value, mode
    }));
    toast('Girvi saved');
    go('loan/' + r.id + '?new=1');
  }) }, 'Save & send receipt');
  return screen('New girvi loan', fdate(S.today), [
    sec(t('Customer')), picker, item, h('div', { class: 'karat-row' }, kseg, purity), grid(2, gross, net),
    grid(2, amount, rate), valueBox, grid(2, date, h('div', null)), modeSeg
  ], [perMonth, save], { back: '#/loans' });
}

export async function view({ id }, query) {
  const asOf = query.on || S.today;
  const l = await call('loans.get', { id, asOf });
  const st = l.statement;
  const open = l.status === 'open';
  const custRows = st.rows.map((r) => {
    if (r.kind === 'interest' || r.kind === 'minimum') {
      return h('div', { class: 'mrow' }, h('span', null, r.label + (r.kind === 'interest' && r.principal !== l.principal ? ' (on ' + inr(r.principal) + ')' : '')), h('span', null, r.days), h('span', { class: 'r' }, inr(r.interest)));
    }
    if (r.kind === 'topup') return h('div', { class: 'mrow note' }, h('span', null, fdate(r.date) + ' extra loan'), h('span', null, ''), h('span', { class: 'r' }, '+ ' + inr(r.amount)));
    return h('div', { class: 'mrow note' }, h('span', null, fdate(r.date) + ' paid'), h('span', null, ''), h('span', { class: 'r' }, '− ' + inr(r.amount)));
  });
  const shopDoc = (title) => (size) => receiptHtml({
    title, no: l.id.slice(-6), date: open ? l.date : l.closedAt, shop: l.shop,
    customer: { name: l.customerName, mobile: l.mobile },
    rows: [['Item', l.item + ' (' + (l.metal === 'silver' ? 'silver' : (l.purityPct || '') + '%') + ')'],
      ['Gross / net weight', g3(l.grossWt) + ' / ' + g3(l.netWt) + ' g'], ['Loan amount', '₹' + Calc.inr(st.principal)],
      ['Interest', '₹' + l.ratePct + ' per 100 / month'], ['Loan date', fdate(l.date)],
      ...(open ? [] : [['Interest paid', '₹' + Calc.inr(st.paidInterest)], ['Released on', fdate(l.closedAt)]])],
    total: open ? ['Loan', '₹' + Calc.inr(st.principal)] : ['Collected', '₹' + Calc.inr(st.paidInterest + st.paidPrincipal)],
    note: open ? 'Please bring this receipt to release the item.' : 'Item returned to the customer.'
  }, size);
  const actions = docActions(shopDoc(open ? 'GIRVI RECEIPT' : 'GIRVI RELEASED'), {
    filename: 'girvi-' + l.customerName.replace(/\s+/g, '-') + '.pdf', mobile: l.mobile,
    text: `${l.shop.name}\nGirvi: ${l.item} ${g3(l.netWt)} g\nLoan ₹${Calc.inr(st.principal)} @ ₹${l.ratePct}/100/month from ${fdate(l.date)}` +
      (open ? `\nDue till ${fdate(asOf)}: ₹${Calc.inr(st.totalDue)}` : `\nReleased on ${fdate(l.closedAt)}`)
  });

  const onDate = field('Work out till', { type: 'date', value: asOf });
  onDate.input.addEventListener('change', () => go('loan/' + id + '?on=' + onDate.input.value));
  const pay = (type) => async () => {
    const labels = { close: 'Release girvi', interest: 'Interest only', part: 'Part payment', topup: 'Extra loan (top-up)' };
    const v = await ask(labels[type], [
      { key: 'amount', label: type === 'topup' ? 'Extra amount given (₹)' : 'Amount received (₹)', type: 'num',
        value: type === 'close' ? String(st.totalDue) : type === 'interest' ? String(Math.round(st.interestDue)) : '' },
      { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' },
      { key: 'date', label: t('Date'), type: 'date', value: asOf }]);
    if (!v) return;
    await busy(null, async () => {
      await call('loans.pay', { loanId: id, type, amount: v.amount, mode: v.mode, date: v.date });
      toast(type === 'close' ? 'Girvi released' : 'Saved');
      go('loan/' + id + (type === 'close' ? '' : '?on=' + v.date));
    });
  };

  return screen(open ? t('Release girvi') : 'Girvi (closed)', l.customerName + ' · ' + l.item + ' · ' + g3(l.netWt) + ' g', [
    query.new ? h('div', { class: 'ok-box' }, 'Girvi saved. Send the receipt below.') : null,
    card(
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Loan given'), h('span', null, inr(l.principal))),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Rate'), h('span', null, '₹' + l.ratePct + ' per 100 / month')),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, fdate(l.date) + ' → ' + fdate(l.asOf)), h('span', null, st.totalDays + ' days')),
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Paid before'), h('span', null, inr(st.paidInterest + st.paidPrincipal))),
      l.valueToday ? h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Item value today'), h('span', null, inr(l.valueToday) + ' · loan ' + l.ltvPct + '%')) : null),
    open ? onDate : null,
    card(h('div', { class: 'sec' }, 'INTEREST BY MONTH'), h('div', { class: 'mrow head' }, h('span', null, 'Month'), h('span', null, 'Days'), h('span', { class: 'r' }, 'Interest')),
      custRows, h('div', { class: 'mrow strong' }, h('span', null, 'Total interest'), h('span', null, st.totalDays), h('span', { class: 'r' }, inr(st.totalInterest)))),
    open && !isViewer() ? h('div', { class: 'grid g3' },
      h('button', { class: 'btn2 small', onclick: pay('interest') }, 'Interest only'),
      h('button', { class: 'btn2 small', onclick: pay('part') }, 'Part pay'),
      h('button', { class: 'btn2 small', onclick: pay('topup') }, 'Extra loan')) : null,
    actions
  ], open ? [h('div', { class: 'kv foot-total' }, h('span', { class: 'muted' }, t('Take from customer')), h('span', { class: 'big' }, inr(st.totalDue))),
    isViewer() ? null : h('button', { class: 'btn', onclick: pay('close') }, 'Release & send receipt')] : null, { back: '#/loans' });
}
