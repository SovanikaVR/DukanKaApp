/* ---------- Sales (GST bill / estimate) and old gold ---------- */

function oldGoldCalc_(g) {
  var weight = pos_(g.weight, 'Old gold weight');
  var cut = pos_(g.cutPct, 'Cut %');
  var rate = pos_(g.rate, 'Rate');
  var purity = g.ourPurityPct === '' || g.ourPurityPct === undefined ? num_(settings_().standard_purity_pct) : pos_(g.ourPurityPct, 'Purity');
  req_(cut <= 100, 'Cut % should be between 0 and 100');
  req_(purity <= 100, 'Purity % should be between 0 and 100');
  pos_(g.amount, 'Old gold amount');
  var customerFine = round3_(Calc.evalFormula(formula_('formula_old_fine'), { Weight: weight, Cut: cut }));
  var ourFine = round3_(Calc.evalFormula(formula_('formula_our_fine'), { Weight: weight, Purity: purity }));
  var amount = g.amount !== undefined && g.amount !== '' ? Math.round(num_(g.amount)) : Math.round(customerFine * rate);
  return {
    item: String(g.item || 'Old item').trim(), metal: g.metal === 'silver' ? 'silver' : 'gold',
    weight: round3_(weight), cutPct: cut, customerFine: customerFine, rate: rate, amount: amount,
    ourPurityPct: purity, ourFine: ourFine
  };
}

function rememberItemNames_(names) {
  if (!names.length) return;
  var list = json_(settings_().item_names, []);
  names.forEach(function (n) {
    n = String(n || '').trim();
    if (n && list.indexOf(n) < 0) list.unshift(n);
  });
  setSetting_('item_names', JSON.stringify(list.slice(0, 300)));
}

