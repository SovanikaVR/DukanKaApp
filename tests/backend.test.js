/* End-to-end checks of the backend against an in-memory Google Sheet.  Run: npm test */
const assert = require('assert');
const { createContext } = require('./mock-gas');

const g = createContext(new Date('2026-10-08T11:30:00Z'));

// One-time setup without the Sheets UI.
Object.keys(g.SCHEMA).forEach((n) => g.sheet_(n));
Object.keys(g.DEFAULT_SETTINGS).forEach((k) => g.insert_('Settings', { key: k, value: g.DEFAULT_SETTINGS[k] }));
g.setSetting_('cash_opening_date', '2026-01-01');
g.createUser_('Viju', 'viju', 'owner', '1234');

function call(action, data, token) {
  g._rowsCache = {};
  const res = g.doPost({ postData: { contents: JSON.stringify({ action, token, data }) } });
  return JSON.parse(res.text);
}
function ok(action, data, token) {
  const r = call(action, data, token);
  if (!r.ok) throw new Error(action + ' failed: ' + r.error);
  return r.data;
}
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('  ✓ ' + name); }

console.log('Backend scenario');

assert.strictEqual(call('auth.login', { username: 'viju', pin: '9999' }).ok, false);
const T = ok('auth.login', { username: 'Viju', pin: '1234' }).token;

test('bootstrap + rate', () => {
  const b = ok('bootstrap', {}, T);
  assert.strictEqual(b.user.role, 'owner');
  const r = ok('rates.save', { g24: 15300 }, T);
  assert.strictEqual(r.g22, Math.round(15300 * 0.916));
  ok('rates.save', { g24: 15300, g22: 14030, g18: 11475, silver: 190 }, T);
  assert.strictEqual(ok('bootstrap', {}, T).rate.g22, 14030);
});

let ramesh, ganesh;
test('customers + search by name, surname, mobile, village', () => {
  ramesh = ok('customers.save', { firstName: 'Ramesh', lastName: 'Patil', mobile: '98220 41127', village: 'Wadgaon' }, T);
  ganesh = ok('customers.save', { firstName: 'Ganesh', lastName: 'Patil', mobile: '9011077342', village: 'Wadgaon' }, T);
  ok('customers.save', { firstName: 'Sunita', lastName: 'Patil', mobile: '9764420915', village: 'Shirur' }, T);
  assert.strictEqual(ok('customers.search', { q: 'ram' }, T).results[0].name, 'Ramesh Patil');
  assert.strictEqual(ok('customers.search', { q: 'patil' }, T).results.length, 3);
  assert.strictEqual(ok('customers.search', { q: '41127' }, T).results[0].matched, 'mobile');
  assert.strictEqual(ok('customers.search', { q: 'patil', village: 'Shirur' }, T).results.length, 1);
});

test('GST bill needs GSTIN, then matches the design numbers', () => {
  const sale = {
    type: 'GST', customerId: ganesh.id, gstPct: 3,
    lines: [{ name: 'Ring 22K', metal: 'gold', purityPct: 91.6, weight: 4.2, rate: 14030, makingPerG: 150, saveName: true }],
    oldGold: [{ item: 'Old ear rings', weight: 3, cutPct: 25, rate: 15300, ourPurityPct: 80 }],
    cash: 20000, upi: 6918, udhaar: 0
  };
  assert.ok(/GSTIN/.test(call('sale.create', sale, T).error));
  ok('settings.save', { shop_gstin: '27ABCDE1234F1Z5', shop_name: 'Test Jewellers' }, T);
  const b = ok('sale.create', sale, T);
  assert.strictEqual(b.billNo, 'GST/26-27/0001');
  assert.strictEqual(b.subtotal, 59556);
  assert.strictEqual(b.tax, 1786.68);
  assert.strictEqual(b.invoiceTotal, 61343);
  assert.strictEqual(b.oldValue, 34425);
  assert.strictEqual(b.net, 26918);
  assert.strictEqual(b.shop.gstin, '27ABCDE1234F1Z5');
  const og = ok('oldgold.list', {}, T);
  assert.strictEqual(og.length, 1);
  assert.strictEqual(og[0].ourFine, 2.4);
  assert.strictEqual(og[0].customerFine, 2.25);
  const est = ok('sale.create', Object.assign({}, sale, { type: 'EST', cash: 20000, upi: 5131 }), T);
  assert.strictEqual(est.billNo, 'EST/26-27/0001');
  assert.strictEqual(est.net, 25131);
  assert.ok(call('sale.create', Object.assign({}, sale, { type: 'EST', cash: 1, upi: 1 }), T).error.indexOf('add up') > 0);
});

