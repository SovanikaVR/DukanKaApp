/**
 * DukanKaApp — one-link shop installer.
 *
 * A separate Apps Script project, deployed ONCE by the developer as a web app:
 *   Execute as: User accessing the web app   (USER_ACCESSING)
 *   Who has access: Anyone with a Google account (ANYONE)
 * Its /exec link is the one link a new shop opens. Everything below runs AS THE VISITOR, in the
 * visitor's own Google account: the new sheet and script project belong to them, not to us.
 *
 * What installShop() does (each step is remembered in the visitor's UserProperties, so
 * "Try again" resumes where it stopped and never makes a second sheet):
 *   1. sheet   — new Google Sheet "<Shop> — DukanKaApp" with one tab "Setup" (key | value).
 *                The PIN is never stored: only a salt and SHA-256(salt + ':' + pin), the same
 *                as hashPin_() in the backend (apps-script/src/03_auth.js).
 *   2. project — Apps Script API projects.create, bound to that sheet (parentId).
 *   3. code    — dist/Code.gs + dist/appsscript.json from GitHub → projects.updateContent.
 *   4. version — projects.versions.create.
 *   5. deploy  — projects.deployments.create → the shop's /exec URL.
 *   6. finish  — webapp_url + deployment_id rows added to the Setup tab.
 * The shop's own backend finishes the rest (tabs, owner login, nightly trigger) on its first
 * request: finishInstall_() in apps-script/src/22_install_finish.js. That first request is the
 * owner opening <exec>?setup=1 and pressing "Allow" (the shop project is a new OAuth client,
 * so Google needs the owner's one-time consent for it).
 *
 * Nothing about any shop is stored in THIS project (no script properties, no sheet):
 * UserProperties are private to each visitor, and the script cache only holds the public
 * GitHub code.
 */

var CODE_BASE_URL = 'https://raw.githubusercontent.com/SovanikaVR/DukanKaApp/stable/dist/';
var APP_PAGE_URL = 'https://sovanikavr.github.io/DukanKaApp/';
var SCRIPT_API = 'https://script.googleapis.com/v1/';
var API_SETTINGS_URL = 'https://script.google.com/home/usersettings';
var STATE_KEY = 'dukan_install_v1';
var GH_CACHE_SECONDS = 1800;
var GH_CHUNK = 20000; // characters per cache entry (CacheService allows 100 KB per value; Hindi = 3 bytes/char)

/* ===================== Web app ===================== */

