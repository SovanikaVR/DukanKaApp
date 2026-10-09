/* ---------- Live market rate (shown on Home; the shop can hide it) ----------
 * Free sources, no key: world gold/silver price in US$ (api.gold-api.com) and US$ → ₹ (open.er-api.com).
 * Indian price ≈ world price × ₹ rate × (1 + import duty %), per gram. Cities differ a little (local
 * sarafa association, transport): the shop sets its city and a ± ₹ per 10 g difference once in Settings.
 * Optional: a GoldAPI.io key (free plan) gives the ₹ price directly.
 * Answers are kept for 15 minutes so the free services are called rarely.
 */
var OZ_G = 31.1034768;

function fetchJson_(url, headers) {
  var res;
  try {
    res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: headers || {}, followRedirects: true });
  } catch (e) {
    // Google has not been allowed to reach the internet yet (new permission after an update).
    req_(!/permission|external_request|authoriz/i.test(String(e && e.message)), 'NEED_PERMISSION: Open the Google Sheet → Extensions → Apps Script → choose "allowPermissions" at the top → Run → Allow. Then Deploy → Manage deployments → Edit → New version → Deploy.');
    throw e;
  }
  req_(res.getResponseCode() === 200, 'Live rate service did not answer (' + res.getResponseCode() + ')');
  return JSON.parse(res.getContentText());
}

function liveRates_() {
  var s = settings_();
  var cache = CacheService.getScriptCache();
  var hit = cache.get('live_rates');
  var base = hit ? JSON.parse(hit) : null;
  if (!base) {
    var g24, ag, source, at = nowIso_();
    if (s.live_goldapi_key) {
      var hdr = { 'x-access-token': s.live_goldapi_key };
      var gj = fetchJson_('https://www.goldapi.io/api/XAU/INR', hdr);
      var sj = fetchJson_('https://www.goldapi.io/api/XAG/INR', hdr);
      g24 = num_(gj.price_gram_24k); ag = num_(sj.price_gram_24k) || num_(sj.price) / OZ_G;
      source = 'GoldAPI.io';
    } else {
      var xau = fetchJson_('https://api.gold-api.com/price/XAU');
      var xag = fetchJson_('https://api.gold-api.com/price/XAG');
      var fx = fetchJson_('https://open.er-api.com/v6/latest/USD');
      var inr = num_(fx && fx.rates && fx.rates.INR);
      req_(inr > 0 && num_(xau.price) > 0, 'Live rate not available right now');
      g24 = num_(xau.price) * inr / OZ_G; ag = num_(xag.price) * inr / OZ_G;
      source = 'gold-api.com + open.er-api.com';
      at = xau.updatedAt || at;
    }
    base = { g24World: round2_(g24), agWorld: round2_(ag), source: source, at: at };
    try { cache.put('live_rates', JSON.stringify(base), 900); } catch (e) { /* ignore */ }
  }
  // India price = world price + market difference % (import duty, GST, local premium; the shop can match it to its own city once).
  var duty = s.live_premium_pct === '' || s.live_premium_pct === undefined ? 9 : num_(s.live_premium_pct);
  var adj10 = num_(s.live_city_adjust);
  var g24g = base.g24World * (s.live_goldapi_key ? 1 : 1 + duty / 100) + adj10 / 10;
  var p22 = num_(s.purity_22k) || 91.6, p18 = num_(s.purity_18k) || 75;
  var sDuty = s.live_silver_pct === '' || s.live_silver_pct === undefined ? duty : num_(s.live_silver_pct);
  var agg = base.agWorld * (s.live_goldapi_key ? 1 : 1 + sDuty / 100);
  return {
    city: s.live_city || '', source: base.source, at: base.at, dutyPct: duty, silverPct: sDuty, cityAdjust10g: adj10,
    g24: Math.round(g24g * 100) / 100, g22: Math.round(g24g * p22) / 100, g18: Math.round(g24g * p18) / 100, silver: Math.round(agg * 100) / 100,
    per10: { g24: Math.round(g24g * 10), g22: Math.round(g24g * p22 / 10), g18: Math.round(g24g * p18 / 10) }, silverKg: Math.round(agg * 1000)
  };
}

/** Run this once from the Apps Script editor (or the sheet menu) after an update that needs new Google permissions. */
function allowPermissions() {
  UrlFetchApp.fetch('https://api.gold-api.com/price/XAU', { muteHttpExceptions: true });
  ScriptApp.getProjectTriggers();
  try { SpreadsheetApp.getUi().alert('Done. Permissions are allowed. / अनुमति मिल गई।'); } catch (e) { Logger.log('Permissions are allowed.'); }
}
