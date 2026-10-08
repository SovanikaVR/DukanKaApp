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

function login_(data) {
  var username = String(data.username || '').trim().toLowerCase();
  var cache = CacheService.getScriptCache();
  var failKey = 'fail_' + username;
  var fails = num_(cache.get(failKey));
  if (fails >= 5) throw new Error('Too many wrong PINs. Try again after 10 minutes.');
  var u = findUser_(username);
  if (!u || u.active !== 'true' || hashPin_(u.salt, String(data.pin || '')) !== u.pinHash) {
    cache.put(failKey, String(fails + 1), 600);
    throw new Error('Wrong username or PIN');
  }
  cache.remove(failKey);
  var token = Utilities.getUuid() + Utilities.getUuid();
  var props = PropertiesService.getScriptProperties();
  cleanSessions_(props);
  props.setProperty('s_' + token, JSON.stringify({ u: u.id, exp: Date.now() + SESSION_DAYS * 86400000 }));
  audit_(u, 'login', u.id, {});
  return { token: token, user: publicUser_(u) };
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
  var u = find_('Users', s.u);
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
  if (patch.active === 'false' || patch.pinHash) dropSessionsOf_(u.id);
  audit_(user, 'user.update', u.id, { name: patch.name, role: patch.role, active: patch.active, pin: !!d.pin });
  return publicUser_(saved);
}
