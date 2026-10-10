/* Speed check: fills a shop with about two years of data, then counts what each screen asks of Google
 * (sheet reads, cells, row writes, cache calls) and turns it into an estimated time on real Apps Script.
 * Run: node tests/perf.js            (prints a table; nothing is sent anywhere) */
const { createContext } = require('./mock-gas');

// Rough Apps Script costs, from Google's quotas/best-practice notes and common measurements (estimates only).
const COST = { call: 60, cellRead: 0.012, cellWrite: 0.02, append: 120, cache: 12, props: 25, base: 350 };
const est = (o) => Math.round(COST.base + o.calls * COST.call + o.read * COST.cellRead + o.written * COST.cellWrite
  + o.appends * (COST.append - COST.call) + o.cache * COST.cache + o.props * COST.props);

function build(scale) {
  const g = createContext(new Date('2026-10-08T11:30:00Z'));
  Object.keys(g.SCHEMA).forEach((n) => g.sheet_(n));
  Object.keys(g.DEFAULT_SETTINGS).forEach((k) => g.insert_('Settings', { key: k, value: g.DEFAULT_SETTINGS[k] }));
  g.setSetting_('cash_opening_date', '2024-04-01');
  g.setSetting_('shop_gstin', '27ABCDE1234F1Z5');
  g.setSetting_('dues_v', '1');
  g.createUser_('Viju', 'viju', 'owner', '1234');
  const N = (x) => Math.round(x * scale);
  const sheet = (n) => g._active.getSheetByName(n);
  const put = (name, objs) => { const H = g.SCHEMA[name]; const sh = sheet(name); objs.forEach((o) => sh.data.push(H.map((h) => (o[h] === undefined ? '' : typeof o[h] === 'object' ? JSON.stringify(o[h]) : String(o[h]))))); };
  const day = (i) => { const d = new Date(Date.UTC(2024, 3, 1) + (i % 920) * 86400000); return d.toISOString().slice(0, 10); };
  const cust = []; for (let i = 0; i < N(4000); i++) cust.push({ id: 'K' + i, firstName: 'Name' + i, lastName: 'Patil', mobile: String(9000000000 + i), village: 'V' + (i % 40), createdAt: day(i) });
  put('Customers', cust);
  const line = { name: 'Ring 22K', metal: 'gold', purityPct: 91.6, weight: 4.2, rate: 14030, makingType: 'perg', makingPerG: 150, metalValue: 58926, making: 630, amount: 59556, cost: 52000 };
  const sales = []; for (let i = 0; i < N(8000); i++) sales.push({ id: 'S' + i, billNo: 'GST/26-27/' + i, type: i % 3 ? 'GST' : 'EST', fy: '26-27', date: day(i), customerId: 'K' + (i % N(4000)), customerName: 'Name Patil', mobile: '9000000000', village: 'V1', lines: [line], oldGold: [], gstPct: 3, subtotal: 59556, tax: 1786, roundOff: 0, invoiceTotal: 61342, oldValue: 0, net: 61342, cash: 61342, upi: 0, udhaar: 0, costTotal: 52000, status: 'ok', by: 'viju', at: day(i) + 'T10:00:00', notes: '', printOpts: {} });
  put('Sales', sales);
  const rates = []; for (let i = 0; i < 920; i++) rates.push({ id: 'R' + i, date: day(i), g24: 15300, g22: 14030, g18: 11475, silver: 190, by: 'viju', at: day(i) });
  put('Rates', rates);
  const loans = [], txns = []; for (let i = 0; i < N(1500); i++) { loans.push({ id: 'L' + i, date: day(i), customerId: 'K' + (i * 3 % N(4000)), customerName: 'Name Patil', item: 'Chain', metal: 'gold', purityPct: 91.6, grossWt: 10, netWt: 10, principal: 50000, ratePct: 2, formula: 'Principal * Rate / 100 * Days / 30', minDays: 0, status: i % 3 ? 'closed' : 'open', closedAt: i % 3 ? day(i + 90) : '', mode: 'cash' }); txns.push({ id: 'T' + i, loanId: 'L' + i, date: day(i + 30), type: 'interest', amount: 1000, mode: 'cash', status: 'ok' }); txns.push({ id: 'T' + i + 'b', loanId: 'L' + i, date: day(i + 60), type: 'part', amount: 5000, mode: 'cash', status: 'ok' }); }
  put('Loans', loans); put('LoanTxns', txns);
  const cash = []; for (let i = 0; i < N(25000); i++) cash.push({ id: 'C' + i, date: day(Math.floor(i / 27)), dir: i % 4 ? 'in' : 'out', mode: i % 5 ? 'cash' : 'upi', amount: 1000 + (i % 50) * 100, category: 'sale', refType: 'sale', refId: 'S' + (i % 8000), notes: 'Bill', by: 'viju', at: day(i), status: '' });
  put('Cash', cash);
  const dues = []; for (let i = 0; i < N(3000); i++) dues.push({ id: 'D' + i, date: day(i), customerId: 'K' + (i * 7 % N(4000)), customerName: 'Name Patil', mobile: '9000000000', amount: i % 3 ? 2000 : -1500, refType: i % 3 ? 'sale' : 'payment', refId: 'S' + i, notes: 'Bill', by: 'viju', at: day(i) });
  put('Dues', dues);
  const items = []; for (let i = 0; i < N(1500); i++) items.push({ id: 'I' + i, tag: 'T' + i, name: 'Ring', category: ['Ring', 'Chain', 'Bangles'][i % 3], metal: i % 4 ? 'gold' : 'silver', purityPct: 91.6, grossWt: 4, netWt: 4, pieces: 1, makingPerG: 150, costTotal: 50000, status: i % 2 ? 'sold' : 'in', addedAt: day(i) });
  put('Items', items);
  const old = []; for (let i = 0; i < N(3000); i++) old.push({ id: 'G' + i, date: day(i), customerId: 'K' + i % N(4000), customerName: 'Name Patil', source: 'purchase', item: 'Old ring', metal: 'gold', weight: 5, cutPct: 20, customerFine: 4, rate: 15000, amount: 60000, ourPurityPct: 80, ourFine: 4, status: i < N(2900) ? 'melted' : 'stock' });
  put('OldGold', old);
  const orders = [], op = []; for (let i = 0; i < N(800); i++) { orders.push({ id: 'O' + i, date: day(i), customerId: 'K' + i, customerName: 'Name Patil', mobile: '9000000000', item: 'Necklace', metal: 'gold', purityPct: 91.6, estWt: 20, makingPerG: 400, method: 'advance', rate: 14030, status: i < N(760) ? 'delivered' : 'booked', deliveryDate: day(i + 20), finalWt: 20, deliveredAt: day(i + 20) }); op.push({ id: 'P' + i, orderId: 'O' + i, date: day(i), amount: 20000, mode: 'cash' }); op.push({ id: 'P' + i + 'b', orderId: 'O' + i, date: day(i + 20), amount: 260000, mode: 'upi' }); }
  put('Orders', orders); put('OrderPayments', op);
  const rep = []; for (let i = 0; i < N(1200); i++) rep.push({ id: 'X' + i, date: day(i), customerId: 'K' + i, customerName: 'Name Patil', item: 'Payal', work: 'Polish', wtIn: 20, status: i < N(1150) ? 'delivered' : 'received', custCharge: 300, deliveredAt: day(i + 5) });
  put('Repairs', rep);
  const audit = []; for (let i = 0; i < N(45000); i++) audit.push({ at: day(i), user: 'viju', action: 'sale.create', ref: 'S' + i, details: '{"billNo":"GST/26-27/1","net":61342}' });
  put('Audit', audit);
  return g;
}

