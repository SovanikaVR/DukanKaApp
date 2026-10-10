/* ---------- Orders (advance booking) ---------- */

var _payIndex = null;
function orderPayments_(orderId) {
  // Built once per request (cleared when a payment is added): lists of many orders stay fast.
  if (!_payIndex || (!_payIndex.partial && (_payIndex.rows !== rows_('OrderPayments') || _payIndex.n !== rows_('OrderPayments').length))) {
    _payIndex = { rows: rows_('OrderPayments'), n: rows_('OrderPayments').length, by: {} };
    _payIndex.rows.forEach(function (p) { (_payIndex.by[p.orderId] = _payIndex.by[p.orderId] || []).push(p); });
  }
  return (_payIndex.by[orderId] || []).map(function (p) {
    return { id: p.id, date: p.date, amount: num_(p.amount), mode: p.mode, by: p.by };
  });
}

function orderTotalFor_(weight, rate, making) {
  return Math.round(Calc.evalFormula(formula_('formula_order_total'), { Weight: weight, Rate: rate, Making: making }));
}

function orderSummary_(o) {
  var pays = orderPayments_(o.id);
  var paid = pays.reduce(function (a, p) { return a + p.amount; }, 0); // refunds are stored as minus payments
  var refunded = -pays.reduce(function (a, p) { return a + (p.amount < 0 ? p.amount : 0); }, 0);
  var rateFixed = num_(o.rate) > 0;
  var estTotal = rateFixed ? (num_(o.fixedTotal) || orderTotalFor_(num_(o.estWt), num_(o.rate), num_(o.makingPerG))) : 0;
  return {
    id: o.id, date: o.date, customerId: o.customerId, customerName: o.customerName, mobile: o.mobile,
    item: o.item, metal: o.metal, purityPct: num_(o.purityPct), estWt: num_(o.estWt),
    makingPerG: num_(o.makingPerG), karigarPerG: num_(o.karigarPerG), method: o.method,
    rate: num_(o.rate), rateFixed: rateFixed, fixedTotal: num_(o.fixedTotal), estTotal: estTotal,
    deliveryDate: o.deliveryDate, status: o.status, karigarId: o.karigarId,
    finalWt: num_(o.finalWt), finalTotal: num_(o.finalTotal), deliveredAt: o.deliveredAt,
    notes: o.notes, payments: pays, paid: paid, refunded: refunded,
    toBaki: o.status === 'delivered' ? rows_('Dues').filter(function (x) { return x.refType === 'order' && x.refId === o.id; })
      .reduce(function (a, x) { return a + num_(x.amount); }, 0) : 0,
    balance: o.status === 'delivered' ? 0 : (rateFixed ? estTotal - paid : null)
  };
}

function orderCreate_(user, d) {
  var c = ensureCustomer_(user, d);
  var method = d.method === 'B' ? 'B' : 'A';
  var estWt = round3_(pos_(d.estWt, 'Weight'));
  pos_(d.advance, 'Advance'); pos_(d.makingPerG, 'Making'); pos_(d.karigarPerG, 'Karigar labour'); pos_(d.rate, 'Rate');
  req_(estWt > 0, 'Enter the approximate weight');
  var making = num_(d.makingPerG);
  var rate = method === 'A' ? num_(d.rate) : 0;
  if (method === 'A') req_(rate > 0, 'Enter the rate to fix');
  var date = validDate_(d.date);
  var rec = {
    id: uid_('O'), date: date, customerId: c.id, customerName: customerName_(c), mobile: c.mobile,
    item: String(d.item || 'Item').trim(), metal: d.metal === 'silver' ? 'silver' : 'gold',
    purityPct: num_(d.purityPct), estWt: estWt, makingPerG: making, karigarPerG: num_(d.karigarPerG),
    method: method, rate: rate, fixedTotal: method === 'A' ? orderTotalFor_(estWt, rate, making) : '',
    deliveryDate: d.deliveryDate || '', status: 'booked', karigarId: '', finalWt: '', finalTotal: '',
    deliveredAt: '', notes: String(d.notes || ''), by: user.username, at: nowIso_()
  };
  insert_('Orders', rec);
  var adv = round2_(d.advance);
  if (adv > 0) addOrderPayment_(user, rec, adv, d.mode, date);
  audit_(user, 'order.create', rec.id, { method: method, advance: adv });
  return orderGet_(rec.id);
}

