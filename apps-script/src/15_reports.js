/* ---------- Reports ---------- */

function reportDaily_(date) {
  date = readDate_(date);
  var rate = rateOn_(date) || { g24: 0 };
  var sales = rows_('Sales').filter(function (b) { return b.date === date && b.status !== 'void'; });
  var salesTotal = 0, salesProfit = 0, taxTotal = 0, unknownCostLines = 0;
  sales.forEach(function (b) {
    salesTotal += num_(b.invoiceTotal);
    taxTotal += num_(b.tax);
    json_(b.lines, []).forEach(function (l) {
      if (num_(l.cost) > 0) salesProfit += num_(l.amount) - num_(l.cost);
      else { salesProfit += num_(l.making); unknownCostLines++; }
    });
  });
  var interest = 0, loansClosed = 0;
  rows_('LoanTxns').forEach(function (t) {
    if (t.date !== date) return;
    interest += num_(t.interestPart);
    if (t.type === 'close') loansClosed++;
  });
  var newLoans = rows_('Loans').filter(function (l) { return l.date === date && l.status !== 'void'; });
  var repairs = rows_('Repairs').filter(function (r) { return r.deliveredAt === date; });
  var repairProfit = repairs.reduce(function (a, r) { return a + num_(r.custCharge) - num_(r.karigarCost); }, 0);
  var delivered = rows_('Orders').filter(function (o) { return o.deliveredAt === date && o.status === 'delivered'; });
  // Making profit = making charged to the customer − labour actually booked to the karigar for that order.
  var labourOf = {};
  rows_('PartyLedger').forEach(function (e) {
    if (e.refType === 'order' && e.type === 'job_done') labourOf[e.refId] = (labourOf[e.refId] || 0) + num_(e.cash);
  });
  var makingProfit = delivered.reduce(function (a, o) {
    return a + num_(o.makingPerG) * num_(o.finalWt) - (labourOf[o.id] || 0);
  }, 0);
  var melts = rows_('Melts').filter(function (m) { return m.date === date; });
  var meltGain = melts.reduce(function (a, m) {
    return a + num_(m.actualFine) * num_(rate.g24) - num_(m.paidAmount) - num_(m.cost);
  }, 0);
  var cashEntries = rows_('Cash').filter(function (c) { return c.date === date; });
  var expenses = cashEntries.filter(function (c) { return c.dir === 'out' && c.category === 'expense'; })
    .reduce(function (a, c) { return a + num_(c.amount); }, 0);
  var otherIncome = cashEntries.filter(function (c) { return c.dir === 'in' && c.category === 'other-income'; })
    .reduce(function (a, c) { return a + num_(c.amount); }, 0);
  var oldBought = rows_('OldGold').filter(function (g) { return g.date === date && g.status !== 'void'; });
  var booked = rows_('Orders').filter(function (o) { return o.date === date && o.status !== 'cancelled'; });
  var cash = cashList_({ from: date, to: date });
  var profit = salesProfit + interest + repairProfit + makingProfit + meltGain + otherIncome - expenses;
  return {
    date: date,
    profit: Math.round(profit),
    parts: {
      sales: Math.round(salesProfit), interest: Math.round(interest), repair: Math.round(repairProfit),
      making: Math.round(makingProfit), melting: Math.round(meltGain), other: Math.round(otherIncome), expenses: Math.round(expenses)
    },
    unknownCostLines: unknownCostLines,
    sales: { count: sales.length, total: Math.round(salesTotal), tax: round2_(taxTotal),
      gst: sales.filter(function (b) { return b.type === 'GST'; }).length },
    loans: { newCount: newLoans.length, newAmount: Math.round(newLoans.reduce(function (a, l) { return a + num_(l.principal); }, 0)),
      closed: loansClosed },
    oldGold: { count: oldBought.length,
      weight: round3_(oldBought.filter(function (g) { return g.metal !== 'silver'; }).reduce(function (a, g) { return a + num_(g.weight); }, 0)),
      silverWeight: round3_(oldBought.filter(function (g) { return g.metal === 'silver'; }).reduce(function (a, g) { return a + num_(g.weight); }, 0)),
      amount: Math.round(oldBought.reduce(function (a, g) { return a + num_(g.amount); }, 0)) },
    orders: { booked: booked.length, delivered: delivered.length },
    repairs: { delivered: repairs.length },
    cash: { opening: cash.opening, cashIn: cash.cashIn, cashOut: cash.cashOut, closing: cash.closing,
      upiIn: cash.upiIn, upiOut: cash.upiOut }
  };
}

function reportMonth_(month) {
  month = /^\d{4}-\d{2}$/.test(String(month || '')) ? month : today_().slice(0, 7);
  var y = parseInt(month.slice(0, 4), 10), m = parseInt(month.slice(5, 7), 10);
  var days = new Date(y, m, 0).getDate();
  var t = today_();
  var out = [], total = 0;
  var parts = { sales: 0, interest: 0, repair: 0, making: 0, melting: 0, other: 0, expenses: 0 };
  for (var d = 1; d <= days; d++) {
    var date = month + '-' + String(d).padStart(2, '0');
    if (date > t) break;
    var r = reportDaily_(date);
    out.push({ date: date, profit: r.profit, sales: r.sales.total });
    total += r.profit;
    Object.keys(parts).forEach(function (k) { parts[k] += r.parts[k]; });
  }
  return { month: month, days: out, profit: total, parts: parts };
}

