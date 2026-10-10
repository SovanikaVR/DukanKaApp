/* ---------- Dues (baki): every customer who still owes money, in one place ---------- */

/** Positive amount = customer owes us more; negative = customer paid back. */
function duesAdd_(user, c, amount, refType, refId, notes, date) {
  amount = round2_(amount);
  if (!amount) return null;
  return insert_('Dues', {
    id: uid_('D'), date: validDate_(date), customerId: c.id, customerName: customerName_(c), mobile: c.mobile,
    amount: amount, refType: refType || '', refId: refId || '', notes: notes || '', by: user ? user.username : '', at: nowIso_()
  });
}

function customerUdhaar_(customerId) {
  var due = 0;
  rows_('Dues').forEach(function (d) { if (d.customerId === customerId) due += num_(d.amount); });
  return round2_(due);
}

function duesList_(d) {
  var by = {};
  rows_('Dues').forEach(function (x) {
    var r = by[x.customerId] || (by[x.customerId] = { customerId: x.customerId, customerName: x.customerName, mobile: x.mobile,
      due: 0, since: x.date, last: x.date, items: [] });
    r.due = round2_(r.due + num_(x.amount));
    if (x.date < r.since) r.since = x.date;
    if (x.date > r.last) r.last = x.date;
    r.items.push({ id: x.id, date: x.date, amount: num_(x.amount), refType: x.refType, refId: x.refId, notes: x.notes, by: x.by, at: x.at });
  });
  var q = String(d.q || '').toLowerCase();
  // d.cleared: customers whose baki went to zero in the last 60 days — to see who cleared it, and undo a mistake.
  var since60 = shiftDate_(today_(), -60);
  var list = Object.keys(by).map(function (k) { return by[k]; }).filter(function (r) {
    if (d.cleared) { if (r.due > 0.5 || r.last < since60 || !r.items.some(function (x) { return x.amount > 0; })) return false; }
    else if (r.due <= 0.5) return false;
    return !q || (r.customerName + ' ' + r.mobile).toLowerCase().indexOf(q) >= 0;
  });
  if (d.cleared) list.sort(function (a, b) { return a.last < b.last ? 1 : -1; });
  else list.sort(function (a, b) { return a.since < b.since ? -1 : 1; });
  var total = Math.round(list.reduce(function (a, r) { return a + r.due; }, 0)), count = list.length;
  // A page at a time (oldest baki first): the phone gets a small answer even when hundreds of customers owe.
  var limit = Math.min(Math.max(parseInt(d.limit, 10) || 100, 20), 1000);
  list = list.slice(0, limit);
  var names = {};
  if (list.length > 3) readCols_('Customers', ['id', 'firstName', 'lastName', 'mobile', 'village']).forEach(function (c) { names[c.id] = c; });
  list.forEach(function (r) {
    var c = names[r.customerId] || (list.length <= 3 ? find_('Customers', r.customerId) : null);
    if (c) { r.customerName = customerName_(c); r.mobile = c.mobile; r.village = c.village; }
    var undone = {};
    r.items.forEach(function (x) { var m = /Payment undone \((D\w+)\)/.exec(x.notes || ''); if (m) undone[m[1]] = 1; });
    r.items = r.items.slice(-8).reverse().map(function (x) {
      return { id: x.id, date: x.date, amount: x.amount, refType: x.refType, notes: x.notes, by: x.by, undone: !!undone[x.id] };
    });
  });
  return { list: list, total: total, count: count, more: count > list.length };
}

function duesPay_(user, d) {
  var c = find_('Customers', d.customerId);
  req_(c, 'Customer not found');
  var amt = round2_(d.amount);
  req_(amt > 0, 'Enter the amount received');
  var due = customerUdhaar_(c.id);
  req_(amt <= round2_(due) + 0.5, 'Customer owes only ₹' + Math.round(due));
  var date = validDate_(d.date);
  var cr = cash_(user, 'in', d.mode === 'upi' ? 'upi' : 'cash', amt, 'udhaar', 'udhaar', c.id, customerName_(c), date);
  duesAdd_(user, c, -amt, 'payment', '', 'Received (' + cr.id + ')' + (d.notes ? ' ' + d.notes : ''), date);
  audit_(user, 'dues.pay', c.id, { amount: amt });
  return { udhaar: customerUdhaar_(c.id) };
}