function addOrderPayment_(user, o, amount, mode, date) {
  mode = mode === 'upi' ? 'upi' : 'cash';
  insert_('OrderPayments', { id: uid_('P'), orderId: o.id, date: validDate_(date), amount: amount, mode: mode,
    by: user.username, at: nowIso_() });
  cash_(user, 'in', mode, amount, 'order-advance', 'order', o.id, o.customerName, date);
}

function orderGet_(id) {
  var o = find_('Orders', id);
  req_(o, 'Order not found');
  var out = orderSummary_(o);
  out.shop = shopInfo_();
  return out;
}

function ordersList_(d) {
  var status = d.status || 'pending';
  var list = rows_('Orders').filter(function (o) {
    if (status === 'pending') return o.status !== 'delivered' && o.status !== 'cancelled';
    return status === 'all' || o.status === status;
  }).map(orderSummary_);
  list.sort(function (a, b) { return (a.deliveryDate || '9') < (b.deliveryDate || '9') ? -1 : 1; });
  return list;
}

/** Extra payment; for "only deposit" orders the rate can be fixed now (rate of that day). */
function orderPay_(user, d) {
  var o = find_('Orders', d.orderId);
  req_(o, 'Order not found');
  req_(o.status !== 'delivered' && o.status !== 'cancelled', 'Order is closed');
  var patch = {};
  if (num_(d.fixRate) > 0 && !num_(o.rate)) {
    patch.rate = num_(d.fixRate);
    patch.fixedTotal = orderTotalFor_(num_(o.estWt), patch.rate, num_(o.makingPerG));
  }
  if (d.deliveryDate) patch.deliveryDate = d.deliveryDate;
  var amt = round2_(pos_(d.amount, 'Amount'));
  pos_(d.fixRate, 'Rate');
  req_(amt > 0 || Object.keys(patch).length, 'Enter the amount received');
  if (Object.keys(patch).length) update_('Orders', o.id, patch);
  if (amt > 0) addOrderPayment_(user, o, amt, d.mode, d.date);
  audit_(user, 'order.pay', o.id, { amount: amt, fixRate: patch.rate || '' });
  return orderGet_(o.id);
}

/**
 * Status changes: making (give to karigar, optionally issue fine gold),
 * ready (karigar handed it back: final weight, fine used, labour), cancelled (refund).
 */
function orderStatus_(user, d) {
  var o = find_('Orders', d.orderId);
  req_(o, 'Order not found');
  req_(o.status !== 'delivered' && o.status !== 'cancelled', 'This order is already ' + o.status);
  var date = validDate_(d.date);
  var patch = { status: d.status };
  var allowed = { making: ['booked'], ready: ['booked', 'making'], cancelled: ['booked', 'making', 'ready'], booked: ['making'] };
  req_(allowed[d.status], 'Unknown status');
  req_(allowed[d.status].indexOf(o.status) >= 0, 'Order is "' + o.status + '" — cannot change it to "' + d.status + '"');
  if (d.status === 'cancelled') req_(user.role === 'owner', 'Only the owner can cancel an order');
  if (d.status === 'making') {
    if (d.karigarId) {
      patch.karigarId = d.karigarId;
      var g = round3_(pos_(d.issueFineG, 'Fine gold'));
      if (g > 0) issueFineToKarigar_(user, d.karigarId, g, 'order', o.id, 'For order: ' + o.item + ' (' + o.customerName + ')', date);
    }
  } else if (d.status === 'ready') {
    if (num_(d.finalWt) > 0) patch.finalWt = round3_(pos_(d.finalWt, 'Weight'));
    var kid = d.karigarId || o.karigarId;
    if (kid) {
      var fw = num_(d.finalWt) || num_(o.estWt);
      var labour = d.labour !== undefined && d.labour !== '' ? round2_(pos_(d.labour, 'Labour')) : round2_(fw * num_(o.karigarPerG));
      pos_(d.fineUsed, 'Fine gold used');
      patch.karigarId = kid;
      insert_('PartyLedger', {
        id: uid_('Y'), partyId: kid, date: date, type: 'job_done', goldG: -round3_(d.fineUsed), cash: labour,
        rate: '', refType: 'order', refId: o.id, notes: o.item + ' for ' + o.customerName, by: user.username, at: nowIso_()
      });
    }
  } else if (d.status === 'cancelled') {
    var refund = round2_(pos_(d.refund, 'Refund'));
    var paidSoFar = orderPayments_(o.id).reduce(function (a, p) { return a + p.amount; }, 0);
    req_(refund <= round2_(paidSoFar), 'Customer paid only ₹' + Math.round(paidSoFar));
    if (refund > 0) {
      var rmode = d.mode === 'upi' ? 'upi' : 'cash';
      insert_('OrderPayments', { id: uid_('P'), orderId: o.id, date: date, amount: -refund, mode: rmode, by: user.username, at: nowIso_() });
      cash_(user, 'out', rmode, refund, 'order-refund', 'order', o.id, o.customerName, date);
    }
  }
  update_('Orders', o.id, patch);
  audit_(user, 'order.status', o.id, patch);
  return orderGet_(o.id);
}

