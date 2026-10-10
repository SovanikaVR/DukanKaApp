/* ---------- Users, PIN login and sessions ---------- */

var SESSION_DAYS = 30;

function hashPin_(salt, pin) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function publicUser_(u) {
  return { id: u.id, name: u.name, username: u.username, role: u.role, active: u.active === 'true' };
}

function findUser_(username) {
  var uname = String(username || '').trim().toLowerCase();
  var list = rows_('Users');
  for (var i = 0; i < list.length; i++) if (list[i].username.toLowerCase() === uname) return list[i];
  return null;
}

function createUser_(name, username, role, pin) {
  req_(name && username, 'Name and username are needed');
  req_(/^\d{4,8}$/.test(String(pin || '')), 'PIN must be 4 to 8 digits');
  req_(['owner', 'employee', 'viewer'].indexOf(role) >= 0, 'Role must be owner, employee or viewer');
  req_(!findUser_(username), 'This username is already used');
  var salt = Utilities.getUuid();
  return insert_('Users', {
    id: uid_('U'), name: name, username: String(username).trim().toLowerCase(), role: role,
    salt: salt, pinHash: hashPin_(salt, String(pin)), active: 'true', createdAt: nowIso_()
  });
}

/* Wrong-PIN protection. Kept in Script Properties (not the cache, which Google may empty), per login name:
 * 5 wrong PINs → locked 15 minutes; every further 5 → twice as long (up to 24 hours). The owner is emailed.
 * The owner can unlock a user by setting a new PIN (Settings → Users, or the sheet menu "Reset an owner PIN"). */
var LOCK_AFTER = 5;
function loginFails_(username) {
  return json_(PropertiesService.getScriptProperties().getProperty('lf_' + username), { n: 0, until: 0 });
}
function clearLoginFails_(username) {
  try { PropertiesService.getScriptProperties().deleteProperty('lf_' + String(username || '').toLowerCase()); } catch (e) { /* ignore */ }
}

function login_(data) {
  var username = String(data.username || '').trim().toLowerCase().slice(0, 60);
  req_(username, 'Wrong username or PIN');
  var props = PropertiesService.getScriptProperties();
  var f = loginFails_(username);
  if (f.until > Date.now()) {
    var mins = Math.ceil((f.until - Date.now()) / 60000);
    throw new Error('Too many wrong PINs. Try again after ' + (mins > 90 ? Math.ceil(mins / 60) + ' hours' : mins + ' minutes') + ', or ask the owner to set a new PIN.');
  }
  var u = findUser_(username);
  if (!u || u.active !== 'true' || hashPin_(u.salt, String(data.pin || '')) !== u.pinHash) {
    f.n = (f.n || 0) + 1;
    if (f.n % LOCK_AFTER === 0) {
      f.until = Date.now() + Math.min(15 * 60000 * Math.pow(2, f.n / LOCK_AFTER - 1), 86400000);
      alertOwnerLogin_(username, f.n);
    }
    props.setProperty('lf_' + username, JSON.stringify(f));
    audit_(null, 'login.failed', username, { fails: f.n });
    throw new Error('Wrong username or PIN');
  }
  if (f.n) props.deleteProperty('lf_' + username);
  var token = Utilities.getUuid() + Utilities.getUuid();
  var props = PropertiesService.getScriptProperties();
  cleanSessions_(props);
  props.setProperty('s_' + token, JSON.stringify({ u: u.id, exp: Date.now() + SESSION_DAYS * 86400000 }));
  audit_(u, 'login', u.id, {});
  return { token: token, user: publicUser_(u) };
}

/** Emails the owner (nightly-report address, else the Google account) when a login gets locked. At most once an hour per name. */
function alertOwnerLogin_(username, fails) {
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get('lfmail_' + username)) return;
    cache.put('lfmail_' + username, '1', 3600);
    var to = settings_().report_email || Session.getEffectiveUser().getEmail();
    if (!to) return;
    MailApp.sendEmail(to, 'DukanKaApp: wrong PINs for "' + username + '"',
      fails + ' wrong PIN tries for the login name "' + username + '" on ' + settings_().shop_name + '. The login is locked for a while.\n\n' +
      'If this was not you or your staff, change that PIN in the app (Settings → Users) and use "Log out all phones".');
  } catch (e) { /* email is best effort */ }
}

