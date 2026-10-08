/* DukanKaApp backend — GENERATED FILE, do not edit. Source: apps-script/src + shared/calc.js */

/* ===== 00_config.js ===== */
/**
 * DukanKaApp — backend for small jewellery shops.
 * Runs as a Google Apps Script web app bound to the shop owner's own Google Sheet.
 * All data stays in the owner's Google Drive. No paid services are used.
 *
 * This file is generated into dist/Code.gs by tools/build-gs.js — edit the files in
 * apps-script/src/, not dist/Code.gs.
 */

var APP_VERSION = '1.1.0';

/** Sheet (tab) name -> column headers. The first column is always the row id. */
var SCHEMA = {
  Settings: ['key', 'value'],
  Users: ['id', 'name', 'username', 'role', 'salt', 'pinHash', 'active', 'createdAt'],
  Rates: ['id', 'date', 'g24', 'g22', 'g18', 'silver', 'by', 'at'],
  Customers: ['id', 'firstName', 'lastName', 'mobile', 'village', 'address', 'notes', 'createdAt', 'by'],
  Items: ['id', 'tag', 'name', 'category', 'metal', 'purityPct', 'grossWt', 'netWt', 'pieces',
    'makingPerG', 'costTotal', 'status', 'source', 'sourceId', 'soldBillId', 'addedAt', 'by'],
  Sales: ['id', 'billNo', 'type', 'fy', 'date', 'customerId', 'customerName', 'mobile', 'village',
    'lines', 'oldGold', 'gstPct', 'subtotal', 'tax', 'roundOff', 'invoiceTotal', 'oldValue', 'net',
    'cash', 'upi', 'udhaar', 'costTotal', 'status', 'by', 'at'],
  OldGold: ['id', 'date', 'customerId', 'customerName', 'source', 'billId', 'item', 'metal', 'weight',
    'cutPct', 'customerFine', 'rate', 'amount', 'ourPurityPct', 'ourFine', 'status', 'meltId', 'by', 'at'],
  Loans: ['id', 'date', 'customerId', 'customerName', 'mobile', 'item', 'metal', 'purityPct',
    'grossWt', 'netWt', 'principal', 'ratePct', 'formula', 'minDays', 'status', 'closedAt',
    'notes', 'by', 'at'],
  LoanTxns: ['id', 'loanId', 'date', 'type', 'amount', 'interestPart', 'principalPart', 'mode', 'by', 'at', 'status'],
  Orders: ['id', 'date', 'customerId', 'customerName', 'mobile', 'item', 'metal', 'purityPct',
    'estWt', 'makingPerG', 'karigarPerG', 'method', 'rate', 'fixedTotal', 'deliveryDate', 'status',
    'karigarId', 'finalWt', 'finalTotal', 'deliveredAt', 'notes', 'by', 'at'],
  OrderPayments: ['id', 'orderId', 'date', 'amount', 'mode', 'by', 'at'],
  Repairs: ['id', 'date', 'customerId', 'customerName', 'mobile', 'item', 'work', 'wtIn', 'karigarId',
    'karigarRateType', 'karigarRate', 'custRateType', 'custRate', 'deliveryDate', 'status', 'wtOut',
    'karigarCost', 'custCharge', 'returnedAt', 'deliveredAt', 'notes', 'by', 'at'],
  Melts: ['id', 'date', 'oldGoldIds', 'totalWt', 'ourFine', 'paidFine', 'paidAmount', 'barWt',
    'purityPct', 'actualFine', 'cost', 'notes', 'by', 'at'],
  FineLedger: ['id', 'date', 'type', 'grams', 'value', 'refType', 'refId', 'notes', 'by', 'at'],
  Parties: ['id', 'type', 'name', 'mobile', 'notes', 'active', 'createdAt'],
  PartyLedger: ['id', 'partyId', 'date', 'type', 'goldG', 'cash', 'rate', 'refType', 'refId', 'notes', 'by', 'at'],
  Cash: ['id', 'date', 'dir', 'mode', 'amount', 'category', 'refType', 'refId', 'notes', 'by', 'at', 'status'],
  Dues: ['id', 'date', 'customerId', 'customerName', 'mobile', 'amount', 'refType', 'refId', 'notes', 'by', 'at'],
  Audit: ['at', 'user', 'action', 'ref', 'details']
};

/** Default settings written by setup(). Everything here can be changed in the app's Settings. */
var DEFAULT_SETTINGS = {
  shop_name: '[SHOP NAME] Jewellers',
  shop_address: '',
  shop_mobile: '',
  shop_gstin: '',
  shop_state: '',
  gst_enabled: 'true',
  gst_default_pct: '3',
  hsn_code: '7113',
  bill_terms: '',
  making_default_per_g: '150',
  standard_cut_pct: '20',
  standard_purity_pct: '80',
  interest_default_rate: '2',
  interest_min_days: '0',
  purity_24k: '99.9',
  purity_22k: '91.6',
  purity_18k: '75',
  cash_opening: '0',
  cash_opening_date: '',
  report_email: '',
  modules: JSON.stringify({
    girvi: true, sale: true, oldgold: true, orders: true, repair: true, stock: true,
    melt: true, wholesaler: true, karigar: true, cash: true, reports: true
  }),
  formula_interest: 'Principal * Rate / 100 * Days / 30',
  formula_old_fine: 'Weight * (100 - Cut) / 100',
  formula_our_fine: 'Weight * Purity / 100',
  formula_sale_line: 'Weight * Rate + Weight * Making',
  formula_order_total: 'Weight * Rate + Weight * Making',
  formula_repair_charge: 'Weight * RatePerG'
};

/** Actions only the owner may call. */
var OWNER_ONLY = {
  'settings.save': 1, 'users.list': 1, 'users.save': 1, 'sale.void': 1, 'cash.opening': 1,
  'reports.profit': 1, 'admin.archive': 1, 'admin.backupNow': 1, 'loans.edit': 1, 'loans.void': 1,
  'loans.undoLast': 1, 'orders.edit': 1, 'repairs.edit': 1, 'cash.void': 1, 'stock.update': 1, 'dues.adjust': 1
};

/* ===== 01_util.js ===== */
/* ---------- Spreadsheet helpers ---------- */

var _ss = null;
var _rowsCache = {};

function ss_() {
  if (!_ss) _ss = SpreadsheetApp.getActiveSpreadsheet();
  return _ss;
}

/** Returns the sheet, creating it (with headers, plain-text columns) if missing. */
function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) {
    var headers = SCHEMA[name];
    if (!headers) throw new Error('Unknown sheet ' + name);
    sh = ss_().insertSheet(name);
    // Plain text everywhere so Sheets never turns "2026-10-08" or "007" into something else.
    sh.getRange('A:' + colLetter_(headers.length)).setNumberFormat('@');
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else if (!_headerChecked[name]) {
    // Newer app versions add columns at the end: write the full header row once.
    var headers2 = SCHEMA[name];
    var cur = sh.getRange(1, 1, 1, headers2.length).getValues()[0];
    if (String(cur[headers2.length - 1]) !== headers2[headers2.length - 1]) {
      sh.getRange(1, 1, 1, headers2.length).setValues([headers2]).setFontWeight('bold');
      sh.getRange('A:' + colLetter_(headers2.length)).setNumberFormat('@');
    }
  }
  _headerChecked[name] = true;
  return sh;
}
var _headerChecked = {};

function colLetter_(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** All rows of a sheet as objects (cached for this request). */
function rows_(name) {
  if (_rowsCache[name]) return _rowsCache[name];
  var sh = sheet_(name);
  var headers = SCHEMA[name];
  var last = sh.getLastRow();
  var out = [];
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, headers.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      var o = { _row: i + 2 };
      for (var j = 0; j < headers.length; j++) {
        var v = vals[i][j];
        if (v instanceof Date) v = Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
        o[headers[j]] = v === null || v === undefined ? '' : String(v);
      }
      out.push(o);
    }
  }
  // Cancelled cash entries and loan payments stay in the sheet for history but count nowhere.
  if (name === 'Cash' || name === 'LoanTxns') out = out.filter(function (o) { return o.status !== 'void'; });
  _rowsCache[name] = out;
  return out;
}

function toCell_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

/** Appends one record. Missing fields become blank. Returns the record. */
function insert_(name, obj) {
  var headers = SCHEMA[name];
  var row = headers.map(function (h) { return toCell_(obj[h]); });
  var sh = sheet_(name);
  sh.appendRow(row);
  delete _rowsCache[name];
  return obj;
}

/** Updates fields of the record whose first column equals id. */
function update_(name, id, patch) {
  var headers = SCHEMA[name];
  var list = rows_(name);
  var rec = null;
  for (var i = 0; i < list.length; i++) if (list[i][headers[0]] === String(id)) { rec = list[i]; break; }
  if (!rec) throw new Error(name + ' record not found: ' + id);
  var sh = sheet_(name);
  var current = headers.map(function (h) { return rec[h]; });
  Object.keys(patch).forEach(function (k) {
    var idx = headers.indexOf(k);
    if (idx >= 0) current[idx] = toCell_(patch[k]);
  });
  sh.getRange(rec._row, 1, 1, headers.length).setValues([current]);
  delete _rowsCache[name];
  var merged = {};
  headers.forEach(function (h, j) { merged[h] = current[j]; });
  return merged;
}

