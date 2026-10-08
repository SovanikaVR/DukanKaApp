/* ---------- Girvi (gold loans) ---------- */

function loanOpts_() {
  return { formula: formula_('formula_interest'), minDays: num_(settings_().interest_min_days) };
}

function loanTxns_(loanId) {
  return rows_('LoanTxns').filter(function (t) { return t.loanId === loanId; }).map(function (t) {
    return { id: t.id, date: t.date, type: t.type, amount: num_(t.amount), interestPart: num_(t.interestPart),
      principalPart: num_(t.principalPart), mode: t.mode, by: t.by };
  });
}

function loanCreate_(user, d) {
  var c = ensureCustomer_(user, d);
  var principal = round2_(pos_(d.principal, 'Loan amount'));
  pos_(d.grossWt, 'Weight'); pos_(d.netWt, 'Weight'); pos_(d.ratePct, 'Interest rate');
  req_(principal > 0, 'Enter the loan amount');
  var rate = d.ratePct === '' || d.ratePct === undefined ? num_(settings_().interest_default_rate) : num_(d.ratePct);
  req_(rate >= 0, 'Enter the interest rate');
  var date = validDate_(d.date);
  var rec = {
    id: uid_('L'), date: date, customerId: c.id, customerName: customerName_(c), mobile: c.mobile,
    item: String(d.item || '').trim() || 'Item', metal: d.metal === 'silver' ? 'silver' : 'gold',
    purityPct: num_(d.purityPct), grossWt: round3_(d.grossWt), netWt: round3_(d.netWt || d.grossWt),
    principal: principal, ratePct: rate, formula: formula_('formula_interest'),
    minDays: num_(settings_().interest_min_days), status: 'open', closedAt: '',
    notes: String(d.notes || ''), by: user.username, at: nowIso_()
  };
  insert_('Loans', rec);
  cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', principal, 'girvi-given', 'loan', rec.id, rec.customerName, date);
  audit_(user, 'loan.create', rec.id, { principal: principal, rate: rate });
  return loanGet_(rec.id);
}

function itemValue_(metal, netWt, purityPct, rate) {
  if (!rate) return 0;
  if (metal === 'silver') return Math.round(netWt * num_(rate.silver) * (purityPct || 100) / 100);
  return Math.round(netWt * num_(rate.g24) * (purityPct || 91.6) / 100);
}

function loanGet_(id, asOf) {
  var l = find_('Loans', id);
  req_(l, 'Loan not found');
  var txns = loanTxns_(id);
  var on = l.status === 'open' ? validDate_(asOf) : (l.closedAt || today_());
  var st = Calc.loanStatement(l, txns, on, loanOpts_());
  var rate = todayRate_();
  var value = itemValue_(l.metal, num_(l.netWt), num_(l.purityPct), rate);
  var out = {};
  SCHEMA.Loans.forEach(function (k) { out[k] = l[k]; });
  ['purityPct', 'grossWt', 'netWt', 'principal', 'ratePct', 'minDays'].forEach(function (k) { out[k] = num_(l[k]); });
  out.txns = txns;
  out.statement = st;
  out.asOf = on;
  out.valueToday = value;
  out.ltvPct = value ? Math.round(st.principal / value * 100) : null;
  out.shop = shopInfo_();
  return out;
}

function loansList_(d) {
  var status = d.status || 'open';
  var q = String(d.q || '').toLowerCase();
  var t = today_();
  var opts = loanOpts_();
  var rate = todayRate_();
  var allTx = rows_('LoanTxns');
  var list = rows_('Loans').filter(function (l) {
    if (status !== 'all' && l.status !== status) return false;
    if (q && (l.customerName + ' ' + l.mobile + ' ' + l.item).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).map(function (l) {
    var txns = allTx.filter(function (x) { return x.loanId === l.id; });
    var st = Calc.loanStatement(l, txns, l.status === 'open' ? t : (l.closedAt || t), opts);
    var value = itemValue_(l.metal, num_(l.netWt), num_(l.purityPct), rate);
    return {
      id: l.id, date: l.date, customerId: l.customerId, customerName: l.customerName, mobile: l.mobile,
      item: l.item, metal: l.metal, netWt: num_(l.netWt), principal: st.principal, ratePct: num_(l.ratePct),
      days: st.totalDays, interestDue: st.interestDue, totalDue: st.totalDue, valueToday: value,
      ltvPct: value ? Math.round(st.principal / value * 100) : null, status: l.status, closedAt: l.closedAt
    };
  });
  list.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  return list;
}

function loanPay_(user, d) {
  var l = find_('Loans', d.loanId);
  req_(l, 'Loan not found');
  req_(l.status === 'open', 'This loan is already closed');
  var type = d.type;
  req_(['interest', 'part', 'topup', 'close'].indexOf(type) >= 0, 'Pick what is being paid');
  var date = validDate_(d.date);
  req_(date >= l.date, 'Date is before the loan date');
  var txns = loanTxns_(l.id);
  var before = Calc.loanStatement(l, txns, date, loanOpts_());
  var amt = round2_(pos_(d.amount, 'Amount'));
  if (type === 'close' && !amt && !d.restToBaki) amt = before.totalDue;
  req_(amt > 0 || (type === 'close' && d.restToBaki), 'Enter the amount');
  var interestPart = 0, principalPart = 0;
  if (type === 'interest') interestPart = amt;
  else if (type === 'part' || type === 'close') {
    interestPart = Math.min(amt, Math.max(before.interestDue, 0));
    principalPart = amt - interestPart;
  }
  var rest = 0;
  if (type === 'close') {
    req_(amt <= before.totalDue + 1, 'Total due is only ₹' + before.totalDue);
    rest = Math.round(before.totalDue - amt);
    req_(rest < 1 || d.restToBaki, 'To close, collect the full ₹' + before.totalDue + ' (or tick "rest to Baki")');
  } else if (type === 'part' || type === 'interest') {
    req_(amt <= before.totalDue + 1, 'Total due is only ₹' + before.totalDue + '. Use "Release" to close.');
  }
  var tx = {
    id: uid_('T'), loanId: l.id, date: date, type: type, amount: amt,
    interestPart: round2_(interestPart), principalPart: round2_(principalPart),
    mode: d.mode === 'upi' ? 'upi' : 'cash', by: user.username, at: nowIso_()
  };
  if (amt > 0) insert_('LoanTxns', tx);
  if (rest >= 1) duesAdd_(user, find_('Customers', l.customerId), rest, 'loan', l.id, 'Girvi released, balance', date);
  if (type === 'topup') {
    cash_(user, 'out', tx.mode, amt, 'girvi-given', 'loan', l.id, l.customerName + ' (top-up)', date);
  } else {
    cash_(user, 'in', tx.mode, amt, type === 'interest' ? 'girvi-interest' : 'girvi-received', 'loan', l.id, l.customerName, date);
  }
  if (type === 'close') update_('Loans', l.id, { status: 'closed', closedAt: date });
  audit_(user, 'loan.' + type, l.id, { amount: amt });
  return loanGet_(l.id, date);
}