test('bill design, colour and shop rule line with % per bill', () => {
  assert.ok(/design/.test(call('settings.save', { bill_template: 'fancy' }, T).error));
  assert.ok(/0 to 100/.test(call('settings.save', { bill_rule_pct: '150' }, T).error));
  ok('settings.save', { bill_template: 'royal', bill_color: 'maroon', bill_rule_line: 'मोडताना ___% घट', bill_rule_pct: '10' }, T);
  const sale = { type: 'EST', customerId: ganesh.id, lines: [{ name: 'Ring', metal: 'gold', purityPct: 91.6, weight: 1, rate: 14000, makingPerG: 0 }],
    oldGold: [], cash: 14000, upi: 0, udhaar: 0, printOpts: { rulePct: '8', rate: false } };
  const b = ok('sale.create', sale, T);
  assert.strictEqual(b.printOpts.rulePct, '8');
  assert.strictEqual(b.printOpts.rate, false);
  assert.strictEqual(b.shop.template, 'royal');
  assert.strictEqual(b.shop.color, 'maroon');
  assert.strictEqual(b.shop.ruleLine, 'मोडताना ___% घट');
  assert.ok(/0 to 100/.test(call('sale.create', Object.assign({}, sale, { printOpts: { rulePct: '-3' } }), T).error));
  ok('sale.void', { id: b.id }, T);
});

let loan;
test('girvi: day-wise interest, part payment, close', () => {
  loan = ok('loans.create', { customerId: ramesh.id, item: 'Gold chain', metal: 'gold', purityPct: 91.6,
    grossWt: 12.65, netWt: 12.4, principal: 60000, ratePct: 2, date: '2026-06-14' }, T);
  const st = ok('loans.get', { id: loan.id, asOf: '2026-10-08' }, T).statement;
  assert.strictEqual(st.totalDays, 116);
  assert.strictEqual(st.totalInterest, 4640);
  assert.strictEqual(st.totalDue, 64640);
  assert.strictEqual(ok('loans.list', {}, T)[0].totalDue, 64640);
  const after = ok('loans.pay', { loanId: loan.id, type: 'part', amount: 10000, date: '2026-10-08' }, T);
  assert.strictEqual(after.statement.principal, 54640);
  assert.ok(call('loans.pay', { loanId: loan.id, type: 'close', amount: 100, date: '2026-10-08' }, T).error.indexOf('full') > 0);
  const closed = ok('loans.pay', { loanId: loan.id, type: 'close', date: '2026-10-08' }, T);
  assert.strictEqual(closed.status, 'closed');
  assert.strictEqual(ok('loans.list', {}, T).length, 0);
});

test('orders: fixed rate (A) and deposit only (B)', () => {
  const a = ok('orders.create', { customerId: ramesh.id, item: 'Necklace', estWt: 10, makingPerG: 150, karigarPerG: 35,
    method: 'A', rate: 15300, advance: 77250, deliveryDate: '2026-10-25' }, T);
  assert.strictEqual(a.estTotal, 154500);
  assert.strictEqual(a.balance, 77250);
  const b = ok('orders.create', { customerId: ramesh.id, item: 'Chain', estWt: 12, makingPerG: 150, method: 'B', advance: 50000 }, T);
  assert.strictEqual(b.balance, null);
  const fixed = ok('orders.pay', { orderId: b.id, amount: 20000, fixRate: 15400, deliveryDate: '2026-11-02' }, T);
  assert.strictEqual(fixed.rate, 15400);
  assert.strictEqual(fixed.paid, 70000);
  const done = ok('orders.deliver', { orderId: a.id, finalWt: 10, amount: 77250 }, T);
  assert.strictEqual(done.status, 'delivered');
  assert.strictEqual(ok('orders.list', {}, T).length, 1);
});

let karigar, wholesaler;
test('repair: karigar cost vs customer charge', () => {
  karigar = ok('parties.save', { type: 'karigar', name: 'Sanjay' }, T);
  const r = ok('repairs.create', { customerId: ramesh.id, item: 'Bangles', work: 'polish', wtIn: 10, karigarId: karigar.id,
    karigarRateType: 'perg', karigarRate: 60, custRateType: 'perg', custRate: 150 }, T);
  assert.strictEqual(r.estKarigarCost, 600);
  assert.strictEqual(r.estCustCharge, 1500);
  ok('repairs.return', { id: r.id, wtOut: 9.98 }, T);
  const d = ok('repairs.deliver', { id: r.id }, T);
  assert.strictEqual(d.custCharge, 1500);
  assert.strictEqual(ok('parties.ledger', { id: karigar.id }, T).cash, 600);
});