function find_(name, id) {
  var key = SCHEMA[name][0];
  var list = rows_(name);
  for (var i = 0; i < list.length; i++) if (list[i][key] === String(id)) return list[i];
  return null;
}

function where_(name, fn) { return rows_(name).filter(fn); }

/* ---------- Values ---------- */

function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  var n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function round2_(n) { return Math.round(num_(n) * 100) / 100; }
function round3_(n) { return Math.round(num_(n) * 1000) / 1000; }

function json_(v, fallback) {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch (e) { return fallback; }
}

function uid_(prefix) {
  return (prefix || '') + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function tz_() { return 'Asia/Kolkata'; }

function nowIso_() { return Utilities.formatDate(new Date(), tz_(), "yyyy-MM-dd'T'HH:mm:ss"); }

function today_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }

/** Indian financial year label for a yyyy-MM-dd date, e.g. 2026-10-08 -> "26-27". */
function fyOf_(dateStr) {
  var y = parseInt(dateStr.slice(0, 4), 10);
  var m = parseInt(dateStr.slice(5, 7), 10);
  var start = m >= 4 ? y : y - 1;
  return String(start % 100).padStart(2, '0') + '-' + String((start + 1) % 100).padStart(2, '0');
}

function validDate_(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : today_();
}

function req_(cond, msg) { if (!cond) throw new Error(msg); }

/** Money / weight typed in a form: blank = 0, negative is refused. */
function pos_(v, label) {
  var n = num_(v);
  req_(n >= 0, (label || 'Amount') + ' cannot be negative');
  return n;
}

/* ---------- Settings ---------- */

function settings_() {
  var out = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { out[k] = DEFAULT_SETTINGS[k]; });
  rows_('Settings').forEach(function (r) { out[r.key] = r.value; });
  return out;
}

function setSetting_(key, value) {
  var list = rows_('Settings');
  for (var i = 0; i < list.length; i++) {
    if (list[i].key === key) { update_('Settings', key, { value: value }); return; }
  }
  insert_('Settings', { key: key, value: value });
}

/** Next running number for a counter (bill numbers etc). Call inside the write lock. */
function nextCounter_(key) {
  var s = settings_();
  var n = num_(s['counter_' + key]) + 1;
  setSetting_('counter_' + key, String(n));
  return n;
}

function audit_(user, action, ref, details) {
  try {
    insert_('Audit', {
      at: nowIso_(), user: user ? user.username : '', action: action, ref: ref || '',
      details: typeof details === 'string' ? details : JSON.stringify(details || {})
    });
  } catch (e) { /* never block the real work because of the audit log */ }
}

function cash_(user, dir, mode, amount, category, refType, refId, notes, date) {
  amount = round2_(amount);
  if (!amount) return null;
  return insert_('Cash', {
    id: uid_('C'), date: validDate_(date), dir: dir, mode: mode || 'cash', amount: amount,
    category: category, refType: refType || '', refId: refId || '', notes: notes || '',
    by: user ? user.username : '', at: nowIso_()
  });
}

function customerName_(c) {
  return c ? ((c.firstName || '') + ' ' + (c.lastName || '')).trim() : '';
}

/* ===== 03_auth.js ===== */
/* ---------- Users, PIN login and sessions ---------- */

var SESSION_DAYS = 30;

function hashPin_(salt, pin) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function publicUser_(u) {
  return { id: u.id, name: u.name, username: u.username, role: u.role, active: u.active === 'true' };
}

function findUser_(username) {
  var uname = String(username || '').trim().toLowerCase();
  var list = rows_('Users');
  for (var i = 0; i < list.length; i++) if (list[i].username.toLowerCase() === uname) return list[i];
  return null;
}

function createUser_(name, username, role, pin) {
  req_(name && username, 'Name and username are needed');
  req_(/^\d{4,8}$/.test(String(pin || '')), 'PIN must be 4 to 8 digits');
  req_(['owner', 'employee', 'viewer'].indexOf(role) >= 0, 'Role must be owner, employee or viewer');
  req_(!findUser_(username), 'This username is already used');
  var salt = Utilities.getUuid();
  return insert_('Users', {
    id: uid_('U'), name: name, username: String(username).trim().toLowerCase(), role: role,
    salt: salt, pinHash: hashPin_(salt, String(pin)), active: 'true', createdAt: nowIso_()
  });
}

function login_(data) {
  var username = String(data.username || '').trim().toLowerCase();
  var cache = CacheService.getScriptCache();
  var failKey = 'fail_' + username;
  var fails = num_(cache.get(failKey));
  if (fails >= 5) throw new Error('Too many wrong PINs. Try again after 10 minutes.');
  var u = findUser_(username);
  if (!u || u.active !== 'true' || hashPin_(u.salt, String(data.pin || '')) !== u.pinHash) {
    cache.put(failKey, String(fails + 1), 600);
    throw new Error('Wrong username or PIN');
  }
  cache.remove(failKey);
  var token = Utilities.getUuid() + Utilities.getUuid();
  var props = PropertiesService.getScriptProperties();
  cleanSessions_(props);
  props.setProperty('s_' + token, JSON.stringify({ u: u.id, exp: Date.now() + SESSION_DAYS * 86400000 }));
  audit_(u, 'login', u.id, {});
  return { token: token, user: publicUser_(u) };
}

function cleanSessions_(props) {
  var all = props.getProperties();
  var now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('s_') !== 0) return;
    var s = json_(all[k], null);
    if (!s || s.exp < now) props.deleteProperty(k);
  });
}

function sessionUser_(token) {
  req_(token, 'Please log in');
  var props = PropertiesService.getScriptProperties();
  var s = json_(props.getProperty('s_' + token), null);
  if (!s || s.exp < Date.now()) throw new Error('SESSION_EXPIRED');
  var u = find_('Users', s.u);
  if (!u || u.active !== 'true') throw new Error('SESSION_EXPIRED');
  return u;
}

function logout_(token) {
  PropertiesService.getScriptProperties().deleteProperty('s_' + token);
  return { ok: true };
}

/** Removes every session of one user (used when the owner switches a user off). */
function dropSessionsOf_(userId) {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('s_') !== 0) return;
    var s = json_(all[k], null);
    if (s && s.u === userId) props.deleteProperty(k);
  });
}

function usersList_() {
  return rows_('Users').map(publicUser_);
}

function usersSave_(user, d) {
  if (!d.id) {
    var nu = createUser_(d.name, d.username, d.role || 'employee', d.pin);
    audit_(user, 'user.add', nu.id, { username: nu.username, role: nu.role });
    return publicUser_(nu);
  }
  var u = find_('Users', d.id);
  req_(u, 'User not found');
  var patch = {};
  if (d.name) patch.name = d.name;
  if (d.role) {
    req_(['owner', 'employee', 'viewer'].indexOf(d.role) >= 0, 'Bad role');
    patch.role = d.role;
  }
  if (d.active !== undefined) patch.active = d.active ? 'true' : 'false';
  if (d.pin) {
    req_(/^\d{4,8}$/.test(String(d.pin)), 'PIN must be 4 to 8 digits');
    patch.salt = Utilities.getUuid();
    patch.pinHash = hashPin_(patch.salt, String(d.pin));
  }
  // Never lock the shop out: keep at least one active owner.
  var owners = rows_('Users').filter(function (x) {
    var role = x.id === u.id ? (patch.role || x.role) : x.role;
    var active = x.id === u.id ? (patch.active || x.active) : x.active;
    return role === 'owner' && active === 'true';
  });
  req_(owners.length > 0, 'At least one active owner is needed');
  var saved = update_('Users', u.id, patch);
  if (patch.active === 'false' || patch.pinHash) dropSessionsOf_(u.id);
  audit_(user, 'user.update', u.id, { name: patch.name, role: patch.role, active: patch.active, pin: !!d.pin });
  return publicUser_(saved);
}

/* ===== 04_api.js ===== */
/* ---------- Web app entry points ---------- */

/**
 * The phone app sends POST requests with a text/plain JSON body:
 *   { action: "sale.create", token: "...", data: {...} }
 * and gets back { ok: true, data } or { ok: false, error }.
 */