function saleCreate_(user, d) {
  var s = settings_();
  var type = d.type === 'GST' ? 'GST' : 'EST';
  if (type === 'GST') {
    req_(s.gst_enabled === 'true', 'GST bills are switched off in Settings');
    req_(s.shop_gstin, 'Add the shop GSTIN in Settings before making a GST bill');
  }
  var date = validDate_(d.date);
  req_(!s['archive_' + fyOf_(date)], 'Year ' + fyOf_(date) + ' is closed (archived). Use a date in the current year.');
  // Only fully empty lines are skipped; a line with a name or a stock item but no weight is a mistake.
  var lines = (d.lines || []).filter(function (l) {
    return l.itemId || num_(l.weight) || num_(l.amount) || String(l.name || '').trim() && String(l.name).trim() !== 'Item';
  });
  req_(lines.length, 'Add at least one item. (To only buy old gold, use "Buy old gold".)');
  var seen = {};
  lines.forEach(function (l) {
    req_(num_(l.weight) > 0 || (!l.itemId && num_(l.amount) > 0), 'Enter the weight for ' + (String(l.name || '').trim() || 'each item'));
    if (l.itemId) { req_(!seen[l.itemId], 'The same stock item is twice in this bill'); seen[l.itemId] = 1; }
  });
  var gstIn = d.gstPct !== undefined && d.gstPct !== '' ? num_(d.gstPct) : null;
  req_(gstIn === null || (gstIn >= 0 && gstIn <= 28), 'GST % should be between 0 and 28');
  var c = ensureCustomer_(user, d);
  var saleFormula = formula_('formula_sale_line');
  var subtotal = 0, costTotal = 0, namesToSave = [];
  var cleanLines = lines.map(function (l) {
    var item = l.itemId ? find_('Items', l.itemId) : null;
    if (l.itemId) {
      req_(item, 'Stock item not found');
      req_(item.status === 'in', 'Item ' + (item.tag || item.name) + ' is not in stock');
    }
    var w = pos_(l.weight, 'Weight'), rate = pos_(l.rate, 'Rate'), mk = pos_(l.makingPerG, 'Making');
    pos_(l.amount, 'Amount');
    var amount = l.amount !== undefined && l.amount !== '' && !w ? num_(l.amount)
      : round2_(Calc.evalFormula(saleFormula, { Weight: w, Rate: rate, Making: mk }));
    subtotal += amount;
    // A lot (many pieces, or loose weight) is sold from: only the weight / pieces sold leave stock,
    // and that part is remembered on the bill so cancelling puts back exactly that.
    var part = null;
    if (item) {
      var lotWt = num_(item.netWt), lotPcs = num_(item.pieces) || 1;
      var name = item.tag || item.name;
      // A single piece weighed again at the counter can differ a little: that is still the whole piece.
      var tol = lotPcs === 1 ? Math.max(0.1, lotWt * 0.02) : 0.0005;
      req_(w <= lotWt + tol, 'Only ' + round3_(lotWt) + ' g left in ' + name);
      var isLot = lotPcs > 1 || w < lotWt - tol;
      if (isLot) {
        var soldPcs = lotPcs > 1 ? Math.max(1, Math.round(num_(l.pieces) || 1)) : 0;
        req_(soldPcs <= lotPcs, 'Only ' + lotPcs + ' pieces left in ' + name);
        if (lotPcs > 1) {
          var allPcs = soldPcs === lotPcs, allWt = w >= lotWt - 0.0005;
          req_(allPcs === allWt, allPcs ? 'Selling all ' + lotPcs + ' pieces of ' + name + ': the weight should be ' + round3_(lotWt) + ' g'
            : 'The whole weight of ' + name + ' is ' + round3_(lotWt) + ' g — enter the weight of the ' + soldPcs + ' piece(s) sold');
        }
        part = { wt: round3_(Math.min(w, lotWt)), pcs: soldPcs, cost: round2_(num_(item.costTotal) * Math.min(w, lotWt) / (lotWt || 1)) };
      }
    }
    var cost = item ? (part ? part.cost : num_(item.costTotal)) : 0;
    costTotal += cost;
    if (l.saveName && l.name) namesToSave.push(l.name);
    return {
      itemId: l.itemId || '', tag: item ? item.tag : '', name: String(l.name || (item && item.name) || 'Item'),
      metal: l.metal || (item && item.metal) || 'gold', purityPct: num_(l.purityPct || (item && item.purityPct)),
      huid: String(l.huid || ''), weight: round3_(w), rate: rate, makingPerG: mk,
      metalValue: round2_(w * rate), making: round2_(w * mk), amount: amount, cost: cost, part: part
    };
  });
  subtotal = round2_(subtotal);
  var gstPct = type === 'GST' ? (gstIn !== null ? gstIn : num_(s.gst_default_pct)) : 0;
  var tax = round2_(subtotal * gstPct / 100);
  var invoiceTotal = Math.round(subtotal + tax);
  var roundOff = round2_(invoiceTotal - subtotal - tax);

  var old = (d.oldGold || []).filter(function (g) { return num_(g.weight) > 0; }).map(oldGoldCalc_);
  var oldValue = old.reduce(function (a, g) { return a + g.amount; }, 0);
  var net = invoiceTotal - oldValue;

  var cash = round2_(pos_(d.cash, 'Cash')), upi = round2_(pos_(d.upi, 'UPI')), udhaar = round2_(pos_(d.udhaar, 'Baki'));
  req_(!(net < 0 && udhaar), 'Baki is not possible when we pay the customer');
  if (net >= 0) {
    req_(Math.abs(cash + upi + udhaar - net) < 1, 'Cash + UPI + Udhaar should add up to ₹' + net);
  } else {
    req_(Math.abs(cash + upi + net) < 1, 'Old gold is worth more than the bill: pay the customer ₹' + (-net));
  }

  var fy = fyOf_(date);
  var no = nextCounter_(type + '_' + fy);
  var billNo = type + '/' + fy + '/' + String(no).padStart(4, '0');
  var id = uid_('S');
  var bill = {
    id: id, billNo: billNo, type: type, fy: fy, date: date, customerId: c.id,
    customerName: customerName_(c), mobile: c.mobile, village: c.village,
    lines: cleanLines, oldGold: old, gstPct: gstPct, subtotal: subtotal, tax: tax, roundOff: roundOff,
    invoiceTotal: invoiceTotal, oldValue: oldValue, net: net, cash: cash, upi: upi, udhaar: udhaar,
    costTotal: round2_(costTotal), status: 'ok', by: user.username, at: nowIso_()
  };
  insert_('Sales', bill);
  cleanLines.forEach(function (l) {
    if (!l.itemId) return;
    if (l.part) {
      var it = find_('Items', l.itemId);
      var left = round3_(num_(it.netWt) - l.part.wt);
      var pcsLeft = num_(it.pieces) - l.part.pcs;
      update_('Items', l.itemId, {
        netWt: Math.max(left, 0), grossWt: round3_(Math.max(0, num_(it.grossWt) - l.part.wt)), pieces: Math.max(pcsLeft, 0),
        costTotal: round2_(Math.max(0, num_(it.costTotal) - l.part.cost)),
        status: left <= 0.0005 ? 'sold' : 'in', soldBillId: id
      });
    } else update_('Items', l.itemId, { status: 'sold', soldBillId: id });
  });
  if (udhaar > 0) duesAdd_(user, c, udhaar, 'sale', id, 'Bill ' + billNo, date);
  old.forEach(function (g) {
    insert_('OldGold', {
      id: uid_('G'), date: date, customerId: c.id, customerName: customerName_(c), source: 'sale', billId: id,
      item: g.item, metal: g.metal, weight: g.weight, cutPct: g.cutPct, customerFine: g.customerFine,
      rate: g.rate, amount: g.amount, ourPurityPct: g.ourPurityPct, ourFine: g.ourFine, status: 'stock',
      meltId: '', by: user.username, at: nowIso_()
    });
  });
  var dir = net >= 0 ? 'in' : 'out';
  cash_(user, dir, 'cash', Math.abs(cash), 'sale', 'sale', id, billNo, date);
  cash_(user, dir, 'upi', Math.abs(upi), 'sale', 'sale', id, billNo, date);
  rememberItemNames_(namesToSave);
  audit_(user, 'sale.create', id, { billNo: billNo, net: net });
  return saleGet_(id);
}

