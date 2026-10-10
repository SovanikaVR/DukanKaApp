/* ---------- Settings, daily rate, customers ---------- */

function settingsSave_(user, d) {
  var allowed = Object.keys(DEFAULT_SETTINGS);
  var changed = {};
  var NUM = { making_default_silver: [0, 1e6], purity_silver: [1, 100],
    gst_default_pct: [0, 28], making_default_per_g: [0, 1e6], standard_cut_pct: [0, 100], standard_purity_pct: [0, 100],
    interest_default_rate: [0, 100], interest_min_days: [0, 365], purity_24k: [1, 100], purity_22k: [1, 100], purity_18k: [1, 100] };
  // Check every value first, then save: a mistake in one box must not half-save the rest.
  Object.keys(d || {}).forEach(function (k) {
    if (allowed.indexOf(k) < 0) return;
    var v = d[k];
    if (typeof v === 'object') v = JSON.stringify(v);
    v = String(v);
    if (k.indexOf('formula_') === 0) testFormula_(k, v);
    if (k === 'shop_gstin' && v) {
      v = v.trim().toUpperCase();
      req_(/^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v), 'GSTIN is not valid (15 characters, like 27ABCDE1234F1Z5)');
    }
    if ((k === 'bill_design_gst' || k === 'bill_design_quote') && v) {
      req_(v.length < 8000, 'Bill design is too big');
      try { req_(typeof JSON.parse(v) === 'object', 'Bill design is not valid'); } catch (e) { throw new Error('Bill design is not valid'); }
    }
    if ((k === 'shop_logo' || k === 'quote_logo' || k === 'bill_pic_right') && v) {
      req_(/^data:image\/(png|jpeg|webp);base64,/.test(v), 'Logo should be a picture');
      req_(v.length < 45000, 'Logo picture is too big — use a smaller one');
    }
    if (k === 'bill_template') req_(['classic', 'modern', 'simple', 'royal'].indexOf(v) >= 0, 'Pick a bill design');
    if (k === 'bill_color') req_(['gold', 'maroon', 'blue', 'green', 'black'].indexOf(v) >= 0, 'Pick a bill colour');
    if (k === 'bill_rule_line') v = v.trim().slice(0, 200);
    if (k === 'bill_rule_pct' && v.trim() !== '') { var rp = parseFloat(v); req_(!isNaN(rp) && rp >= 0 && rp <= 100, 'Cut % should be 0 to 100'); v = String(rp); }
    if (k === 'making_default_pct' && v !== '') { var mp = parseFloat(v); req_(!isNaN(mp) && mp >= 0 && mp <= 100, 'Making % should be 0 to 100'); }
    if (NUM[k]) {
      var n = parseFloat(String(v).replace(/,/g, ''));
      req_(!isNaN(n) && n >= NUM[k][0] && n <= NUM[k][1], 'Check the value of ' + k.replace(/_/g, ' ') + ' (' + NUM[k][0] + ' to ' + NUM[k][1] + ')');
      v = String(n);
    }
    changed[k] = v;
  });
  setSettings_(changed);
  audit_(user, 'settings.save', '', changed);
  return settings_();
}

var FORMULA_SAMPLES = {
  formula_interest: { Principal: 60000, Rate: 2, Days: 30 },
  formula_old_fine: { Weight: 10, Cut: 20 },
  formula_our_fine: { Weight: 10, Purity: 80 },
  formula_sale_line: { Weight: 10, Rate: 14000, Making: 150 },
  formula_order_total: { Weight: 10, Rate: 14000, Making: 150 },
  formula_repair_charge: { Weight: 10, RatePerG: 150 }
};

function testFormula_(key, expr) {
  var sample = FORMULA_SAMPLES[key];
  if (!sample) return;
  var v;
  try { v = Calc.evalFormula(expr, sample); } catch (e) { throw new Error('Formula problem: ' + e.message); }
  req_(isFinite(v), 'Formula gives no number');
}

function formula_(key) { return settings_()[key] || DEFAULT_SETTINGS[key]; }

/* ---------- Rates ---------- */

function ratesSave_(user, d) {
  var s = settings_();
  var date = validDate_(d.date);
  var g24 = num_(d.g24);
  req_(g24 > 0, 'Enter the 24K rate');
  var rec = {
    date: date,
    g24: g24,
    g22: num_(d.g22) || Math.round(g24 * num_(s.purity_22k) / 100),
    g18: num_(d.g18) || Math.round(g24 * num_(s.purity_18k) / 100),
    silver: num_(d.silver),
    by: user.username,
    at: nowIso_()
  };
  var existing = rows_('Rates').filter(function (r) { return r.date === date; })[0];
  if (existing) update_('Rates', existing.id, rec);
  else { rec.id = uid_('R'); insert_('Rates', rec); }
  audit_(user, 'rates.save', date, rec);
  return todayRate_();
}