test('melt old gold into fine stock, pay wholesaler in gold, karigar issue', () => {
  const og = ok('oldgold.list', {}, T);
  const m = ok('melt.create', { oldGoldIds: og.map((x) => x.id), barWt: 5.9, purityPct: 81 }, T);
  assert.strictEqual(m.actualFine, 4.779);
  assert.strictEqual(m.vsPaidG, 0.279);
  wholesaler = ok('parties.save', { type: 'wholesaler', name: 'Shree Bullion' }, T);
  ok('parties.entry', { partyId: wholesaler.id, type: 'purchase', goldG: 90, cash: 4500,
    items: [{ name: 'Ring', category: 'Ring', metal: 'gold', purityPct: 91.6, netWt: 4.2, costTotal: 60000 }] }, T);
  ok('parties.entry', { partyId: wholesaler.id, type: 'pay_gold', goldG: 3 }, T);
  const led = ok('parties.entry', { partyId: wholesaler.id, type: 'pay_cash_rate', goldG: 20, rate: 15300 }, T);
  assert.strictEqual(led.goldG, 67);
  ok('parties.entry', { partyId: karigar.id, type: 'issue_gold', goldG: 1 }, T);
  const f = ok('fine.summary', {}, T);
  assert.strictEqual(f.inHand, 0.779);
  assert.strictEqual(f.withKarigars, 1);
  assert.strictEqual(ok('stock.summary', {}, T).totals.gold.pieces, 1);
});

test('weight loss: old gold less, melting + refining loss, silver melt', () => {
  const c = ok('customers.search', { q: '' }, T).results[0];
  // 10 g old gold, 0.5 g stones/dirt taken off → fine on 9.5 g
  const r = ok('oldgold.buy', { customerId: c.id, items: [{ item: 'Old chain', weight: 10, lossG: 0.5, cutPct: 20, rate: 15000, ourPurityPct: 80 }] }, T);
  assert.strictEqual(r.items[0].customerFine, 7.6);
  assert.strictEqual(r.items[0].lossG, 0.5);
  assert.ok(/less than the weight/.test(call('oldgold.buy', { customerId: c.id, items: [{ weight: 2, lossG: 3, cutPct: 10, rate: 15000 }] }, T).error));
  ok('oldgold.buy', { customerId: c.id, items: [{ item: 'Old payal', metal: 'silver', weight: 100, lossG: 2, cutPct: 10, rate: 190, ourPurityPct: 70 }] }, T);
  const gold = ok('oldgold.list', {}, T).filter((g) => g.metal === 'gold');
  const silver = ok('oldgold.list', {}, T).filter((g) => g.metal === 'silver');
  assert.ok(/only gold/.test(call('melt.create', { oldGoldIds: [gold[0].id, silver[0].id], barWt: 5, purityPct: 80 }, T).error));
  // gold: net in 9.5 g, bar 9.3 g → melting loss 0.2 g; refining loss 0.1 g → fine (9.3−0.1)×80% = 7.36
  const m = ok('melt.create', { oldGoldIds: [gold[0].id], barWt: 9.3, purityPct: 80, refineLossG: 0.1 }, T);
  assert.strictEqual(m.lossG, 0.2);
  assert.strictEqual(m.refineLossG, 0.1);
  assert.strictEqual(m.totalLossG, 0.3);
  assert.strictEqual(m.actualFine, 7.36);
  const ms = ok('melt.create', { metal: 'silver', oldGoldIds: [silver[0].id], barWt: 96, purityPct: 75 }, T);
  assert.strictEqual(ms.metal, 'silver');
  assert.strictEqual(ms.lossG, 2);
  assert.strictEqual(ms.actualFine, 72);
  const f = ok('fine.summary', {}, T);
  assert.strictEqual(f.silver.inHand, 72);
  assert.strictEqual(f.losses.gold.buy, 0.5);
  assert.strictEqual(f.losses.gold.melt, 0.3); // 0.1 g from the first melt + 0.2 g here
  assert.strictEqual(f.losses.silver.melt, 2);
  assert.strictEqual(ok('melt.list', { metal: 'silver' }, T).length, 1);
});

