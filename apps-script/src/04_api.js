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