function doGet() {
  var state = {};
  try { state = publicState_(loadState_()); } catch (e) { console.error(e); }
  return HtmlService.createHtmlOutput(pageHtml_(state))
    .setTitle('DukanKaApp — नई दुकान / New shop')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ===================== google.script.run targets ===================== */

/**
 * Creates (or resumes creating) the visitor's shop.
 * Returns { ok: true, state } or { ok: false, step: 'form'|'api_off'|'busy'|'error', error, state }.
 */
function installShop(form) {
  var lock = LockService.getUserLock();
  if (!lock.tryLock(20000)) {
    return { ok: false, step: 'busy', error: 'पिछला काम अभी चल रहा है। 1 मिनट बाद "फिर से कोशिश करें" दबाएं। / Still working on your last tap. Wait a minute and tap "Try again".' };
  }
  try {
    return runInstall_(form || {});
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    var step = e && e.apiOff ? 'api_off' : (e && e.busy ? 'busy' : 'error');
    return { ok: false, step: step, error: friendlyError_(e), state: safeState_() };
  } finally {
    lock.releaseLock();
  }
}

/** Current state for the page. */
function getInstallState() {
  return safeState_();
}

/**
 * Forget the remembered install so a NEW shop can be made. Files already made stay in Drive.
 * (Used by "Make another shop" and "Start over".)
 */
function startOver() {
  PropertiesService.getUserProperties().deleteProperty(STATE_KEY);
  return safeState_();
}

/* ===================== The install ===================== */

function runInstall_(form) {
  var st = loadState_();
  if (st && st.sheetId && !sheetExists_(st.sheetId)) st = null; // sheet deleted: start fresh
  if (st && st.done) return { ok: true, state: publicState_(st) };

  // 1. Sheet + Setup tab (needs the form; later steps do not).
  if (!st || !st.sheetId) {
    var bad = checkForm_(form);
    if (bad) return { ok: false, step: 'form', error: bad, state: publicState_(null) };
    st = { v: 1, startedAt: new Date().toISOString() };
    createShopSheet_(form, st);
    saveState_(st);
  }

  // 2. Script project bound to the sheet.
  if (!st.scriptId) {
    var proj = scriptApi_('post', 'projects', { title: projectTitle_(st.shopName), parentId: st.sheetId });
    if (!proj.scriptId) throw new Error('Apps Script API did not return a scriptId');
    st.scriptId = proj.scriptId;
    saveState_(st);
  }

  // 3. The DukanKaApp backend from GitHub. updateContent replaces every file; the manifest must be included.
  if (!st.codeDone) {
    var gh = githubBackend_();
    scriptApi_('put', 'projects/' + encodeURIComponent(st.scriptId) + '/content', {
      files: [
        { name: 'Code', type: 'SERVER_JS', source: gh.code },
        { name: 'appsscript', type: 'JSON', source: gh.manifest }
      ]
    });
    st.codeDone = true;
    st.appVersion = gh.version;
    saveState_(st);
  }

  var desc = ('DukanKaApp ' + (st.appVersion || '') + ' (one-link installer)').slice(0, 100);

  // 4. A version to deploy.
  if (!st.versionNumber) {
    var ver = scriptApi_('post', 'projects/' + encodeURIComponent(st.scriptId) + '/versions', { description: desc });
    if (!ver.versionNumber) throw new Error('Apps Script API did not return a version number');
    st.versionNumber = ver.versionNumber;
    saveState_(st);
  }

  // 5. The web app deployment (its settings come from the manifest: execute as owner, anyone can call).
  if (!st.deploymentId) {
    var dep = scriptApi_('post', 'projects/' + encodeURIComponent(st.scriptId) + '/deployments', {
      versionNumber: st.versionNumber, manifestFileName: 'appsscript', description: desc
    });
    if (!dep.deploymentId) throw new Error('Apps Script API did not return a deployment id');
    st.deploymentId = dep.deploymentId;
    st.execUrl = webAppUrlOf_(dep);
    saveState_(st);
  }
  if (!st.execUrl) {
    try {
      st.execUrl = webAppUrlOf_(scriptApi_('get', 'projects/' + encodeURIComponent(st.scriptId) +
        '/deployments/' + encodeURIComponent(st.deploymentId)));
    } catch (e) { console.error(e); }
    // The /exec URL of a normal Gmail account's deployment.
    if (!st.execUrl) st.execUrl = 'https://script.google.com/macros/s/' + st.deploymentId + '/exec';
    saveState_(st);
  }

  // 6. Tell the shop's backend its own link (finishInstall_ stores it for "Show my app link" and auto-update).
  if (!st.setupWritten) {
    var sh = SpreadsheetApp.openById(st.sheetId).getSheetByName('Setup');
    if (sh) {
      var row = sh.getLastRow() + 1;
      sh.getRange(row, 1, 2, 2).setNumberFormat('@').setValues([
        ['webapp_url', st.execUrl],
        ['deployment_id', st.deploymentId]
      ]);
      SpreadsheetApp.flush();
    }
    st.setupWritten = true;
  }
  st.done = true;
  st.doneAt = new Date().toISOString();
  saveState_(st);
  return { ok: true, state: publicState_(st) };
}

/** Step 1: the spreadsheet and its Setup tab. Fills st with sheetId, sheetUrl, shopName, login. */
function createShopSheet_(form, st) {
  var shopName = clean_(form.shopName, 60);
  var login = String(form.loginName).trim().toLowerCase();
  var pin = String(form.pin).trim();
  var salt = Utilities.getUuid();
  var email = '';
  try { email = Session.getActiveUser().getEmail(); } catch (e) { /* no email scope: leave blank */ }

  var ss = SpreadsheetApp.create(shopName + ' — DukanKaApp');
  var sh = ss.getSheets()[0];
  sh.setName('Setup');
  var rows = [
    ['key', 'value'],
    ['shop_name', shopName],
    ['shop_mobile', cleanMobile_(form.mobile)],
    ['shop_city', clean_(form.city, 60)],
    ['owner_name', clean_(form.ownerName, 60)],
    ['owner_username', login],
    ['owner_salt', salt],
    ['owner_pinHash', hashPin_(salt, pin)],
    ['installed_by', email],
    ['installed_at', new Date().toISOString()]
  ];
  // Plain text, so Sheets never turns a mobile number or a hash like "12e45..." into a number.
  sh.getRange('A:B').setNumberFormat('@');
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
  sh.getRange(1, 1, 1, 2).setFontWeight('bold');
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 420);
  SpreadsheetApp.flush();

  st.sheetId = ss.getId();
  st.sheetUrl = ss.getUrl();
  st.shopName = shopName;
  st.login = login;
}

