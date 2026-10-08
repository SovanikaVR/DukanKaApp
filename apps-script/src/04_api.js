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
  'admin.archive': function (u, d) { return archiveFy_(u, d.fy); },
  'admin.backupNow': function () { return backupNow_(); }
};

var READ_ONLY = {
  'ping': 1, 'bootstrap': 1, 'rates.list': 1, 'customers.search': 1, 'customers.get': 1, 'sale.list': 1,
  'sale.get': 1, 'oldgold.list': 1, 'loans.list': 1, 'loans.get': 1, 'orders.list': 1, 'orders.get': 1,
  'repairs.list': 1, 'stock.list': 1, 'stock.summary': 1, 'melt.list': 1, 'fine.summary': 1,
  'parties.list': 1, 'parties.ledger': 1, 'cash.list': 1, 'reports.daily': 1, 'reports.month': 1,
  'reports.position': 1, 'users.list': 1
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
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    return fn(user, data, token);
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
