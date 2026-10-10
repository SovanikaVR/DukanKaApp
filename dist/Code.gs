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

var APP_VERSION = '1.7.0';

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
    'cash', 'upi', 'udhaar', 'costTotal', 'status', 'by', 'at', 'notes', 'printOpts'],
  OldGold: ['id', 'date', 'customerId', 'customerName', 'source', 'billId', 'item', 'metal', 'weight',
    'cutPct', 'customerFine', 'rate', 'amount', 'ourPurityPct', 'ourFine', 'status', 'meltId', 'by', 'at'],
  Loans: ['id', 'date', 'customerId', 'customerName', 'mobile', 'item', 'metal', 'purityPct',
    'grossWt', 'netWt', 'principal', 'ratePct', 'formula', 'minDays', 'status', 'closedAt',
    'notes', 'by', 'at', 'mode'],
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
  shop_city: '',
  gst_enabled: 'true',
  gst_default_pct: '3',
  hsn_code: '7113',
  bill_terms: '',
  shop_tagline: '',
  shop_phones: '',
  bis_licence: '',
  shop_logo: '',
  quote_title: 'QUOTATION',
  quote_shop_name: '',
  quote_tagline: '',
  quote_address: '',
  quote_phones: '',
  quote_logo: '',
  quote_footer: '',
  bill_lang: 'en',
  bill_template: 'classic',
  bill_color: 'gold',
  bill_design_gst: '',
  bill_design_quote: '',
  bill_pic_right: '',
  bill_rule_line: '',
  bill_rule_pct: '',
  bill_rate_unit: '10g',
  bill_fields_gst: JSON.stringify({ billNo: true, gross: true, net: true, purity: true, purityInName: false, hsn: true, huid: false,
    rate: true, making: true, makingAmt: false, metalValue: false, words: true, payment: true, oldGold: true, sign: true }),
  bill_fields_quote: JSON.stringify({ billNo: true, gross: true, net: true, purity: false, purityInName: false, hsn: false, huid: false,
    rate: true, making: true, makingAmt: false, metalValue: false, words: false, payment: true, oldGold: true, sign: true }),
  making_default_type: 'perg',
  making_default_pct: '',
  making_default_silver: '0',
  purity_silver: '100',
  oldgold_rcm: 'false',
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
  'admin.archive': 1, 'admin.backupNow': 1, 'loans.edit': 1, 'loans.void': 1,
  'loans.undoLast': 1, 'orders.edit': 1, 'repairs.edit': 1, 'cash.void': 1, 'admin.check': 1, 'stock.update': 1, 'dues.adjust': 1
};

/* ===== 01_util.js ===== */
/* ---------- Spreadsheet helpers ---------- */

var _ss = null;
var _rowsCache = {};
var _rawCount = {}; // rows in the sheet (before hiding cancelled ones), so a new row's number is known without reading
var _sheets = {};

function ss_() {
  if (!_ss) _ss = SpreadsheetApp.getActiveSpreadsheet();
  return _ss;
}