/** Same as hashPin_ in apps-script/src/03_auth.js: SHA-256 of salt + ':' + pin, lowercase hex. */
function hashPin_(salt, pin) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function projectTitle_(shopName) {
  return (String(shopName || 'Shop') + ' — DukanKaApp').slice(0, 100);
}

function sheetExists_(id) {
  try { SpreadsheetApp.openById(id); return true; } catch (e) { return false; }
}

/* ===================== Form checks (same rules as checkInstallForm_ in 21_install.js) ===================== */

function clean_(s, max) {
  return String(s === undefined || s === null ? '' : s).replace(/[\r\n\t]+/g, ' ').replace(/^[=+\-@]+/, '').trim().slice(0, max || 100);
}

function cleanMobile_(m) {
  var d = String(m || '').replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
  if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
  return d;
}

/** Returns an error (Hindi + English) or ''. */
function checkForm_(f) {
  if (!clean_(f.shopName, 60)) return 'दुकान का नाम लिखें। / Enter the shop name.';
  if (!clean_(f.ownerName, 60)) return 'अपना नाम लिखें। / Enter your name.';
  if (!/^\d{10}$/.test(cleanMobile_(f.mobile))) return 'मोबाइल नंबर 10 अंकों का लिखें। / Mobile number should be 10 digits.';
  if (!/^[a-zA-Z0-9._-]{2,20}$/.test(String(f.loginName || '').trim())) {
    return 'लॉगिन नाम छोटा, अंग्रेज़ी अक्षरों में, बिना space (जैसे viju)। / Login name: English letters/numbers, no spaces (e.g. viju).';
  }
  if (!/^\d{4,8}$/.test(String(f.pin || '').trim())) return 'PIN 4 से 8 अंकों का हो। / PIN must be 4 to 8 digits.';
  if (String(f.pin).trim() !== String(f.pin2 || '').trim()) return 'दोनों PIN एक जैसे नहीं हैं। / The two PINs do not match.';
  return '';
}

/* ===================== Remembered progress (per visitor) ===================== */