function run(g, label, action, data, token) {
  g._rowsCache = {}; g._sheets = {}; g._headerChecked = {}; g._findCount = {};
  const o = g._ops; Object.keys(o).forEach((k) => { o[k] = 0; });
  const t0 = Date.now();
  const res = JSON.parse(g.doPost({ postData: { contents: JSON.stringify({ action, token, data: /^(sale\.create|.*\.(save|add|pay|create))$/.test(action) ? Object.assign({ _rid: label + Math.random() }, data) : data }) } }).text);
  if (!res.ok) throw new Error(label + ': ' + res.error);
  return { label, calls: o.calls, read: o.read, written: o.written, appends: o.appends, cache: o.cache, props: o.props, ms: est(o), cpu: Date.now() - t0, bytes: JSON.stringify(res.data).length, data: res.data };
}

function suite(g, title) {
  const T = run(g, 'login', 'auth.login', { username: 'viju', pin: '1234' }).data.token;
  const rows = [];
  const clear = () => Object.keys(g._cache).forEach((k) => { if (/^(rc_|dataver|hdr_)/.test(k)) delete g._cache[k]; });
  const screens = [
    ['App open (bootstrap)', 'bootstrap', {}], ['Home summary', 'home.summary', {}], ['Find customer "name12"', 'customers.search', { q: 'name12' }],
    ['Customer page', 'customers.get', { id: 'K12' }], ['Baki list', 'dues.list', {}], ['Girvi list', 'loans.list', {}],
    ['Stock', 'stock.list', {}], ['Today report', 'reports.daily', { date: '2026-10-08' }], ['Cash book today', 'cash.list', { from: '2026-10-08' }],
    ['Bills list', 'sale.list', {}], ['Open one bill', 'sale.get', { id: 'S77' }]
  ];
  clear();
  screens.forEach(([l, a, d]) => rows.push(Object.assign(run(g, l, a, d, T), { when: 'first' })));
  const sale = run(g, 'Save a GST bill', 'sale.create', { type: 'GST', customerId: 'K5', gstPct: 3,
    lines: [{ name: 'Ring', metal: 'gold', purityPct: 91.6, weight: 4.2, rate: 14030, makingPerG: 150 }], oldGold: [], cash: 61343, upi: 0, udhaar: 0 }, T);
  rows.push(Object.assign(sale, { when: 'save' }));
  screens.slice(0, 5).forEach(([l, a, d]) => rows.push(Object.assign(run(g, l, a, d, T), { when: 'after save' })));
  screens.slice(0, 5).forEach(([l, a, d]) => rows.push(Object.assign(run(g, l, a, d, T), { when: 'again' })));
  console.log('\n' + title);
  console.log('screen'.padEnd(28) + 'when'.padEnd(12) + 'calls'.padStart(6) + 'cells read'.padStart(12) + 'rows added'.padStart(11) + 'est. sec'.padStart(10) + 'KB'.padStart(7));
  rows.forEach((r) => console.log(r.label.padEnd(28) + r.when.padEnd(12) + String(r.calls).padStart(6) + String(r.read).padStart(12) + String(r.appends).padStart(11) + (r.ms / 1000).toFixed(1).padStart(10) + (r.bytes / 1024).toFixed(0).padStart(7)));
  return rows;
}

const scale = parseFloat(process.argv[2] || '1');
const g = build(scale);
const sizes = Object.keys(g.SCHEMA).map((n) => n + ' ' + g._active.getSheetByName(n).data.length).join(', ');
console.log('Shop data: ' + sizes);
suite(g, 'Two-year shop (scale ' + scale + ')');
module.exports = { build, run, suite };