function doPost(e) {
  var out;
  try {
    var body = json_(e && e.postData && e.postData.contents, {});
    out = { ok: true, data: handle_(body.action, body.token, body.data || {}) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Opening the web app link in a browser just shows that the backend is alive. */
function doGet() {
  var s = settings_();
  return ContentService.createTextOutput(JSON.stringify({
    ok: true, app: 'DukanKaApp', version: APP_VERSION, shop: s.shop_name
  })).setMimeType(ContentService.MimeType.JSON);
}

var ROUTES = {
  'ping': function () { return { app: 'DukanKaApp', version: APP_VERSION, shop: settings_().shop_name }; },
  'bootstrap': function (u) { return bootstrap_(u); },
  'auth.logout': function (u, d, token) { return logout_(token); },
  'settings.save': function (u, d) { return settingsSave_(u, d); },
  'users.list': function () { return usersList_(); },
  'users.save': function (u, d) { return usersSave_(u, d); },
  'rates.save': function (u, d) { return ratesSave_(u, d); },
  'rates.list': function () { return ratesList_(); },
  'customers.search': function (u, d) { return customersSearch_(d); },
  'customers.get': function (u, d) { return customerGet_(d.id); },
  'customers.save': function (u, d) { return customerSave_(u, d); },
  'sale.create': function (u, d) { return saleCreate_(u, d); },
  'sale.list': function (u, d) { return saleList_(d); },
  'sale.get': function (u, d) { return saleGet_(d.id, d.fy); },
  'sale.void': function (u, d) { return saleVoid_(u, d); },
  'sale.payUdhaar': function (u, d) { return salePayUdhaar_(u, d); },
  'oldgold.buy': function (u, d) { return oldGoldBuy_(u, d); },
  'oldgold.list': function (u, d) { return oldGoldList_(d); },
  'loans.create': function (u, d) { return loanCreate_(u, d); },
  'loans.list': function (u, d) { return loansList_(d); },
  'loans.get': function (u, d) { return loanGet_(d.id, d.asOf); },
  'loans.pay': function (u, d) { return loanPay_(u, d); },
  'orders.create': function (u, d) { return orderCreate_(u, d); },
  'orders.list': function (u, d) { return ordersList_(d); },
  'orders.get': function (u, d) { return orderGet_(d.id); },
  'orders.pay': function (u, d) { return orderPay_(u, d); },
  'orders.status': function (u, d) { return orderStatus_(u, d); },
  'orders.deliver': function (u, d) { return orderDeliver_(u, d); },
  'repairs.create': function (u, d) { return repairCreate_(u, d); },
  'repairs.list': function (u, d) { return repairsList_(d); },
  'repairs.return': function (u, d) { return repairReturn_(u, d); },
  'repairs.deliver': function (u, d) { return repairDeliver_(u, d); },
  'stock.add': function (u, d) { return stockAdd_(u, d); },
  'stock.list': function (u, d) { return stockList_(d); },
  'stock.summary': function () { return stockSummary_(); },
  'stock.update': function (u, d) { return stockUpdate_(u, d); },
  'melt.create': function (u, d) { return meltCreate_(u, d); },
  'melt.list': function () { return meltList_(); },
  'fine.summary': function () { return fineSummary_(); },
  'parties.list': function (u, d) { return partiesList_(d); },
  'parties.save': function (u, d) { return partySave_(u, d); },
  'parties.ledger': function (u, d) { return partyLedger_(d.id); },
  'parties.entry': function (u, d) { return partyEntry_(u, d); },
  'cash.list': function (u, d) { return cashList_(d); },
  'cash.add': function (u, d) { return cashAdd_(u, d); },
  'cash.opening': function (u, d) { return cashOpening_(u, d); },
  'reports.daily': function (u, d) { return reportDaily_(d.date); },
  'reports.month': function (u, d) { return reportMonth_(d.month); },
  'reports.position': function () { return reportPosition_(); },
  'dues.list': function (u, d) { return duesList_(d); },
  'dues.pay': function (u, d) { return duesPay_(u, d); },
  'dues.adjust': function (u, d) { return duesAdjust_(u, d); },
  'loans.edit': function (u, d) { return loanEdit_(u, d); },
  'loans.void': function (u, d) { return loanVoid_(u, d); },
  'loans.undoLast': function (u, d) { return loanUndoLast_(u, d); },
  'orders.edit': function (u, d) { return orderEdit_(u, d); },
  'repairs.edit': function (u, d) { return repairEdit_(u, d); },
  'cash.void': function (u, d) { return cashVoid_(u, d); },
  'home.summary': function () { return homeSummary_(); },
  'admin.archive': function (u, d) { return archiveFy_(u, d.fy); },
  'admin.backupNow': function () { return backupNow_(); }
};

var READ_ONLY = {
  'ping': 1, 'bootstrap': 1, 'rates.list': 1, 'customers.search': 1, 'customers.get': 1, 'sale.list': 1,
  'sale.get': 1, 'oldgold.list': 1, 'loans.list': 1, 'loans.get': 1, 'orders.list': 1, 'orders.get': 1,
  'repairs.list': 1, 'stock.list': 1, 'stock.summary': 1, 'melt.list': 1, 'fine.summary': 1,
  'parties.list': 1, 'parties.ledger': 1, 'cash.list': 1, 'reports.daily': 1, 'reports.month': 1,
  'reports.position': 1, 'users.list': 1, 'dues.list': 1, 'home.summary': 1
};

function handle_(action, token, data) {
  if (action === 'auth.login') return login_(data);
  if (action === 'ping') return ROUTES.ping();
  var fn = ROUTES[action];
  req_(fn, 'Unknown action: ' + action);
  var user = sessionUser_(token);
  if (OWNER_ONLY[action]) req_(user.role === 'owner', 'Only the owner can do this');
  if (user.role === 'viewer') req_(READ_ONLY[action] || action === 'auth.logout', 'View-only users cannot change data');
  if (READ_ONLY[action]) return fn(user, data, token);
  // Every save from the app carries a request id (_rid). If the same save arrives twice
  // (double tap, slow network, retry), the first result is returned and nothing is saved again.
  var rid = data && data._rid ? 'rid_' + String(data._rid).slice(0, 60) : '';
  var cache = rid ? CacheService.getScriptCache() : null;
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (cache) {
      var prev = cache.get(rid);
      if (prev) return json_(prev, {});
    }
    migrateDues_();
    var result = fn(user, data, token);
    if (cache) {
      try {
        var str = JSON.stringify(result === undefined ? {} : result);
        if (str.length < 90000) cache.put(rid, str, 21600);
      } catch (e) { /* cache full or too large: skip */ }
    }
    return result;
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function bootstrap_(user) {
  var s = settings_();
  var clean = {};
  Object.keys(s).forEach(function (k) { if (k.indexOf('counter_') !== 0) clean[k] = s[k]; });
  return {
    user: publicUser_(user),
    settings: clean,
    rate: todayRate_(),
    today: today_(),
    version: APP_VERSION
  };
}

/* ===== 10_core.js ===== */
/* ---------- Settings, daily rate, customers ---------- */

function settingsSave_(user, d) {
  var allowed = Object.keys(DEFAULT_SETTINGS);
  var changed = {};
  Object.keys(d || {}).forEach(function (k) {
    if (allowed.indexOf(k) < 0) return;
    var v = d[k];
    if (typeof v === 'object') v = JSON.stringify(v);
    v = String(v);
    if (k.indexOf('formula_') === 0) testFormula_(k, v);
    if (k === 'shop_gstin' && v) {
      v = v.trim().toUpperCase();
      req_(/^[0-9]{2}[A-Z0-9]{13}$/.test(v), 'GSTIN should be 15 characters, starting with the 2-digit state code');
    }
    setSetting_(k, v);
    changed[k] = v;
  });
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
    var dup = rows_('Customers').filter(function (c) { return c.mobile === mobile; })[0];
    if (dup && dup.firstName.toLowerCase() === first.toLowerCase()) return dup;
  }
  rec.id = uid_('K');
  rec.createdAt = nowIso_();
  rec.by = user.username;
  insert_('Customers', rec);
  audit_(user, 'customer.add', rec.id, rec);
  return rec;
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
  var q = String(d.q || '').trim().toLowerCase();
  var village = String(d.village || '').trim().toLowerCase();
  var digits = q.replace(/\D/g, '');
  var list = rows_('Customers');
  var scored = [];
  list.forEach(function (c) {
    if (village && c.village.toLowerCase() !== village) return;
    var fn = c.firstName.toLowerCase(), ln = c.lastName.toLowerCase();
    var score = 0, matched = '';
    if (!q) { score = 1; }
    else if (fn.indexOf(q) === 0) { score = 5; matched = 'name'; }
    else if (ln.indexOf(q) === 0) { score = 4; matched = 'surname'; }
    else if ((fn + ' ' + ln).indexOf(q) >= 0) { score = 3; matched = 'name'; }
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
    udhaar: customerUdhaar_(id)
  };
}

/* ===== 11_sales.js ===== */
/* ---------- Sales (GST bill / estimate) and old gold ---------- */

function oldGoldCalc_(g) {
  var weight = num_(g.weight);
  var cut = num_(g.cutPct);
  var rate = num_(g.rate);
  var purity = g.ourPurityPct === '' || g.ourPurityPct === undefined ? num_(settings_().standard_purity_pct) : num_(g.ourPurityPct);
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
  var c = ensureCustomer_(user, d);
  var lines = (d.lines || []).filter(function (l) { return num_(l.weight) > 0 || num_(l.amount) > 0; });
  req_(lines.length, 'Add at least one item');
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
    // A lot (many pieces / loose weight) can be sold in part: only what was sold leaves stock.
    var part = null;
    if (item) {
      var lotWt = num_(item.netWt), lotPcs = num_(item.pieces) || 1;
      var soldWt = w > 0 ? Math.min(w, lotWt) : lotWt;
      var soldPcs = lotPcs > 1 ? Math.max(1, Math.round(num_(l.pieces) || 1)) : 1;
      req_(soldPcs <= lotPcs, 'Only ' + lotPcs + ' pieces left in ' + (item.tag || item.name));
      if (soldWt < lotWt - 0.0005 || soldPcs < lotPcs) part = { wt: round3_(soldWt), pcs: soldPcs,
        cost: round2_(num_(item.costTotal) * soldWt / (lotWt || 1)) };
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
  var gstPct = type === 'GST' ? (d.gstPct !== undefined && d.gstPct !== '' ? num_(d.gstPct) : num_(s.gst_default_pct)) : 0;
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
      var pcsLeft = (num_(it.pieces) || 1) - l.part.pcs;
      update_('Items', l.itemId, {
        netWt: Math.max(left, 0), grossWt: round3_(Math.max(0, num_(it.grossWt) - l.part.wt)), pieces: Math.max(pcsLeft, 0),
        costTotal: round2_(num_(it.costTotal) - l.part.cost),
        status: left <= 0.0005 || pcsLeft <= 0 ? 'sold' : 'in', soldBillId: id
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
  update_('Sales', b.id, { status: 'void' });
  json_(b.lines, []).forEach(function (l) {
    if (!l.itemId) return;
    var it = find_('Items', l.itemId);
    if (!it) return;
    if (l.part) {
      update_('Items', l.itemId, { status: 'in', netWt: round3_(num_(it.netWt) + l.part.wt),
        grossWt: round3_(num_(it.grossWt) + l.part.wt), pieces: num_(it.pieces) + l.part.pcs,
        costTotal: round2_(num_(it.costTotal) + l.part.cost) });
    } else update_('Items', l.itemId, { status: 'in', soldBillId: '' });
  });
  if (num_(b.udhaar) > 0) {
    var cust = find_('Customers', b.customerId);
    if (cust) duesAdd_(user, cust, -num_(b.udhaar), 'sale-cancel', b.id, 'Cancelled ' + b.billNo);
  }
  rows_('OldGold').filter(function (g) { return g.billId === b.id; }).forEach(function (g) {
    req_(g.status !== 'melted', 'Old gold from this bill is already melted; cannot cancel');
    update_('OldGold', g.id, { status: 'void' });
  });
  var net = num_(b.net);
  var dir = net >= 0 ? 'out' : 'in';
  cash_(user, dir, 'cash', num_(b.cash), 'sale-cancel', 'sale', b.id, 'Cancelled ' + b.billNo);
  cash_(user, dir, 'upi', num_(b.upi), 'sale-cancel', 'sale', b.id, 'Cancelled ' + b.billNo);
  audit_(user, 'sale.void', b.id, { billNo: b.billNo, reason: d.reason || '' });
  return { ok: true };
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

/* ===== 12_loans.js ===== */
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

/* ===== 13_orders_repairs.js ===== */
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
    var refund = round2_(pos_(d.refund, 'Refund'));
    var paidSoFar = orderPayments_(o.id).reduce(function (a, p) { return a + p.amount; }, 0);
    req_(refund <= paidSoFar + 1, 'Customer paid only ₹' + Math.round(paidSoFar));
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
    patch.returnedAt = date;
    patch.wtOut = r.wtOut || r.wtIn;
    if (r.karigarCost === '') patch.karigarCost = repairAmount_(r.karigarRateType, r.karigarRate, r.wtIn);
  }
  var saved = update_('Repairs', r.id, patch);
  audit_(user, 'repair.deliver', r.id, { charge: charge });
  return repairOut_(saved);
}

/* ===== 14_stock_partners.js ===== */
/* ---------- Stock ---------- */

function itemOut_(i) {
  var out = {};
  SCHEMA.Items.forEach(function (k) { out[k] = i[k]; });
  ['purityPct', 'grossWt', 'netWt', 'pieces', 'makingPerG', 'costTotal'].forEach(function (k) { out[k] = num_(i[k]); });
  return out;
}

function stockAdd_(user, d) {
  var items = d.items || [];
  req_(items.length, 'Add at least one item');
  var saved = [];
  items.forEach(function (it) {
    var net = round3_(it.netWt || it.grossWt);
    req_(net > 0, 'Enter the weight for ' + (it.name || 'the item'));
    var tag = String(it.tag || '').trim();
    if (!tag) tag = 'T' + String(nextCounter_('tag')).padStart(5, '0');
    var rec = {
      id: uid_('I'), tag: tag, name: String(it.name || 'Item').trim(), category: String(it.category || 'Other').trim(),
      metal: it.metal === 'silver' ? 'silver' : 'gold', purityPct: num_(it.purityPct),
      grossWt: round3_(it.grossWt || net), netWt: net, pieces: Math.max(1, Math.round(num_(it.pieces) || 1)),
      makingPerG: num_(it.makingPerG), costTotal: round2_(it.costTotal), status: 'in',
      source: d.source || 'manual', sourceId: d.sourceId || '', soldBillId: '', addedAt: nowIso_(), by: user.username
    };
    insert_('Items', rec);
    saved.push(itemOut_(rec));
  });
  rememberCategories_(saved.map(function (x) { return x.category; }));
  audit_(user, 'stock.add', saved.map(function (x) { return x.id; }).join(','), { count: saved.length });
  return saved;
}

function rememberCategories_(cats) {
  var list = json_(settings_().item_categories, ['Necklace', 'Chain', 'Ring', 'Ear rings', 'Bangles', 'Mangalsutra', 'Pendant', 'Payal', 'Bichhiya', 'Coin']);
  cats.forEach(function (c) { if (c && list.indexOf(c) < 0) list.push(c); });
  setSetting_('item_categories', JSON.stringify(list));
}

function stockList_(d) {
  var status = d.status || 'in';
  var q = String(d.q || '').toLowerCase();
  return rows_('Items').filter(function (i) {
    if (status !== 'all' && i.status !== status) return false;
    if (d.category && i.category !== d.category) return false;
    if (d.metal && i.metal !== d.metal) return false;
    if (q && (i.tag + ' ' + i.name + ' ' + i.category).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).slice().reverse().slice(0, 300).map(itemOut_);
}

function stockSummary_() {
  var rate = todayRate_();
  var groups = {};
  var totals = { gold: { pieces: 0, netWt: 0, value: 0 }, silver: { pieces: 0, netWt: 0, value: 0 } };
  rows_('Items').forEach(function (i) {
    if (i.status !== 'in') return;
    var key = i.metal + '|' + i.category;
    var g = groups[key] || (groups[key] = { metal: i.metal, category: i.category, pieces: 0, netWt: 0, value: 0 });
    var pcs = num_(i.pieces) || 1;
    var val = itemValue_(i.metal, num_(i.netWt), num_(i.purityPct) || (i.metal === 'silver' ? 100 : 91.6), rate);
    g.pieces += pcs; g.netWt = round3_(g.netWt + num_(i.netWt)); g.value += val;
    var t = totals[i.metal] || totals.gold;
    t.pieces += pcs; t.netWt = round3_(t.netWt + num_(i.netWt)); t.value += val;
  });
  var list = Object.keys(groups).map(function (k) { return groups[k]; });
  list.sort(function (a, b) { return b.netWt - a.netWt; });
  var today = today_();
  var soldToday = rows_('Items').filter(function (i) {
    if (i.status !== 'sold' || !i.soldBillId) return false;
    var b = find_('Sales', i.soldBillId);
    return b && b.date === today;
  }).length;
  return { categories: list, totals: totals, soldToday: soldToday,
    categoriesList: json_(settings_().item_categories, []) };
}

function stockUpdate_(user, d) {
  var i = find_('Items', d.id);
  req_(i, 'Item not found');
  var patch = {};
  ['tag', 'name', 'category', 'metal'].forEach(function (k) { if (d[k] !== undefined) patch[k] = String(d[k]); });
  ['purityPct', 'grossWt', 'netWt', 'pieces', 'makingPerG', 'costTotal'].forEach(function (k) {
    if (d[k] !== undefined && d[k] !== '') patch[k] = pos_(d[k], k);
  });
  req_(i.status === 'in' || d.status, 'This item is already sold');
  if (d.status) {
    req_(['in', 'removed'].indexOf(d.status) >= 0, 'Bad status');
    patch.status = d.status;
  }
  var saved = update_('Items', i.id, patch);
  audit_(user, 'stock.update', i.id, patch);
  return itemOut_(saved);
}

/* ---------- Melting and fine gold stock ---------- */

function fineEntry_(user, type, grams, value, refType, refId, notes, date) {
  return insert_('FineLedger', {
    id: uid_('F'), date: validDate_(date), type: type, grams: round3_(grams), value: round2_(value),
    refType: refType || '', refId: refId || '', notes: notes || '', by: user ? user.username : '', at: nowIso_()
  });
}

function meltCreate_(user, d) {
  var ids = d.oldGoldIds || [];
  req_(ids.length, 'Pick the old gold items to melt');
  var barWt = round3_(d.barWt), purity = num_(d.purityPct);
  req_(barWt > 0 && purity > 0, 'Enter bar weight and tested purity');
  var totalWt = 0, ourFine = 0, paidFine = 0, paidAmount = 0;
  ids.forEach(function (gid) {
    var g = find_('OldGold', gid);
    req_(g && g.status === 'stock', 'An item is not in old gold stock');
    totalWt += num_(g.weight); ourFine += num_(g.ourFine); paidFine += num_(g.customerFine); paidAmount += num_(g.amount);
  });
  var actualFine = round3_(barWt * purity / 100);
  var cost = round2_(d.cost);
  var date = validDate_(d.date);
  var rec = {
    id: uid_('M'), date: date, oldGoldIds: ids, totalWt: round3_(totalWt), ourFine: round3_(ourFine),
    paidFine: round3_(paidFine), paidAmount: round2_(paidAmount), barWt: barWt, purityPct: purity,
    actualFine: actualFine, cost: cost, notes: String(d.notes || ''), by: user.username, at: nowIso_()
  };
  insert_('Melts', rec);
  ids.forEach(function (gid) { update_('OldGold', gid, { status: 'melted', meltId: rec.id }); });
  fineEntry_(user, 'melt_in', actualFine, paidAmount + cost, 'melt', rec.id, 'Melted ' + ids.length + ' items', date);
  if (cost > 0) cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', cost, 'melting', 'melt', rec.id, 'Melting / testing charges', date);
  audit_(user, 'melt.create', rec.id, { actualFine: actualFine });
  return meltOut_(rec);
}

function meltOut_(m) {
  var rate = rateOn_(m.date) || todayRate_() || { g24: 0 };
  var actual = num_(m.actualFine);
  return {
    id: m.id, date: m.date, items: json_(m.oldGoldIds, []).length, totalWt: num_(m.totalWt),
    ourFine: num_(m.ourFine), paidFine: num_(m.paidFine), paidAmount: num_(m.paidAmount), barWt: num_(m.barWt),
    purityPct: num_(m.purityPct), actualFine: actual, cost: num_(m.cost),
    vsEstimateG: round3_(actual - num_(m.ourFine)), vsPaidG: round3_(actual - num_(m.paidFine)),
    gainValue: Math.round(actual * num_(rate.g24) - num_(m.paidAmount) - num_(m.cost))
  };
}

function meltList_() {
  return rows_('Melts').slice().reverse().map(meltOut_);
}

function fineSummary_() {
  var inHand = 0, valueIn = 0, gramsIn = 0;
  rows_('FineLedger').forEach(function (f) {
    var g = num_(f.grams);
    inHand += g;
    if (g > 0 && num_(f.value) > 0) { gramsIn += g; valueIn += num_(f.value); }
  });
  var karigarIds = {};
  rows_('Parties').forEach(function (p) { if (p.type === 'karigar') karigarIds[p.id] = 1; });
  var withKarigars = 0;
  rows_('PartyLedger').forEach(function (e) { if (karigarIds[e.partyId]) withKarigars += num_(e.goldG); });
  var old = rows_('OldGold').filter(function (g) { return g.status === 'stock' && g.metal === 'gold'; });
  return {
    inHand: round3_(inHand), withKarigars: round3_(withKarigars),
    avgCostPerG: gramsIn ? Math.round(valueIn / gramsIn) : 0,
    oldGold: {
      items: old.length,
      weight: round3_(old.reduce(function (a, g) { return a + num_(g.weight); }, 0)),
      ourFine: round3_(old.reduce(function (a, g) { return a + num_(g.ourFine); }, 0)),
      paidFine: round3_(old.reduce(function (a, g) { return a + num_(g.customerFine); }, 0)),
      amount: Math.round(old.reduce(function (a, g) { return a + num_(g.amount); }, 0))
    }
  };
}

function issueFineToKarigar_(user, karigarId, grams, refType, refId, notes, date) {
  var p = find_('Parties', karigarId);
  req_(p && p.type === 'karigar', 'Karigar not found');
  fineEntry_(user, 'karigar_out', -grams, 0, refType, refId, 'To ' + p.name + ': ' + notes, date);
  insert_('PartyLedger', {
    id: uid_('Y'), partyId: p.id, date: validDate_(date), type: 'issue_gold', goldG: round3_(grams), cash: 0,
    rate: '', refType: refType, refId: refId, notes: notes, by: user.username, at: nowIso_()
  });
}

/* ---------- Wholesalers and karigars ---------- */

function partyBalances_(partyId) {
  var gold = 0, cash = 0;
  rows_('PartyLedger').forEach(function (e) {
    if (e.partyId === partyId) { gold += num_(e.goldG); cash += num_(e.cash); }
  });
  return { goldG: round3_(gold), cash: round2_(cash) };
}

function partiesList_(d) {
  var rate = todayRate_();
  return rows_('Parties').filter(function (p) {
    return (!d.type || p.type === d.type) && p.active !== 'false';
  }).map(function (p) {
    var b = partyBalances_(p.id);
    return { id: p.id, type: p.type, name: p.name, mobile: p.mobile, notes: p.notes, goldG: b.goldG, cash: b.cash,
      valueToday: Math.round(b.goldG * (rate ? rate.g24 : 0) + b.cash) };
  });
}

function partySave_(user, d) {
  req_(d.name, 'Enter the name');
  var rec = { type: d.type === 'karigar' ? 'karigar' : 'wholesaler', name: String(d.name).trim(),
    mobile: cleanMobile_(d.mobile), notes: String(d.notes || '') };
  if (d.id) {
    if (d.active !== undefined) rec.active = d.active ? 'true' : 'false';
    return update_('Parties', d.id, rec);
  }
  rec.id = uid_('Q'); rec.active = 'true'; rec.createdAt = nowIso_();
  insert_('Parties', rec);
  audit_(user, 'party.add', rec.id, rec);
  return rec;
}

function partyLedger_(id) {
  var p = find_('Parties', id);
  req_(p, 'Not found');
  var entries = rows_('PartyLedger').filter(function (e) { return e.partyId === id; }).map(function (e) {
    return { id: e.id, date: e.date, type: e.type, goldG: num_(e.goldG), cash: num_(e.cash), rate: num_(e.rate),
      refType: e.refType, refId: e.refId, notes: e.notes, by: e.by };
  }).reverse();
  var b = partyBalances_(id);
  var rate = todayRate_();
  return { party: p, entries: entries, goldG: b.goldG, cash: b.cash,
    valueToday: Math.round(b.goldG * (rate ? rate.g24 : 0) + b.cash) };
}

/**
 * Wholesaler (positive = we owe them):
 *   purchase      goods taken: goldG = fine to give, cash = labour to give; items optional (added to stock)
 *   pay_gold      gave fine gold from our fine stock (goldG grams)
 *   pay_cash_rate "rate cut": settled goldG grams in cash at rate
 *   pay_cash      paid cash dues (labour etc.)
 * Karigar (goldG positive = karigar holds our gold, cash positive = we owe labour):
 *   issue_gold, return_gold, job_done (fineUsed, labour), pay_labour
 */
function partyEntry_(user, d) {
  var p = find_('Parties', d.partyId);
  req_(p, 'Not found');
  var date = validDate_(d.date);
  var g = round3_(pos_(d.goldG, 'Grams')), c = round2_(pos_(d.cash, 'Amount')), rate = pos_(d.rate, 'Rate');
  var mode = d.mode === 'upi' ? 'upi' : 'cash';
  var e = { id: uid_('Y'), partyId: p.id, date: date, type: d.type, goldG: 0, cash: 0, rate: '',
    refType: d.refType || '', refId: d.refId || '', notes: String(d.notes || ''), by: user.username, at: nowIso_() };
  if (p.type === 'wholesaler') {
    if (d.type === 'purchase') {
      req_(g > 0 || c > 0, 'Enter fine gold to give or cash to give');
      e.goldG = g; e.cash = c;
      if (d.items && d.items.length) {
        var added = stockAdd_(user, { items: d.items, source: 'wholesaler', sourceId: e.id });
        e.notes = (e.notes ? e.notes + ' · ' : '') + added.length + ' items to stock';
      }
    } else if (d.type === 'pay_gold') {
      req_(g > 0, 'Enter grams given');
      e.goldG = -g;
      fineEntry_(user, 'wholesaler_out', -g, 0, 'party', p.id, 'To ' + p.name, date);
    } else if (d.type === 'pay_cash_rate') {
      req_(g > 0 && rate > 0, 'Enter grams and rate');
      e.goldG = -g; e.rate = rate;
      cash_(user, 'out', mode, Math.round(g * rate), 'wholesaler', 'party', p.id, p.name + ' rate cut ' + g + ' g', date);
    } else if (d.type === 'pay_cash') {
      req_(c > 0, 'Enter the amount');
      e.cash = -c;
      cash_(user, 'out', mode, c, 'wholesaler', 'party', p.id, p.name, date);
    } else throw new Error('Unknown entry type');
  } else {
    if (d.type === 'issue_gold') {
      req_(g > 0, 'Enter grams given');
      e.goldG = g;
      fineEntry_(user, 'karigar_out', -g, 0, 'party', p.id, 'To ' + p.name, date);
    } else if (d.type === 'return_gold') {
      req_(g > 0, 'Enter grams returned');
      e.goldG = -g;
      fineEntry_(user, 'karigar_return', g, 0, 'party', p.id, 'From ' + p.name, date);
    } else if (d.type === 'job_done') {
      e.goldG = -g; e.cash = c;
      if (d.items && d.items.length) stockAdd_(user, { items: d.items, source: 'karigar', sourceId: e.id });
    } else if (d.type === 'pay_labour') {
      req_(c > 0, 'Enter the amount');
      e.cash = -c;
      cash_(user, 'out', mode, c, 'karigar-labour', 'party', p.id, p.name, date);
    } else throw new Error('Unknown entry type');
  }
  insert_('PartyLedger', e);
  audit_(user, 'party.' + d.type, p.id, { goldG: e.goldG, cash: e.cash });
  return partyLedger_(p.id);
}

/* ---------- Cash book ---------- */

function cashBalanceBefore_(date, mode) {
  var s = settings_();
  var openDate = s.cash_opening_date || '0000-00-00';
  var bal = mode === 'cash' ? num_(s.cash_opening) : 0;
  rows_('Cash').forEach(function (c) {
    if (c.mode !== mode || c.date < openDate || c.date >= date) return;
    bal += c.dir === 'in' ? num_(c.amount) : -num_(c.amount);
  });
  return round2_(bal);
}

function cashList_(d) {
  var from = validDate_(d.from), to = d.to ? validDate_(d.to) : from;
  var entries = rows_('Cash').filter(function (c) { return c.date >= from && c.date <= to; }).map(function (c) {
    return { id: c.id, date: c.date, dir: c.dir, mode: c.mode, amount: num_(c.amount), category: c.category,
      refType: c.refType, notes: c.notes, by: c.by, at: c.at };
  }).reverse();
  var sum = function (dir, mode) {
    return round2_(entries.filter(function (e) { return e.dir === dir && e.mode === mode; })
      .reduce(function (a, e) { return a + e.amount; }, 0));
  };
  var opening = cashBalanceBefore_(from, 'cash');
  var cashIn = sum('in', 'cash'), cashOut = sum('out', 'cash');
  return { from: from, to: to, entries: entries, opening: opening, cashIn: cashIn, cashOut: cashOut,
    closing: round2_(opening + cashIn - cashOut), upiIn: sum('in', 'upi'), upiOut: sum('out', 'upi') };
}

function cashAdd_(user, d) {
  var amt = round2_(pos_(d.amount, 'Amount'));
  req_(amt > 0, 'Enter the amount');
  var dir = d.dir === 'in' ? 'in' : 'out';
  var rec = cash_(user, dir, d.mode === 'upi' ? 'upi' : 'cash', amt, dir === 'out' ? 'expense' : 'other-income',
    'manual', '', String(d.notes || d.category || ''), d.date);
  audit_(user, 'cash.add', rec.id, rec);
  return rec;
}

function cashOpening_(user, d) {
  setSetting_('cash_opening', String(round2_(d.amount)));
  setSetting_('cash_opening_date', validDate_(d.date));
  audit_(user, 'cash.opening', '', d);
  return { ok: true };
}

/* ===== 15_reports.js ===== */
/* ---------- Reports ---------- */

function reportDaily_(date) {
  date = validDate_(date);
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
  var newLoans = rows_('Loans').filter(function (l) { return l.date === date; });
  var repairs = rows_('Repairs').filter(function (r) { return r.deliveredAt === date; });
  var repairProfit = repairs.reduce(function (a, r) { return a + num_(r.custCharge) - num_(r.karigarCost); }, 0);
  var delivered = rows_('Orders').filter(function (o) { return o.deliveredAt === date; });
  var makingProfit = delivered.reduce(function (a, o) {
    return a + (num_(o.makingPerG) - num_(o.karigarPerG)) * num_(o.finalWt);
  }, 0);
  var melts = rows_('Melts').filter(function (m) { return m.date === date; });
  var meltGain = melts.reduce(function (a, m) {
    return a + num_(m.actualFine) * num_(rate.g24) - num_(m.paidAmount) - num_(m.cost);
  }, 0);
  var cashEntries = rows_('Cash').filter(function (c) { return c.date === date; });
  var expenses = cashEntries.filter(function (c) { return c.dir === 'out' && c.category === 'expense'; })
    .reduce(function (a, c) { return a + num_(c.amount); }, 0);
  var oldBought = rows_('OldGold').filter(function (g) { return g.date === date && g.status !== 'void'; });
  var booked = rows_('Orders').filter(function (o) { return o.date === date; });
  var cash = cashList_({ from: date, to: date });
  var profit = salesProfit + interest + repairProfit + makingProfit + meltGain - expenses;
  return {
    date: date,
    profit: Math.round(profit),
    parts: {
      sales: Math.round(salesProfit), interest: Math.round(interest), repair: Math.round(repairProfit),
      making: Math.round(makingProfit), melting: Math.round(meltGain), expenses: Math.round(expenses)
    },
    unknownCostLines: unknownCostLines,
    sales: { count: sales.length, total: Math.round(salesTotal), tax: round2_(taxTotal),
      gst: sales.filter(function (b) { return b.type === 'GST'; }).length },
    loans: { newCount: newLoans.length, newAmount: Math.round(newLoans.reduce(function (a, l) { return a + num_(l.principal); }, 0)),
      closed: loansClosed },
    oldGold: { count: oldBought.length, weight: round3_(oldBought.reduce(function (a, g) { return a + num_(g.weight); }, 0)),
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
  var parts = { sales: 0, interest: 0, repair: 0, making: 0, melting: 0, expenses: 0 };
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
    row('Melting gain', r(d.parts.melting)) + row('Expenses', '− ' + r(d.parts.expenses)) + '</table>' +
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

/* ===== 16_dues_edits.js ===== */
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
    r.items.push({ id: x.id, date: x.date, amount: num_(x.amount), refType: x.refType, refId: x.refId, notes: x.notes });
  });
  var q = String(d.q || '').toLowerCase();
  var list = Object.keys(by).map(function (k) { return by[k]; }).filter(function (r) {
    if (r.due <= 0.5) return false;
    return !q || (r.customerName + ' ' + r.mobile).toLowerCase().indexOf(q) >= 0;
  });
  list.forEach(function (r) {
    var c = find_('Customers', r.customerId);
    if (c) { r.customerName = customerName_(c); r.mobile = c.mobile; r.village = c.village; }
    r.items = r.items.slice(-10).reverse();
  });
  list.sort(function (a, b) { return a.since < b.since ? -1 : 1; });
  return { list: list, total: Math.round(list.reduce(function (a, r) { return a + r.due; }, 0)), count: list.length };
}

function duesPay_(user, d) {
  var c = find_('Customers', d.customerId);
  req_(c, 'Customer not found');
  var amt = round2_(d.amount);
  req_(amt > 0, 'Enter the amount received');
  var due = customerUdhaar_(c.id);
  req_(amt <= due + 1, 'Customer owes only ₹' + Math.round(due));
  var date = validDate_(d.date);
  duesAdd_(user, c, -amt, 'payment', '', d.notes || 'Received', date);
  cash_(user, 'in', d.mode === 'upi' ? 'upi' : 'cash', amt, 'udhaar', 'udhaar', c.id, customerName_(c), date);
  audit_(user, 'dues.pay', c.id, { amount: amt });
  return { udhaar: customerUdhaar_(c.id) };
}

/** Owner: write off or correct a balance without money moving (e.g. discount given). */
function duesAdjust_(user, d) {
  var c = find_('Customers', d.customerId);
  req_(c, 'Customer not found');
  var amt = round2_(d.amount);
  req_(amt !== 0, 'Enter the amount');
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
  if (d.date && d.date !== l.date) { req_(!hasTx, 'Date cannot change after payments; cancel the payments first'); patch.date = validDate_(d.date); }
  if (d.principal !== undefined && d.principal !== '' && num_(d.principal) !== num_(l.principal)) {
    req_(!hasTx, 'Amount cannot change after payments; cancel the payments first');
    var np = round2_(d.principal);
    req_(np > 0, 'Enter the loan amount');
    var diff = np - num_(l.principal);
    cash_(user, diff > 0 ? 'out' : 'in', 'cash', Math.abs(diff), 'girvi-given', 'loan', l.id, 'Correction: ' + l.customerName, l.date);
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
  cash_(user, 'in', 'cash', num_(l.principal), 'girvi-cancel', 'loan', l.id, 'Cancelled entry: ' + l.customerName);
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
  if (t.type === 'close') update_('Loans', l.id, { status: 'open', closedAt: '' });
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
  var orders = rows_('Orders').filter(function (o) { return o.status !== 'delivered' && o.status !== 'cancelled'; });
  var dues = duesList_({});
  return {
    ordersDueToday: orders.filter(function (o) { return o.deliveryDate === t; }).length,
    ordersLate: orders.filter(function (o) { return o.deliveryDate && o.deliveryDate < t; }).length,
    loansOld: rows_('Loans').filter(function (l) { return l.status === 'open' && l.date <= yearAgo; }).length,
    loansOpen: rows_('Loans').filter(function (l) { return l.status === 'open'; }).length,
    ordersPending: orders.length,
    repairsReady: rows_('Repairs').filter(function (r) { return r.status === 'ready'; }).length,
    duesCount: dues.count, duesTotal: dues.total
  };
}

/** v1.0 kept udhaar only on bills. Copy it into the Dues tab once (runs on the first save after updating). */
function migrateDues_() {
  if (settings_().dues_v === '1') return;
  rows_('Sales').forEach(function (s) {
    if (s.status === 'void' || num_(s.udhaar) <= 0) return;
    var c = find_('Customers', s.customerId);
    if (c) duesAdd_(null, c, num_(s.udhaar), 'sale', s.id, 'Bill ' + s.billNo, s.date);
  });
  rows_('Cash').forEach(function (x) {
    if (x.refType !== 'udhaar') return;
    var c = find_('Customers', x.refId);
    if (c) duesAdd_(null, c, -num_(x.amount), 'payment', '', 'Received', x.date);
  });
  setSetting_('dues_v', '1');
}

/* ===== 20_setup.js ===== */
/* ---------- One-time setup, menu, nightly jobs, archive ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Dukan App')
    .addItem('1. Set up this sheet', 'setup')
    .addItem('2. Turn on nightly backup + email report', 'installNightly')
    .addSeparator()
    .addItem('Back up now', 'backupNowMenu')
    .addItem('Email today\'s report now', 'emailReportNow')
    .addItem('Reset an owner PIN', 'resetOwnerPin')
    .addToUi();
}

/** Creates every tab, default settings and the first owner login. Safe to run again. */
function setup() {
  var ui = SpreadsheetApp.getUi();
  Object.keys(SCHEMA).forEach(function (name) { sheet_(name); });
  var existing = {};
  rows_('Settings').forEach(function (r) { existing[r.key] = 1; });
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    if (!existing[k]) insert_('Settings', { key: k, value: DEFAULT_SETTINGS[k] });
  });
  if (!existing.cash_opening_date) setSetting_('cash_opening_date', today_());
  var blank = ss_().getSheetByName('Sheet1');
  if (blank && ss_().getSheets().length > 1 && blank.getLastRow() === 0) ss_().deleteSheet(blank);

  var hasOwner = rows_('Users').some(function (u) { return u.role === 'owner' && u.active === 'true'; });
  if (!hasOwner) {
    var name = ui.prompt('Owner name', 'Your name (shown in the app):', ui.ButtonSet.OK_CANCEL);
    if (name.getSelectedButton() !== ui.Button.OK) return;
    var uname = ui.prompt('Login name', 'A short login name, e.g. viju:', ui.ButtonSet.OK_CANCEL);
    if (uname.getSelectedButton() !== ui.Button.OK) return;
    var pin = ui.prompt('PIN', 'Choose a 4 to 8 digit PIN (numbers only):', ui.ButtonSet.OK_CANCEL);
    if (pin.getSelectedButton() !== ui.Button.OK) return;
    createUser_(name.getResponseText().trim(), uname.getResponseText().trim(), 'owner', pin.getResponseText().trim());
  }
  ui.alert('Setup done',
    'All tabs are ready.\n\nNext: Deploy → New deployment → Web app\n' +
    '  • Execute as: Me\n  • Who has access: Anyone\n' +
    'Copy the web app URL and paste it into the app on first open.\n\n' +
    'Then run "Dukan App → 2. Turn on nightly backup" from the menu.', ui.ButtonSet.OK);
}

function installNightly() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'nightly') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('nightly').timeBased().atHour(21).nearMinute(30).everyDays(1).inTimezone(tz_()).create();
  SpreadsheetApp.getUi().alert('Done. Every night around 9:30 pm the sheet is backed up and today\'s report is emailed.');
}

function nightly() {
  try { backupNow_(); } catch (e) { console.error(e); }
  try { emailReport_(today_()); } catch (e2) { console.error(e2); }
  try { cleanSessions_(PropertiesService.getScriptProperties()); } catch (e3) { console.error(e3); }
}

function backupNowMenu() {
  var r = backupNow_();
  SpreadsheetApp.getUi().alert('Backup saved: ' + r.name);
}

/** Copies the whole spreadsheet into a "DukanKaApp Backups" folder and keeps the last 30 copies. */
function backupNow_() {
  var folders = DriveApp.getFoldersByName('DukanKaApp Backups');
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('DukanKaApp Backups');
  var file = DriveApp.getFileById(ss_().getId());
  var name = ss_().getName() + ' backup ' + Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HHmm');
  file.makeCopy(name, folder);
  var copies = [];
  var it = folder.getFiles();
  while (it.hasNext()) copies.push(it.next());
  copies.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  copies.slice(30).forEach(function (f) { f.setTrashed(true); });
  return { name: name };
}

function reportEmailTo_() {
  var s = settings_();
  return s.report_email || Session.getEffectiveUser().getEmail();
}

function emailReport_(date) {
  var to = reportEmailTo_();
  if (!to) return;
  var html = reportHtml_(date);
  var pdf = Utilities.newBlob(html, 'text/html', 'report.html').getAs('application/pdf')
    .setName('Report ' + date + '.pdf');
  MailApp.sendEmail({ to: to, subject: settings_().shop_name + ' — report ' + date, htmlBody: html, attachments: [pdf] });
}

function emailReportNow() {
  emailReport_(today_());
  SpreadsheetApp.getUi().alert('Report sent to ' + reportEmailTo_());
}

function resetOwnerPin() {
  var ui = SpreadsheetApp.getUi();
  var uname = ui.prompt('Reset PIN', 'Login name of the owner:', ui.ButtonSet.OK_CANCEL);
  if (uname.getSelectedButton() !== ui.Button.OK) return;
  var u = findUser_(uname.getResponseText());
  if (!u) { ui.alert('No such user'); return; }
  var pin = ui.prompt('New PIN', '4 to 8 digits:', ui.ButtonSet.OK_CANCEL);
  if (pin.getSelectedButton() !== ui.Button.OK) return;
  usersSave_({ username: 'sheet-menu' }, { id: u.id, pin: pin.getResponseText().trim(), active: true });
  ui.alert('PIN changed for ' + u.username);
}

/**
 * Moves one finished financial year's bills into their own spreadsheet so the main sheet stays fast.
 * The archive file id is saved in Settings so old bills can still be opened from the app.
 */
function archiveFy_(user, fy) {
  req_(/^\d{2}-\d{2}$/.test(String(fy || '')), 'Give the year like 25-26');
  req_(fy < fyOf_(today_()), 'Only a finished year can be archived');
  var sh = sheet_('Sales');
  var headers = SCHEMA.Sales;
  var all = rows_('Sales');
  var move = all.filter(function (r) { return r.fy === fy; });
  req_(move.length, 'No bills for ' + fy);
  var arch = SpreadsheetApp.create(ss_().getName() + ' — bills FY ' + fy);
  var ash = arch.getSheets()[0];
  ash.setName('Sales');
  ash.getRange('A:' + colLetter_(headers.length)).setNumberFormat('@');
  var data = [headers].concat(move.map(function (r) { return headers.map(function (h) { return r[h]; }); }));
  ash.getRange(1, 1, data.length, headers.length).setValues(data);
  var keep = all.filter(function (r) { return r.fy !== fy; }).map(function (r) {
    return headers.map(function (h) { return r[h]; });
  });
  sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), headers.length).clearContent();
  if (keep.length) sh.getRange(2, 1, keep.length, headers.length).setValues(keep);
  delete _rowsCache.Sales;
  setSetting_('archive_' + fy, arch.getId());
  audit_(user, 'archive', fy, { bills: move.length, file: arch.getId() });
  return { moved: move.length, fileUrl: arch.getUrl() };
}

/* ===== shared/calc.js ===== */
/*
 * Calc — shared calculation engine used by BOTH the phone app and the Apps Script backend.
 * Edit this file only; tools/build.js copies it into dist/Code.gs and web/js/calc.js.
 *
 * - evalFormula: safe evaluator for the admin-editable formulas (no eval()).
 * - loanStatement: day-wise girvi interest with month-by-month breakdown, top-ups and part payments.
 */
var Calc = (function () {
  var FUNCS = {
    min: Math.min, max: Math.max, round: Math.round, ceil: Math.ceil, floor: Math.floor, abs: Math.abs
  };
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, 'u-': 3 };

  function tokenize(expr) {
    var s = String(expr || '').replace(/×/g, '*').replace(/÷/g, '/');
    var out = [];
    var i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        var n = parseFloat(s.slice(i, j));
        if (isNaN(n)) throw new Error('Bad number in formula');
        out.push({ t: 'num', v: n });
        i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var k = i;
        while (k < s.length && /[A-Za-z0-9_]/.test(s[k])) k++;
        out.push({ t: 'id', v: s.slice(i, k) });
        i = k; continue;
      }
      if ('+-*/(),%'.indexOf(c) >= 0) { out.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('Formula has an unknown symbol: ' + c);
    }
    return out;
  }

  /** Shunting-yard to reverse polish notation. */
  function toRpn(tokens) {
    var out = [], stack = [], prev = null;
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (tk.t === 'num') out.push(tk);
      else if (tk.t === 'id') {
        var nxt = tokens[i + 1];
        if (nxt && nxt.t === 'op' && nxt.v === '(') stack.push({ t: 'fn', v: tk.v.toLowerCase(), argc: 1 });
        else out.push(tk);
      } else if (tk.v === '%') {
        out.push({ t: 'num', v: 100 }); out.push({ t: 'op', v: '/' });
        prev = { t: 'num' }; continue;
      } else if (tk.v === ',') {
        while (stack.length && stack[stack.length - 1].v !== '(') out.push(stack.pop());
        for (var f = stack.length - 1; f >= 0; f--) if (stack[f].t === 'fn') { stack[f].argc++; break; }
      } else if (tk.v === '(') stack.push(tk);
      else if (tk.v === ')') {
        while (stack.length && stack[stack.length - 1].v !== '(') out.push(stack.pop());
        if (!stack.length) throw new Error('Formula brackets do not match');
        stack.pop();
        if (stack.length && stack[stack.length - 1].t === 'fn') out.push(stack.pop());
      } else {
        var op = tk.v;
        var unary = op === '-' && (!prev || (prev.t === 'op' && prev.v !== ')'));
        if (op === '+' && (!prev || (prev.t === 'op' && prev.v !== ')'))) { prev = tk; continue; }
        if (unary) op = 'u-';
        while (stack.length) {
          var top = stack[stack.length - 1];
          if (top.t === 'op' && top.v !== '(' && PREC[top.v] >= PREC[op] && op !== 'u-') out.push(stack.pop());
          else break;
        }
        stack.push({ t: 'op', v: op });
      }
      prev = tk;
    }
    while (stack.length) {
      var x = stack.pop();
      if (x.v === '(') throw new Error('Formula brackets do not match');
      out.push(x);
    }
    return out;
  }

  function evalFormula(expr, vars) {
    var rpn = toRpn(tokenize(expr));
    var st = [];
    vars = vars || {};
    var lower = {};
    Object.keys(vars).forEach(function (k) { lower[k.toLowerCase()] = vars[k]; });
    for (var i = 0; i < rpn.length; i++) {
      var tk = rpn[i];
      if (tk.t === 'num') st.push(tk.v);
      else if (tk.t === 'id') {
        var key = tk.v.toLowerCase();
        if (!(key in lower)) throw new Error('Unknown name in formula: ' + tk.v);
        var v = parseFloat(String(lower[key]).replace(/,/g, ''));
        st.push(isNaN(v) ? 0 : v);
      } else if (tk.t === 'fn') {
        var fn = FUNCS[tk.v];
        if (!fn) throw new Error('Unknown function in formula: ' + tk.v);
        var args = st.splice(st.length - tk.argc, tk.argc);
        st.push(fn.apply(null, args));
      } else if (tk.v === 'u-') {
        st.push(-st.pop());
      } else {
        var b = st.pop(), a = st.pop();
        if (a === undefined || b === undefined) throw new Error('Formula is incomplete');
        if (tk.v === '+') st.push(a + b);
        else if (tk.v === '-') st.push(a - b);
        else if (tk.v === '*') st.push(a * b);
        else if (tk.v === '/') st.push(b === 0 ? 0 : a / b);
      }
    }
    if (st.length !== 1 || isNaN(st[0])) throw new Error('Formula is incomplete');
    return st[0];
  }

  /** Names used in a formula, e.g. ["Principal","Rate","Days"]. */
  function formulaNames(expr) {
    var seen = {};
    var toks = tokenize(expr);
    toks.forEach(function (t, i) {
      var nxt = toks[i + 1];
      if (t.t === 'id' && !(nxt && nxt.v === '(')) seen[t.v] = 1;
    });
    return Object.keys(seen);
  }

  /* ---------- dates (yyyy-MM-dd strings, no timezone surprises) ---------- */

  function parseD(s) {
    var p = String(s).slice(0, 10).split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function fmtD(t) {
    var d = new Date(t);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  }
  function daysBetween(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
  function monthEnd(t) {
    var d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function monthLabel(t) {
    var d = new Date(t);
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }

  function r2(n) { return Math.round(n * 100) / 100; }

  /**
   * Girvi statement up to asOf (yyyy-MM-dd).
   * loan: {date, principal, ratePct, formula?, minDays?}
   * txns: [{date, type: topup|interest|part|close, amount}]
   * Interest is worked out day by day on the principal outstanding, shown month by month.
   * A payment first clears interest due, the rest reduces the principal.
   */
  function loanStatement(loan, txns, asOf, opts) {
    opts = opts || {};
    var formula = loan.formula || opts.formula || 'Principal * Rate / 100 * Days / 30';
    var rate = parseFloat(loan.ratePct) || 0;
    var P = parseFloat(String(loan.principal).replace(/,/g, '')) || 0;
    var A = 0;
    var rows = [];
    var cursor = parseD(loan.date);
    var end = parseD(asOf);
    var totalInterest = 0, paidInterest = 0, paidPrincipal = 0;

    function accrue(to) {
      while (cursor < to) {
        var me = monthEnd(cursor);
        if (me <= cursor) me = monthEnd(cursor + 86400000);
        var chunkEnd = Math.min(to, me);
        var days = Math.round((chunkEnd - cursor) / 86400000);
        if (days > 0) {
          var it = r2(evalFormula(formula, { Principal: P, Rate: rate, Days: days }));
          A += it; totalInterest += it;
          var last = rows[rows.length - 1];
          var label = monthLabel(chunkEnd === me ? chunkEnd : cursor + 86400000);
          if (last && last.kind === 'interest' && last.label === label && last.principal === P) {
            last.days += days; last.interest = r2(last.interest + it); last.to = fmtD(chunkEnd);
          } else {
            rows.push({ kind: 'interest', label: label, from: fmtD(cursor), to: fmtD(chunkEnd),
              days: days, principal: P, interest: it });
          }
        }
        cursor = chunkEnd;
      }
    }

    var events = (txns || []).slice().sort(function (a, b) {
      return parseD(a.date) - parseD(b.date);
    });
    events.forEach(function (e) {
      var t = parseD(e.date);
      if (t > end) return;
      accrue(t);
      var amt = parseFloat(String(e.amount).replace(/,/g, '')) || 0;
      if (e.type === 'topup') {
        P += amt;
        rows.push({ kind: 'topup', date: e.date, amount: amt, principal: P });
      } else if (e.type === 'interest') {
        A -= amt; paidInterest += amt;
        rows.push({ kind: 'payment', date: e.date, amount: amt, interestPart: amt, principalPart: 0 });
      } else {
        var toInt = Math.min(amt, Math.max(A, 0));
        A -= toInt; paidInterest += toInt;
        var toP = amt - toInt;
        P -= toP; paidPrincipal += toP;
        rows.push({ kind: 'payment', date: e.date, amount: amt, interestPart: r2(toInt), principalPart: r2(toP) });
      }
    });
    accrue(end);

    var totalDays = daysBetween(loan.date, asOf);
    var minDays = parseFloat(loan.minDays !== undefined && loan.minDays !== '' ? loan.minDays : opts.minDays) || 0;
    if (minDays > 0 && totalDays < minDays && P > 0) {
      var extra = r2(evalFormula(formula, { Principal: P, Rate: rate, Days: minDays - totalDays }));
      A += extra; totalInterest += extra;
      rows.push({ kind: 'minimum', label: 'Minimum ' + minDays + ' days', days: minDays - totalDays,
        principal: P, interest: extra });
    }

    return {
      rows: rows,
      totalDays: totalDays,
      principal: r2(P),
      interestDue: r2(A),
      totalInterest: r2(totalInterest),
      paidInterest: r2(paidInterest),
      paidPrincipal: r2(paidPrincipal),
      totalDue: Math.round(P + A)
    };
  }

  /** Indian number format: 152000 -> "1,52,000". */
  function inr(n, decimals) {
    var v = parseFloat(n) || 0;
    var neg = v < 0; v = Math.abs(v);
    var d = decimals || 0;
    var s = v.toFixed(d);
    var parts = s.split('.');
    var x = parts[0];
    var last3 = x.slice(-3);
    var rest = x.slice(0, -3);
    if (rest) last3 = ',' + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (neg ? '-' : '') + rest + last3 + (d ? '.' + parts[1] : '');
  }

  /** Rupees in words for invoices, e.g. "Twenty Six Thousand Nine Hundred Eighteen". */
  function inWords(num) {
    var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
      'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function two(n) { return n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''); }
    function three(n) {
      var h = Math.floor(n / 100), r = n % 100;
      return (h ? a[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
    }
    var n = Math.round(Math.abs(parseFloat(num) || 0));
    if (n === 0) return 'Zero';
    var parts = [];
    var crore = Math.floor(n / 10000000); n %= 10000000;
    var lakh = Math.floor(n / 100000); n %= 100000;
    var th = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push(two(crore) + ' Crore');
    if (lakh) parts.push(two(lakh) + ' Lakh');
    if (th) parts.push(two(th) + ' Thousand');
    if (n) parts.push(three(n));
    return parts.join(' ');
  }

  return {
    evalFormula: evalFormula, formulaNames: formulaNames, loanStatement: loanStatement,
    daysBetween: daysBetween, inr: inr, inWords: inWords, r2: r2
  };
})();

if (typeof module !== 'undefined') module.exports = Calc;