test('wholesaler: silver purchase, pay in fine silver, silver rate cut', () => {
  const w = ok('parties.save', { type: 'wholesaler', name: 'Silver Mart' }, T);
  // 1 kg payal at 70% touch → 700 g fine silver to give
  ok('parties.entry', { partyId: w.id, type: 'purchase', silverG: 700, cash: 0 }, T);
  assert.ok(/fine silver in hand/.test(call('parties.entry', { partyId: w.id, type: 'pay_silver', silverG: 100 }, T).error));
  ok('parties.entry', { partyId: w.id, type: 'pay_silver', silverG: 72 }, T);
  const led = ok('parties.entry', { partyId: w.id, type: 'pay_cash_rate', metal: 'silver', goldG: 128, rate: 190 }, T);
  assert.strictEqual(led.silverG, 500);
  assert.strictEqual(led.goldG, 0);
  assert.strictEqual(ok('fine.summary', {}, T).silver.inHand, 0);
  assert.strictEqual(ok('parties.list', { type: 'wholesaler' }, T).find((p) => p.id === w.id).silverG, 500);
});

test('stock photo kept in Drive, loaded on its own', () => {
  const it = ok('stock.list', {}, T)[0];
  const jpg = 'data:image/jpeg;base64,' + Buffer.from('fakejpeg').toString('base64');
  assert.ok(ok('stock.photoSet', { id: it.id, data: jpg }, T).photoId);
  assert.strictEqual(ok('stock.photo', { id: it.id }, T).data, jpg);
  assert.ok(ok('stock.list', {}, T)[0].photoId);
  ok('stock.photoSet', { id: it.id, data: '' }, T);
  assert.ok(/No photo/.test(call('stock.photo', { id: it.id }, T).error));
});

test('import many customers with opening baki', () => {
  const before = ok('dues.list', {}, T).total;
  const r = ok('customers.import', { rows: [
    { firstName: 'Suresh', lastName: 'Jadhav', mobile: '+91 98220 11111', village: 'Akot', baki: '₹2,500' },
    { firstName: 'Mangesh', mobile: '98220 22222' },
    { firstName: 'Suresh', mobile: '9822011111' },
    { firstName: 'Bad', mobile: '12345' },
    { lastName: '', firstName: '' }] }, T);
  assert.strictEqual(r.added, 2);
  assert.strictEqual(r.skipped.length, 3);
  assert.strictEqual(r.baki, 2500);
  assert.strictEqual(ok('dues.list', {}, T).total, before + 2500);
  assert.strictEqual(ok('customers.import', { rows: [{ firstName: 'Suresh', mobile: '9822011111' }] }, T).added, 0);
});

test('reports', () => {
  const d = ok('reports.daily', { date: '2026-10-08' }, T);
  assert.strictEqual(d.sales.count, 2);
  assert.strictEqual(d.parts.repair, 900);
  assert.ok(d.parts.interest > 4600);
  const p = ok('reports.position', {}, T);
  assert.strictEqual(p.orders.pending, 1);
  assert.strictEqual(p.wholesalers.goldG, 67);
  assert.ok(typeof g.reportHtml_('2026-10-08') === 'string');
  assert.strictEqual(ok('reports.month', { month: '2026-10' }, T).days.length, 8);
});

test('roles: employee cannot change settings, viewer cannot write', () => {
  ok('users.save', { name: 'Ravi', username: 'ravi', role: 'employee', pin: '5678' }, T);
  ok('users.save', { name: 'CA', username: 'ca', role: 'viewer', pin: '1111' }, T);
  const E = ok('auth.login', { username: 'ravi', pin: '5678' }).token;
  const V = ok('auth.login', { username: 'ca', pin: '1111' }).token;
  assert.ok(/owner/.test(call('settings.save', { shop_name: 'x' }, E).error));
  ok('customers.search', { q: '' }, E);
  assert.ok(/View-only/.test(call('customers.save', { firstName: 'X' }, V).error));
  ok('reports.daily', {}, V);
  assert.ok(/owner/.test(call('users.save', { id: 'x', active: false }, E).error));
});

test('formula editing is validated', () => {
  assert.ok(/Formula/.test(call('settings.save', { formula_interest: 'Principal * Rate / ' }, T).error));
  ok('settings.save', { formula_interest: 'Principal * Rate / 100 * Days / 30' }, T);
});

