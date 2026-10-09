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