/** Owner: log out every phone (lost phone, staff left). Keeps the phone that asked. */
function logoutAll_(user, token) {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var n = 0;
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('s_') === 0 && k !== 's_' + token) { props.deleteProperty(k); n++; }
  });
  audit_(user, 'auth.logoutAll', '', { sessions: n });
  return { loggedOut: n };
}

function cleanSessions_(props) {
  var all = props.getProperties();
  var now = Date.now();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('s_') !== 0) return;
    var s = json_(all[k], null);
    if (!s || s.exp < now) props.deleteProperty(k);
  });
}

function sessionUser_(token) {
  req_(token, 'Please log in');
  var props = PropertiesService.getScriptProperties();
  var s = json_(props.getProperty('s_' + token), null);
  if (!s || s.exp < Date.now()) throw new Error('SESSION_EXPIRED');
  // The user record is kept in the cache for 10 minutes, so a request does not have to open the sheet just to check the login.
  var cache = CacheService.getScriptCache();
  var u = json_(cache.get('u_' + s.u), null);
  if (!u) {
    u = find_('Users', s.u);
    if (u) try { cache.put('u_' + s.u, JSON.stringify(u), 600); } catch (e) { /* ignore */ }
  }
  if (!u || u.active !== 'true') throw new Error('SESSION_EXPIRED');
  return u;
}

function logout_(token) {
  PropertiesService.getScriptProperties().deleteProperty('s_' + token);
  return { ok: true };
}

/** Removes every session of one user (used when the owner switches a user off). */
function dropSessionsOf_(userId) {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('s_') !== 0) return;
    var s = json_(all[k], null);
    if (s && s.u === userId) props.deleteProperty(k);
  });
}

function usersList_() {
  return rows_('Users').map(publicUser_);
}

function usersSave_(user, d) {
  if (!d.id) {
    req_((d.role || 'employee') !== 'owner' || String(d.pin || '').length >= 6, 'The owner PIN must be at least 6 digits');
    var nu = createUser_(d.name, d.username, d.role || 'employee', d.pin);
    audit_(user, 'user.add', nu.id, { username: nu.username, role: nu.role });
    return publicUser_(nu);
  }
  var u = find_('Users', d.id);
  req_(u, 'User not found');
  var patch = {};
  if (d.name) patch.name = d.name;
  if (d.role) {
    req_(['owner', 'employee', 'viewer'].indexOf(d.role) >= 0, 'Bad role');
    patch.role = d.role;
  }
  if (d.active !== undefined) patch.active = d.active ? 'true' : 'false';
  if (d.pin) {
    req_(/^\d{4,8}$/.test(String(d.pin)), 'PIN must be 4 to 8 digits');
    req_((patch.role || u.role) !== 'owner' || String(d.pin).length >= 6, 'The owner PIN must be at least 6 digits');
    patch.salt = Utilities.getUuid();
    patch.pinHash = hashPin_(patch.salt, String(d.pin));
  }
  // Never lock the shop out: keep at least one active owner.
  var owners = rows_('Users').filter(function (x) {
    var role = x.id === u.id ? (patch.role || x.role) : x.role;
    var active = x.id === u.id ? (patch.active || x.active) : x.active;
    return role === 'owner' && active === 'true';
  });
  req_(owners.length > 0, 'At least one active owner is needed');
  var saved = update_('Users', u.id, patch);
  try { CacheService.getScriptCache().remove('u_' + u.id); } catch (e) { /* ignore */ }
  if (patch.active === 'false' || patch.pinHash) dropSessionsOf_(u.id);
  if (patch.pinHash) clearLoginFails_(u.username);
  audit_(user, 'user.update', u.id, { name: patch.name, role: patch.role, active: patch.active, pin: !!d.pin });
  return publicUser_(saved);
}
