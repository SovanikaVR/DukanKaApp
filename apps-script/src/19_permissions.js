/* Permissions helper (sheet menu → Allow permissions). */
/** Run this once from the Apps Script editor (or the sheet menu) after an update that needs new Google permissions. */
function allowPermissions() {
  UrlFetchApp.fetch('https://api.gold-api.com/price/XAU', { muteHttpExceptions: true });
  ScriptApp.getProjectTriggers();
  try { SpreadsheetApp.getUi().alert('Done. Permissions are allowed. / अनुमति मिल गई।'); } catch (e) { Logger.log('Permissions are allowed.'); }
}
