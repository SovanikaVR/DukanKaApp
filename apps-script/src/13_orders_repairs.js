/* ---------- Orders (advance booking) ---------- */

function orderPayments_(orderId) {
  return rows_('OrderPayments').filter(function (p) { return p.orderId === orderId; }).map(function (p) {
    return { id: p.id, date: p.date, amount: num_(p.amount), mode: p.mode, by: p.by };
  });
}

function orderTotalFor_(weight, rate, making) {
  return Math.round(Calc.evalFormula(formula_('formula_order_total'), { Weight: weight, Rate: rate, Making: making }));
}

function orderSummary_(o) {
  var pays = orderPayments_(o.id);
  var paid = pays.reduce(function (a, p) { return a + p.amount; }, 0);
  var rateFixed = num_(o.rate) > 0;
  var estTotal = rateFixed ? (num_(o.fixedTotal) || orderTotalFor_(num_(o.estWt), num_(o.rate), num_(o.makingPerG))) : 0;
  return {
    id: o.id, date: o.date, customerId: o.customerId, customerName: o.customerName, mobile: o.mobile,
    item: o.item, metal: o.metal, purityPct: num_(o.purityPct), estWt: num_(o.estWt),
    makingPerG: num_(o.makingPerG), karigarPerG: num_(o.karigarPerG), method: o.method,
    rate: num_(o.rate), rateFixed: rateFixed, fixedTotal: num_(o.fixedTotal), estTotal: estTotal,
    deliveryDate: o.deliveryDate, status: o.status, karigarId: o.karigarId,
    finalWt: num_(o.finalWt), finalTotal: num_(o.finalTotal), deliveredAt: o.deliveredAt,
    notes: o.notes, payments: pays, paid: paid,
    balance: o.status === 'delivered' ? 0 : (rateFixed ? estTotal - paid : null)
  };
}

function orderCreate_(user, d) {
  var c = ensureCustomer_(user, d);
  var method = d.method === 'B' ? 'B' : 'A';
  var estWt = round3_(d.estWt);
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
  if (Object.keys(patch).length) update_('Orders', o.id, patch);
  var amt = round2_(d.amount);
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
  var date = validDate_(d.date);
  var patch = { status: d.status };
  if (d.status === 'making') {
    if (d.karigarId) {
      patch.karigarId = d.karigarId;
      var g = round3_(d.issueFineG);
      if (g > 0) issueFineToKarigar_(user, d.karigarId, g, 'order', o.id, 'For order: ' + o.item + ' (' + o.customerName + ')', date);
    }
  } else if (d.status === 'ready') {
    if (num_(d.finalWt) > 0) patch.finalWt = round3_(d.finalWt);
    var kid = d.karigarId || o.karigarId;
    if (kid) {
      var fw = num_(d.finalWt) || num_(o.estWt);
      var labour = d.labour !== undefined && d.labour !== '' ? round2_(d.labour) : round2_(fw * num_(o.karigarPerG));
      insert_('PartyLedger', {
        id: uid_('Y'), partyId: kid, date: date, type: 'job_done', goldG: -round3_(d.fineUsed), cash: labour,
        rate: '', refType: 'order', refId: o.id, notes: o.item + ' for ' + o.customerName, by: user.username, at: nowIso_()
      });
    }
  } else if (d.status === 'cancelled') {
    var refund = round2_(d.refund);
    if (refund > 0) cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', refund, 'order-refund', 'order', o.id, o.customerName, date);
  } else {
    req_(d.status === 'booked', 'Unknown status');
  }
  update_('Orders', o.id, patch);
  audit_(user, 'order.status', o.id, patch);
  return orderGet_(o.id);
}

function orderDeliver_(user, d) {
  var o = find_('Orders', d.orderId);
  req_(o, 'Order not found');
  req_(o.status !== 'delivered' && o.status !== 'cancelled', 'Order is closed');
  var finalWt = round3_(d.finalWt || o.finalWt || o.estWt);
  var rate = num_(o.rate) || num_(d.rate);
  req_(rate > 0, 'Enter today\'s rate to work out the price');
  var total = orderTotalFor_(finalWt, rate, num_(o.makingPerG));
  var paid = orderPayments_(o.id).reduce(function (a, p) { return a + p.amount; }, 0);
  var balance = total - paid;
  var amt = round2_(d.amount);
  req_(Math.abs(amt - balance) < 1 || (balance <= 0 && amt === 0), 'Collect the balance ₹' + Math.round(balance));
  var date = validDate_(d.date);
  if (amt > 0) addOrderPayment_(user, o, amt, d.mode, date);
  if (balance < 0) cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', -balance, 'order-refund', 'order', o.id, 'Extra advance returned', date);
  update_('Orders', o.id, {
    status: 'delivered', finalWt: finalWt, finalTotal: total, rate: rate, deliveredAt: date
  });
  audit_(user, 'order.deliver', o.id, { total: total, balance: balance });
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
    item: String(d.item || 'Item').trim(), work: d.work || 'polish', wtIn: round3_(d.wtIn),
    karigarId: d.karigarId || '', karigarRateType: d.karigarRateType === 'fixed' ? 'fixed' : 'perg',
    karigarRate: num_(d.karigarRate), custRateType: d.custRateType === 'fixed' ? 'fixed' : 'perg',
    custRate: num_(d.custRate), deliveryDate: d.deliveryDate || '',
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
  var cost = d.karigarCost !== undefined && d.karigarCost !== '' ? round2_(d.karigarCost)
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
  var charge = d.custCharge !== undefined && d.custCharge !== '' ? round2_(d.custCharge)
    : repairAmount_(r.custRateType, r.custRate, r.wtIn);
  var date = validDate_(d.date);
  cash_(user, 'in', d.mode === 'upi' ? 'upi' : 'cash', charge, 'repair-charge', 'repair', r.id, r.customerName, date);
  var patch = { status: 'delivered', custCharge: charge, deliveredAt: date };
  if (!r.returnedAt) {
    patch.returnedAt = date;
    patch.wtOut = r.wtOut || r.wtIn;
    if (r.karigarCost === '') patch.karigarCost = repairAmount_(r.karigarRateType, r.karigarRate, r.wtIn);
  }
  var saved = update_('Repairs', r.id, patch);
  audit_(user, 'repair.deliver', r.id, { charge: charge });
  return repairOut_(saved);
}