/** Owner: a payment entered by mistake (customer did not pay). The baki comes back and the cash / UPI entry
 *  of that payment is removed from the cash book. Can be done once per payment. */
function duesUndoPay_(user, d) {
  var x = find_('Dues', d.id);
  req_(x && x.refType === 'payment' && num_(x.amount) < 0, 'This is not a payment');
  var already = rows_('Dues').some(function (y) { return y.customerId === x.customerId && String(y.notes).indexOf('Payment undone (' + x.id + ')') >= 0; });
  req_(!already, 'This payment is already undone');
  var c = find_('Customers', x.customerId);
  req_(c, 'Customer not found');
  var m = /Received \((C\w+)\)/.exec(x.notes || '');
  if (m) { var cr = find_('Cash', m[1]); if (cr && cr.status !== 'void') update_('Cash', cr.id, { status: 'void' }); }
  duesAdd_(user, c, -num_(x.amount), 'adjust', '', 'Payment undone (' + x.id + ')' + (d.reason ? ': ' + String(d.reason).slice(0, 100) : ''), today_());
  audit_(user, 'dues.undoPay', x.id, { customer: c.id, amount: x.amount, reason: d.reason || '' });
  return { udhaar: customerUdhaar_(c.id) };
}

/** Owner: write off or correct a balance without money moving (e.g. discount given). */
function duesAdjust_(user, d) {
  var c = find_('Customers', d.customerId);
  req_(c, 'Customer not found');
  var amt = round2_(d.amount);
  req_(amt !== 0, 'Enter the amount');
  if (amt < 0) { var owes = customerUdhaar_(c.id); req_(-amt <= round2_(owes) + 0.01, 'Customer owes only ₹' + Math.round(owes)); }
  duesAdd_(user, c, amt, 'adjust', '', d.notes || (amt < 0 ? 'Written off' : 'Added'), d.date);
  audit_(user, 'dues.adjust', c.id, { amount: amt, notes: d.notes || '' });
  return { udhaar: customerUdhaar_(c.id) };
}

/* ---------- Correcting old records (owner) ---------- */

function loanEdit_(user, d) {
  var l = find_('Loans', d.id);
  req_(l, 'Loan not found');
  req_(l.status === 'open', 'Only an open loan can be edited');
  var patch = {};
  ['item', 'metal', 'notes'].forEach(function (k) { if (d[k] !== undefined) patch[k] = String(d[k]); });
  ['purityPct', 'grossWt', 'netWt', 'ratePct'].forEach(function (k) {
    if (d[k] !== undefined && d[k] !== '') { req_(num_(d[k]) >= 0, 'Values cannot be negative'); patch[k] = num_(d[k]); }
  });
  var hasTx = loanTxns_(l.id).length > 0;
  if (patch.ratePct !== undefined && patch.ratePct !== num_(l.ratePct)) req_(!hasTx, 'Interest rate cannot change after payments; cancel the payments first');
  if (d.date && d.date !== l.date) { req_(!hasTx, 'Date cannot change after payments; cancel the payments first'); patch.date = validDate_(d.date); }
  if (d.principal !== undefined && d.principal !== '' && num_(d.principal) !== num_(l.principal)) {
    req_(!hasTx, 'Amount cannot change after payments; cancel the payments first');
    var np = round2_(d.principal);
    req_(np > 0, 'Enter the loan amount');
    var diff = np - num_(l.principal);
    cash_(user, diff > 0 ? 'out' : 'in', l.mode || 'cash', Math.abs(diff), 'girvi-given', 'loan', l.id, 'Correction: ' + l.customerName, l.date);
    patch.principal = np;
  }
  update_('Loans', l.id, patch);
  audit_(user, 'loan.edit', l.id, patch);
  return loanGet_(l.id);
}