function todayRate_() {
  var t = today_();
  var list = rows_('Rates').filter(function (r) { return r.date <= t; });
  list.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var r = list[0];
  if (!r) return null;
  return {
    date: r.date, g24: num_(r.g24), g22: num_(r.g22), g18: num_(r.g18), silver: num_(r.silver),
    isToday: r.date === t, by: r.by
  };
}

function ratesList_() {
  var list = rows_('Rates').slice();
  list.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return list.slice(0, 60).map(function (r) {
    return { date: r.date, g24: num_(r.g24), g22: num_(r.g22), g18: num_(r.g18), silver: num_(r.silver), by: r.by };
  });
}

/* ---------- Customers ---------- */

function cleanMobile_(m) {
  var digits = String(m || '').replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
}

function customerSave_(user, d) {
  var first = String(d.firstName || '').trim();
  req_(first, 'Enter the customer name');
  var mobile = cleanMobile_(d.mobile);
  req_(!mobile || mobile.length === 10, 'Mobile number should have 10 digits');
  var rec = {
    firstName: first, lastName: String(d.lastName || '').trim(), mobile: mobile,
    village: String(d.village || '').trim(), address: String(d.address || '').trim(),
    notes: String(d.notes || '').trim()
  };
  if (d.id) {
    var saved = update_('Customers', d.id, rec);
    audit_(user, 'customer.update', d.id, rec);
    return saved;
  }
  if (mobile) {
    // Same person typed again (same mobile, first name and surname/blank): reuse instead of making a copy.
    var dup = rows_('Customers').filter(function (c) {
      return c.mobile === mobile && c.firstName.toLowerCase() === first.toLowerCase() &&
        (!rec.lastName || !c.lastName || c.lastName.toLowerCase() === rec.lastName.toLowerCase());
    })[0];
    if (dup) return dup;
  }
  rec.id = uid_('K');
  rec.createdAt = nowIso_();
  rec.by = user.username;
  insert_('Customers', rec);
  audit_(user, 'customer.add', rec.id, rec);
  return rec;
}

/**
 * Many customers at once (from an Excel / CSV file or the phone's contacts). Up to 500 per call.
 * A customer already saved (same mobile and first name) is skipped, so importing the same file twice is safe.
 * An opening baki in the file goes to the Baki list as "Opening baki".
 */
function customersImport_(user, d) {
  var list = (d.rows || []).slice(0, 500);
  req_(list.length, 'Nothing to import');
  var seen = {};
  rows_('Customers').forEach(function (c) { if (c.mobile) seen[c.mobile + '|' + c.firstName.toLowerCase()] = 1; });
  var add = [], dues = [], skipped = [], date = today_(), bakiTotal = 0;
  list.forEach(function (r, i) {
    var first = String(r.firstName || '').trim(), last = String(r.lastName || '').trim();
    if (!first && last) { first = last; last = ''; }
    var mobile = cleanMobile_(r.mobile);
    if (!first) { skipped.push({ row: r.row || i + 1, reason: 'no name' }); return; }
    if (mobile && mobile.length !== 10) { skipped.push({ row: r.row || i + 1, name: first, reason: 'mobile is not 10 digits' }); return; }
    var key = mobile + '|' + first.toLowerCase();
    if (mobile && seen[key]) { skipped.push({ row: r.row || i + 1, name: first, reason: 'already saved' }); return; }
    seen[key] = 1;
    var baki = round2_(num_(String(r.baki || '').replace(/[₹,\s]/g, '')));
    var rec = { id: uid_('K'), firstName: first.slice(0, 60), lastName: last.slice(0, 60), mobile: mobile,
      village: String(r.village || '').trim().slice(0, 60), address: String(r.address || '').trim().slice(0, 200),
      notes: String(r.notes || '').trim().slice(0, 200), createdAt: nowIso_(), by: user.username };
    add.push(rec);
    if (baki > 0) {
      bakiTotal += baki;
      dues.push({ id: uid_('D'), date: date, customerId: rec.id, customerName: customerName_(rec), mobile: mobile, amount: baki,
        refType: 'adjust', refId: '', notes: 'Opening baki', by: user.username, at: nowIso_() });
    }
  });
  insertMany_('Customers', add);
  insertMany_('Dues', dues);
  audit_(user, 'customers.import', '', { added: add.length, skipped: skipped.length, baki: bakiTotal });
  return { added: add.length, skipped: skipped, bakiCustomers: dues.length, baki: round2_(bakiTotal) };
}

/** Uses d.customerId, or creates/finds the customer described in d.customer. */
function ensureCustomer_(user, d) {
  if (d.customerId) {
    var c = find_('Customers', d.customerId);
    req_(c, 'Customer not found');
    return c;
  }
  req_(d.customer && d.customer.firstName, 'Pick or add a customer first');
  return customerSave_(user, d.customer);
}