test('cancel bill returns stock', () => {
  const items = ok('stock.list', {}, T);
  const b = ok('sale.create', { type: 'EST', customerId: ganesh.id, lines: [{ itemId: items[0].id, weight: 4.2, rate: 14030, makingPerG: 150 }],
    cash: 59556 }, T);
  assert.strictEqual(ok('stock.list', {}, T).length, 0);
  ok('sale.void', { id: b.id }, T);
  assert.strictEqual(ok('stock.list', {}, T).length, 1);
});

test('same save sent twice is saved once (request id)', () => {
  const n = ok('cash.list', {}, T).entries.length;
  const a = ok('cash.add', { dir: 'out', amount: 50, notes: 'tea', _rid: 'r-1' }, T);
  const b = ok('cash.add', { dir: 'out', amount: 50, notes: 'tea', _rid: 'r-1' }, T);
  assert.strictEqual(a.id, b.id);
  assert.strictEqual(ok('cash.list', {}, T).entries.length, n + 1);
});

test('negative amounts are refused', () => {
  assert.ok(/negative/.test(call('orders.create', { customerId: ganesh.id, method: 'A', estWt: 5, rate: 15000, advance: -500 }, T).error));
  assert.ok(/negative/.test(call('sale.create', { type: 'EST', customerId: ganesh.id, lines: [{ name: 'Ring', weight: 2, rate: -1 }] }, T).error));
});

test('baki (dues): bill, order and repair balances in one list, then paid back', () => {
  const c = ok('customers.save', { firstName: 'Baki', lastName: 'Wala', mobile: '9000000002', village: 'Rampur' }, T);
  ok('sale.create', { type: 'EST', customerId: c.id, lines: [{ name: 'Ring', weight: 1, rate: 10000 }], cash: 7000, udhaar: 3000 }, T);
  const o = ok('orders.create', { customerId: c.id, method: 'A', estWt: 2, rate: 10000, makingPerG: 0, advance: 5000 }, T);
  assert.ok(/only/.test(call('orders.deliver', { orderId: o.id, finalWt: 2, amount: 20000 }, T).error));
  ok('orders.deliver', { orderId: o.id, finalWt: 2, amount: 10000 }, T);       // 5000 left as baki
  const r = ok('repairs.create', { customerId: c.id, item: 'Payal', wtIn: 10, custRateType: 'fixed', custRate: 500 }, T);
  ok('repairs.deliver', { id: r.id, amount: 200 }, T);                          // 300 left as baki
  let list = ok('dues.list', {}, T);
  let me = list.list.find((x) => x.customerId === c.id);
  assert.strictEqual(me.due, 8300);
  assert.strictEqual(ok('customers.get', { id: c.id }, T).udhaar, 8300);
  assert.ok(/only/.test(call('dues.pay', { customerId: c.id, amount: 9000 }, T).error));
  ok('dues.pay', { customerId: c.id, amount: 8300, _rid: 'pay-1' }, T);
  ok('dues.pay', { customerId: c.id, amount: 8300, _rid: 'pay-1' }, T);        // double tap: ignored
  list = ok('dues.list', {}, T);
  assert.ok(!list.list.some((x) => x.customerId === c.id));
  assert.strictEqual(ok('home.summary', {}, T).duesCount, list.count);
});

test('selling part of a lot reduces stock; cancel puts it back', () => {
  ok('stock.add', { items: [{ name: 'Chain lot', category: 'Chain', netWt: 30, pieces: 3, costTotal: 300000 }] }, T);
  const lot = ok('stock.list', { q: 'chain lot' }, T)[0];
  const b = ok('sale.create', { type: 'EST', customerId: ganesh.id, lines: [{ itemId: lot.id, weight: 10, pieces: 1, rate: 10000 }], cash: 100000 }, T);
  let now = ok('stock.list', { q: 'chain lot' }, T)[0];
  assert.strictEqual(now.netWt, 20); assert.strictEqual(now.pieces, 2); assert.strictEqual(now.costTotal, 200000);
  ok('sale.void', { id: b.id }, T);
  now = ok('stock.list', { q: 'chain lot' }, T)[0];
  assert.strictEqual(now.netWt, 30); assert.strictEqual(now.pieces, 3);
  ok('stock.update', { id: lot.id, status: 'removed' }, T);
});

