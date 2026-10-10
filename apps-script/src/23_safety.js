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
  // Safety: the shop's sheet should not be open to everyone with the link, and should have few other editors.
  var warnings = sharingWarnings_();
  warnings.forEach(function (w) { problems.push(w); });
  return { ok: !problems.length, problems: problems.slice(0, 50), count: problems.length, checkedAt: nowIso_() };
}

function sharingWarnings_() {
  var out = [];
  try {
    var file = DriveApp.getFileById(ss_().getId());
    var access = String(file.getSharingAccess());
    if (access === 'ANYONE' || access === 'ANYONE_WITH_LINK') out.push('SAFETY: the Google Sheet can be opened by anyone with its link. Open the sheet → Share → General access → Restricted.');
    else if (access === 'DOMAIN' || access === 'DOMAIN_WITH_LINK') out.push('SAFETY: the Google Sheet is shared with a whole organisation. Set Share → General access → Restricted.');
    var editors = file.getEditors().map(function (e) { return e.getEmail(); }).filter(Boolean);
    if (editors.length) out.push('SAFETY: these Google accounts can change the sheet directly: ' + editors.join(', ') + '. Remove anyone who should not (Share).');
  } catch (e) { /* no Drive access: skip */ }
  return out;
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
    bumpDataVersion_(); bumpCustEdits_();
    audit_(null, 'restore', fileId, { tabs: tabs });
    return { tabs: tabs };
  } finally { lock.releaseLock(); }
}