/** Cancels a loan entered by mistake: money given is taken back into the cash book. */
function loanVoid_(user, d) {
  var l = find_('Loans', d.id);
  req_(l, 'Loan not found');
  req_(l.status === 'open', 'Only an open loan can be cancelled');
  req_(loanTxns_(l.id).length === 0, 'Cancel the payments on this loan first');
  update_('Loans', l.id, { status: 'void', closedAt: today_(), notes: (l.notes ? l.notes + ' · ' : '') + 'Cancelled: ' + (d.reason || '') });
  cash_(user, 'in', l.mode || 'cash', num_(l.principal), 'girvi-cancel', 'loan', l.id, 'Cancelled entry: ' + l.customerName);
  audit_(user, 'loan.void', l.id, { reason: d.reason || '' });
  return { ok: true };
}

/** Undo the latest payment / top-up / release on a loan (wrong amount typed, etc.). */
function loanUndoLast_(user, d) {
  var l = find_('Loans', d.id);
  req_(l, 'Loan not found');
  var txs = rows_('LoanTxns').filter(function (t) { return t.loanId === l.id && t.status !== 'void'; });
  req_(txs.length, 'No payment to undo');
  var t = txs[txs.length - 1];
  update_('LoanTxns', t.id, { status: 'void' });
  var amt = num_(t.amount);
  if (t.type === 'topup') cash_(user, 'in', t.mode, amt, 'girvi-cancel', 'loan', l.id, 'Undo top-up: ' + l.customerName);
  else cash_(user, 'out', t.mode, amt, 'girvi-cancel', 'loan', l.id, 'Undo payment: ' + l.customerName);
  if (t.type === 'close') {
    update_('Loans', l.id, { status: 'open', closedAt: '' });
    // The balance that went to Baki at release is taken back too.
    var c = find_('Customers', l.customerId);
    var put = rows_('Dues').filter(function (x) { return x.refType === 'loan' && x.refId === l.id; })
      .reduce(function (a, x) { return a + num_(x.amount); }, 0);
    if (c && put > 0) duesAdd_(user, c, -put, 'loan', l.id, 'Girvi release undone');
  }
  audit_(user, 'loan.undo', l.id, { txn: t.id, type: t.type, amount: amt });
  return loanGet_(l.id);
}

function orderEdit_(user, d) {
  var o = find_('Orders', d.id);
  req_(o, 'Order not found');
  req_(o.status !== 'delivered' && o.status !== 'cancelled', 'Order is closed');
  var patch = {};
  ['item', 'notes', 'deliveryDate', 'metal'].forEach(function (k) { if (d[k] !== undefined) patch[k] = String(d[k]); });
  ['purityPct', 'estWt', 'makingPerG', 'karigarPerG'].forEach(function (k) {
    if (d[k] !== undefined && d[k] !== '') { req_(num_(d[k]) >= 0, 'Values cannot be negative'); patch[k] = num_(d[k]); }
  });
  if (patch.estWt !== undefined) req_(patch.estWt > 0, 'Enter the approximate weight');
  if (d.rate !== undefined && d.rate !== '' && num_(o.rate) > 0) { req_(num_(d.rate) > 0, 'Enter the rate'); patch.rate = num_(d.rate); }
  var w = patch.estWt !== undefined ? patch.estWt : num_(o.estWt);
  var r = patch.rate !== undefined ? patch.rate : num_(o.rate);
  var m = patch.makingPerG !== undefined ? patch.makingPerG : num_(o.makingPerG);
  if (r > 0) patch.fixedTotal = orderTotalFor_(w, r, m);
  update_('Orders', o.id, patch);
  audit_(user, 'order.edit', o.id, patch);
  return orderGet_(o.id);
}

function repairEdit_(user, d) {
  var r = find_('Repairs', d.id);
  req_(r, 'Repair not found');
  req_(r.status !== 'delivered', 'Already given back');
  var patch = {};
  ['item', 'work', 'notes', 'deliveryDate'].forEach(function (k) { if (d[k] !== undefined) patch[k] = String(d[k]); });
  if (d.wtIn !== undefined && d.wtIn !== '' && num_(d.wtIn) !== num_(r.wtIn)) req_(!r.returnedAt, 'Weight in cannot change after the item came back from the karigar');
  ['wtIn', 'karigarRate', 'custRate'].forEach(function (k) {
    if (d[k] !== undefined && d[k] !== '') { req_(num_(d[k]) >= 0, 'Values cannot be negative'); patch[k] = num_(d[k]); }
  });
  var saved = update_('Repairs', r.id, patch);
  audit_(user, 'repair.edit', r.id, patch);
  return repairOut_(saved);
}