/** Bills of a financial year that was moved out by archiveFy_ (read-only). */
function archivedSales_(fy) {
  var fileId = settings_()['archive_' + fy];
  if (!fileId) return null;
  var sh = SpreadsheetApp.openById(fileId).getSheetByName('Sales');
  var headers = SCHEMA.Sales;
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, headers.length).getValues().map(function (r) {
    var o = {};
    headers.forEach(function (h, j) { o[h] = String(r[j]); });
    return o;
  });
}

function saleGet_(id, fy) {
  var b = find_('Sales', id);
  if (!b && fy) b = (archivedSales_(fy) || []).filter(function (x) { return x.id === id; })[0];
  req_(b, 'Bill not found');
  var s = settings_();
  var out = {};
  SCHEMA.Sales.forEach(function (k) { out[k] = b[k]; });
  out.lines = json_(b.lines, []);
  out.oldGold = json_(b.oldGold, []);
  ['gstPct', 'subtotal', 'tax', 'roundOff', 'invoiceTotal', 'oldValue', 'net', 'cash', 'upi', 'udhaar', 'costTotal']
    .forEach(function (k) { out[k] = num_(b[k]); });
  delete out.costTotal;
  out.shop = {
    name: s.shop_name, address: s.shop_address, mobile: s.shop_mobile, gstin: s.shop_gstin,
    state: s.shop_state, hsn: s.hsn_code, terms: s.bill_terms
  };
  var c = find_('Customers', b.customerId);
  out.customer = c ? { name: customerName_(c), mobile: c.mobile, village: c.village, address: c.address } : null;
  out.rate = rateOn_(b.date);
  return out;
}

function rateOn_(date) {
  var list = rows_('Rates').filter(function (r) { return r.date <= date; });
  list.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var r = list[0];
  return r ? { g24: num_(r.g24), g22: num_(r.g22), g18: num_(r.g18), silver: num_(r.silver) } : null;
}