function loadState_() {
  var raw = PropertiesService.getUserProperties().getProperty(STATE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function saveState_(st) {
  PropertiesService.getUserProperties().setProperty(STATE_KEY, JSON.stringify(st));
}

function safeState_() {
  try { return publicState_(loadState_()); } catch (e) { return publicState_(null); }
}

/** What the page may show. Holds no secret (no PIN, salt or hash). */
function publicState_(st) {
  var s = { stage: 'none', apiSettingsUrl: API_SETTINGS_URL };
  if (!st || !st.sheetId) return s;
  s.stage = st.done ? 'done' : 'partial';
  s.shopName = st.shopName || '';
  s.login = st.login || '';
  s.sheetUrl = st.sheetUrl || '';
  if (st.done && st.execUrl) {
    var link = APP_PAGE_URL + '?api=' + encodeURIComponent(st.execUrl);
    s.execUrl = st.execUrl;
    s.setupUrl = st.execUrl + '?setup=1';
    s.appLink = link;
    s.qr = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=' + encodeURIComponent(link);
    s.whatsapp = 'https://wa.me/?text=' + encodeURIComponent((st.shopName || 'DukanKaApp') + ' — दुकान का ऐप / shop app:\n' + link);
  }
  return s;
}

/* ===================== Apps Script API ===================== */

/**
 * Calls https://script.googleapis.com/v1/<path> with the visitor's own token.
 * Throws an Error with .httpCode; .apiOff when the visitor's "Google Apps Script API" switch is off;
 * .busy on rate limits.
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
  var res = UrlFetchApp.fetch(SCRIPT_API + path, opts);
  var code = res.getResponseCode();
  var text = res.getContentText();
  var data = {};
  try { data = JSON.parse(text || '{}'); } catch (e) { data = {}; }
  if (code >= 200 && code < 300) return data;
  var msg = (data && data.error && data.error.message) || String(text || '').slice(0, 300) || ('HTTP ' + code);
  var err = new Error('Apps Script API (' + code + '): ' + msg);
  err.httpCode = code;
  // "User has not enabled the Apps Script API. Enable it by visiting https://script.google.com/home/usersettings then retry."
  if (code === 403 && /usersettings|has not enabled the Apps Script API/i.test(msg)) err.apiOff = true;
  if (code === 429 || code === 503 || /quota|rate limit/i.test(msg)) err.busy = true;
  throw err;
}

/** The /exec URL from a Deployment resource, or ''. */
function webAppUrlOf_(dep) {
  var eps = (dep && dep.entryPoints) || [];
  for (var i = 0; i < eps.length; i++) {
    if (eps[i].entryPointType === 'WEB_APP' && eps[i].webApp && eps[i].webApp.url) return eps[i].webApp.url;
  }
  return '';
}

/* ===================== Backend code from GitHub (public, cached for all visitors) ===================== */

function githubBackend_() {
  var code = cachedDownload_('Code.gs');
  var manifestText = cachedDownload_('appsscript.json');
  var m = String(code).match(/var\s+APP_VERSION\s*=\s*['"]([0-9][0-9.]*)['"]/);
  var manifest = null;
  try { manifest = JSON.parse(manifestText); } catch (e) { manifest = null; }
  var looksRight = m && code.length > 20000 && code.indexOf('DukanKaApp') >= 0 && code.indexOf('function doPost') >= 0;
  if (!looksRight || !manifest || !manifest.webapp || !manifest.runtimeVersion) {
    forgetDownloads_();
    throw new Error('GitHub से कोड ठीक नहीं आया। थोड़ी देर बाद फिर कोशिश करें। / The app code from GitHub did not look right. Try again later.');
  }
  if (code.indexOf('function finishInstall_') < 0) {
    // An older backend could never finish the shop by itself. Developer must publish the new dist/.
    throw new Error('Installer and app code do not match (finishInstall_ missing in dist/Code.gs). Please tell the app developer.');
  }
  return { code: code, manifest: manifestText, version: m[1] };
}

function cachedDownload_(name) {
  var cache = CacheService.getScriptCache();
  var key = 'gh_' + name.replace(/\W/g, '_');
  try {
    var n = parseInt(cache.get(key + '_n'), 10);
    if (n > 0) {
      var keys = [];
      for (var i = 0; i < n; i++) keys.push(key + '_' + i);
      var got = cache.getAll(keys);
      if (keys.every(function (k) { return typeof got[k] === 'string'; })) {
        return keys.map(function (k) { return got[k]; }).join('');
      }
    }
  } catch (e) { /* cache miss */ }

  var res = UrlFetchApp.fetch(CODE_BASE_URL + name, { muteHttpExceptions: true, followRedirects: true });
  var code = res.getResponseCode();
  if (code !== 200) {
    var err = new Error('GitHub download failed (' + code + '): ' + name);
    err.httpCode = code;
    if (code === 429 || code >= 500) err.busy = true;
    throw err;
  }
  var text = res.getContentText('UTF-8');
  try {
    var put = {};
    var parts = Math.ceil(text.length / GH_CHUNK);
    for (var j = 0; j < parts; j++) put[key + '_' + j] = text.slice(j * GH_CHUNK, (j + 1) * GH_CHUNK);
    cache.putAll(put, GH_CACHE_SECONDS);
    cache.put(key + '_n', String(parts), GH_CACHE_SECONDS);
  } catch (e2) { /* too big for the cache: fine, next visitor downloads again */ }
  return text;
}

function forgetDownloads_() {
  try { CacheService.getScriptCache().removeAll(['gh_Code_gs_n', 'gh_appsscript_json_n']); } catch (e) { /* ignore */ }
}

/* ===================== Messages ===================== */

function friendlyError_(e) {
  var msg = String(e && e.message ? e.message : e);
  if (e && e.apiOff) {
    return 'आपके Google खाते में "Google Apps Script API" बंद है। / The "Google Apps Script API" switch is off in your Google account.';
  }
  if (e && e.busy) {
    return 'Google अभी व्यस्त है। 1–2 मिनट बाद "फिर से कोशिश करें" दबाएं। / Google is busy right now. Wait 1–2 minutes and tap "Try again". (' + msg + ')';
  }
  if (/Service invoked too many times|too many/i.test(msg)) {
    return 'आज बहुत बार कोशिश हो गई। कल फिर कोशिश करें। / Daily limit reached for this Google account. Try again tomorrow. (' + msg + ')';
  }
  if (/Authorization|permission|insufficient/i.test(msg) && !(e && e.httpCode)) {
    return 'Google की अनुमति पूरी नहीं हुई। पेज दोबारा खोलें और Allow दबाएं। / Permission missing: reopen this page and press Allow. (' + msg + ')';
  }
  return 'कुछ गड़बड़ हुई। "फिर से कोशिश करें" दबाएं। / Something went wrong. Tap "Try again". (' + msg + ')';
}

/* ===================== Page ===================== */

function pageHtml_(state) {
  var stateJson = JSON.stringify(state || {}).replace(/</g, '\\u003c');
  return [
    '<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><base target="_top">',
    '<style>',
    ':root{--navy:#1F3A5F;--navy-d:#142842;--ink:#15202B;--muted:#4A5763;--line:#DCE2E8;--line-2:#C3CCD5;--bg:#F5F7F9;',
    '--gold:#C9962B;--gold-bg:#FBF4E4;--gold-line:#E8D3A2;--gold-ink:#5B4300;--good:#1E6B45;--good-bg:#E7F3EC;--bad:#A3360F;--bad-bg:#FDF1EC}',
    '*{box-sizing:border-box}',
    'body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI","Noto Sans Devanagari",sans-serif;font-size:17px;line-height:1.5}',
    'header{background:var(--navy);color:#fff;padding:18px 16px;border-bottom:4px solid var(--gold)}',
    'header h1{margin:0;font-size:22px}header p{margin:2px 0 0;color:var(--gold-line);font-size:15px}',
    'main{max-width:520px;margin:0 auto;padding:16px}',
    '.en{color:var(--muted);font-size:14px;font-weight:normal}',
    '.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;margin:0 0 14px}',
    'label{display:block;margin:14px 0 4px;font-weight:bold}',
    'input{width:100%;font-size:19px;padding:12px;border:1px solid var(--line-2);border-radius:10px;background:#fff;color:var(--ink)}',
    'input:focus{outline:3px solid var(--gold-line);border-color:var(--gold)}',
    '.btn{display:block;width:100%;margin:12px 0;padding:16px 12px;border:0;border-radius:12px;font-size:19px;font-weight:bold;',
    'text-align:center;text-decoration:none;cursor:pointer;background:var(--navy);color:#fff;font-family:inherit}',
    '.btn small{display:block;font-size:14px;font-weight:normal;opacity:.9}',
    '.btn.gold{background:var(--gold);color:var(--ink)}.btn.green{background:var(--good)}.btn.plain{background:#fff;color:var(--navy);border:2px solid var(--navy)}',
    '.btn[disabled]{opacity:.6;cursor:wait}',
    '.err{background:var(--bad-bg);border:1px solid var(--bad);color:var(--bad);border-radius:10px;padding:12px;margin:12px 0;display:none}',
    '.note{background:var(--gold-bg);border:1px solid var(--gold-line);color:var(--gold-ink);border-radius:10px;padding:12px;margin:12px 0}',
    '.ok{background:var(--good-bg);border-color:var(--good);color:var(--good);font-weight:bold}',
    '.scr{display:none}.qr{text-align:center}.qr img{width:240px;height:240px;border:1px solid var(--line);border-radius:8px}',
    'ol{padding-left:22px;margin:8px 0}li{margin:8px 0}',
    '.spin{width:44px;height:44px;margin:16px auto;border:5px solid var(--gold-line);border-top-color:var(--navy);border-radius:50%;animation:s 1s linear infinite}',
    '@keyframes s{to{transform:rotate(360deg)}}',
    'textarea{width:100%;font-size:13px;height:80px;border:1px solid var(--line-2);border-radius:8px;padding:8px}',
    'details{margin:10px 0}summary{cursor:pointer;color:var(--navy);font-weight:bold}',
    '</style></head><body>',
    '<header><h1>DukanKaApp</h1><p>ज्वेलरी दुकान का मुफ़्त ऐप · Free app for jewellery shops</p></header>',
    '<main>',

    // ---- The form ----
    '<div id="form" class="scr">',
    '<div class="card"><h2 style="margin:0 0 4px">अपनी दुकान बनाएं <span class="en">/ Create your shop</span></h2>',
    '<p class="en" style="margin:0">सब कुछ आपके अपने Google Drive में बनेगा। / Everything is made in your own Google Drive.</p>',
    '<label>दुकान का नाम <span class="en">Shop name</span></label><input id="shopName" maxlength="60" placeholder="Shree Ganesh Jewellers">',
    '<label>आपका नाम <span class="en">Owner name</span></label><input id="ownerName" maxlength="60" placeholder="Vijay">',
    '<label>मोबाइल <span class="en">Mobile</span></label><input id="mobile" type="tel" inputmode="numeric" maxlength="14" placeholder="98XXXXXXXX">',
    '<label>शहर / गाँव <span class="en">City (optional)</span></label><input id="city" maxlength="60">',
    '<label>लॉगिन नाम <span class="en">Login name (English, no space)</span></label>',
    '<input id="loginName" maxlength="20" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="viju">',
    '<label>PIN <span class="en">4–8 अंक / digits</span></label><input id="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password">',
    '<label>PIN दोबारा <span class="en">PIN again</span></label><input id="pin2" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password">',
    '<p class="note">PIN याद रखें — ऐप में लॉगिन इसी से होगा। <span class="en">Remember the PIN: you log in with it.</span></p>',
    '<div id="formErr" class="err"></div>',
    '<button class="btn gold" onclick="create(this)">दुकान बनाएं<small>Create my shop</small></button>',
    '</div></div>',

    // ---- Working ----
    '<div id="working" class="scr"><div class="card" style="text-align:center">',
    '<div class="spin"></div><b>दुकान बन रही है…</b><br><span class="en">Creating your shop…</span>',
    '<p>1–2 मिनट लग सकते हैं। यह पेज बंद न करें।<br><span class="en">This can take 1–2 minutes. Keep this page open.</span></p>',
    '</div></div>',

    // ---- Unfinished install found ----
    '<div id="partial" class="scr"><div class="card">',
    '<h2 style="margin:0 0 6px">दुकान अधूरी है <span class="en">/ Not finished yet</span></h2>',
    '<p><b id="partialName"></b> — पिछली बार पूरी नहीं हुई। <span class="en">was not finished last time.</span></p>',
    '<button class="btn gold" onclick="resume(this)">आगे बढ़ाएं<small>Continue</small></button>',
    '<button class="btn plain" onclick="over(this)">नई दुकान शुरू से<small>Start a new shop instead</small></button>',
    '</div></div>',

    // ---- Apps Script API switch is off ----
    '<div id="apioff" class="scr"><div class="card">',
    '<h2 style="margin:0 0 6px">बस एक बटन चालू करना है <span class="en">/ Turn on one switch</span></h2>',
    '<ol>',
    '<li>नीचे नीला बटन दबाएं। नया पेज खुलेगा।<br><span class="en">Tap the blue button. A new page opens.</span></li>',
    '<li>वहाँ <b>Google Apps Script API</b> के सामने वाला बटन दबाकर <b>On</b> करें।<br><span class="en">Switch "Google Apps Script API" On.</span></li>',
    '<li>इस पेज पर लौटें और <b>फिर से कोशिश करें</b> दबाएं।<br><span class="en">Come back here and tap "Try again".</span></li>',
    '</ol>',
    '<a id="apiLink" class="btn" target="_blank" rel="noopener">सेटिंग खोलें<small>Open settings</small></a>',
    '<button class="btn gold" onclick="resume(this)">फिर से कोशिश करें<small>Try again</small></button>',
    '<p class="en">On करने के बाद कभी-कभी 1–2 मिनट लगते हैं। / After switching it on, it can take a minute to work.</p>',
    '<div id="apiErr" class="err"></div>',
    '</div></div>',

    // ---- Any other error ----
    '<div id="error" class="scr"><div class="card">',
    '<h2 style="margin:0 0 6px">रुकावट आई <span class="en">/ Something stopped</span></h2>',
    '<div id="errMsg" class="err" style="display:block"></div>',
    '<p class="en">आपका भरा हुआ फ़ॉर्म याद है, दोबारा भरना नहीं पड़ेगा। / Your form is remembered; no need to fill it again.</p>',
    '<button class="btn gold" onclick="resume(this)">फिर से कोशिश करें<small>Try again</small></button>',
    '</div></div>',

    // ---- Done: allow the shop app, then the link ----
    '<div id="done" class="scr">',
    '<div class="card ok">✅ <span id="doneName"></span> बन गई!<br><span class="en">Your shop is created.</span></div>',
    '<div class="card"><h2 style="margin:0 0 6px">आख़िरी कदम <span class="en">/ Last step (one time)</span></h2>',
    '<p>नीचे वाला बटन दबाएं। Google एक बार फिर अनुमति माँगेगा — यह आपके अपने दुकान ऐप के लिए है।<br>',
    '<span class="en">Tap the button. Google asks for permission once more — this time for your own shop app.</span></p>',
    '<a id="allowLink" class="btn gold" target="_blank" rel="noopener">अपने दुकान ऐप को अनुमति दें<small>Allow your shop app (one time)</small></a>',
    '<details><summary>वहाँ क्या दिखेगा? / What will I see?</summary><ol>',
    '<li><b>Authorization needed / Review permissions</b> → अपना Gmail चुनें।</li>',
    '<li><b>Google hasn\'t verified this app</b> → नीचे <b>Advanced</b> → <b>Go to … DukanKaApp (unsafe)</b>। यह सामान्य है: ऐप आपके अपने Drive में है।</li>',
    '<li><b>Allow</b> दबाएं। फिर "आपकी दुकान तैयार है" पेज खुलेगा।</li>',
    '</ol><p class="en">Choose your account → Advanced → Go to … (unsafe) → Allow. Then the "Your shop is ready" page opens.</p></details>',
    '</div>',
    '<div class="card"><b>अनुमति के बाद यह आपका ऐप लिंक है</b><br><span class="en">After you allow, this is your app link</span>',
    '<a id="openLink" class="btn" target="_blank" rel="noopener">ऐप खोलें<small>Open the app</small></a>',
    '<div class="qr"><p><b>दुकान के फ़ोन से QR स्कैन करें</b><br><span class="en">Scan with the shop phone</span></p><img id="qrImg" alt="QR"></div>',
    '<a id="waLink" class="btn green" target="_blank" rel="noopener">WhatsApp पर भेजें<small>Send on WhatsApp</small></a>',
    '<div class="note"><b>लॉगिन नाम / Login name: <span id="loginLine"></span></b><br>PIN — जो आपने चुना। <span class="en">PIN: the one you chose.</span></div>',
    '<label>लिंक / Link</label><textarea id="linkBox" readonly onclick="this.select()"></textarea>',
    '<p class="en">यह लिंक सिर्फ़ अपनी दुकान के लोगों को दें। अनुमति के बाद यह लिंक आपके ईमेल पर भी आएगा। / ',
    'Share it only with your shop staff. It is also emailed to you after you allow.</p>',
    '<p><a id="sheetLink" target="_blank" rel="noopener">आपकी Google Sheet / Your Google Sheet</a></p>',
    '</div>',
    '<button class="btn plain" onclick="over(this)">एक और दुकान बनाएं<small>Make another shop</small></button>',
    '</div>',

    '</main>',
    '<script>',
    'var S=' + stateJson + ';',
    'var lastForm=null;',
    'function $(id){return document.getElementById(id);}',
    'function show(id){var s=document.querySelectorAll(".scr");for(var i=0;i<s.length;i++)s[i].style.display="none";$(id).style.display="block";window.scrollTo(0,0);}',
    'function unbusy(){var b=document.querySelectorAll("button");for(var i=0;i<b.length;i++)b[i].disabled=false;}',
    'function render(){',
    '  if(S.stage==="done"&&S.appLink){done();return;}',
    '  if(S.stage==="partial"){$("partialName").textContent=S.shopName||"";show("partial");return;}',
    '  show("form");',
    '}',
    'function done(){',
    '  $("doneName").textContent=S.shopName||"दुकान"; $("allowLink").href=S.setupUrl; $("openLink").href=S.appLink;',
    '  $("qrImg").src=S.qr; $("waLink").href=S.whatsapp; $("linkBox").value=S.appLink; $("loginLine").textContent=S.login||"";',
    '  if(S.sheetUrl){$("sheetLink").href=S.sheetUrl;}else{$("sheetLink").style.display="none";}',
    '  show("done");',
    '}',
    'function onResult(r){',
    '  unbusy(); r=r||{}; if(r.state)S=r.state;',
    '  if(r.ok){done();return;}',
    '  var msg=r.error||"";',
    '  if(r.step==="form"){show("form");$("formErr").textContent=msg;$("formErr").style.display="block";return;}',
    '  if(r.step==="api_off"){$("apiLink").href=S.apiSettingsUrl||"' + API_SETTINGS_URL + '";$("apiErr").textContent=msg;$("apiErr").style.display=msg?"block":"none";show("apioff");return;}',
    '  $("errMsg").textContent=msg; show("error");',
    '}',
    'function onFail(e){onResult({ok:false,step:"error",error:String(e&&e.message||e)});}',
    'function run(form){show("working");google.script.run.withSuccessHandler(onResult).withFailureHandler(onFail).installShop(form||{});}',
    'function val(id){return $(id).value.trim();}',
    'function create(b){',
    '  var d={shopName:val("shopName"),ownerName:val("ownerName"),mobile:val("mobile"),city:val("city"),loginName:val("loginName"),pin:val("pin"),pin2:val("pin2")};',
    '  var m=d.mobile.replace(/\\D/g,""); if(m.length===12&&m.indexOf("91")===0)m=m.slice(2); if(m.length===11&&m.charAt(0)==="0")m=m.slice(1);',
    '  var err="";',
    '  if(!d.shopName)err="दुकान का नाम लिखें। / Enter the shop name.";',
    '  else if(!d.ownerName)err="अपना नाम लिखें। / Enter your name.";',
    '  else if(!/^\\d{10}$/.test(m))err="मोबाइल नंबर 10 अंकों का लिखें। / Mobile number should be 10 digits.";',
    '  else if(!/^[a-zA-Z0-9._-]{2,20}$/.test(d.loginName))err="लॉगिन नाम अंग्रेज़ी में, बिना space (जैसे viju)। / Login name: English letters/numbers, no spaces.";',
    '  else if(!/^\\d{4,8}$/.test(d.pin))err="PIN 4 से 8 अंकों का हो। / PIN must be 4 to 8 digits.";',
    '  else if(d.pin!==d.pin2)err="दोनों PIN एक जैसे नहीं हैं। / The two PINs do not match.";',
    '  if(err){$("formErr").textContent=err;$("formErr").style.display="block";return;}',
    '  $("formErr").style.display="none"; b.disabled=true; lastForm=d; run(d);',
    '}',
    'function resume(b){if(b)b.disabled=true;run(lastForm||{});}',
    'function over(b){',
    '  if(!confirm("नई दुकान शुरू करें? पहले बनी शीट Drive में रहेगी।\\nStart a new shop? The sheet made before stays in your Drive."))return;',
    '  if(b)b.disabled=true; lastForm=null;',
    '  google.script.run.withSuccessHandler(function(st){unbusy();S=st||{stage:"none"};show("form");}).withFailureHandler(onFail).startOver();',
    '}',
    'render();',
    '</script></body></html>'
  ].join('\n');
}