function orderDeliver_(user, d) {
  var o = find_('Orders', d.orderId);
  req_(o, 'Order not found');
  req_(o.status !== 'delivered' && o.status !== 'cancelled', 'Order is closed');
  var finalWt = round3_(pos_(d.finalWt, 'Weight') || o.finalWt || o.estWt);
  var rate = num_(o.rate) || pos_(d.rate, 'Rate');
  req_(rate > 0, 'Enter today\'s rate to work out the price');
  var total = orderTotalFor_(finalWt, rate, num_(o.makingPerG));
  var paid = orderPayments_(o.id).reduce(function (a, p) { return a + p.amount; }, 0);
  var balance = total - paid;
  var amt = round2_(pos_(d.amount, 'Amount'));
  var date = validDate_(d.date);
  var due = 0;
  if (balance > 0) {
    req_(amt <= balance + 1, 'Balance is only ₹' + Math.round(balance));
    due = Math.round(balance - amt);
  } else {
    req_(amt === 0, 'Customer has already paid more than the price. Nothing to collect.');
  }
  if (amt > 0) addOrderPayment_(user, o, amt, d.mode, date);
  if (due >= 1) {
    var cust = find_('Customers', o.customerId);
    duesAdd_(user, cust, due, 'order', o.id, 'Order: ' + o.item, date);
  }
  if (balance < 0) cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', -balance, 'order-refund', 'order', o.id, 'Extra advance returned', date);
  // Went straight from the karigar to the customer ("Item ready" skipped): book the karigar's labour now.
  if (o.karigarId && o.status !== 'ready') {
    var booked = rows_('PartyLedger').some(function (x) { return x.refType === 'order' && x.refId === o.id && x.type === 'job_done'; });
    if (!booked) insert_('PartyLedger', {
      id: uid_('Y'), partyId: o.karigarId, date: date, type: 'job_done', goldG: 0, cash: round2_(finalWt * num_(o.karigarPerG)),
      rate: '', refType: 'order', refId: o.id, notes: o.item + ' for ' + o.customerName, by: user.username, at: nowIso_()
    });
  }
  update_('Orders', o.id, {
    status: 'delivered', finalWt: finalWt, finalTotal: total, rate: rate, deliveredAt: date
  });
  audit_(user, 'order.deliver', o.id, { total: total, balance: balance, due: due });
  return orderGet_(o.id);
}

/* ---------- Repairs and polish ---------- */

function repairAmount_(type, rate, wt) {
  return type === 'fixed' ? round2_(rate)
    : round2_(Calc.evalFormula(formula_('formula_repair_charge'), { Weight: num_(wt), RatePerG: num_(rate) }));
}

function repairOut_(r) {
  var out = {};
  SCHEMA.Repairs.forEach(function (k) { out[k] = r[k]; });
  ['wtIn', 'karigarRate', 'custRate', 'wtOut', 'karigarCost', 'custCharge'].forEach(function (k) { out[k] = num_(r[k]); });
  out.estKarigarCost = repairAmount_(r.karigarRateType, r.karigarRate, r.wtIn);
  out.estCustCharge = repairAmount_(r.custRateType, r.custRate, r.wtIn);
  return out;
}

function repairCreate_(user, d) {
  var c = ensureCustomer_(user, d);
  var rec = {
    id: uid_('W'), date: validDate_(d.date), customerId: c.id, customerName: customerName_(c), mobile: c.mobile,
    item: String(d.item || 'Item').trim(), work: d.work || 'polish', wtIn: round3_(pos_(d.wtIn, 'Weight')),
    karigarId: d.karigarId || '', karigarRateType: d.karigarRateType === 'fixed' ? 'fixed' : 'perg',
    karigarRate: num_(d.karigarRate), custRateType: d.custRateType === 'fixed' ? 'fixed' : 'perg',
    custRate: pos_(d.custRate, 'Charge'), deliveryDate: d.deliveryDate || '',
    status: d.karigarId ? 'with_karigar' : 'received', wtOut: '', karigarCost: '', custCharge: '',
    returnedAt: '', deliveredAt: '', notes: String(d.notes || ''), by: user.username, at: nowIso_()
  };
  insert_('Repairs', rec);
  audit_(user, 'repair.create', rec.id, {});
  return repairOut_(rec);
}