/** Reverses a manual cash entry (expense / other income) typed by mistake. */
function cashVoid_(user, d) {
  var c = find_('Cash', d.id);
  req_(c, 'Entry not found');
  req_(c.refType === 'manual', 'Only expenses / other income can be removed here. Undo the bill, loan or order instead.');
  req_(c.status !== 'void', 'Already removed');
  update_('Cash', c.id, { status: 'void' });
  audit_(user, 'cash.void', c.id, { amount: c.amount, notes: c.notes });
  return { ok: true };
}

/* ---------- Light summary for the home screen ---------- */

function homeSummary_() {
  var t = today_();
  var yearAgo = String(parseInt(t.slice(0, 4), 10) - 1) + t.slice(4);
  // Home only needs counts: a few columns of each tab, never whole tabs.
  var orders = readCols_('Orders', ['status', 'deliveryDate']).filter(function (o) { return o.status !== 'delivered' && o.status !== 'cancelled'; });
  var loans = readCols_('Loans', ['date', 'status']).filter(function (l) { return l.status === 'open'; });
  var due = {};
  readCols_('Dues', ['customerId', 'amount']).forEach(function (x) { due[x.customerId] = (due[x.customerId] || 0) + num_(x.amount); });
  var owing = Object.keys(due).filter(function (k) { return round2_(due[k]) > 0.5; });
  return {
    ordersDueToday: orders.filter(function (o) { return o.deliveryDate === t; }).length,
    ordersLate: orders.filter(function (o) { return o.deliveryDate && o.deliveryDate < t; }).length,
    loansOld: loans.filter(function (l) { return l.date <= yearAgo; }).length,
    loansOpen: loans.length,
    ordersPending: orders.length,
    repairsReady: readCols_('Repairs', ['status']).filter(function (r) { return r.status === 'ready'; }).length,
    duesCount: owing.length, duesTotal: Math.round(owing.reduce(function (a, k) { return a + round2_(due[k]); }, 0))
  };
}

/** v1.0 kept udhaar only on bills. Copy it into the Dues tab once (runs on the first save after updating).
 *  Safe to run again: bills and payments already copied are skipped. */
function migrateDues_() {
  if (settings_().dues_v === '1') return;
  var have = {};
  rows_('Dues').forEach(function (x) { have[x.refType + '|' + (x.refType === 'payment' ? x.notes : x.refId)] = 1; });
  var custs = {};
  rows_('Customers').forEach(function (c) { custs[c.id] = c; });
  var out = [];
  var add = function (c, amount, refType, refId, notes, date) {
    out.push({ id: uid_('D'), date: date, customerId: c.id, customerName: customerName_(c), mobile: c.mobile,
      amount: round2_(amount), refType: refType, refId: refId, notes: notes, by: 'update', at: nowIso_() });
  };
  rows_('Sales').forEach(function (s) {
    if (s.status === 'void' || num_(s.udhaar) <= 0 || have['sale|' + s.id]) return;
    if (custs[s.customerId]) add(custs[s.customerId], num_(s.udhaar), 'sale', s.id, 'Bill ' + s.billNo, s.date);
  });
  rows_('Cash').forEach(function (x) {
    var key = 'payment|Received (' + x.id + ')';
    if (x.refType !== 'udhaar' || have[key]) return;
    if (custs[x.refId]) add(custs[x.refId], -num_(x.amount), 'payment', '', 'Received (' + x.id + ')', x.date);
  });
  if (out.length) {
    var headers = SCHEMA.Dues;
    var sh = sheet_('Dues');
    markWritten_('Dues');
    sh.getRange(sh.getLastRow() + 1, 1, out.length, headers.length)
      .setValues(out.map(function (o) { return headers.map(function (h) { return toCell_(o[h]); }); }));
    delete _rowsCache.Dues;
  }
  setSetting_('dues_v', '1');
}