test('owner can correct and cancel old records', () => {
  const c = ok('customers.save', { firstName: 'Galti', mobile: '9000000003' }, T);
  const l = ok('loans.create', { customerId: c.id, item: 'Ring', grossWt: 5, principal: 20000, ratePct: 2, date: '2026-09-08' }, T);
  ok('loans.edit', { id: l.id, principal: 25000, item: 'Gold ring' }, T);
  ok('loans.pay', { loanId: l.id, type: 'interest', amount: 500, date: '2026-10-08' }, T);
  assert.ok(/payments/.test(call('loans.edit', { id: l.id, principal: 30000 }, T).error));
  assert.ok(/payments/.test(call('loans.void', { id: l.id }, T).error));
  let g2 = ok('loans.undoLast', { id: l.id }, T);
  assert.strictEqual(g2.txns.length, 0);
  ok('loans.void', { id: l.id, reason: 'typed twice' }, T);
  assert.ok(!ok('loans.list', {}, T).some((x) => x.id === l.id));
  const e = ok('cash.add', { dir: 'out', amount: 777, notes: 'tea' }, T);
  const before = ok('cash.list', {}, T).closing;
  ok('cash.void', { id: e.id }, T);
  assert.strictEqual(ok('cash.list', {}, T).closing, before + 777);
  const o = ok('orders.create', { customerId: c.id, method: 'A', estWt: 5, rate: 10000, makingPerG: 100 }, T);
  assert.strictEqual(ok('orders.edit', { id: o.id, estWt: 6 }, T).estTotal, 60600);
  const E = ok('auth.login', { username: 'ravi', pin: '5678' }).token;
  assert.ok(/owner/.test(call('cash.void', { id: e.id }, E).error));
});