/** Returns the sheet, creating it (with headers, plain-text columns) if missing. */
function sheet_(name) {
  if (_sheets[name] && _headerChecked[name]) return _sheets[name];
  var sh = ss_().getSheetByName(name);
  if (!sh) {
    var headers = SCHEMA[name];
    if (!headers) throw new Error('Unknown sheet ' + name);
    sh = ss_().insertSheet(name);
    // Plain text everywhere so Sheets never turns "2026-10-08" or "007" into something else.
    sh.getRange('A:' + colLetter_(headers.length)).setNumberFormat('@');
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else if (!_headerChecked[name] && !headerKnownOk_(name)) {
    // Newer app versions add columns at the end: write the full header row once.
    var headers2 = SCHEMA[name];
    var cur = sh.getRange(1, 1, 1, headers2.length).getValues()[0];
    if (String(cur[headers2.length - 1]) !== headers2[headers2.length - 1]) {
      sh.getRange(1, 1, 1, headers2.length).setValues([headers2]).setFontWeight('bold');
      sh.getRange('A:' + colLetter_(headers2.length)).setNumberFormat('@');
    }
    try { CacheService.getScriptCache().put('hdr_' + APP_VERSION + '_' + name, '1', 21600); } catch (e) { /* ignore */ }
  }
  _headerChecked[name] = true;
  _sheets[name] = sh;
  return sh;
}
var _headerChecked = {};
var _hdrOk = null;
/** Header rows are checked once per app version (remembered in the cache), not on every request. */
function headerKnownOk_(name) {
  if (!_hdrOk) {
    try {
      var keys = Object.keys(SCHEMA).map(function (n) { return 'hdr_' + APP_VERSION + '_' + n; });
      _hdrOk = CacheService.getScriptCache().getAll(keys) || {};
    } catch (e) { _hdrOk = {}; }
  }
  return !!_hdrOk['hdr_' + APP_VERSION + '_' + name];
}

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
  _rawCount[name] = Math.max(last - 1, 0);
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, headers.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      var o = { _row: i + 2 };
      for (var j = 0; j < headers.length; j++) {
        var v = vals[i][j];
        if (v instanceof Date) v = Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
        v = v === null || v === undefined ? '' : String(v);
        if (v.charAt(0) === "'" && v.charAt(1) === '=') v = v.slice(1);
        o[headers[j]] = v;
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
  v = String(v);
  // Text typed by a user that starts with "=" must never become a Google Sheets formula.
  return v.charAt(0) === '=' ? "'" + v : v;
}

/** Appends one record. Missing fields become blank. Returns the record. */
function insert_(name, obj) {
  var headers = SCHEMA[name];
  var row = headers.map(function (h) { return toCell_(obj[h]); });
  var sh = sheet_(name);
  sh.appendRow(row);
  // Keep this request's copy of the sheet up to date instead of reading the whole sheet again.
  var list = _rowsCache[name];
  if (list && _rawCount[name] !== undefined) {
    _rawCount[name]++;
    var rec = { _row: _rawCount[name] + 1 };
    headers.forEach(function (h, j) { rec[h] = row[j].charAt(0) === "'" && row[j].charAt(1) === '=' ? row[j].slice(1) : row[j]; });
    if (!((name === 'Cash' || name === 'LoanTxns') && rec.status === 'void')) list.push(rec);
  } else delete _rowsCache[name];
  return obj;
}

/** Appends many records with one write (much faster than one by one). */
function insertMany_(name, objs) {
  if (!objs.length) return;
  if (objs.length === 1) { insert_(name, objs[0]); return; }
  var headers = SCHEMA[name];
  var sh = sheet_(name);
  var start = sh.getLastRow() + 1;
  sh.getRange(start, 1, objs.length, headers.length)
    .setValues(objs.map(function (o) { return headers.map(function (h) { return toCell_(o[h]); }); }));
  delete _rowsCache[name];
}

/** Updates fields of the record whose first column equals id. */
function update_(name, id, patch) {
  var headers = SCHEMA[name];
  var list = _rowsCache[name];
  var rec = null;
  if (list) { for (var i = 0; i < list.length; i++) if (list[i][headers[0]] === String(id)) { rec = list[i]; break; } }
  else {
    rec = findRowById_(name, id);
    if (rec === undefined) { list = rows_(name); rec = null; for (var k = 0; k < list.length; k++) if (list[k][headers[0]] === String(id)) { rec = list[k]; break; } }
  }
  if (!rec) throw new Error(name + ' record not found: ' + id);
  var sh = sheet_(name);
  var current = headers.map(function (h) { return rec[h]; });
  Object.keys(patch).forEach(function (k) {
    var idx = headers.indexOf(k);
    if (idx >= 0) current[idx] = toCell_(patch[k]);
  });
  sh.getRange(rec._row, 1, 1, headers.length).setValues([current]);
  // Update the cached record in place (no re-read of the sheet).
  headers.forEach(function (h, j) {
    var v = current[j];
    rec[h] = typeof v === 'string' && v.charAt(0) === "'" && v.charAt(1) === '=' ? v.slice(1) : v;
  });
  if (list && (name === 'Cash' || name === 'LoanTxns') && rec.status === 'void' && list.indexOf(rec) >= 0) list.splice(list.indexOf(rec), 1);
  var merged = {};
  headers.forEach(function (h, j) { merged[h] = current[j]; });
  return merged;
}

function find_(name, id) {
  var key = SCHEMA[name][0];
  if (!_rowsCache[name]) {
    // Index lookup: find the one row by its id instead of reading the whole sheet.
    var one = findRowById_(name, id);
    if (one !== undefined) return one;
  }
  var list = rows_(name);
  for (var i = 0; i < list.length; i++) if (list[i][key] === String(id)) return list[i];
  return null;
}

/** Reads one record by id with Google's TextFinder (fast on big sheets). undefined = could not use it. */
function findRowById_(name, id) {
  if (id === undefined || id === null || id === '') return null;
  try {
    var sh = sheet_(name);
    var cell = sh.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
    if (!cell) return null;
    var row = cell.getRow();
    if (row < 2) return null;
    var headers = SCHEMA[name];
    var vals = sh.getRange(row, 1, 1, headers.length).getValues()[0];
    var o = { _row: row, _single: true };
    headers.forEach(function (h, j) {
      var v = vals[j];
      if (v instanceof Date) v = Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
      v = v === null || v === undefined ? '' : String(v);
      if (v.charAt(0) === "'" && v.charAt(1) === '=') v = v.slice(1);
      o[h] = v;
    });
    if ((name === 'Cash' || name === 'LoanTxns') && o.status === 'void') return null;
    return o;
  } catch (e) { return undefined; }
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

/** Date used only to look things up (future allowed): a bad value means today. */
function readDate_(s) {
  try { return s && String(s) > today_() && /^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? (validDateAny_(String(s)) ? String(s) : today_()) : validDate_(s); }
  catch (e) { return today_(); }
}
function validDateAny_(s) {
  var p = s.split('-').map(Number);
  var dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  return dt.getUTCFullYear() === p[0] && dt.getUTCMonth() === p[1] - 1 && dt.getUTCDate() === p[2];
}

/** Entry date from the app: blank = today. A wrong or future date is refused. */
function validDate_(s) {
  if (s === undefined || s === null || s === '') return today_();
  s = String(s);
  req_(/^\d{4}-\d{2}-\d{2}$/.test(s), 'Date is not valid');
  var p = s.split('-').map(Number);
  var dt = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  req_(dt.getUTCFullYear() === p[0] && dt.getUTCMonth() === p[1] - 1 && dt.getUTCDate() === p[2], 'Date is not valid: ' + s);
  req_(s <= today_(), 'Date cannot be in the future');
  return s;
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

/** Saves many settings with one write. */
function setSettings_(map) {
  var keys = Object.keys(map);
  if (!keys.length) return;
  var list = rows_('Settings');
  var byKey = {};
  list.forEach(function (r) { byKey[r.key] = r; });
  var fresh = [];
  keys.forEach(function (k) {
    if (byKey[k]) byKey[k].value = String(map[k]);
    else fresh.push({ key: k, value: String(map[k]) });
  });
  if (list.length) {
    var sh = sheet_('Settings');
    // Rows are written back in sheet order; the sheet has no hidden rows, so _row runs 2..n+1.
    var maxRow = list.reduce(function (m, r) { return Math.max(m, r._row); }, 1);
    var grid = [];
    for (var i = 2; i <= maxRow; i++) grid.push(['', '']);
    list.forEach(function (r) { grid[r._row - 2] = [toCell_(r.key), toCell_(r.value)]; });
    var rng = sh.getRange(2, 1, grid.length, 2);
    // Keep any row we did not read (should not happen) untouched.
    var cur = rng.getValues();
    grid = grid.map(function (g, i) { return g[0] === '' ? cur[i] : g; });
    rng.setValues(grid);
  }
  fresh.forEach(function (f) { insert_('Settings', f); });
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
  // The user record is kept in the cache for 10 minutes, so a request does not have to open the sheet just to check the login.
  var cache = CacheService.getScriptCache();
  var u = json_(cache.get('u_' + s.u), null);
  if (!u) {
    u = find_('Users', s.u);
    if (u) try { cache.put('u_' + s.u, JSON.stringify(u), 600); } catch (e) { /* ignore */ }
  }
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
  try { CacheService.getScriptCache().remove('u_' + u.id); } catch (e) { /* ignore */ }
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
  finishInstall_(); // a shop made by the one-link installer finishes itself on first use (no-op afterwards)
  try {
    var body = json_(e && e.postData && e.postData.contents, {});
    out = { ok: true, data: handle_(body.action, body.token, body.data || {}) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Opening the web app link in a browser just shows that the backend is alive. */
function doGet(e) {
  finishInstall_();
  var ready = installReadyPage_(e);
  if (ready) return ready;
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
  'sale.get': function (u, d) { return hideCost_(u, saleGet_(d.id, d.fy)); },
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
  'stock.list': function (u, d) { return stockList_(d).map(function (i) { if (u.role !== 'owner') i.costTotal = null; return i; }); },
  'stock.summary': function () { return stockSummary_(); },
  'stock.update': function (u, d) { return stockUpdate_(u, d); },
  'melt.create': function (u, d) { return meltCreate_(u, d); },
  'melt.list': function (u) { var m = meltList_(); if (u.role !== 'owner') m.forEach(function (x) { delete x.gain; delete x.gainValue; delete x.cost; delete x.paidAmount; }); return m; },
  'fine.summary': function () { return fineSummary_(); },
  'parties.list': function (u, d) { return partiesList_(d); },
  'parties.save': function (u, d) { return partySave_(u, d); },
  'parties.ledger': function (u, d) { return partyLedger_(d.id); },
  'parties.entry': function (u, d) { return partyEntry_(u, d); },
  'cash.list': function (u, d) { return cashList_(d); },
  'cash.add': function (u, d) { return cashAdd_(u, d); },
  'cash.opening': function (u, d) { return cashOpening_(u, d); },
  'reports.daily': function (u, d) { return hideProfit_(u, reportDaily_(d.date)); },
  'reports.month': function (u, d) { return hideProfit_(u, reportMonth_(d.month)); },
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
  'admin.check': function () { return checkData_(); },
  'sale.print': function (u, d) { return salePrint_(u, d); },
  'sale.export': function (u, d) { return saleExport_(d); },
  'export.list': function (u, d) { return exportList_(u, d); },
  'admin.archive': function (u, d) { return archiveFy_(u, d.fy); },
  'admin.backupNow': function () { return backupNow_(); }
};

var READ_ONLY = {
  'ping': 1, 'bootstrap': 1, 'rates.list': 1, 'customers.search': 1, 'customers.get': 1, 'sale.list': 1,
  'sale.get': 1, 'oldgold.list': 1, 'loans.list': 1, 'loans.get': 1, 'orders.list': 1, 'orders.get': 1,
  'repairs.list': 1, 'stock.list': 1, 'stock.summary': 1, 'melt.list': 1, 'fine.summary': 1,
  'parties.list': 1, 'parties.ledger': 1, 'cash.list': 1, 'reports.daily': 1, 'reports.month': 1,
  'reports.position': 1, 'users.list': 1, 'dues.list': 1, 'home.summary': 1, 'admin.check': 1, 'sale.export': 1, 'export.list': 1
};

function handle_(action, token, data) {
  if (action === 'auth.login') return login_(data);
  if (action === 'ping') return ROUTES.ping();
  var fn = ROUTES[action];
  req_(fn, 'Unknown action: ' + action);
  var user = sessionUser_(token);
  if (OWNER_ONLY[action]) req_(user.role === 'owner', 'Only the owner can do this');
  if (user.role === 'viewer') req_(READ_ONLY[action] || action === 'auth.logout', 'View-only users cannot change data');
  if (READ_ONLY[action]) return cachedRead_(action, user, data, function () { return fn(user, data, token); });
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
    bumpDataVersion_();
    if (cache) {
      try {
        var str = JSON.stringify(result === undefined ? {} : result);
        // CacheService holds 100 KB (bytes; Hindi text is 3 bytes a letter). A big reply is remembered only as "saved".
        cache.put(rid, str.length * 3 < 95000 ? str : '{"_saved":true}', 21600);
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

function hideCost_(user, bill) {
  if (user && user.role === 'owner') return bill;
  (bill.lines || []).forEach(function (l) { delete l.cost; if (l.part) delete l.part.cost; });
  return bill;
}

/* ---------- Read cache: the "index" that makes repeated screens instant ----------
 * Reading big sheets is the slow part. Every answer to a read is kept in CacheService for 10 minutes,
 * filed under the current "data version". Any save changes the version, so after a save every screen
 * is read fresh; until then the same screen comes back in a few milliseconds without opening the sheet. */

function dataVersion_() {
  var c = CacheService.getScriptCache();
  var v = c.get('dataver');
  if (!v) { v = String(Date.now()); c.put('dataver', v, 21600); }
  return v;
}
function bumpDataVersion_() {
  try { CacheService.getScriptCache().put('dataver', String(Date.now()) + Math.random().toString(36).slice(2, 6), 21600); } catch (e) { /* ignore */ }
}

var NO_READ_CACHE = { 'ping': 1, 'auth.logout': 1, 'admin.check': 1 };

function cachedRead_(action, user, data, run) {
  if (NO_READ_CACHE[action]) return run();
  var cache = CacheService.getScriptCache();
  var key;
  try {
    var raw = [dataVersion_(), user.id, user.role, today_(), action, JSON.stringify(data || {})].join('|');
    key = 'rc_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw, Utilities.Charset.UTF_8));
    var hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  } catch (e) { key = null; }
  var result = run();
  if (key) {
    try {
      var str = JSON.stringify(result === undefined ? null : result);
      if (str.length * 3 < 95000) cache.put(key, str, 600);
    } catch (e2) { /* too big or cache full: fine */ }
  }
  return result;
}

/* ===== 10_core.js ===== */
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

/* ===== 11_sales.js ===== */
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
    var gross = l.grossWt !== undefined && l.grossWt !== '' ? round3_(pos_(l.grossWt, 'Gross weight')) : round3_(w);
    req_(gross + 0.0005 >= w, 'Gross weight cannot be less than net weight');
    // Making can be ₹ per gram, a % of the metal value, or one fixed ₹ amount for the piece.
    var mType = l.makingType === 'pct' ? 'pct' : l.makingType === 'fixed' ? 'fixed' : 'perg';
    var mPct = mType === 'pct' ? pos_(l.makingPct, 'Making %') : 0;
    var mFixed = mType === 'fixed' ? pos_(l.makingFixed, 'Making') : 0;
    req_(mPct <= 100, 'Making % should be 0 to 100');
    var metalValue = round2_(w * rate);
    var makingAmt, amount;
    if (l.amount !== undefined && l.amount !== '' && !w) { amount = num_(l.amount); makingAmt = 0; metalValue = 0; }
    else if (mType === 'perg') {
      amount = round2_(Calc.evalFormula(saleFormula, { Weight: w, Rate: rate, Making: mk }));
      makingAmt = round2_(amount - metalValue);
    } else {
      makingAmt = round2_(mType === 'pct' ? metalValue * mPct / 100 : mFixed);
      amount = round2_(metalValue + makingAmt);
      mk = 0;
    }
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
      huid: String(l.huid || ''), weight: round3_(w), grossWt: gross, rate: rate, makingPerG: mk,
      makingType: mType, makingPct: mPct, metalValue: metalValue, making: makingAmt, amount: amount, cost: cost, part: part
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
  // Bill number: next in the series, or typed by hand (for a missed / back-dated bill). Never used twice.
  var billNo = String(d.billNo || '').trim();
  if (billNo) {
    req_(billNo.length <= 30, 'Bill number is too long');
    var taken = rows_('Sales').some(function (x) { return x.billNo.toLowerCase() === billNo.toLowerCase(); });
    req_(!taken, 'Bill number ' + billNo + ' is already used');
  } else {
    billNo = type + '/' + fy + '/' + String(nextCounter_(type + '_' + fy)).padStart(4, '0');
  }
  var printOpts = cleanPrintOpts_(d.printOpts);
  var notes = String(d.notes || '').trim().slice(0, 500);
  var id = uid_('S');
  var bill = {
    id: id, billNo: billNo, type: type, fy: fy, date: date, customerId: c.id,
    customerName: customerName_(c), mobile: c.mobile, village: c.village,
    lines: cleanLines, oldGold: old, gstPct: gstPct, subtotal: subtotal, tax: tax, roundOff: roundOff,
    invoiceTotal: invoiceTotal, oldValue: oldValue, net: net, cash: cash, upi: upi, udhaar: udhaar,
    costTotal: round2_(costTotal), status: 'ok', by: user.username, at: nowIso_(), notes: notes, printOpts: printOpts
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
  out.printOpts = json_(b.printOpts, {});
  out.oldGold = json_(b.oldGold, []);
  ['gstPct', 'subtotal', 'tax', 'roundOff', 'invoiceTotal', 'oldValue', 'net', 'cash', 'upi', 'udhaar', 'costTotal']
    .forEach(function (k) { out[k] = num_(b[k]); });
  delete out.costTotal;
  out.shop = billShop_(s, b.type);
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

/** Header and footer printed on a bill. A quotation can carry a different shop name (e.g. a sister shop). */
function billShop_(s, type) {
  var gst = type === 'GST';
  var q = function (k) { return s[k === 'name' ? 'quote_shop_name' : 'quote_' + k] || s['shop_' + k] || ''; };
  return {
    name: gst ? s.shop_name : q('name'), tagline: gst ? s.shop_tagline : q('tagline'),
    address: gst ? s.shop_address : q('address'), mobile: s.shop_mobile, phones: gst ? s.shop_phones : q('phones'),
    logo: gst ? s.shop_logo : (s.quote_logo || (s.quote_shop_name ? '' : s.shop_logo)),
    gstin: s.shop_gstin, state: s.shop_state, hsn: s.hsn_code, bis: s.bis_licence,
    terms: gst ? s.bill_terms : (s.quote_footer || s.bill_terms), title: gst ? 'TAX INVOICE' : (s.quote_title || 'QUOTATION'),
    lang: s.bill_lang || 'en', rateUnit: s.bill_rate_unit || '10g',
    template: s.bill_template || 'classic', color: s.bill_color || 'gold', ruleLine: s.bill_rule_line || '',
    design: json_(gst ? s.bill_design_gst : (s.bill_design_quote || s.bill_design_gst), null), picRight: s.bill_pic_right || '',
    fields: json_(gst ? s.bill_fields_gst : s.bill_fields_quote, {})
  };
}

/** What to print on one bill: true/false per field, plus the cut % for the shop's rule line. */
function cleanPrintOpts_(o) {
  var out = {};
  if (!o || typeof o !== 'object') return out;
  Object.keys(o).forEach(function (k) {
    if (k === 'rulePct') {
      var v = String(o[k] === null || o[k] === undefined ? '' : o[k]).trim();
      if (v === '') return;
      var n = parseFloat(v);
      req_(!isNaN(n) && n >= 0 && n <= 100, 'Cut % on the bill should be 0 to 100');
      out.rulePct = String(n);
    } else if (/^[a-zA-Z]{1,20}$/.test(k)) out[k] = !!o[k];
  });
  return out;
}

/** Change what is printed on one bill (show / hide fields, note). Money is never changed here. */
function salePrint_(user, d) {
  var b = find_('Sales', d.id);
  req_(b, 'Bill not found');
  var patch = {};
  if (d.printOpts && typeof d.printOpts === 'object') patch.printOpts = cleanPrintOpts_(d.printOpts);
  if (d.notes !== undefined) patch.notes = String(d.notes || '').trim().slice(0, 500);
  update_('Sales', b.id, patch);
  audit_(user, 'sale.print', b.id, patch);
  return saleGet_(b.id);
}

/** All bills of a period with everything needed to print them (for one-click PDFs). */
function saleExport_(d) {
  var from = readDate_(d.from), to = d.to ? readDate_(d.to) : from;
  var s = settings_();
  var list = rows_('Sales').filter(function (b) {
    if (b.date < from || b.date > to) return false;
    if (d.type && d.type !== 'all' && b.type !== d.type) return false;
    if (!d.withCancelled && b.status === 'void') return false;
    return true;
  });
  list.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.billNo < b.billNo ? -1 : 1); });
  req_(list.length <= 400, list.length + ' bills in this period. Please pick a shorter period (up to 400 bills at a time).');
  var custs = {};
  rows_('Customers').forEach(function (c) { custs[c.id] = c; });
  var shops = { GST: billShop_(s, 'GST'), EST: billShop_(s, 'EST') };
  var rates = rows_('Rates').slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var rateFor = function (date) {
    var r = null;
    rates.forEach(function (x) { if (x.date <= date) r = x; });
    return r ? { g24: num_(r.g24), g22: num_(r.g22), g18: num_(r.g18), silver: num_(r.silver) } : null;
  };
  var bills = list.map(function (b) {
    var out = {};
    SCHEMA.Sales.forEach(function (k) { out[k] = b[k]; });
    out.lines = json_(b.lines, []).map(function (l) { delete l.cost; if (l.part) delete l.part.cost; return l; });
    out.oldGold = json_(b.oldGold, []);
    out.printOpts = json_(b.printOpts, {});
    ['gstPct', 'subtotal', 'tax', 'roundOff', 'invoiceTotal', 'oldValue', 'net', 'cash', 'upi', 'udhaar'].forEach(function (k) { out[k] = num_(b[k]); });
    delete out.costTotal;
    out.shop = shops[b.type] || shops.EST;
    var c = custs[b.customerId];
    out.customer = c ? { name: customerName_(c), mobile: c.mobile, village: c.village, address: c.address } : null;
    out.rate = rateFor(b.date);
    return out;
  });
  var totals = { count: bills.length, taxable: 0, tax: 0, total: 0 };
  bills.forEach(function (b) { totals.taxable += b.subtotal; totals.tax += b.tax; totals.total += b.invoiceTotal; });
  totals.taxable = round2_(totals.taxable); totals.tax = round2_(totals.tax); totals.total = round2_(totals.total);
  return { from: from, to: to, bills: bills, totals: totals };
}

/* ===== 12_loans.js ===== */
/* ---------- Girvi (gold loans) ---------- */

function loanOpts_() {
  return { formula: formula_('formula_interest'), minDays: num_(settings_().interest_min_days) };
}

function loanTxns_(loanId) {
  return rows_('LoanTxns').filter(function (t) { return t.loanId === loanId; }).map(function (t) {
    return { id: t.id, date: t.date, type: t.type, amount: num_(t.amount), interestPart: num_(t.interestPart),
      principalPart: num_(t.principalPart), mode: t.mode, by: t.by, at: t.at };
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
    notes: String(d.notes || ''), by: user.username, at: nowIso_(), mode: d.mode === 'upi' ? 'upi' : 'cash'
  };
  insert_('Loans', rec);
  cash_(user, 'out', rec.mode, principal, 'girvi-given', 'loan', rec.id, rec.customerName, date);
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
  var on = l.status === 'open' ? readDate_(asOf) : (l.closedAt || today_());
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
  var byLoan = {};
  rows_('LoanTxns').forEach(function (x) { (byLoan[x.loanId] = byLoan[x.loanId] || []).push(x); });
  var list = rows_('Loans').filter(function (l) {
    if (status !== 'all' && l.status !== status) return false;
    if (q && (l.customerName + ' ' + l.mobile + ' ' + l.item).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).map(function (l) {
    var txns = byLoan[l.id] || [];
    var st = Calc.loanStatement(l, txns, l.status === 'open' ? t : (l.closedAt || t), opts);
    var value = itemValue_(l.metal, num_(l.netWt), num_(l.purityPct), rate);
    return {
      id: l.id, date: l.date, customerId: l.customerId, customerName: l.customerName, mobile: l.mobile,
      item: l.item, metal: l.metal, netWt: num_(l.netWt), principal: l.status === 'open' ? st.principal : num_(l.principal) + txns.filter(function (x) { return x.type === 'topup'; }).reduce(function (a, x) { return a + num_(x.amount); }, 0), ratePct: num_(l.ratePct),
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
  var lastTx = txns.reduce(function (m, t) { return t.date > m ? t.date : m; }, '');
  req_(!lastTx || date >= lastTx, 'A later payment (' + lastTx + ') is already saved. Use that date or later.');
  var before = Calc.loanStatement(l, txns, date, loanOpts_());
  var amt = round2_(pos_(d.amount, 'Amount'));
  if (type === 'close' && !amt && !d.restToBaki) amt = before.totalDue;
  req_(amt > 0 || (type === 'close' && d.restToBaki), 'Enter the amount');
  var interestPart = 0, principalPart = 0;
  // Part payments clear only the interest earned so far; the minimum-days interest is charged only at release.
  var basis = type === 'part' ? Calc.loanStatement(l, txns, date, { formula: loanOpts_().formula, noMinimum: true }) : before;
  if (type === 'interest') {
    req_(amt <= Math.max(before.interestDue, 0) + 1, 'Interest due is only ₹' + Math.round(Math.max(before.interestDue, 0)) + '. Use "Part pay" to pay more.');
    interestPart = amt;
  } else if (type === 'part' || type === 'close') {
    interestPart = Math.min(amt, Math.max(basis.interestDue, 0));
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
  // A release is always written (even with ₹0 paid) so it can be undone.
  if (amt > 0 || type === 'close') insert_('LoanTxns', tx);
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

var _payIndex = null;
function orderPayments_(orderId) {
  // Built once per request (cleared when a payment is added): lists of many orders stay fast.
  if (!_payIndex || _payIndex.rows !== rows_('OrderPayments') || _payIndex.n !== rows_('OrderPayments').length) {
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
  var tags = {};
  rows_('Items').forEach(function (i) { if (i.tag) tags[i.tag.toLowerCase()] = 1; });
  // Check every row before saving any, so a mistake in one row never half-saves the others.
  items.forEach(function (it) {
    ['netWt', 'grossWt', 'pieces', 'makingPerG', 'costTotal', 'purityPct'].forEach(function (k) { pos_(it[k], k); });
    req_(num_(it.purityPct) <= 100, 'Purity % should be 100 or less');
    req_(round3_(it.netWt || it.grossWt) > 0, 'Enter the weight for ' + (it.name || 'the item'));
    var tg = String(it.tag || '').trim().toLowerCase();
    if (tg) { req_(!tags[tg], 'Tag ' + it.tag + ' is already used'); tags[tg] = 1; }
  });
  items.forEach(function (it) {
    var net = round3_(it.netWt || it.grossWt);
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
  var todayBills = {};
  rows_('Sales').forEach(function (b) { if (b.date === today && b.status !== 'void') todayBills[b.id] = 1; });
  var soldToday = rows_('Items').filter(function (i) { return i.soldBillId && todayBills[i.soldBillId]; }).length;
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
  if (patch.pieces !== undefined) req_(patch.pieces >= 1, 'Pieces should be at least 1');
  if (patch.purityPct !== undefined) req_(patch.purityPct <= 100, 'Purity % should be 100 or less');
  if (d.status) {
    req_(['in', 'removed'].indexOf(d.status) >= 0, 'Bad status');
    req_(i.status !== 'sold', 'This item is sold. To bring it back, cancel its bill.');
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
  var ids = (d.oldGoldIds || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
  req_(ids.length, 'Pick the old gold items to melt');
  var barWt = round3_(pos_(d.barWt, 'Bar weight')), purity = pos_(d.purityPct, 'Purity');
  req_(barWt > 0 && purity > 0, 'Enter bar weight and tested purity');
  req_(purity <= 100, 'Purity % should be 100 or less');
  pos_(d.cost, 'Charge');
  var totalWt = 0, ourFine = 0, paidFine = 0, paidAmount = 0;
  ids.forEach(function (gid) {
    var g = find_('OldGold', gid);
    req_(g && g.status === 'stock', 'An item is not in old gold stock');
    req_(g.metal !== 'silver', 'Silver cannot be melted into fine gold');
    totalWt += num_(g.weight); ourFine += num_(g.ourFine); paidFine += num_(g.customerFine); paidAmount += num_(g.amount);
  });
  req_(barWt <= round3_(totalWt) + 0.0005, 'Bar weight (' + barWt + ' g) cannot be more than the old gold melted (' + round3_(totalWt) + ' g)');
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

function fineInHand_() {
  return round3_(rows_('FineLedger').reduce(function (a, f) { return a + num_(f.grams); }, 0));
}
function needFine_(grams) {
  var have = fineInHand_();
  req_(grams <= have + 0.0005, 'Only ' + have + ' g fine gold in hand');
}

function issueFineToKarigar_(user, karigarId, grams, refType, refId, notes, date) {
  var p = find_('Parties', karigarId);
  req_(p && p.type === 'karigar', 'Karigar not found');
  needFine_(grams);
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
    var saved = update_('Parties', d.id, rec);
    audit_(user, 'party.edit', d.id, rec);
    return saved;
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
      needFine_(g);
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
      needFine_(g);
      e.goldG = g;
      fineEntry_(user, 'karigar_out', -g, 0, 'party', p.id, 'To ' + p.name, date);
    } else if (d.type === 'return_gold') {
      req_(g > 0, 'Enter grams returned');
      e.goldG = -g;
      fineEntry_(user, 'karigar_return', g, 0, 'party', p.id, 'From ' + p.name, date);
    } else if (d.type === 'job_done') {
      req_(g > 0 || c > 0, 'Enter the fine gold used or the labour');
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
  var led = partyLedger_(p.id);
  if (led.entries && led.entries.length > 60) led.entries = led.entries.slice(0, 60); // keep the reply small
  return led;
}

/* ---------- Cash book ---------- */

function cashBalanceBefore_(date, mode) {
  var s = settings_();
  var openDate = s.cash_opening_date || '0000-00-00';
  var bal = mode === 'cash' ? num_(s.cash_opening) : 0;
  // The opening amount is the drawer at the start of the opening date. Days before it are worked out backwards.
  var back = date < openDate;
  rows_('Cash').forEach(function (c) {
    if (c.mode !== mode) return;
    var sign = c.dir === 'in' ? 1 : -1;
    if (back) { if (c.date >= date && c.date < openDate) bal -= sign * num_(c.amount); }
    else if (c.date >= openDate && c.date < date) bal += sign * num_(c.amount);
  });
  return round2_(bal);
}

function cashList_(d) {
  var from = readDate_(d.from), to = d.to ? readDate_(d.to) : from;
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
  req_(d.amount !== '' && d.amount !== undefined && !isNaN(parseFloat(String(d.amount).replace(/,/g, ''))), 'Enter the cash in the drawer');
  pos_(d.amount, 'Opening cash');
  setSetting_('cash_opening', String(round2_(d.amount)));
  setSetting_('cash_opening_date', validDate_(d.date));
  audit_(user, 'cash.opening', '', d);
  return { ok: true };
}

/* ===== 15_reports.js ===== */
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
  // Optional (Settings): GST under reverse charge on old gold bought from customers, for the shop's accountant.
  var rcmOn = settings_().oldgold_rcm === 'true';
  var rcmBase = rcmOn ? oldBought.filter(function (g) { return g.source !== 'sale'; }).reduce(function (a, g) { return a + num_(g.amount); }, 0) : 0;
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
    rcm: rcmOn ? { base: Math.round(rcmBase), gst: round2_(rcmBase * 0.03) } : null,
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
  req_(amt <= round2_(due) + 0.5, 'Customer owes only ₹' + Math.round(due));
  var date = validDate_(d.date);
  var cr = cash_(user, 'in', d.mode === 'upi' ? 'upi' : 'cash', amt, 'udhaar', 'udhaar', c.id, customerName_(c), date);
  duesAdd_(user, c, -amt, 'payment', '', 'Received (' + cr.id + ')' + (d.notes ? ' ' + d.notes : ''), date);
  audit_(user, 'dues.pay', c.id, { amount: amt });
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
    sh.getRange(sh.getLastRow() + 1, 1, out.length, headers.length)
      .setValues(out.map(function (o) { return headers.map(function (h) { return toCell_(o[h]); }); }));
    delete _rowsCache.Dues;
  }
  setSetting_('dues_v', '1');
}

/* ===== 17_exports.js ===== */
/* ---------- Excel / CSV export of any list ---------- */

/**
 * export.list {module, from, to} -> {title, columns, rows}
 * The app turns this into a CSV file that opens in Excel / Google Sheets.
 * Purchase cost and profit columns go only to the owner.
 */
function exportList_(user, d) {
  var owner = user && user.role === 'owner';
  var from = d.from ? readDate_(d.from) : '0000-00-00';
  var to = d.to ? readDate_(d.to) : '9999-99-99';
  var inRange = function (date) { return date >= from && date <= to; };
  var m = String(d.module || '');
  var out;
  if (m === 'bills') {
    out = {
      title: 'Bills', columns: ['Date', 'Bill no', 'Type', 'Customer', 'Mobile', 'Village', 'Items', 'Net wt (g)', 'Taxable / items', 'GST %',
        'CGST', 'SGST', 'Round off', 'Invoice total', 'Old gold', 'Net', 'Cash', 'UPI', 'Baki', 'Status', 'Note'],
      rows: rows_('Sales').filter(function (b) { return inRange(b.date) && (!d.type || d.type === 'all' || b.type === d.type); }).map(function (b) {
        var lines = json_(b.lines, []);
        var tax = num_(b.tax), cg = Math.round(tax / 2 * 100) / 100;
        return [b.date, b.billNo, b.type === 'GST' ? 'GST' : 'Quotation', b.customerName, b.mobile, b.village,
          lines.map(function (l) { return l.name; }).join(', '), round3_(lines.reduce(function (a, l) { return a + num_(l.weight); }, 0)),
          num_(b.subtotal), num_(b.gstPct), cg, round2_(tax - cg), num_(b.roundOff), num_(b.invoiceTotal), num_(b.oldValue), num_(b.net),
          num_(b.cash), num_(b.upi), num_(b.udhaar), b.status === 'void' ? 'Cancelled' : 'OK', b.notes || ''];
      })
    };
  } else if (m === 'girvi') {
    var list = loansList_({ status: d.status || 'all' }).filter(function (l) { return inRange(l.date); });
    out = {
      title: 'Girvi', columns: ['Date', 'Customer', 'Mobile', 'Item', 'Metal', 'Net wt (g)', 'Loan ₹', 'Rate ₹/100/month', 'Days',
        'Interest due', 'Total due', 'Value today', 'Loan %', 'Status', 'Closed on'],
      rows: list.map(function (l) {
        return [l.date, l.customerName, l.mobile, l.item, l.metal, l.netWt, l.principal, l.ratePct, l.days, l.interestDue, l.totalDue,
          l.valueToday, l.ltvPct, l.status, l.closedAt || ''];
      })
    };
  } else if (m === 'oldgold') {
    out = {
      title: 'Old gold', columns: ['Date', 'Customer', 'Item', 'Metal', 'Weight (g)', 'Cut %', 'Customer fine (g)', 'Rate', 'Amount',
        'From', 'Status'].concat(owner ? ['Our purity %', 'Our fine (g)'] : []),
      rows: rows_('OldGold').filter(function (g) { return inRange(g.date) && g.status !== 'void'; }).map(function (g) {
        return [g.date, g.customerName, g.item, g.metal, num_(g.weight), num_(g.cutPct), num_(g.customerFine), num_(g.rate), num_(g.amount),
          g.source === 'sale' ? 'In a bill' : 'Bought', g.status].concat(owner ? [num_(g.ourPurityPct), num_(g.ourFine)] : []);
      })
    };
  } else if (m === 'orders') {
    out = {
      title: 'Orders', columns: ['Booked', 'Customer', 'Mobile', 'Item', 'Approx wt (g)', 'Final wt (g)', 'Rate', 'Making ₹/g', 'Price',
        'Paid', 'Balance', 'Delivery date', 'Status', 'Delivered on'],
      rows: rows_('Orders').filter(function (o) { return inRange(o.date); }).map(orderSummary_).map(function (o) {
        return [o.date, o.customerName, o.mobile, o.item, o.estWt, o.finalWt || '', o.rate || 'Not fixed', o.makingPerG,
          o.finalTotal || o.estTotal || '', o.paid, o.balance === null ? '' : o.balance, o.deliveryDate, o.status, o.deliveredAt || ''];
      })
    };
  } else if (m === 'repairs') {
    out = {
      title: 'Repairs', columns: ['Date', 'Customer', 'Mobile', 'Item', 'Work', 'Weight in', 'Weight out', 'Customer charge',
        'Karigar cost', 'Status', 'Given back on'],
      rows: rows_('Repairs').filter(function (r) { return inRange(r.date); }).map(repairOut_).map(function (r) {
        return [r.date, r.customerName, r.mobile, r.item, r.work, r.wtIn, r.wtOut || '', r.custCharge || r.estCustCharge,
          r.karigarCost || r.estKarigarCost, r.status, r.deliveredAt || ''];
      })
    };
  } else if (m === 'stock') {
    out = {
      title: 'Stock', columns: ['Tag', 'Item', 'Category', 'Metal', 'Purity %', 'Gross wt', 'Net wt', 'Pieces', 'Making ₹/g', 'Status', 'Added']
        .concat(owner ? ['Our cost ₹'] : []),
      rows: rows_('Items').filter(function (i) { return (d.status || 'in') === 'all' || i.status === (d.status || 'in'); }).map(function (i) {
        return [i.tag, i.name, i.category, i.metal, num_(i.purityPct), num_(i.grossWt), num_(i.netWt), num_(i.pieces), num_(i.makingPerG),
          i.status, String(i.addedAt).slice(0, 10)].concat(owner ? [num_(i.costTotal)] : []);
      })
    };
  } else if (m === 'dues') {
    var dl = duesList_({});
    out = {
      title: 'Baki', columns: ['Customer', 'Mobile', 'Village', 'Baki ₹', 'Since', 'Last entry'],
      rows: dl.list.map(function (r) { return [r.customerName, r.mobile, r.village || '', r.due, r.since, r.last]; })
    };
  } else if (m === 'cash') {
    out = {
      title: 'Cash book', columns: ['Date', 'In / out', 'Mode', 'Amount', 'What', 'Note', 'By'],
      rows: rows_('Cash').filter(function (c) { return inRange(c.date); }).map(function (c) {
        return [c.date, c.dir === 'in' ? 'In' : 'Out', c.mode === 'upi' ? 'UPI' : 'Cash', num_(c.amount), c.category, c.notes, c.by];
      })
    };
  } else if (m === 'parties') {
    out = {
      title: 'Wholesalers & karigars', columns: ['Type', 'Name', 'Mobile', 'Gold (fine g) +we owe / −they hold', 'Cash ₹ +we owe', 'Notes'],
      rows: partiesList_({}).map(function (p) { return [p.type === 'karigar' ? 'Karigar' : 'Wholesaler', p.name, p.mobile, p.goldG, p.cash, p.notes || '']; })
    };
  } else if (m === 'customers') {
    var due = {};
    rows_('Dues').forEach(function (x) { due[x.customerId] = (due[x.customerId] || 0) + num_(x.amount); });
    out = {
      title: 'Customers', columns: ['First name', 'Surname', 'Mobile', 'Village', 'Address', 'Baki ₹'],
      rows: rows_('Customers').map(function (c) { return [c.firstName, c.lastName, c.mobile, c.village, c.address, round2_(due[c.id] || 0)]; })
    };
  } else {
    throw new Error('Nothing to export for ' + m);
  }
  out.from = d.from || '';
  out.to = d.to || '';
  return out;
}

/* ===== 19_permissions.js ===== */
/* Permissions helper (sheet menu → Allow permissions). */
/** Run this once from the Apps Script editor (or the sheet menu) after an update that needs new Google permissions. */
function allowPermissions() {
  UrlFetchApp.fetch('https://api.gold-api.com/price/XAU', { muteHttpExceptions: true });
  ScriptApp.getProjectTriggers();
  try { SpreadsheetApp.getUi().alert('Done. Permissions are allowed. / अनुमति मिल गई।'); } catch (e) { Logger.log('Permissions are allowed.'); }
}

/* ===== 20_setup.js ===== */
/* ---------- One-time setup, menu, nightly jobs, archive ---------- */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Dukan App')
    .addItem('\u25B6 Start here / सुरू करा', 'startHere')
    .addItem('Show my app link / ऐप लिंक', 'showAppLink')
    .addSeparator()
    .addItem('Back up now', 'backupNowMenu')
    .addItem('Email today\'s report now', 'emailReportNow')
    .addItem('Reset an owner PIN', 'resetOwnerPin')
    .addItem('Check my data / डेटा जाँचें', 'checkDataMenu')
    .addItem('Restore from a backup', 'restoreFromBackupMenu')
    .addItem('Allow permissions / अनुमति दें', 'allowPermissions')
    .addSeparator()
    .addItem('Update now / अपडेट करें', 'updateNowMenu')
    .addItem('Auto-update on / off', 'toggleAutoUpdate')
    .addSubMenu(ui.createMenu('Advanced (manual setup)')
      .addItem('1. Set up this sheet', 'setup')
      .addItem('2. Turn on nightly backup + email report', 'installNightly'))
    .addToUi();
  // A fresh copy of the template has no owner yet: point to the first menu item.
  // (Simple trigger: only reads this sheet, never creates tabs.)
  try {
    var users = ss_().getSheetByName('Users');
    if (!users || users.getLastRow() < 2) {
      ss_().toast('Menu "Dukan App" \u2192 "\u25B6 Start here" दबाएं / click it to set up your shop.', 'DukanKaApp', 20);
    }
  } catch (e) { /* the menu is what matters */ }
}

/**
 * Creates every tab and the default settings. Safe to run again: it only adds what is missing.
 * Used by setup() (menu, interactive) and by the "Start here" installer (21_install.js).
 */
function setupTabs_() {
  Object.keys(SCHEMA).forEach(function (name) { sheet_(name); });
  var existing = {};
  rows_('Settings').forEach(function (r) { existing[r.key] = 1; });
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    if (!existing[k]) insert_('Settings', { key: k, value: DEFAULT_SETTINGS[k] });
  });
  if (!existing.cash_opening_date) setSetting_('cash_opening_date', today_());
  var blank = ss_().getSheetByName('Sheet1');
  if (blank && ss_().getSheets().length > 1 && blank.getLastRow() === 0) ss_().deleteSheet(blank);
  try { protectTabs_(); } catch (e) { /* ignore */ }
  PropertiesService.getScriptProperties().setProperty('tabs_version', APP_VERSION);
}

/** Creates every tab, default settings and the first owner login. Safe to run again. */
function setup() {
  var ui = SpreadsheetApp.getUi();
  setupTabs_();

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
    'All tabs are ready.\n\nNext: Deploy \u2192 New deployment \u2192 Web app\n' +
    '  \u2022 Execute as: Me\n  \u2022 Who has access: Anyone\n' +
    'Copy the web app URL and paste it into the app on first open.\n\n' +
    'Then run "Dukan App \u2192 Advanced \u2192 2. Turn on nightly backup" from the menu.\n\n' +
    'Easier: use "Dukan App \u2192 \u25B6 Start here" instead, it does all of this by itself.', ui.ButtonSet.OK);
}

/** (Re)creates the one nightly trigger. No UI, so the installer can call it too. */
function installNightlyTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'nightly') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('nightly').timeBased().atHour(21).nearMinute(30).everyDays(1).inTimezone(tz_()).create();
}

function installNightly() {
  installNightlyTrigger_();
  SpreadsheetApp.getUi().alert('Done. Every night around 9:30 pm the sheet is backed up and today\'s report is emailed.');
}

/** Runs every night from the time trigger. Each job is separate: one failing never stops the others. */
function nightly() {
  try { backupNow_(); } catch (e) { console.error(e); }
  try { emailReport_(today_()); } catch (e2) { console.error(e2); }
  try { cleanSessions_(PropertiesService.getScriptProperties()); } catch (e3) { console.error(e3); }
  // After an update the new code may have new tabs or settings: add them once.
  try {
    if (PropertiesService.getScriptProperties().getProperty('tabs_version') !== APP_VERSION) setupTabs_();
  } catch (e4) { console.error(e4); }
  // Last, so a slow download never delays the backup. updateFromGithub_ never throws in auto mode.
  try { updateFromGithub_({ auto: true }); } catch (e5) { console.error(e5); }
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
  var oldId = settings_()['archive_' + fy];
  var arch, ash;
  if (oldId) {
    // Archived before (a late bill was added for that year): add to the same file.
    arch = SpreadsheetApp.openById(oldId);
    ash = arch.getSheetByName('Sales');
  } else {
    arch = SpreadsheetApp.create(ss_().getName() + ' — bills FY ' + fy);
    ash = arch.getSheets()[0];
    ash.setName('Sales');
    ash.getRange('A:' + colLetter_(headers.length)).setNumberFormat('@');
    ash.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var rowsOut = move.map(function (r) { return headers.map(function (h) { return toCell_(r[h]); }); });
  ash.getRange(Math.max(ash.getLastRow(), 1) + 1, 1, rowsOut.length, headers.length).setValues(rowsOut);
  var keep = all.filter(function (r) { return r.fy !== fy; }).map(function (r) {
    return headers.map(function (h) { return toCell_(r[h]); });
  });
  // Write the kept bills first, then clear what is left below: nothing is lost if the script stops half way.
  var last = sh.getLastRow();
  if (keep.length) sh.getRange(2, 1, keep.length, headers.length).setValues(keep);
  if (last > keep.length + 1) sh.getRange(keep.length + 2, 1, last - keep.length - 1, headers.length).clearContent();
  delete _rowsCache.Sales;
  if (!oldId) setSetting_('archive_' + fy, arch.getId());
  audit_(user, 'archive', fy, { bills: move.length, file: arch.getId() });
  return { moved: move.length, fileUrl: arch.getUrl() };
}

/* ===== 21_install.js ===== */
/* ---------- "Start here" installer, app link, auto-update ---------- */
/*
 * A new shop gets running without any technical steps:
 *   1. The owner opens the template's ".../copy" link and taps "Make a copy" (sheet + this script).
 *   2. Dukan App → ▶ Start here opens a sidebar. Google asks for permission once.
 *   3. The sidebar form creates the tabs, the owner login and the nightly trigger, and
 *      publishes the web app through the Apps Script API (no Deploy menu needed).
 *   4. The sidebar shows the shop's app link, a QR code, WhatsApp and email buttons.
 *
 * Everything here runs only from the menu, the sidebar or the nightly trigger — never during
 * a normal app request — so the services used here (HtmlService, UrlFetchApp, ScriptApp, MailApp)
 * are not needed by the web app itself.
 */

/*
 * TRUST NOTE: auto-update downloads the backend from this GitHub repo and installs it in every
 * shop that has auto-update on. Whoever can push to the repo's main branch can change the code that
 * runs in every shop's Google account. Protect the branch (2-step login, no other writers).
 * A shop can turn it off: Dukan App → Auto-update on / off.
 */
var UPDATE_BASE_URL = 'https://raw.githubusercontent.com/SovanikaVR/DukanKaApp/main/dist/';
var APP_PAGE_URL = 'https://sovanikavr.github.io/DukanKaApp/';
var SCRIPT_API_URL = 'https://script.googleapis.com/v1/projects/';
var API_SETTINGS_URL = 'https://script.google.com/home/usersettings';

/* Script property keys used by the installer. */
var P_DEPLOYMENT = 'installer_deployment_id';  // deployment made by the installer (its URL never changes)
var P_WEBAPP_URL = 'installer_webapp_url';     // that deployment's /exec URL
var P_SHEET_ID = 'installer_sheet_id';         // spreadsheet these keys belong to (a copy has another id)
var P_DEPLOYED_VERSION = 'installer_deployed_app_version'; // APP_VERSION of the code the web app runs
var P_AUTO_UPDATE = 'auto_update';             // 'false' = off; anything else = on
var P_UPDATE_NOTE = 'update_last_note';        // last auto-update message (to avoid filling the Audit tab)

/* ===================== Menu entry points ===================== */

/** Menu: ▶ Start here. Opens the setup sidebar (or the app link, if the shop is ready). */
function startHere() {
  forgetIfCopied_();
  showSidebar_(installerState_());
}

/** Menu: Show my app link. */
function showAppLink() {
  forgetIfCopied_();
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(P_WEBAPP_URL)) {
    // Shop set up by hand (Deploy menu)? Pick up that deployment if there is exactly one.
    try { adoptDeployment_(); } catch (e) { /* API off or no deployment: the sidebar explains */ }
  }
  showSidebar_(installerState_());
}

/** Menu: Update now. */
function updateNowMenu() {
  forgetIfCopied_();
  var ui = SpreadsheetApp.getUi();
  var r = updateFromGithub_({ auto: false });
  var msg = {
    up_to_date: 'आपका ऐप नया ही है। / Your app is already up to date (version ' + APP_VERSION + ').',
    updated: 'अपडेट हो गया: ' + r.from + ' → ' + r.to + '\nUpdated. The app link stays the same.',
    redeployed: 'अपडेट पूरा हुआ (version ' + r.to + ').\nUpdate finished. The app link stays the same.',
    needs_permission: 'नया कोड डाल दिया है। अब "Dukan App → Update now" एक बार फिर दबाएं और Google को Allow करें।\n' +
      'New code is saved. Click "Dukan App → Update now" once more and press Allow to finish.',
    error: 'अपडेट नहीं हुआ / Update failed:\n' + (r.message || '')
  }[r.status] || (r.message || r.status);
  ui.alert('DukanKaApp', msg, ui.ButtonSet.OK);
}

/** Menu: Auto-update on / off. */
function toggleAutoUpdate() {
  var props = PropertiesService.getScriptProperties();
  var on = !autoUpdateOn_();
  props.setProperty(P_AUTO_UPDATE, on ? 'true' : 'false');
  audit_(null, 'auto.update', on ? 'on' : 'off', {});
  SpreadsheetApp.getUi().alert(on
    ? 'Auto-update चालू है। हर रात नया वर्ज़न अपने-आप आ जाएगा।\nAuto-update is ON.'
    : 'Auto-update बंद है। अपडेट के लिए "Update now" दबाएं।\nAuto-update is OFF. Use "Update now" to update.');
}

/**
 * Developer only (run once from the Apps Script editor in the TEMPLATE sheet, not in a shop):
 * checks that the template holds no shop data, removes triggers and stored keys, and writes a
 * big Hindi "START" tab that a new owner sees right after making a copy.
 */
function prepareTemplate() {
  var users = ss_().getSheetByName('Users');
  req_(!users || users.getLastRow() < 2, 'This sheet has users: it is a shop, not a clean template. Use a new sheet.');
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  PropertiesService.getScriptProperties().deleteAllProperties();
  var start = ss_().getSheetByName('START') || ss_().insertSheet('START', 0);
  start.clear();
  var lines = [
    ['DukanKaApp — अपनी दुकान का ऐप बनाएं'],
    [''],
    ['1. ऊपर मेनू में "Dukan App" पर क्लिक करें (नहीं दिखे तो पेज रीलोड करें, 10 सेकंड रुकें)।'],
    ['2. "▶ Start here / सुरू करा" दबाएं।'],
    ['3. Google अनुमति माँगेगा: Continue → अपना Gmail चुनें।'],
    ['4. "Google hasn\'t verified this app" लिखा आएगा — यह सामान्य है, यह आपकी अपनी शीट है।'],
    ['    नीचे "Advanced" दबाएं → "Go to ... (unsafe)" → "Allow"।'],
    ['5. फिर से "Dukan App → ▶ Start here" दबाएं। दाईं ओर फ़ॉर्म खुलेगा।'],
    ['6. दुकान का नाम, अपना नाम, मोबाइल, लॉगिन नाम और PIN भरें → "दुकान बनाएं" दबाएं।'],
    ['7. ऐप का लिंक और QR कोड आएगा। दुकान के फ़ोन से QR स्कैन करें।'],
    [''],
    ['English: Menu "Dukan App" → "▶ Start here". Allow Google (Advanced → Go to … (unsafe) → Allow),'],
    ['click Start here again, fill the form, press "Create my shop". Scan the QR code with the shop phone.']
  ];
  start.getRange(1, 1, lines.length, 1).setValues(lines);
  start.getRange(1, 1).setFontSize(20).setFontWeight('bold');
  start.getRange(2, 1, lines.length - 1, 1).setFontSize(14);
  start.setColumnWidth(1, 900);
  ss_().setActiveSheet(start);
  ss_().getSheets().forEach(function (sh) {
    if (sh.getName() !== 'START' && sh.getLastRow() === 0) ss_().deleteSheet(sh);
  });
}

/* ===================== Sidebar (google.script.run targets) ===================== */
/* These names have no trailing "_" because google.script.run cannot call private functions. */

/** Sidebar: create the shop (tabs, settings, owner, nightly trigger) and publish the web app. */
function installerCreateShop(form) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return { ok: false, step: 'form', error: 'दूसरा काम चल रहा है, 1 मिनट बाद फिर दबाएं। / Busy, try again in a minute.' };
  try {
    forgetIfCopied_();
    form = form || {};
    setupTabs_();
    var hasOwner = activeOwners_().length > 0;
    if (!hasOwner) {
      var bad = checkInstallForm_(form);
      if (bad) return { ok: false, step: 'form', error: bad, state: installerState_() };
      createUser_(String(form.ownerName).trim(), String(form.loginName).trim(), 'owner', String(form.pin).trim());
      audit_(null, 'user.add', form.loginName, { by: 'installer', role: 'owner' });
    }
    if (form.shopName) {
      setSetting_('shop_name', String(form.shopName).trim());
      try { ss_().rename(String(form.shopName).trim() + ' — DukanKaApp'); } catch (e) { /* name is cosmetic */ }
    }
    if (form.mobile) setSetting_('shop_mobile', installMobile_(form.mobile));
    // The START tab from the template is not needed any more.
    var start = ss_().getSheetByName('START');
    if (start && ss_().getSheets().length > 1) ss_().deleteSheet(start);
    try { installNightlyTrigger_(); } catch (e2) { console.error(e2); }
    audit_(null, 'install', APP_VERSION, { shop: form.shopName || '' });
  } catch (e3) {
    return { ok: false, step: 'form', error: friendlyError_(e3), state: installerState_() };
  } finally {
    lock.releaseLock();
  }
  return installerPublish();
}

/** Sidebar: publish (or re-publish) the web app. Also the "Try again" button. */
function installerPublish() {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return { ok: false, step: 'manual', error: 'Busy, try again in a minute.', state: installerState_() };
  try {
    forgetIfCopied_();
    publishWebApp_({ allowCreate: true, version: APP_VERSION, description: 'DukanKaApp ' + APP_VERSION + ' (Start here)' });
    return { ok: true, state: installerState_() };
  } catch (e) {
    console.error(e);
    return { ok: false, step: e.apiOff ? 'api_off' : 'manual', error: friendlyError_(e), state: installerState_() };
  } finally {
    lock.releaseLock();
  }
}

/** Sidebar (manual path): save the /exec URL the owner copied from Deploy → New deployment. */
function installerSaveManualUrl(url) {
  url = String(url || '').trim();
  if (!/^https:\/\/script\.google\.com\/(a\/macros\/[^\/]+|macros)\/s\/[\w-]+\/exec$/.test(url)) {
    return { ok: false, step: 'manual', error: 'यह लिंक सही नहीं है। वह लिंक चिपकाएं जिसके आख़िर में /exec हो। / Paste the Web app URL ending in /exec.', state: installerState_() };
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty(P_WEBAPP_URL, url);
  props.setProperty(P_SHEET_ID, ss_().getId());
  var m = url.match(/\/s\/([\w-]+)\/exec$/);
  if (m) props.setProperty(P_DEPLOYMENT, m[1]); // a web app URL carries its deployment id
  props.setProperty(P_DEPLOYED_VERSION, APP_VERSION);
  audit_(null, 'install.url', '', { manual: true });
  return { ok: true, state: installerState_() };
}

/** Sidebar: email the app link to the Google account that owns this sheet. */
function installerEmailLink() {
  var st = installerState_();
  if (!st.appLink) return { ok: false, error: 'App is not published yet.' };
  var to = Session.getEffectiveUser().getEmail();
  if (!to) return { ok: false, error: 'No email address found for this Google account.' };
  var html = '<p style="font-size:16px">नमस्ते,</p>' +
    '<p style="font-size:16px">' + esc_(st.shopName) + ' का ऐप लिंक / Your shop app link:</p>' +
    '<p style="font-size:18px"><a href="' + esc_(st.appLink) + '">' + esc_(st.appLink) + '</a></p>' +
    '<p><img src="' + esc_(qrUrl_(st.appLink)) + '" width="220" height="220" alt="QR"></p>' +
    '<p style="font-size:16px">दुकान के फ़ोन पर यह लिंक Chrome में खोलें → ⋮ → "Add to Home screen"।<br>' +
    'लॉगिन नाम / Login name: <b>' + esc_(st.owners.join(', ')) + '</b> (PIN जो आपने चुना / the PIN you chose)</p>' +
    '<p style="color:#666">इस लिंक को सिर्फ़ अपनी दुकान के लोगों को भेजें। / Share this link only with your shop staff.</p>';
  MailApp.sendEmail({ to: to, subject: (st.shopName || 'DukanKaApp') + ' — app link', htmlBody: html });
  return { ok: true, to: to };
}

/** Sidebar: fresh state (used after "Try again"). */
function installerGetState() {
  return installerState_();
}

/* ===================== Installer helpers ===================== */

function activeOwners_() {
  return rows_('Users').filter(function (u) { return u.role === 'owner' && u.active === 'true'; })
    .map(function (u) { return u.username; });
}

/** What the sidebar needs to know. */
function installerState_() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty(P_WEBAPP_URL) || '';
  var owners = [];
  var shopName = '';
  try {
    if (ss_().getSheetByName('Users')) owners = activeOwners_();
    if (ss_().getSheetByName('Settings')) shopName = settings_().shop_name;
  } catch (e) { /* fresh copy: nothing yet */ }
  if (shopName === DEFAULT_SETTINGS.shop_name) shopName = '';
  var link = url ? appLinkFor_(url) : '';
  return {
    hasOwner: owners.length > 0,
    owners: owners,
    shopName: shopName,
    webAppUrl: url,
    appLink: link,
    qr: link ? qrUrl_(link) : '',
    whatsapp: link ? 'https://wa.me/?text=' + encodeURIComponent(
      (shopName || 'DukanKaApp') + ' — दुकान का ऐप / shop app:\n' + link) : '',
    apiSettingsUrl: API_SETTINGS_URL,
    autoUpdate: autoUpdateOn_(),
    version: APP_VERSION
  };
}

function appLinkFor_(webAppUrl) { return APP_PAGE_URL + '?api=' + encodeURIComponent(webAppUrl); }

/** QR picture from a free service that needs no key. Only the public app link is sent. */
function qrUrl_(text) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=' + encodeURIComponent(text);
}

function installMobile_(m) {
  var d = String(m || '').replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
  if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
  return d;
}

/** Returns an error text (Hindi + English) or '' when the form is fine. */
function checkInstallForm_(f) {
  if (!String(f.shopName || '').trim()) return 'दुकान का नाम लिखें। / Enter the shop name.';
  if (!String(f.ownerName || '').trim()) return 'अपना नाम लिखें। / Enter your name.';
  if (!/^\d{10}$/.test(installMobile_(f.mobile))) return 'मोबाइल नंबर 10 अंकों का लिखें। / Mobile number should be 10 digits.';
  if (!/^[a-zA-Z0-9._-]{2,20}$/.test(String(f.loginName || '').trim())) {
    return 'लॉगिन नाम छोटा, अंग्रेज़ी अक्षरों में, बिना space (जैसे viju)। / Login name: English letters/numbers, no spaces (e.g. viju).';
  }
  if (!/^\d{4,8}$/.test(String(f.pin || '').trim())) return 'PIN 4 से 8 अंकों का हो। / PIN must be 4 to 8 digits.';
  if (String(f.pin).trim() !== String(f.pin2 || '').trim()) return 'दोनों PIN एक जैसे नहीं हैं। / The two PINs do not match.';
  return '';
}

/**
 * Installer keys are tied to one spreadsheet. If this script came with a copy of another sheet
 * (template or another shop), forget that sheet's deployment, URL and logins.
 */
function forgetIfCopied_() {
  var props = PropertiesService.getScriptProperties();
  var sid = props.getProperty(P_SHEET_ID);
  if (!sid || sid === ss_().getId()) return;
  [P_DEPLOYMENT, P_WEBAPP_URL, P_SHEET_ID, P_DEPLOYED_VERSION, P_UPDATE_NOTE, 'tabs_version'].forEach(function (k) {
    props.deleteProperty(k);
  });
  var all = props.getProperties();
  Object.keys(all).forEach(function (k) { if (k.indexOf('s_') === 0) props.deleteProperty(k); });
}

function autoUpdateOn_() {
  if (PropertiesService.getScriptProperties().getProperty(P_AUTO_UPDATE) === 'false') return false;
  // An owner may also type a row "auto_update | false" in the Settings tab.
  try {
    if (!ss_().getSheetByName('Settings')) return true;
    var row = rows_('Settings').filter(function (r) { return r.key === 'auto_update'; })[0];
    if (row && String(row.value).toLowerCase() === 'false') return false;
  } catch (e) { /* no Settings tab yet */ }
  return true;
}

function esc_(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/** Turns an error into a short message an owner can act on. */
function friendlyError_(e) {
  var msg = String(e && e.message ? e.message : e);
  if (e && e.apiOff) {
    return 'Google Apps Script API बंद है। / The Google Apps Script API switch is off for this Google account.';
  }
  if (/Authorization|permission|insufficient/i.test(msg) && !(e && e.httpCode)) {
    return 'Google की अनुमति पूरी नहीं हुई। मेनू से फिर "Start here" दबाएं और Allow करें। / Permission missing: run Start here again and press Allow. (' + msg + ')';
  }
  return msg;
}

/* ===================== Apps Script API ===================== */

/**
 * Calls the Apps Script API for THIS project with the owner's own login (no keys, no paid service).
 * Throws an Error with .httpCode, and .apiOff = true when the owner's "Google Apps Script API"
 * switch (script.google.com/home/usersettings) is off.
 */
function scriptApi_(method, path, body) {
  var opts = {
    method: method,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  if (body !== undefined) {
    opts.contentType = 'application/json';
    opts.payload = JSON.stringify(body);
  }
  var res = UrlFetchApp.fetch(SCRIPT_API_URL + ScriptApp.getScriptId() + path, opts);
  var code = res.getResponseCode();
  var text = res.getContentText();
  var data = json_(text, {});
  if (code >= 200 && code < 300) return data;
  var msg = (data && data.error && data.error.message) || String(text).slice(0, 300) || ('HTTP ' + code);
  var err = new Error('Apps Script API (' + code + '): ' + msg);
  err.httpCode = code;
  // "User has not enabled the Apps Script API. Enable it by visiting https://script.google.com/home/usersettings then retry."
  if (code === 403 && /usersettings|has not enabled the Apps Script API/i.test(msg)) err.apiOff = true;
  throw err;
}

/** The /exec URL of a deployment resource, or ''. */
function webAppUrlOf_(dep) {
  var eps = (dep && dep.entryPoints) || [];
  for (var i = 0; i < eps.length; i++) {
    if (eps[i].entryPointType === 'WEB_APP' && eps[i].webApp && eps[i].webApp.url) return eps[i].webApp.url;
  }
  return '';
}

/**
 * Makes a new version of the current code and points the installer's deployment at it
 * (same URL as before). With opts.allowCreate and no deployment yet, creates one.
 *   opts: { allowCreate, version (APP_VERSION of the code being published), description }
 * Returns the web app URL.
 */
function publishWebApp_(opts) {
  var props = PropertiesService.getScriptProperties();
  var scriptId = ScriptApp.getScriptId();
  var desc = String(opts.description || ('DukanKaApp ' + opts.version)).slice(0, 100);
  var depId = props.getProperty(P_DEPLOYMENT);
  // Set up by hand earlier? Reuse that deployment so the phones keep their link.
  if (!depId) depId = adoptDeployment_();
  if (!depId && !opts.allowCreate) {
    throw new Error('No web app deployment found to update. Deploy → Manage deployments → Edit → Version: New version → Deploy.');
  }

  var ver = scriptApi_('post', '/versions', { description: desc });
  var versionNumber = ver.versionNumber;
  req_(versionNumber, 'Apps Script API did not return a version number');

  var dep = null;
  if (depId) {
    try {
      dep = scriptApi_('put', '/deployments/' + encodeURIComponent(depId), {
        deploymentConfig: { scriptId: scriptId, versionNumber: versionNumber, manifestFileName: 'appsscript', description: desc }
      });
    } catch (e) {
      // The deployment was deleted by hand: make a new one only when allowed (new URL!).
      if (e.httpCode !== 404 || !opts.allowCreate) throw e;
      dep = null;
    }
  }
  if (!dep) {
    dep = scriptApi_('post', '/deployments', {
      scriptId: scriptId, versionNumber: versionNumber, manifestFileName: 'appsscript', description: desc
    });
  }
  depId = dep.deploymentId || depId;
  var url = webAppUrlOf_(dep);
  if (!url) {
    try { url = webAppUrlOf_(scriptApi_('get', '/deployments/' + encodeURIComponent(depId))); } catch (e2) { /* fall back below */ }
  }
  // Web app URLs have this form for normal Gmail accounts.
  if (!url) url = 'https://script.google.com/macros/s/' + depId + '/exec';

  props.setProperty(P_DEPLOYMENT, depId);
  props.setProperty(P_WEBAPP_URL, url);
  props.setProperty(P_SHEET_ID, ss_().getId());
  props.setProperty(P_DEPLOYED_VERSION, String(opts.version || APP_VERSION));
  audit_(null, 'deploy', String(opts.version || APP_VERSION), { version: versionNumber, deployment: depId });
  return url;
}

/**
 * For shops set up by hand: if the project has exactly one versioned web app deployment,
 * remember it as the installer's deployment. Returns its id or ''.
 */
function adoptDeployment_() {
  var res = scriptApi_('get', '/deployments?pageSize=50');
  var webApps = (res.deployments || []).filter(function (d) {
    return d.deploymentConfig && d.deploymentConfig.versionNumber && webAppUrlOf_(d);
  });
  if (webApps.length !== 1) return '';
  var props = PropertiesService.getScriptProperties();
  props.setProperty(P_DEPLOYMENT, webApps[0].deploymentId);
  props.setProperty(P_WEBAPP_URL, webAppUrlOf_(webApps[0]));
  props.setProperty(P_SHEET_ID, ss_().getId());
  return webApps[0].deploymentId;
}

/* ===================== Auto-update from GitHub ===================== */

/** Numeric compare of "1.10.0" vs "1.9.2": >0 when a is newer. */
function compareVersions_(a, b) {
  var x = String(a || '0').split('.'), y = String(b || '0').split('.');
  for (var i = 0; i < Math.max(x.length, y.length); i++) {
    var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
    if (d) return d;
  }
  return 0;
}

function versionInCode_(code) {
  var m = String(code).match(/var\s+APP_VERSION\s*=\s*['"]([0-9][0-9.]*)['"]/);
  return m ? m[1] : '';
}

function fetchText_(url) {
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  req_(res.getResponseCode() === 200, 'Download failed (' + res.getResponseCode() + '): ' + url);
  return res.getContentText('UTF-8');
}

/** Picks the project file that holds the DukanKaApp backend (keeps whatever name it has, e.g. "Code"). */
function pickCodeFile_(files) {
  var js = files.filter(function (f) { return f.type === 'SERVER_JS'; });
  var ours = js.filter(function (f) { return /APP_VERSION\s*=/.test(f.source || '') && /function doPost/.test(f.source || ''); });
  if (ours.length === 1) return ours[0];
  return js.length === 1 ? js[0] : null;
}

/**
 * Brings this shop to the newest backend on GitHub and moves the web app to it (same URL).
 *   opts.auto = true  → nightly: obeys the auto-update switch, never throws, never asks for permission.
 *   opts.auto = false → "Update now" menu.
 * Returns { status: 'off'|'up_to_date'|'updated'|'redeployed'|'needs_permission'|'error', from, to, message }.
 */
function updateFromGithub_(opts) {
  opts = opts || {};
  var props = PropertiesService.getScriptProperties();
  var r = { status: 'up_to_date', from: APP_VERSION, to: APP_VERSION, message: '' };
  try {
    if (opts.auto && !autoUpdateOn_()) return { status: 'off', from: APP_VERSION, to: APP_VERSION };
    forgetIfCopied_();
    var code = fetchText_(UPDATE_BASE_URL + 'Code.gs');
    var manifest = json_(fetchText_(UPDATE_BASE_URL + 'appsscript.json'), null);
    var remote = versionInCode_(code);
    req_(remote && code.indexOf('DukanKaApp') >= 0 && code.indexOf('function doPost') >= 0 && code.length > 20000,
      'The downloaded Code.gs does not look like DukanKaApp');
    req_(manifest && manifest.webapp && manifest.runtimeVersion, 'The downloaded appsscript.json is not valid');
    r.to = remote;

    if (compareVersions_(remote, APP_VERSION) > 0) {
      var content = scriptApi_('get', '/content');
      var files = content.files || [];
      var codeFile = pickCodeFile_(files);
      req_(codeFile, 'Could not find the DukanKaApp code file in this project');
      var oldManifestFile = files.filter(function (f) { return f.name === 'appsscript' && f.type === 'JSON'; })[0];
      var oldScopes = (json_(oldManifestFile && oldManifestFile.source, {}) || {}).oauthScopes || [];
      var added = (manifest.oauthScopes || []).filter(function (s) { return oldScopes.indexOf(s) < 0; });

      if (added.length && opts.auto) {
        // New permissions: the nightly trigger and the web app would stop until the owner allows them.
        // So change nothing tonight; ask the owner (once per version) to press "Update now".
        r.status = 'needs_permission';
        r.message = 'New version ' + remote + ' needs new Google permissions: ' + added.join(', ');
        notifyUpdateNeedsOwner_(remote);
      } else {
        // Without a deployment to move, new code would never reach the phones: change nothing.
        req_(props.getProperty(P_DEPLOYMENT) || adoptDeployment_(),
          'No web app deployment found. Run Dukan App \u2192 \u25B6 Start here once, then update again.');
        // updateContent replaces the whole project: send every file back, changing only ours.
        var out = files.map(function (f) {
          var src = f.source;
          if (f === codeFile) src = code;
          else if (f === oldManifestFile) src = JSON.stringify(manifest, null, 2);
          return { name: f.name, type: f.type, source: src };
        });
        if (!oldManifestFile) out.push({ name: 'appsscript', type: 'JSON', source: JSON.stringify(manifest, null, 2) });
        scriptApi_('put', '/content', { files: out });
        if (added.length) {
          // Menu run: the new code is saved, but it needs the owner's "Allow" before it can be published.
          // The next "Update now" asks for it and then finishes below (the deployed-version branch).
          r.status = 'needs_permission';
          r.message = 'New permissions: ' + added.join(', ');
        } else {
          publishWebApp_({ allowCreate: false, version: remote, description: 'DukanKaApp ' + remote + ' (auto-update)' });
          r.status = 'updated';
        }
      }
    } else {
      // The code is current but the web app may still run an older version
      // (update that needed permission, or new code pasted by hand). Finish it.
      var deployed = props.getProperty(P_DEPLOYED_VERSION);
      if (deployed && compareVersions_(APP_VERSION, deployed) > 0 && props.getProperty(P_DEPLOYMENT)) {
        publishWebApp_({ allowCreate: false, version: APP_VERSION, description: 'DukanKaApp ' + APP_VERSION + ' (update)' });
        r.status = 'redeployed';
        r.to = APP_VERSION;
      }
    }
  } catch (e) {
    console.error(e);
    r.status = 'error';
    r.message = friendlyError_(e) + (e && e.apiOff ? ' → ' + API_SETTINGS_URL : '');
  }
  // Audit what happened. A quiet "nothing new" night, or the same error every night, is logged once.
  var note = r.status + '|' + r.to + '|' + r.message;
  var routine = r.status === 'up_to_date' || r.status === 'off';
  if (!opts.auto || (!routine && props.getProperty(P_UPDATE_NOTE) !== note)) {
    audit_(null, 'auto.update', r.to, { status: r.status, from: r.from, to: r.to, message: r.message, auto: !!opts.auto });
  }
  if (!routine) props.setProperty(P_UPDATE_NOTE, note);
  else props.deleteProperty(P_UPDATE_NOTE);
  return r;
}

/** Emails the owner once per version when an update needs them to press "Update now". */
function notifyUpdateNeedsOwner_(remote) {
  var props = PropertiesService.getScriptProperties();
  var key = 'update_mail_' + remote;
  if (props.getProperty(key)) return;
  try {
    var to = Session.getEffectiveUser().getEmail();
    if (!to) return;
    MailApp.sendEmail({
      to: to,
      subject: 'DukanKaApp: नया अपडेट / new update ' + remote,
      htmlBody: '<p style="font-size:16px">DukanKaApp का नया वर्ज़न (' + esc_(remote) + ') आया है। इसके लिए Google की एक बार अनुमति चाहिए।</p>' +
        '<p style="font-size:16px">कंप्यूटर पर अपनी दुकान की Google Sheet खोलें → मेनू <b>Dukan App → Update now</b> दबाएं → Allow → फिर से <b>Update now</b>।</p>' +
        '<p>English: open your shop\'s Google Sheet → Dukan App → Update now → Allow → Update now again. ' +
        'Until then the app keeps working on the old version.</p>' +
        '<p><a href="' + esc_(ss_().getUrl()) + '">' + esc_(ss_().getName()) + '</a></p>'
    });
    props.setProperty(key, '1');
  } catch (e) { console.error(e); }
}

/* ===================== Sidebar HTML ===================== */

function showSidebar_(state) {
  var html = HtmlService.createHtmlOutput(installerHtml_(state))
    .setTitle('Dukan App — शुरू करें');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** The sidebar page. Built here as a string because the build makes a single Code.gs file. */
function installerHtml_(state) {
  // "<" escaped so shop names can never close the <script> tag.
  var stateJson = JSON.stringify(state).replace(/</g, '\\u003c');
  return [
    '<!DOCTYPE html><html><head><base target="_top"><meta charset="utf-8">',
    '<style>',
    'body{font-family:Arial,"Noto Sans Devanagari",sans-serif;font-size:15px;color:#222;margin:0;padding:12px;line-height:1.45}',
    'h2{font-size:19px;margin:4px 0 10px}h3{font-size:16px;margin:14px 0 6px}',
    '.en{color:#666;font-size:12px}',
    'label{display:block;margin:10px 0 3px;font-weight:bold}',
    'input{width:100%;box-sizing:border-box;font-size:17px;padding:9px;border:1px solid #bbb;border-radius:6px}',
    '.btn{display:block;width:100%;box-sizing:border-box;margin:12px 0;padding:14px 10px;font-size:17px;font-weight:bold;',
    'text-align:center;border:0;border-radius:8px;background:#b8860b;color:#fff;cursor:pointer;text-decoration:none}',
    '.btn.green{background:#1fa855}.btn.blue{background:#1a73e8}.btn.grey{background:#666}',
    '.btn[disabled]{opacity:.6;cursor:wait}',
    '.box{background:#fff8e1;border:1px solid #f0d58a;border-radius:8px;padding:10px;margin:10px 0}',
    '.err{background:#fdecea;border:1px solid #f5b5ae;color:#a50e0e;border-radius:8px;padding:10px;margin:10px 0;display:none}',
    '.ok{color:#1b7f3b;font-weight:bold}',
    'ol{padding-left:20px;margin:6px 0}li{margin:5px 0}',
    'textarea{width:100%;box-sizing:border-box;font-size:12px;height:70px}',
    '.scr{display:none}.qr{text-align:center}.qr img{width:220px;height:220px;border:1px solid #ddd}',
    'details{margin:10px 0}summary{cursor:pointer;color:#1a73e8}',
    '</style></head><body>',

    // ---- Step 1: the form ----
    '<div id="form" class="scr">',
    '<h2>अपनी दुकान बनाएं <span class="en">/ Create your shop</span></h2>',
    '<p>Google की अनुमति मिल गई — बढ़िया! अब नीचे भरें। <span class="en">Permission done. Fill this in.</span></p>',
    '<div id="ownerFields">',
    '<label>दुकान का नाम <span class="en">Shop name</span></label><input id="shopName" placeholder="Shree Ganesh Jewellers">',
    '<label>आपका नाम <span class="en">Owner name</span></label><input id="ownerName" placeholder="Vijay">',
    '<label>मोबाइल <span class="en">Mobile</span></label><input id="mobile" type="tel" inputmode="numeric" placeholder="98XXXXXXXX">',
    '<label>लॉगिन नाम <span class="en">Login name (English, no space)</span></label>',
    '<input id="loginName" autocapitalize="off" autocomplete="off" placeholder="viju">',
    '<label>PIN (4–8 अंक / digits)</label><input id="pin" type="password" inputmode="numeric" maxlength="8">',
    '<label>PIN दोबारा <span class="en">PIN again</span></label><input id="pin2" type="password" inputmode="numeric" maxlength="8">',
    '<p class="en">PIN याद रखें — ऐप में लॉगिन इसी से होगा। / Remember the PIN: you log in to the app with it.</p>',
    '</div>',
    '<div id="formErr" class="err"></div>',
    '<button id="createBtn" class="btn" onclick="create()">दुकान बनाएं<br><span style="font-size:13px">Create my shop</span></button>',
    '<p id="working" style="display:none" class="box">बन रहा है… 1 मिनट तक लग सकता है। यह खिड़की बंद न करें।<br>',
    '<span class="en">Working… this can take a minute. Do not close this panel.</span></p>',
    '<details><summary>वह "unsafe" वाली चेतावनी क्या थी? / What was that warning?</summary>',
    '<p>Google ने "Google hasn\'t verified this app" दिखाया क्योंकि यह ऐप आपकी अपनी शीट में चलता है, किसी कंपनी का नहीं है। ',
    'आपका डेटा सिर्फ़ आपके Google Drive में रहता है। आगे कभी फिर पूछे तो: <b>Advanced → Go to … (unsafe) → Allow</b>।</p>',
    '<p class="en">This script lives in your own sheet, so Google has not "verified" it. Your data stays in your Google Drive.</p>',
    '</details>',
    '</div>',

    // ---- Apps Script API switch is off ----
    '<div id="apioff" class="scr">',
    '<h2>बस एक बटन चालू करना है <span class="en">/ One switch to turn on</span></h2>',
    '<div class="box"><ol>',
    '<li>नीचे वाला नीला बटन दबाएं। नया टैब खुलेगा।<br><span class="en">Tap the blue button. A new tab opens.</span></li>',
    '<li>वहाँ <b>"Google Apps Script API"</b> के सामने वाला बटन <b>On</b> करें।<br><span class="en">Turn "Google Apps Script API" On.</span></li>',
    '<li>इस टैब पर वापस आएं और <b>"फिर से कोशिश करें"</b> दबाएं।<br><span class="en">Come back here and tap "Try again".</span></li>',
    '</ol></div>',
    '<a id="apiLink" class="btn blue" target="_blank" rel="noopener">Settings खोलें / Open settings</a>',
    '<button class="btn" onclick="publish(this)">फिर से कोशिश करें / Try again</button>',
    '<p class="en">On करने के बाद 1–2 मिनट लग सकते हैं। / After switching it on, wait a minute if it still fails.</p>',
    '<div class="err" id="apiErr"></div>',
    '</div>',

    // ---- Manual deploy (anything else failed) ----
    '<div id="manual" class="scr">',
    '<h2>आख़िरी कदम हाथ से <span class="en">/ Last step by hand</span></h2>',
    '<div class="err" id="manErr" style="display:block"></div>',
    '<p>दुकान बन गई है, बस ऐप चालू करना है। कंप्यूटर पर: <span class="en">Your shop is ready; publish the app:</span></p>',
    '<div class="box"><ol>',
    '<li>मेनू <b>Extensions → Apps Script</b> खोलें।</li>',
    '<li>ऊपर दाईं ओर नीला <b>Deploy → New deployment</b>।</li>',
    '<li>⚙️ (Select type) → <b>Web app</b>।</li>',
    '<li><b>Execute as: Me</b> — <b>Who has access: Anyone</b>।</li>',
    '<li><b>Deploy</b> दबाएं (अनुमति माँगे तो Allow)। <b>Web app URL</b> कॉपी करें (आख़िर में /exec)।</li>',
    '<li>वह लिंक नीचे चिपकाएं और "सेव करें" दबाएं।</li>',
    '</ol>',
    '<p class="en">Extensions → Apps Script → Deploy → New deployment → ⚙ Web app → Execute as: Me → ',
    'Who has access: Anyone → Deploy → copy the Web app URL (ends with /exec) and paste it below.</p></div>',
    '<label>Web app URL</label><input id="manualUrl" placeholder="https://script.google.com/macros/s/.../exec">',
    '<button class="btn" onclick="saveUrl(this)">सेव करें / Save</button>',
    '<button class="btn grey" onclick="publish(this)">अपने-आप फिर कोशिश करें / Try automatic again</button>',
    '</div>',

    // ---- Done: the app link ----
    '<div id="done" class="scr">',
    '<h2 class="ok">✅ आपका ऐप तैयार है! <span class="en">/ Your app is ready</span></h2>',
    '<div id="shopLine"></div>',
    '<a id="openLink" class="btn green" target="_blank" rel="noopener">इस फ़ोन/कंप्यूटर पर खोलें<br><span style="font-size:13px">Open on this phone / computer</span></a>',
    '<h3>दुकान के फ़ोन से QR स्कैन करें <span class="en">/ Scan with the shop phone</span></h3>',
    '<div class="qr"><img id="qrImg" alt="QR code"></div>',
    '<p class="en" style="text-align:center">फ़ोन का कैमरा या Google Lens खोलें और इस QR पर रखें। / Point the phone camera or Google Lens here.</p>',
    '<a id="waLink" class="btn green" target="_blank" rel="noopener">WhatsApp पर भेजें / Send on WhatsApp</a>',
    '<button class="btn blue" onclick="mail(this)">मुझे ईमेल करें / Email me the link</button>',
    '<p id="mailOk" class="ok" style="display:none"></p>',
    '<div class="box"><b>लॉगिन नाम / Login name: <span id="loginLine"></span></b><br>',
    'PIN — जो आपने चुना। <span class="en">PIN: the one you chose.</span></div>',
    '<h3>आगे क्या करें <span class="en">/ Next</span></h3><ol>',
    '<li>फ़ोन पर लिंक <b>Chrome</b> में खोलें → ⋮ → <b>Add to Home screen</b> (या Install app)।</li>',
    '<li>लॉगिन नाम और PIN से लॉगिन करें।</li>',
    '<li>कर्मचारी जोड़ने के लिए ऐप में: <b>Settings → Users</b>। उन्हें यही लिंक भेजें।</li>',
    '<li>हर रात 9:30 बजे बैकअप और रिपोर्ट ईमेल अपने-आप होगी।</li>',
    '</ol>',
    '<p class="en">Open in Chrome → ⋮ → Add to Home screen. Log in. Add staff in Settings → Users and send them this same link. ',
    'Backup and report email run every night at 9:30 pm.</p>',
    '<label>लिंक / Link</label><textarea id="linkBox" readonly onclick="this.select()"></textarea>',
    '<p class="en">इस लिंक को सिर्फ़ अपनी दुकान के लोगों को दें। / Share this link only with your shop staff.</p>',
    '<p class="en" id="verLine"></p>',
    '</div>',

    // ---- Owner exists, app not published (e.g. after "Try again" was closed) ----
    '<div id="pub" class="scr">',
    '<h2>ऐप चालू करें <span class="en">/ Publish your app</span></h2>',
    '<p>दुकान बन चुकी है। ऐप का लिंक बनाने के लिए दबाएं। <span class="en">Your shop exists. Tap to make the app link.</span></p>',
    '<button class="btn" onclick="publish(this)">ऐप चालू करें / Publish my app</button>',
    '<p id="working2" style="display:none" class="box">बन रहा है… / Working…</p>',
    '</div>',

    '<script>',
    'var S=' + stateJson + ';',
    'function $(id){return document.getElementById(id);}',
    'function show(id){var s=document.querySelectorAll(".scr");for(var i=0;i<s.length;i++)s[i].style.display="none";$(id).style.display="block";window.scrollTo(0,0);}',
    'function busy(b,on){if(b){b.disabled=on;}}',
    'function render(){',
    '  if(S.appLink){done();return;}',
    '  if(S.hasOwner){show("pub");return;}',
    '  show("form");',
    '}',
    'function done(){',
    '  $("openLink").href=S.appLink; $("waLink").href=S.whatsapp; $("qrImg").src=S.qr; $("linkBox").value=S.appLink;',
    '  $("loginLine").textContent=(S.owners||[]).join(", ");',
    '  $("shopLine").textContent=S.shopName||"";',
    '  $("verLine").textContent="Version "+S.version+(S.autoUpdate?" — auto-update on":" — auto-update off");',
    '  show("done");',
    '}',
    'function onResult(r){',
    '  $("working").style.display="none"; $("working2").style.display="none";',
    '  var bs=document.querySelectorAll("button");for(var i=0;i<bs.length;i++)bs[i].disabled=false;',
    '  if(r&&r.state)S=r.state;',
    '  if(r&&r.ok){done();return;}',
    '  var step=(r&&r.step)||"manual", msg=(r&&r.error)||"";',
    '  if(step==="form"){show("form");$("formErr").textContent=msg;$("formErr").style.display="block";return;}',
    '  if(step==="api_off"){$("apiLink").href=S.apiSettingsUrl;show("apioff");if(msg){$("apiErr").textContent=msg;$("apiErr").style.display="block";}return;}',
    '  $("manErr").textContent="अपने-आप नहीं हो पाया / Could not publish automatically: "+msg; show("manual");',
    '}',
    'function onFail(e){onResult({ok:false,step:S.hasOwner?"manual":"form",error:String(e&&e.message||e)});}',
    'function val(id){return $(id).value.trim();}',
    'function create(){',
    '  var d={shopName:val("shopName"),ownerName:val("ownerName"),mobile:val("mobile"),loginName:val("loginName"),pin:val("pin"),pin2:val("pin2")};',
    '  var err="";',
    '  if(!S.hasOwner){',
    '    if(!d.shopName||!d.ownerName)err="सारे खाने भरें। / Fill in every box.";',
    '    else if(!/^\\d{4,8}$/.test(d.pin))err="PIN 4 से 8 अंकों का हो। / PIN must be 4 to 8 digits.";',
    '    else if(d.pin!==d.pin2)err="दोनों PIN एक जैसे नहीं हैं। / The two PINs do not match.";',
    '  }',
    '  if(err){$("formErr").textContent=err;$("formErr").style.display="block";return;}',
    '  $("formErr").style.display="none"; $("createBtn").disabled=true; $("working").style.display="block";',
    '  google.script.run.withSuccessHandler(onResult).withFailureHandler(onFail).installerCreateShop(d);',
    '}',
    'function publish(b){',
    '  busy(b,true); $("working2").style.display="block";',
    '  google.script.run.withSuccessHandler(onResult).withFailureHandler(onFail).installerPublish();',
    '}',
    'function saveUrl(b){',
    '  busy(b,true);',
    '  google.script.run.withSuccessHandler(onResult).withFailureHandler(onFail).installerSaveManualUrl(val("manualUrl"));',
    '}',
    'function mail(b){',
    '  busy(b,true);',
    '  google.script.run.withSuccessHandler(function(r){busy(b,false);$("mailOk").style.display="block";',
    '    $("mailOk").textContent=r&&r.ok?("भेज दिया / Sent to "+r.to):((r&&r.error)||"Not sent");})',
    '    .withFailureHandler(function(e){busy(b,false);$("mailOk").style.display="block";$("mailOk").textContent=String(e&&e.message||e);})',
    '    .installerEmailLink();',
    '}',
    'render();',
    '</script></body></html>'
  ].join('\n');
}

/* ===== 22_install_finish.js ===== */
/* ---------- Finish a shop made by the one-link installer (installer/Code.gs) ---------- */
/*
 * The installer web app runs as the shop owner and:
 *   - creates the shop's spreadsheet with ONE tab "Setup" (key | value rows: shop_name, shop_mobile,
 *     shop_city, owner_name, owner_username, owner_salt, owner_pinHash, installed_by, installed_at,
 *     and after deploying: webapp_url, deployment_id),
 *   - creates this script project bound to it, uploads the code and deploys the web app.
 * It cannot run this project's code (another OAuth client), so the first request that reaches
 * this web app (normally the owner opening <exec url>?setup=1 right after pressing "Allow")
 * finishes the shop here: tabs, settings, owner login, nightly trigger.
 *
 * Wiring (04_api.js): doGet and doPost call finishInstall_() first; doGet returns
 * installReadyPage_(e) when it is not null.
 */

var P_INSTALL_DONE = 'install_done';       // '1' once the shop is finished (or never needed it)
var P_INSTALL_DONE_AT = 'install_done_at'; // ms timestamp, limits how long the ?setup=1 page is served
var READY_PAGE_HOURS = 48;                 // ?setup=1 serves the HTML page only this long after install

/**
 * Finishes an installer-made shop once. After that: one ScriptProperties read and return.
 * Never throws: a failure is logged and the next request tries again.
 */
function finishInstall_() {
  var props;
  try {
    props = PropertiesService.getScriptProperties();
    if (props.getProperty(P_INSTALL_DONE) === '1') return;
  } catch (e0) { console.error(e0); return; }

  // Nothing to finish (hand-made shop that has no owner yet): don't look again for 5 minutes.
  var cache = null;
  try { cache = CacheService.getScriptCache(); if (cache.get('install_chk') === '1') return; } catch (e1) { cache = null; }

  var lock = null;
  try {
    lock = LockService.getScriptLock();
    if (typeof lock.tryLock === 'function') {
      if (!lock.tryLock(30000)) return; // another request is finishing it right now
    } else {
      lock.waitLock(30000);
    }
  } catch (e2) { console.error(e2); return; }

  try {
    if (props.getProperty(P_INSTALL_DONE) === '1') return;
    var setupSheet = ss_().getSheetByName('Setup');
    if (setupSheet) {
      if (!finishFromSetupSheet_(props, setupSheet) && cache) {
        try { cache.put('install_chk', '1', 300); } catch (e5) { /* ignore */ }
      }
    } else if (finishHasOwner_()) {
      // Shop set up by "Start here", the manual menu, or the tests: nothing to do, ever.
      props.setProperty(P_INSTALL_DONE, '1');
    } else if (cache) {
      try { cache.put('install_chk', '1', 300); } catch (e3) { /* ignore */ }
    }
  } catch (e) {
    console.error('finishInstall_: ' + (e && e.stack ? e.stack : e));
  } finally {
    try { lock.releaseLock(); } catch (e4) { /* ignore */ }
  }
}

/** True when the Users tab exists and has an active owner. Never creates the tab. */
function finishHasOwner_() {
  if (!ss_().getSheetByName('Users')) return false;
  return rows_('Users').some(function (u) { return u.role === 'owner' && u.active === 'true'; });
}

/** Reads the installer's "Setup" tab into { key: value } (all text). */
function finishReadSetup_(sh) {
  var out = {};
  var last = sh.getLastRow();
  if (last < 1) return out;
  sh.getRange(1, 1, last, 2).getValues().forEach(function (r) {
    var k = String(r[0] === undefined || r[0] === null ? '' : r[0]).trim();
    if (k && k !== 'key') out[k] = String(r[1] === undefined || r[1] === null ? '' : r[1]).trim();
  });
  return out;
}

/** Returns true when the shop is finished, false when the Setup tab had no usable owner. */
function finishFromSetupSheet_(props, setupSheet) {
  var s = finishReadSetup_(setupSheet);

  setupTabs_();

  // Shop details. City goes into the address (printed on bills) when no address is set yet.
  var cur = settings_();
  var map = {};
  if (s.shop_name) map.shop_name = s.shop_name;
  if (s.shop_mobile) map.shop_mobile = s.shop_mobile;
  if (s.shop_city && !cur.shop_address) map.shop_address = s.shop_city;
  setSettings_(map);

  // Owner login, made from the salt + hash the installer computed (the PIN itself was never stored).
  var hasOwner = finishHasOwner_();
  if (!hasOwner && s.owner_username && s.owner_salt && /^[0-9a-f]{64}$/.test(s.owner_pinHash || '')) {
    var uname = String(s.owner_username).trim().toLowerCase();
    if (!findUser_(uname)) {
      insert_('Users', {
        id: uid_('U'), name: s.owner_name || uname, username: uname, role: 'owner',
        salt: s.owner_salt, pinHash: s.owner_pinHash, active: 'true', createdAt: nowIso_()
      });
      hasOwner = true;
    }
  }
  if (!hasOwner) {
    // Setup tab is broken: keep it so the owner (or "Start here") can still finish by hand.
    console.error('finishInstall_: no owner in the Setup tab; left for "Start here"');
    return false;
  }

  // Remember the deployment so "Show my app link", auto-update and "Update now" (21_install.js) work.
  var url = finishGoodExecUrl_(s.webapp_url);
  if (url) {
    props.setProperty(P_WEBAPP_URL, url);
    var depId = s.deployment_id || ((url.match(/\/s\/([\w-]+)\/exec$/) || [])[1] || '');
    if (depId) props.setProperty(P_DEPLOYMENT, depId);
    props.setProperty(P_SHEET_ID, ss_().getId());
    props.setProperty(P_DEPLOYED_VERSION, APP_VERSION);
  }

  if (typeof installNightlyTrigger_ === 'function') {
    try { installNightlyTrigger_(); } catch (e1) { console.error(e1); }
  }
  try {
    audit_(null, 'install', APP_VERSION, { by: 'one-link installer', shop: s.shop_name || '', installedBy: s.installed_by || '' });
  } catch (e2) { console.error(e2); }

  if (url) finishEmailOwner_(url, s);

  // The Setup tab holds the salt + PIN hash: remove it (setupTabs_ made the other tabs, so it is never the last one).
  try {
    if (ss_().getSheets().length > 1) ss_().deleteSheet(setupSheet);
    else setupSheet.clear();
  } catch (e3) { console.error(e3); }

  props.setProperty(P_INSTALL_DONE_AT, String(Date.now()));
  props.setProperty(P_INSTALL_DONE, '1');
  return true;
}

/** A web app /exec URL (gmail or Workspace form), or ''. A /dev URL is never stored. */
function finishGoodExecUrl_(url) {
  url = String(url || '').trim();
  return /^https:\/\/script\.google\.com\/(a\/macros\/[^\/]+|macros)\/s\/[\w-]+\/exec$/.test(url) ? url : '';
}

function finishAppLink_(url) {
  return 'https://sovanikavr.github.io/DukanKaApp/?api=' + encodeURIComponent(url);
}

function finishQr_(text) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=' + encodeURIComponent(text);
}

function finishEsc_(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/** One email to the owner with the app link (this project already has the send_mail permission). */
function finishEmailOwner_(url, s) {
  try {
    var to = Session.getEffectiveUser().getEmail() || s.installed_by;
    if (!to) return;
    var link = finishAppLink_(url);
    MailApp.sendEmail({
      to: to,
      subject: (s.shop_name || 'DukanKaApp') + ' — app link / ऐप लिंक',
      htmlBody: '<p style="font-size:16px">नमस्ते,</p>' +
        '<p style="font-size:16px">आपकी दुकान का ऐप तैयार है। / Your shop app is ready.</p>' +
        '<p style="font-size:18px"><a href="' + finishEsc_(link) + '">' + finishEsc_(link) + '</a></p>' +
        '<p><img src="' + finishEsc_(finishQr_(link)) + '" width="240" height="240" alt="QR"></p>' +
        '<p style="font-size:16px">लॉगिन नाम / Login name: <b>' + finishEsc_(s.owner_username) + '</b> ' +
        '(PIN जो आपने चुना / the PIN you chose)</p>' +
        '<p style="font-size:16px">फ़ोन पर Chrome में खोलें → ⋮ → "Add to Home screen"।</p>' +
        '<p style="color:#666">यह लिंक सिर्फ़ अपनी दुकान के लोगों को दें। / Share this link only with your shop staff.</p>'
    });
  } catch (e) { console.error(e); }
}

/**
 * <exec url>?setup=1 → the "your shop is ready" page (HtmlOutput). Anything else → null.
 * Served only for READY_PAGE_HOURS after the install finished: every HtmlService page lets its
 * visitor call this project's public functions through google.script.run, so the page is not
 * left open for ever (the owner can always use the sheet menu "Show my app link").
 */
function installReadyPage_(e) {
  if (!(e && e.parameter && e.parameter.setup === '1')) return null;
  try {
    var props = PropertiesService.getScriptProperties();
    var doneAt = Number(props.getProperty(P_INSTALL_DONE_AT) || 0);
    if (!doneAt || Date.now() - doneAt > READY_PAGE_HOURS * 3600000) return null;

    var url = finishGoodExecUrl_(props.getProperty(P_WEBAPP_URL));
    if (!url) {
      try { url = finishGoodExecUrl_(ScriptApp.getService().getUrl()); } catch (e1) { url = ''; }
      if (url) {
        props.setProperty(P_WEBAPP_URL, url);
        if (!props.getProperty(P_DEPLOYMENT)) {
          var m = url.match(/\/s\/([\w-]+)\/exec$/);
          if (m) props.setProperty(P_DEPLOYMENT, m[1]);
        }
        if (!props.getProperty(P_SHEET_ID)) props.setProperty(P_SHEET_ID, ss_().getId());
      }
    }
    if (!url) return null;

    var shopName = '';
    var owners = [];
    try {
      shopName = settings_().shop_name;
      if (shopName === DEFAULT_SETTINGS.shop_name) shopName = '';
      owners = rows_('Users').filter(function (u) { return u.role === 'owner' && u.active === 'true'; })
        .map(function (u) { return u.username; });
    } catch (e2) { /* page still shows the link */ }

    var link = finishAppLink_(url);
    var wa = 'https://wa.me/?text=' + encodeURIComponent((shopName || 'DukanKaApp') + ' — दुकान का ऐप / shop app:\n' + link);
    return HtmlService.createHtmlOutput(installReadyHtml_(shopName, owners, link, wa))
      .setTitle('DukanKaApp — तैयार / Ready')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (e) {
    console.error(e);
    return null;
  }
}

function installReadyHtml_(shopName, owners, link, wa) {
  var L = finishEsc_(link);
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_top">',
    '<style>',
    'body{margin:0;background:#F5F7F9;color:#15202B;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans Devanagari",sans-serif;font-size:17px;line-height:1.5}',
    'header{background:#1F3A5F;color:#fff;padding:18px 16px;border-bottom:4px solid #C9962B}',
    'header h1{margin:0;font-size:22px}header p{margin:4px 0 0;color:#E8D3A2;font-size:15px}',
    'main{max-width:520px;margin:0 auto;padding:16px}',
    '.en{color:#4A5763;font-size:14px}',
    '.card{background:#fff;border:1px solid #DCE2E8;border-radius:14px;padding:16px;margin:0 0 14px}',
    '.ok{background:#E7F3EC;border-color:#1E6B45;color:#1E6B45;font-weight:bold;font-size:19px}',
    '.btn{display:block;box-sizing:border-box;width:100%;margin:10px 0;padding:16px;border-radius:12px;font-size:18px;font-weight:bold;text-align:center;text-decoration:none;color:#fff;background:#1F3A5F}',
    '.btn.gold{background:#C9962B;color:#15202B}.btn.wa{background:#1E6B45}',
    '.qr{text-align:center}.qr img{width:240px;height:240px;border:1px solid #DCE2E8;border-radius:8px;background:#fff}',
    '.login{background:#FBF4E4;border:1px solid #E8D3A2;color:#5B4300}',
    'textarea{width:100%;box-sizing:border-box;font-size:13px;height:80px;border:1px solid #C3CCD5;border-radius:8px;padding:8px}',
    'ol{padding-left:22px}li{margin:6px 0}',
    '</style></head><body>',
    '<header><h1>DukanKaApp</h1><p>' + finishEsc_(shopName || '') + '</p></header>',
    '<main>',
    '<div class="card ok">✅ आपकी दुकान तैयार है!<br><span class="en">Your shop is ready.</span></div>',
    '<a class="btn gold" href="' + L + '">ऐप खोलें<br><span style="font-size:14px">Open the app</span></a>',
    '<div class="card qr"><b>दुकान के फ़ोन से QR स्कैन करें</b><br><span class="en">Scan with the shop phone</span><br><br>',
    '<img src="' + finishEsc_(finishQr_(link)) + '" alt="QR"></div>',
    '<a class="btn wa" href="' + finishEsc_(wa) + '">WhatsApp पर भेजें / Send on WhatsApp</a>',
    '<div class="card login"><b>लॉगिन नाम / Login name: ' + finishEsc_(owners.join(', ')) + '</b><br>',
    'PIN — जो आपने चुना। <span class="en">PIN: the one you chose.</span></div>',
    '<div class="card"><b>आगे / Next</b><ol>',
    '<li>फ़ोन पर लिंक <b>Chrome</b> में खोलें → ⋮ → <b>Add to Home screen</b>।<br><span class="en">Open in Chrome → ⋮ → Add to Home screen.</span></li>',
    '<li>लॉगिन नाम और PIN से लॉगिन करें।<br><span class="en">Log in with your login name and PIN.</span></li>',
    '<li>कर्मचारी: ऐप में <b>Settings → Users</b>, फिर उन्हें यही लिंक भेजें।<br><span class="en">Staff: add them in Settings → Users and send them this link.</span></li>',
    '</ol><p class="en">यह लिंक आपके ईमेल पर भी भेज दिया है। / This link was also emailed to you.</p></div>',
    '<div class="card"><b>लिंक / Link</b><textarea readonly onclick="this.select()">' + L + '</textarea>',
    '<p class="en">यह लिंक सिर्फ़ अपनी दुकान के लोगों को दें। / Share this link only with your shop staff.</p></div>',
    '</main></body></html>'
  ].join('\n');
}

/* ===== 23_safety.js ===== */
/* ---------- Keeping the data safe: health check, guard against hand edits, restore from a backup ----------
 * Three layers protect the shop's data:
 *   1. Every night a full copy of the sheet goes to Drive → "DukanKaApp Backups" (last 30 kept).
 *   2. Google Sheets keeps its own version history (File → Version history) for every change.
 *   3. Tabs warn before anyone types in them by hand, and "Check my data" finds broken rows early.
 * "Restore from a backup" copies all tabs from a chosen nightly copy back into this sheet
 * (after first saving the current state as one more backup), so the app link stays the same.
 */

/** Tabs show a warning (not a block) when someone edits them by hand in Google Sheets. */
function protectTabs_() {
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss_().getSheetByName(name);
    if (!sh) return;
    try {
      if (!sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).length) {
        sh.protect().setDescription('DukanKaApp data — change it from the app').setWarningOnly(true);
      }
    } catch (e) { /* not allowed or not supported: fine */ }
  });
}

/** Looks for problems: missing or repeated ids, broken bill lines, wrong header rows. */
function checkData_() {
  var problems = [];
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss_().getSheetByName(name);
    if (!sh) { problems.push(name + ': tab is missing (it will be made again)'); return; }
    var headers = SCHEMA[name];
    var cur = sh.getRange(1, 1, 1, headers.length).getValues()[0];
    headers.forEach(function (h, i) { if (String(cur[i]) !== h) problems.push(name + ': column ' + (i + 1) + ' should be "' + h + '" but is "' + cur[i] + '"'); });
    if (name === 'Audit' || name === 'Settings') return;
    var seen = {};
    rows_(name).forEach(function (r) {
      var id = r[headers[0]];
      if (!id) problems.push(name + ' row ' + r._row + ': no id');
      else if (seen[id]) problems.push(name + ' rows ' + seen[id] + ' and ' + r._row + ': same id ' + id);
      else seen[id] = r._row;
    });
  });
  rows_('Sales').forEach(function (b) {
    try { JSON.parse(b.lines || '[]'); } catch (e) { problems.push('Sales row ' + b._row + ' (' + b.billNo + '): item lines are damaged'); }
  });
  return { ok: !problems.length, problems: problems.slice(0, 50), count: problems.length, checkedAt: nowIso_() };
}

/** Menu: Check my data. */
function checkDataMenu() {
  var r = checkData_();
  SpreadsheetApp.getUi().alert(r.ok ? 'सब ठीक है / Everything looks fine.' :
    'Problems found (' + r.count + '):\n\n' + r.problems.join('\n') + '\n\nUse "Restore from a backup" if data was damaged, or ask for help.');
}

/** Menu: Restore from a backup. Lists the nightly copies; the owner types the number to restore. */
function restoreFromBackupMenu() {
  var ui = SpreadsheetApp.getUi();
  var folders = DriveApp.getFoldersByName('DukanKaApp Backups');
  if (!folders.hasNext()) { ui.alert('No backups found yet. They are made every night (Dukan App → Back up now makes one now).'); return; }
  var files = [];
  var it = folders.next().getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files = files.slice(0, 15);
  if (!files.length) { ui.alert('No backups found yet.'); return; }
  var list = files.map(function (f, i) { return (i + 1) + '. ' + f.getName(); }).join('\n');
  var r = ui.prompt('Restore from a backup', 'Which copy? Type its number:\n\n' + list +
    '\n\nThe data as it is now is saved as one more backup first.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var n = parseInt(r.getResponseText(), 10);
  if (!(n >= 1 && n <= files.length)) { ui.alert('Please type a number from the list.'); return; }
  var sure = ui.alert('Restore "' + files[n - 1].getName() + '"?', 'Everything entered after that copy will be replaced by the copy.', ui.ButtonSet.YES_NO);
  if (sure !== ui.Button.YES) return;
  var res = restoreFrom_(files[n - 1].getId());
  ui.alert('Restored ' + res.tabs + ' tabs from "' + files[n - 1].getName() + '".\nThe app shows the restored data now.');
}

/** Copies every app tab from a backup spreadsheet into this one. */
function restoreFrom_(fileId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    backupNow_(); // keep the present state too, in case the wrong copy was picked
    var src = SpreadsheetApp.openById(fileId);
    var tabs = 0;
    Object.keys(SCHEMA).forEach(function (name) {
      var from = src.getSheetByName(name);
      if (!from) return;
      var to = sheet_(name);
      var vals = from.getDataRange().getValues();
      var width = SCHEMA[name].length;
      vals = vals.map(function (row) { var r = row.slice(0, width); while (r.length < width) r.push(''); return r.map(function (v) { return toCell_(v); }); });
      to.getRange(1, 1, Math.max(to.getLastRow(), 1), Math.max(to.getLastColumn(), width)).clearContent();
      if (vals.length) to.getRange(1, 1, vals.length, width).setValues(vals);
      tabs++;
    });
    _rowsCache = {};
    bumpDataVersion_();
    audit_(null, 'restore', fileId, { tabs: tabs });
    return { tabs: tabs };
  } finally { lock.releaseLock(); }
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
    var minDays = parseFloat(loan.minDays !== undefined && loan.minDays !== '' ? loan.minDays : opts.minDays) || 0;
    if (opts.noMinimum) minDays = 0;
    var minDone = false;
    var lent = P; // amount lent, with top-ups: the minimum interest is on this, not on what is left
    function addMinimum(onDate) {
      var d = daysBetween(loan.date, onDate);
      if (minDone || !(minDays > 0) || d >= minDays) return;
      var extra = r2(evalFormula(formula, { Principal: lent, Rate: rate, Days: minDays }) - totalInterest);
      minDone = true;
      if (extra <= 0) return;
      A += extra; totalInterest += extra;
      rows.push({ kind: 'minimum', label: 'Minimum ' + minDays + ' days', days: minDays - d, principal: lent, interest: extra });
    }
    events.forEach(function (e) {
      var t = parseD(e.date);
      if (t > end) return;
      accrue(t);
      // Releasing inside the minimum period: the minimum interest is charged before the release payment.
      if (e.type === 'close') addMinimum(e.date);
      var amt = parseFloat(String(e.amount).replace(/,/g, '')) || 0;
      if (e.type === 'topup') {
        P += amt; lent += amt;
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

    var totalDays = Math.max(daysBetween(loan.date, asOf), 0);
    addMinimum(asOf);

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
    if (crore) parts.push((crore < 100 ? two(crore) : inWords(crore)) + ' Crore');
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