function repairsList_(d) {
  var status = d.status || 'pending';
  return rows_('Repairs').filter(function (r) {
    if (status === 'pending') return r.status !== 'delivered';
    return status === 'all' || r.status === status;
  }).map(repairOut_).sort(function (a, b) { return (a.deliveryDate || '9') < (b.deliveryDate || '9') ? -1 : 1; });
}

/** Item came back from the karigar. */
function repairReturn_(user, d) {
  var r = find_('Repairs', d.id);
  req_(r, 'Repair not found');
  req_(r.status !== 'delivered', 'Already given back');
  req_(r.status !== 'ready', 'Already back from the karigar');
  var cost = d.karigarCost !== undefined && d.karigarCost !== '' ? round2_(pos_(d.karigarCost, 'Karigar cost'))
    : repairAmount_(r.karigarRateType, r.karigarRate, r.wtIn);
  var date = validDate_(d.date);
  var kid = d.karigarId || r.karigarId;
  if (kid && cost > 0) {
    insert_('PartyLedger', {
      id: uid_('Y'), partyId: kid, date: date, type: 'job_done', goldG: 0, cash: cost, rate: '',
      refType: 'repair', refId: r.id, notes: r.work + ': ' + r.item + ' (' + r.customerName + ')',
      by: user.username, at: nowIso_()
    });
  } else if (cost > 0) {
    cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', cost, 'repair-cost', 'repair', r.id, r.item, date);
  }
  var saved = update_('Repairs', r.id, {
    status: 'ready', wtOut: round3_(d.wtOut || r.wtIn), karigarCost: cost, karigarId: kid || '', returnedAt: date
  });
  audit_(user, 'repair.return', r.id, { cost: cost });
  return repairOut_(saved);
}

function repairDeliver_(user, d) {
  var r = find_('Repairs', d.id);
  req_(r, 'Repair not found');
  req_(r.status !== 'delivered', 'Already given back');
  var charge = d.custCharge !== undefined && d.custCharge !== '' ? round2_(pos_(d.custCharge, 'Charge'))
    : repairAmount_(r.custRateType, r.custRate, r.wtIn);
  var date = validDate_(d.date);
  // The customer may pay less now; the rest goes to Baki (dues).
  var got = d.amount !== undefined && d.amount !== '' ? round2_(pos_(d.amount, 'Amount')) : charge;
  req_(got <= charge + 1, 'Charge is only ₹' + Math.round(charge));
  cash_(user, 'in', d.mode === 'upi' ? 'upi' : 'cash', got, 'repair-charge', 'repair', r.id, r.customerName, date);
  if (charge - got >= 1) duesAdd_(user, find_('Customers', r.customerId), Math.round(charge - got), 'repair', r.id, 'Repair: ' + r.item, date);
  var patch = { status: 'delivered', custCharge: charge, deliveredAt: date };
  if (!r.returnedAt) {
    // Given back without "Back from karigar": book the karigar's cost now so nobody's account is missed.
    patch.returnedAt = date;
    patch.wtOut = r.wtOut || r.wtIn;
    var kc = r.karigarCost === '' ? repairAmount_(r.karigarRateType, r.karigarRate, r.wtIn) : num_(r.karigarCost);
    patch.karigarCost = r.karigarId || kc > 0 ? kc : 0;
    if (r.karigarId && kc > 0) {
      insert_('PartyLedger', {
        id: uid_('Y'), partyId: r.karigarId, date: date, type: 'job_done', goldG: 0, cash: kc, rate: '',
        refType: 'repair', refId: r.id, notes: r.work + ': ' + r.item + ' (' + r.customerName + ')', by: user.username, at: nowIso_()
      });
    } else if (kc > 0) {
      cash_(user, 'out', 'cash', kc, 'repair-cost', 'repair', r.id, r.item, date);
    }
  }
  var saved = update_('Repairs', r.id, patch);
  audit_(user, 'repair.deliver', r.id, { charge: charge });
  return repairOut_(saved);
}