function reportPosition_() {
  var loans = loansList_({ status: 'open' });
  var t = today_();
  var yearAgo = String(parseInt(t.slice(0, 4), 10) - 1) + t.slice(4);
  var orders = ordersList_({ status: 'pending' });
  var wholesalers = partiesList_({ type: 'wholesaler' });
  var karigars = partiesList_({ type: 'karigar' });
  var repairs = repairsList_({ status: 'pending' });
  var cash = cashList_({ from: t, to: t });
  return {
    date: t,
    rate: todayRate_(),
    loans: {
      count: loans.length,
      principal: Math.round(loans.reduce(function (a, l) { return a + l.principal; }, 0)),
      interestDue: Math.round(loans.reduce(function (a, l) { return a + l.interestDue; }, 0)),
      totalDue: Math.round(loans.reduce(function (a, l) { return a + l.totalDue; }, 0)),
      goldWt: round3_(loans.filter(function (l) { return l.metal === 'gold'; }).reduce(function (a, l) { return a + l.netWt; }, 0)),
      silverWt: round3_(loans.filter(function (l) { return l.metal === 'silver'; }).reduce(function (a, l) { return a + l.netWt; }, 0)),
      valueToday: Math.round(loans.reduce(function (a, l) { return a + l.valueToday; }, 0)),
      over12Months: loans.filter(function (l) { return l.date <= yearAgo; }).length,
      oldest: loans.slice(0, 8)
    },
    wholesalers: {
      goldG: round3_(wholesalers.reduce(function (a, p) { return a + p.goldG; }, 0)),
      cash: Math.round(wholesalers.reduce(function (a, p) { return a + p.cash; }, 0)),
      valueToday: Math.round(wholesalers.reduce(function (a, p) { return a + p.valueToday; }, 0)),
      list: wholesalers
    },
    karigars: {
      goldG: round3_(karigars.reduce(function (a, p) { return a + p.goldG; }, 0)),
      cash: Math.round(karigars.reduce(function (a, p) { return a + p.cash; }, 0)),
      list: karigars
    },
    orders: {
      pending: orders.length,
      advanceHeld: Math.round(orders.reduce(function (a, o) { return a + o.paid; }, 0)),
      dueToday: orders.filter(function (o) { return o.deliveryDate === t; }).length,
      late: orders.filter(function (o) { return o.deliveryDate && o.deliveryDate < t; }).length,
      fixedGoldG: round3_(orders.filter(function (o) { return o.rateFixed; }).reduce(function (a, o) { return a + o.estWt; }, 0)),
      list: orders.slice(0, 20)
    },
    repairs: {
      pending: repairs.length,
      ready: repairs.filter(function (r) { return r.status === 'ready'; }).length,
      list: repairs.slice(0, 20)
    },
    stock: stockSummary_(),
    fine: fineSummary_(),
    cash: { inDrawer: cash.closing, upiToday: cash.upiIn - cash.upiOut }
  };
}

/** HTML used for the nightly email / PDF report. */
function reportHtml_(date) {
  var d = reportDaily_(date);
  var p = reportPosition_();
  var s = settings_();
  var r = function (n) { return '₹' + Calc.inr(n); };
  var row = function (a, b) { return '<tr><td style="padding:4px 12px 4px 0;color:#4A5763">' + a + '</td><td style="padding:4px 0;text-align:right"><b>' + b + '</b></td></tr>'; };
  return '<div style="font-family:Arial,sans-serif;color:#15202B;max-width:560px">' +
    '<h2 style="margin:0 0 4px">' + s.shop_name + ' — daily report</h2>' +
    '<div style="color:#4A5763;margin-bottom:12px">' + d.date + '</div>' +
    '<h3 style="margin:12px 0 4px">Profit today: ' + r(d.profit) + '</h3><table>' +
    row('Sales (' + d.sales.count + ' bills)', r(d.parts.sales)) + row('Girvi interest received', r(d.parts.interest)) +
    row('Repair profit', r(d.parts.repair)) + row('Order making profit', r(d.parts.making)) +
    row('Melting gain', r(d.parts.melting)) + row('Other income', r(d.parts.other)) + row('Expenses', '− ' + r(d.parts.expenses)) + '</table>' +
    '<h3 style="margin:16px 0 4px">Cash</h3><table>' +
    row('Opening', r(d.cash.opening)) + row('In', r(d.cash.cashIn)) + row('Out', r(d.cash.cashOut)) +
    row('Should be in drawer', r(d.cash.closing)) + row('UPI in / out', r(d.cash.upiIn) + ' / ' + r(d.cash.upiOut)) + '</table>' +
    '<h3 style="margin:16px 0 4px">Where things stand</h3><table>' +
    row('Girvi loans out (' + p.loans.count + ')', r(p.loans.principal) + ' + interest ' + r(p.loans.interestDue)) +
    row('Loans over 12 months', p.loans.over12Months) +
    row('To wholesalers', Calc.inr(p.wholesalers.goldG, 3) + ' g + ' + r(p.wholesalers.cash)) +
    row('Order advances held (' + p.orders.pending + ' orders)', r(p.orders.advanceHeld)) +
    row('Gold stock', Calc.inr(p.stock.totals.gold.netWt, 3) + ' g') +
    row('Old gold not melted', Calc.inr(p.fine.oldGold.weight, 3) + ' g') +
    row('Fine gold in hand', Calc.inr(p.fine.inHand, 3) + ' g') +
    row('Gold with karigars', Calc.inr(p.karigars.goldG, 3) + ' g') + '</table></div>';
}

/** Purchase cost and profit are for the owner only. */
function hideProfit_(user, rep) {
  if (user && user.role === 'owner') return rep;
  rep.profit = null; rep.parts = null; rep.unknownCostLines = 0;
  if (rep.days) rep.days.forEach(function (d) { d.profit = null; });
  return rep;
}
