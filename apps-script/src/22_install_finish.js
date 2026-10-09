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
