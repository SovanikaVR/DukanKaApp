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
  var pin = ui.prompt('New PIN', '6 to 8 digits:', ui.ButtonSet.OK_CANCEL);
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
  markWritten_('Sales');
  if (!oldId) setSetting_('archive_' + fy, arch.getId());
  audit_(user, 'archive', fy, { bills: move.length, file: arch.getId() });
  return { moved: move.length, fileUrl: arch.getUrl() };
}