function saleList_(d) {
  var from = d.from || '', to = d.to || '9999';
  var q = String(d.q || '').toLowerCase();
  var source = (d.fy && archivedSales_(d.fy)) || rows_('Sales');
  var list = source.filter(function (b) {
    if (d.fy && b.fy !== d.fy) return false;
    if (b.date < from || b.date > to) return false;
    if (d.type && b.type !== d.type) return false;
    if (q && (b.customerName + ' ' + b.billNo + ' ' + b.mobile).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  return list.slice(-200).reverse().map(function (b) {
    return {
      id: b.id, billNo: b.billNo, type: b.type, date: b.date, customerName: b.customerName,
      mobile: b.mobile, net: num_(b.net), invoiceTotal: num_(b.invoiceTotal), udhaar: num_(b.udhaar), status: b.status
    };
  });
}

function saleVoid_(user, d) {
  var b = find_('Sales', d.id);
  req_(b, 'Bill not found');
  req_(b.status !== 'void', 'Bill is already cancelled');
  // Check everything first: Apps Script cannot roll back half-done changes.
  var olds = rows_('OldGold').filter(function (g) { return g.billId === b.id && g.status !== 'void'; });
  olds.forEach(function (g) { req_(g.status !== 'melted', 'Old gold from this bill is already melted; cannot cancel'); });
  var cust = find_('Customers', b.customerId);
  var udhaar = num_(b.udhaar);
  // If the customer already paid back part of this bill's baki, that money is returned to them now.
  var stillDue = udhaar > 0 && cust ? Math.min(udhaar, Math.max(customerUdhaar_(cust.id), 0)) : 0;
  var paidBack = round2_(udhaar - stillDue);

  update_('Sales', b.id, { status: 'void' });
  json_(b.lines, []).forEach(function (l) {
    if (!l.itemId) return;
    var it = find_('Items', l.itemId);
    if (!it) return;
    if (l.part) {
      update_('Items', l.itemId, { status: 'in', netWt: round3_(num_(it.netWt) + l.part.wt),
        grossWt: round3_(num_(it.grossWt) + l.part.wt), pieces: num_(it.pieces) + num_(l.part.pcs),
        costTotal: round2_(num_(it.costTotal) + num_(l.part.cost)) });
    } else update_('Items', l.itemId, { status: 'in', soldBillId: '' });
  });
  if (stillDue > 0) duesAdd_(user, cust, -stillDue, 'sale-cancel', b.id, 'Cancelled ' + b.billNo);
  olds.forEach(function (g) { update_('OldGold', g.id, { status: 'void' }); });
  var net = num_(b.net);
  var dir = net >= 0 ? 'out' : 'in';
  cash_(user, dir, 'cash', num_(b.cash), 'sale-cancel', 'sale', b.id, 'Cancelled ' + b.billNo);
  cash_(user, dir, 'upi', num_(b.upi), 'sale-cancel', 'sale', b.id, 'Cancelled ' + b.billNo);
  if (paidBack >= 1) cash_(user, 'out', 'cash', paidBack, 'sale-cancel', 'sale', b.id, 'Cancelled ' + b.billNo + ': baki already paid, returned');
  audit_(user, 'sale.void', b.id, { billNo: b.billNo, reason: d.reason || '', returned: paidBack });
  return { ok: true, returned: paidBack };
}

function salePayUdhaar_(user, d) { return duesPay_(user, d); }

/* ---------- Old gold bought for cash ---------- */

function oldGoldBuy_(user, d) {
  var c = ensureCustomer_(user, d);
  var date = validDate_(d.date);
  var items = (d.items || []).filter(function (g) { return num_(g.weight) > 0; }).map(oldGoldCalc_);
  req_(items.length, 'Add the old item and its weight');
  var total = 0, ids = [];
  items.forEach(function (g) {
    var id = uid_('G');
    ids.push(id);
    total += g.amount;
    insert_('OldGold', {
      id: id, date: date, customerId: c.id, customerName: customerName_(c), source: 'purchase', billId: '',
      item: g.item, metal: g.metal, weight: g.weight, cutPct: g.cutPct, customerFine: g.customerFine,
      rate: g.rate, amount: g.amount, ourPurityPct: g.ourPurityPct, ourFine: g.ourFine, status: 'stock',
      meltId: '', by: user.username, at: nowIso_()
    });
  });
  cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', total, 'old-gold', 'oldgold', ids[0], customerName_(c), date);
  audit_(user, 'oldgold.buy', ids.join(','), { total: total });
  return {
    ids: ids, total: total, items: items, customer: { name: customerName_(c), mobile: c.mobile, village: c.village },
    date: date, shop: shopInfo_()
  };
}

function shopInfo_() {
  var s = settings_();
  return { name: s.shop_name, address: s.shop_address, mobile: s.shop_mobile, gstin: s.shop_gstin, state: s.shop_state };
}

function oldGoldList_(d) {
  var status = d.status || 'stock';
  return rows_('OldGold').filter(function (g) { return status === 'all' || g.status === status; })
    .slice().reverse().map(function (g) {
      return {
        id: g.id, date: g.date, customerName: g.customerName, item: g.item, metal: g.metal,
        weight: num_(g.weight), cutPct: num_(g.cutPct), customerFine: num_(g.customerFine), amount: num_(g.amount),
        ourPurityPct: num_(g.ourPurityPct), ourFine: num_(g.ourFine), status: g.status, source: g.source
      };
    });
}
