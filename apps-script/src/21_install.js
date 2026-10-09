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