function customersSearch_(d) {
  var q = String(d.q || '').trim().toLowerCase().replace(/\s+/g, ' ');
  var village = String(d.village || '').trim().toLowerCase();
  var digits = q.replace(/\D/g, '');
  if (digits.length > 10 && /^(91|0)/.test(digits)) digits = digits.slice(-10);
  var words = q.split(' ');
  var list = rows_('Customers');
  var scored = [];
  list.forEach(function (c) {
    if (village && c.village.toLowerCase() !== village) return;
    var fn = c.firstName.toLowerCase(), ln = c.lastName.toLowerCase();
    var score = 0, matched = '';
    if (!q) { score = 1; }
    else if (fn.indexOf(q) === 0) { score = 5; matched = 'name'; }
    else if (ln.indexOf(q) === 0) { score = 4; matched = 'surname'; }
    else if ((fn + ' ' + ln).indexOf(q) >= 0 || (ln + ' ' + fn).indexOf(q) >= 0) { score = 3; matched = 'name'; }
    else if (words.length > 1 && words.every(function (w) { return (fn + ' ' + ln + ' ' + c.village.toLowerCase()).indexOf(w) >= 0; })) { score = 3; matched = 'name'; }
    else if (digits.length >= 3 && c.mobile.indexOf(digits) >= 0) { score = 2; matched = 'mobile'; }
    else if (c.village.toLowerCase().indexOf(q) === 0) { score = 1; matched = 'village'; }
    if (score) scored.push({ c: c, s: score, m: matched });
  });
  scored.sort(function (a, b) { return b.s - a.s || (a.c.firstName < b.c.firstName ? -1 : 1); });
  var top = scored.slice(0, 40);
  var openLoans = countBy_(where_('Loans', function (l) { return l.status === 'open'; }), 'customerId');
  var openOrders = countBy_(where_('Orders', function (o) { return o.status !== 'delivered' && o.status !== 'cancelled'; }), 'customerId');
  var openRepairs = countBy_(where_('Repairs', function (r) { return r.status !== 'delivered'; }), 'customerId');
  var villages = {};
  list.forEach(function (c) { if (c.village) villages[c.village] = (villages[c.village] || 0) + 1; });
  return {
    results: top.map(function (x) {
      return {
        id: x.c.id, name: customerName_(x.c), firstName: x.c.firstName, lastName: x.c.lastName,
        mobile: x.c.mobile, village: x.c.village, matched: x.m,
        loans: openLoans[x.c.id] || 0, orders: openOrders[x.c.id] || 0, repairs: openRepairs[x.c.id] || 0
      };
    }),
    total: scored.length,
    villages: Object.keys(villages).sort(function (a, b) { return villages[b] - villages[a]; }).slice(0, 12)
  };
}

function countBy_(list, key) {
  var m = {};
  list.forEach(function (x) { m[x[key]] = (m[x[key]] || 0) + 1; });
  return m;
}

function customerGet_(id) {
  var c = find_('Customers', id);
  req_(c, 'Customer not found');
  var t = today_();
  var opts = { formula: formula_('formula_interest'), minDays: num_(settings_().interest_min_days) };
  var loans = where_('Loans', function (l) { return l.customerId === id; }).map(function (l) {
    var st = l.status === 'open' ? Calc.loanStatement(l, loanTxns_(l.id), t, opts) : null;
    return {
      id: l.id, date: l.date, item: l.item, metal: l.metal, netWt: num_(l.netWt), principal: num_(l.principal),
      ratePct: num_(l.ratePct), status: l.status, closedAt: l.closedAt,
      days: st ? st.totalDays : null, totalDue: st ? st.totalDue : 0
    };
  });
  var orders = where_('Orders', function (o) { return o.customerId === id; }).map(orderSummary_);
  var repairs = where_('Repairs', function (r) { return r.customerId === id; });
  var sales = where_('Sales', function (s) { return s.customerId === id; }).slice(-20).reverse().map(function (s) {
    return { id: s.id, billNo: s.billNo, type: s.type, date: s.date, net: num_(s.net), status: s.status };
  });
  var oldGold = where_('OldGold', function (g) { return g.customerId === id; }).slice(-20).reverse().map(function (g) {
    return {
      id: g.id, date: g.date, item: g.item, metal: g.metal, weight: num_(g.weight), cutPct: num_(g.cutPct),
      customerFine: num_(g.customerFine), amount: num_(g.amount), status: g.status, source: g.source, billId: g.billId
    };
  });
  var girviDue = loans.reduce(function (a, l) { return a + (l.status === 'open' ? l.totalDue : 0); }, 0);
  var advance = orders.reduce(function (a, o) { return a + (o.status !== 'delivered' && o.status !== 'cancelled' ? o.paid : 0); }, 0);
  return {
    customer: c, name: customerName_(c), loans: loans, orders: orders, repairs: repairs, sales: sales,
    oldGold: oldGold, girviDue: Math.round(girviDue), orderAdvance: Math.round(advance),
    udhaar: customerUdhaar_(id),
    dues: rows_('Dues').filter(function (x) { return x.customerId === id; }).slice(-20)
      .map(function (x) { return { date: x.date, amount: num_(x.amount), refType: x.refType }; })
  };
}