test('QA round: money stays consistent in the tricky cases', () => {
  const c = ok('customers.save', { firstName: 'Qa', lastName: 'Case', mobile: '9000000099' }, T);
  // girvi: rest-to-baki release can be undone, baki goes back
  const l = ok('loans.create', { customerId: c.id, item: 'Ring', grossWt: 5, principal: 10000, ratePct: 2, date: '2026-09-08', mode: 'upi' }, T);
  ok('loans.pay', { loanId: l.id, type: 'close', amount: 8000, date: '2026-10-08', restToBaki: true }, T);
  assert.strictEqual(ok('customers.get', { id: c.id }, T).udhaar, 2200);
  ok('loans.undoLast', { id: l.id }, T);
  assert.strictEqual(ok('customers.get', { id: c.id }, T).udhaar, 0);
  assert.ok(/Interest due is only/.test(call('loans.pay', { loanId: l.id, type: 'interest', amount: 5000, date: '2026-10-08' }, T).error));
  ok('loans.pay', { loanId: l.id, type: 'part', amount: 1000, date: '2026-10-08' }, T);
  assert.ok(/later payment/.test(call('loans.pay', { loanId: l.id, type: 'part', amount: 100, date: '2026-10-01' }, T).error));
  assert.ok(/future/.test(call('loans.pay', { loanId: l.id, type: 'part', amount: 100, date: '2026-12-01' }, T).error));
  // minimum days: release inside the minimum period leaves nothing negative
  ok('settings.save', { interest_min_days: '30' }, T);
  const m = ok('loans.create', { customerId: c.id, item: 'Chain', grossWt: 5, principal: 10000, ratePct: 3, date: '2026-09-28' }, T);
  const due = ok('loans.get', { id: m.id, asOf: '2026-10-08' }, T).statement.totalDue;
  assert.strictEqual(due, 10300);
  const closed = ok('loans.pay', { loanId: m.id, type: 'close', date: '2026-10-08' }, T);
  assert.strictEqual(closed.statement.principal, 0);
  assert.strictEqual(closed.statement.totalDue, 0);
  ok('settings.save', { interest_min_days: '0' }, T);
  // order: cannot cancel twice, refund recorded once
  const o = ok('orders.create', { customerId: c.id, method: 'A', estWt: 2, rate: 10000, advance: 5000 }, T);
  ok('orders.status', { orderId: o.id, status: 'cancelled', refund: 5000 }, T);
  assert.ok(/already/.test(call('orders.status', { orderId: o.id, status: 'cancelled', refund: 5000 }, T).error));
  assert.strictEqual(ok('orders.get', { id: o.id }, T).refunded, 5000);
  // bill cancel after its baki was paid back: the paid part is returned, no hidden credit
  const b = ok('sale.create', { type: 'EST', customerId: c.id, lines: [{ name: 'Ring', weight: 1, rate: 10000 }], cash: 4000, udhaar: 6000 }, T);
  ok('dues.pay', { customerId: c.id, amount: 6000 }, T);
  const v = ok('sale.void', { id: b.id }, T);
  assert.strictEqual(v.returned, 6000);
  assert.strictEqual(ok('customers.get', { id: c.id }, T).udhaar, 0);
  // stock: weight-only lot sold in part stays in stock; over-selling refused; same piece twice refused
  const lot = ok('stock.add', { items: [{ name: 'Loose chain', netWt: 30, pieces: 1 }] }, T)[0];
  ok('sale.create', { type: 'EST', customerId: c.id, lines: [{ itemId: lot.id, weight: 10, rate: 100 }], cash: 1000 }, T);
  const left = ok('stock.list', { q: 'loose chain' }, T)[0];
  assert.strictEqual(left.netWt, 20);
  assert.ok(/Only 20 g/.test(call('sale.create', { type: 'EST', customerId: c.id, lines: [{ itemId: lot.id, weight: 25, rate: 100 }], cash: 2500 }, T).error));
  assert.ok(/twice/.test(call('sale.create', { type: 'EST', customerId: c.id, lines: [{ itemId: lot.id, weight: 5, rate: 100 }, { itemId: lot.id, weight: 5, rate: 100 }], cash: 1000 }, T).error));
  // old gold limits
  assert.ok(/Cut %/.test(call('oldgold.buy', { customerId: c.id, items: [{ weight: 2, cutPct: 120, rate: 15000 }] }, T).error));
  // fine gold cannot go below zero
  const k = ok('parties.save', { type: 'karigar', name: 'QA Karigar' }, T);
  assert.ok(/fine gold in hand/.test(call('parties.entry', { partyId: k.id, type: 'issue_gold', goldG: 500 }, T).error));
  // minimum days cannot be dodged by paying it all as "part" first
  ok('settings.save', { interest_min_days: '30' }, T);
  const md = ok('loans.create', { customerId: c.id, item: 'Kada', grossWt: 5, principal: 10000, ratePct: 3, date: '2026-10-01' }, T);
  ok('loans.pay', { loanId: md.id, type: 'part', amount: 10000, date: '2026-10-08' }, T);
  const rel = ok('loans.get', { id: md.id, asOf: '2026-10-08' }, T).statement;
  assert.strictEqual(rel.totalInterest, 300);
  ok('settings.save', { interest_min_days: '0' }, T);
  // a single piece weighed slightly lighter at the counter is still the whole piece
  const ring = ok('stock.add', { items: [{ name: 'Tag ring', netWt: 4.25 }] }, T)[0];
  ok('sale.create', { type: 'EST', customerId: c.id, lines: [{ itemId: ring.id, weight: 4.2, rate: 100 }], cash: 420 }, T);
  assert.ok(!ok('stock.list', { q: 'tag ring' }, T).length);
  // an advance to a karigar is allowed
  ok('parties.entry', { partyId: k.id, type: 'pay_labour', cash: 500 }, T);
  // employees do not see cost / profit
  const E = ok('auth.login', { username: 'ravi', pin: '5678' }).token;
  assert.strictEqual(ok('reports.daily', {}, E).profit, null);
  assert.strictEqual(ok('reports.daily', {}, T).profit !== null, true);
});

test('bills like the sample: making %, gross weight, own bill no, note, print options, exports', () => {
  const c = ok('customers.save', { firstName: 'Amol', lastName: 'Nimkar', mobile: '9970691198' }, T);
  // Sample tax invoice: 3.930 g × ₹1,51,900 per 10 g, making 5.5 % → 62,980.02 + CGST 944.70 + SGST 944.70 = 64,869
  const b = ok('sale.create', { type: 'GST', customerId: c.id, gstPct: 3, notes: 'Latkan jod, 2 pcs',
    lines: [{ name: 'Latkan Jod', weight: 3.93, grossWt: 3.93, rate: 15190, makingType: 'pct', makingPct: 5.5, purityPct: 91.6 }],
    cash: 0, upi: 64869, billNo: 'IS/73', printOpts: { purity: true } }, T);
  assert.strictEqual(b.lines[0].amount, 62980.02);
  assert.strictEqual(b.tax, 1889.4);
  assert.strictEqual(b.invoiceTotal, 64869);
  assert.strictEqual(b.billNo, 'IS/73');
  assert.strictEqual(b.notes, 'Latkan jod, 2 pcs');
  assert.ok(/already used/.test(call('sale.create', { type: 'GST', customerId: c.id, lines: [{ name: 'X', weight: 1, rate: 100 }], cash: 103, billNo: 'is/73' }, T).error));
  assert.ok(/Gross weight/.test(call('sale.create', { type: 'EST', customerId: c.id, lines: [{ name: 'X', weight: 2, grossWt: 1, rate: 100 }], cash: 200 }, T).error));
  // fixed making for the piece
  const f = ok('sale.create', { type: 'EST', customerId: c.id, lines: [{ name: 'Payal', metal: 'silver', weight: 50, rate: 190, makingType: 'fixed', makingFixed: 500 }], cash: 10000 }, T);
  assert.strictEqual(f.lines[0].making, 500);
  assert.strictEqual(f.shop.title, 'QUOTATION');
  const p = ok('sale.print', { id: b.id, printOpts: { purity: false, billNo: false }, notes: 'Thank you' }, T);
  assert.strictEqual(p.printOpts.billNo, false);
  assert.strictEqual(p.notes, 'Thank you');
  const ex = ok('sale.export', { from: '2026-10-01', to: '2026-10-08', type: 'GST' }, T);
  assert.ok(ex.bills.some((x) => x.billNo === 'IS/73'));
  assert.ok(ex.bills.every((x) => x.type === 'GST'));
  for (const m of ['bills', 'girvi', 'oldgold', 'orders', 'repairs', 'stock', 'dues', 'cash', 'customers']) {
    const r = ok('export.list', { module: m, from: '2026-01-01', to: '2026-12-31' }, T);
    assert.ok(r.columns.length && Array.isArray(r.rows), m);
    r.rows.forEach((row) => assert.strictEqual(row.length, r.columns.length, m));
  }
  const E = ok('auth.login', { username: 'ravi', pin: '5678' }).token;
  assert.ok(!ok('export.list', { module: 'stock', status: 'all' }, E).columns.includes('Our cost ₹'));
});

test('bill designer: design saved per bill type and sent with the bill', () => {
  assert.ok(/not valid/.test(call('settings.save', { bill_design_gst: '{bad' }, T).error));
  const D = { layout: 'invoice', main: '#7a1f2b', cols: ['sr', 'desc', 'net', 'amount'] };
  ok('settings.save', { bill_design_gst: JSON.stringify(D), shop_city: 'Nanded' }, T);
  const sale = { type: 'EST', customerId: ok('customers.search', { q: '' }, T).results[0].id,
    lines: [{ name: 'Ring', metal: 'gold', purityPct: 91.6, weight: 1, rate: 14000, makingPerG: 0 }], oldGold: [], cash: 14000, upi: 0, udhaar: 0 };
  const b = ok('sale.create', sale, T);
  assert.strictEqual(b.shop.design.layout, 'invoice'); // quotation uses the GST design until it has its own
  ok('settings.save', { bill_design_quote: JSON.stringify({ layout: 'book' }) }, T);
  assert.strictEqual(ok('sale.get', { id: b.id }, T).shop.design.layout, 'book');
  ok('sale.void', { id: b.id }, T);
});

test('data health check finds a repeated id', () => {
  assert.strictEqual(ok('admin.check', {}, T).ok, true);
  const c = ok('customers.search', { q: '' }, T).results[0];
  g.insert_('Customers', { id: c.id, firstName: 'Copy' });
  const r = ok('admin.check', {}, T);
  assert.strictEqual(r.ok, false);
  assert.ok(r.problems.some((p) => /same id/.test(p)));
});

test('archive finished year keeps bills searchable', () => {
  const t2 = g.createContext ? null : null; // archive needs a finished year; fake one bill in FY 25-26
  g.insert_('Sales', { id: 'S_OLD', billNo: 'EST/25-26/0009', type: 'EST', fy: '25-26', date: '2026-03-10',
    customerId: ganesh.id, customerName: 'Ganesh Patil', lines: '[]', oldGold: '[]', net: '1000', status: 'ok' });
  const r = ok('admin.archive', { fy: '25-26' }, T);
  assert.strictEqual(r.moved, 1);
  assert.ok(!ok('sale.list', {}, T).some((x) => x.id === 'S_OLD'));
  assert.strictEqual(ok('sale.list', { fy: '25-26' }, T)[0].billNo, 'EST/25-26/0009');
  assert.strictEqual(ok('sale.get', { id: 'S_OLD', fy: '25-26' }, T).billNo, 'EST/25-26/0009');
});

console.log(`\n${passed} checks passed`);
