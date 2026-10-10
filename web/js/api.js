/* Talks to the shop's own Apps Script web app. */

const KEY_API = 'dk_api';
const KEY_TOKEN = 'dk_token';

function store(key, val) {
  try {
    if (val === undefined) return localStorage.getItem(key);
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch (e) { /* private mode: keep going in memory */ }
  return null;
}

const mem = {};
export function apiUrl(v) {
  if (v !== undefined) { mem.api = v; store(KEY_API, v); }
  return mem.api || store(KEY_API) || '';
}
export function token(v) {
  if (v !== undefined) { mem.token = v; store(KEY_TOKEN, v); }
  return mem.token || store(KEY_TOKEN) || '';
}

let onExpired = () => {};
export function onSessionExpired(fn) { onExpired = fn; }

export class ApiError extends Error {}

/** Actions that only read. Everything else is a save and gets a request id. */
const READS = new Set(['ping', 'bootstrap', 'rates.list', 'customers.search', 'customers.get', 'sale.list', 'sale.get',
  'oldgold.list', 'loans.list', 'loans.get', 'orders.list', 'orders.get', 'repairs.list', 'stock.list', 'stock.summary', 'stock.photo',
  'melt.list', 'fine.summary', 'parties.list', 'parties.ledger', 'cash.list', 'reports.daily', 'reports.month',
  'reports.position', 'users.list', 'dues.list', 'home.summary', 'auth.login', 'auth.logout']);

let pendingRid = null;
let lost = null;
/** The next save uses this request id (set by the form's Save button, see ui.busy). */
export function useRid(r) { pendingRid = r; }

const newRid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

async function post(target, payload, ms) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), ms) : null;
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: ctl ? ctl.signal : undefined
    });
    return await res.json();
  } finally { if (timer) clearTimeout(timer); }
}

/**
 * call('sale.create', {...}) -> data. POST with text/plain so the browser sends it
 * without a CORS pre-flight (Apps Script does not answer OPTIONS requests).
 * Saves carry a request id, so trying again after a slow or broken connection never saves twice.
 */
/* ---------- Instant screens: answers to reads are kept on the phone ----------
 * A screen opened again shows the saved answer at once, while the fresh one is fetched in the background.
 * If the fresh answer is different, 'dk-fresh' is sent and the screen redraws itself. Any save clears this. */
const NO_KEEP = new Set(['ping', 'auth.login', 'auth.logout', 'bootstrap', 'export.list', 'sale.export', 'stock.photo']);
const KEEP_MS = 30 * 60 * 1000;
const kept = new Map();
const keepKey = (action, data) => token().slice(-8) + '|' + action + '|' + JSON.stringify(data || {}); // per login: never shows one user's data to another
(function loadKept() {
  try {
    const all = JSON.parse(localStorage.getItem('dk_kept') || '[]');
    all.forEach(([k, v]) => { if (Date.now() - v.t < KEEP_MS) kept.set(k, v); });
  } catch (e) { /* ignore */ }
})();
let saveTimer = null;
function persistKept() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const all = [...kept.entries()].sort((a, b) => b[1].t - a[1].t).slice(0, 40);
      localStorage.setItem('dk_kept', JSON.stringify(all));
    } catch (e) { try { localStorage.removeItem('dk_kept'); } catch (x) { /* ignore */ } }
  }, 500);
}
export function forgetKept() { kept.clear(); try { localStorage.removeItem('dk_kept'); } catch (e) { /* ignore */ } }

export async function call(action, data = {}, url) {
  if (!url && READS.has(action) && !NO_KEEP.has(action) && token()) {
    const key = keepKey(action, data);
    const hit = kept.get(key);
    const fresh = () => callNet(action, data).then((d) => {
      const s = JSON.stringify(d);
      if (s.length < 300000) { kept.set(key, { t: Date.now(), s }); persistKept(); }
      return { d, changed: !hit || hit.s !== s };
    });
    if (hit && Date.now() - hit.t < KEEP_MS) {
      fresh().then((r) => { if (r.changed) document.dispatchEvent(new CustomEvent('dk-fresh', { detail: action })); }).catch(() => {});
      return JSON.parse(hit.s);
    }
    return (await fresh()).d;
  }
  return callNet(action, data, url);
}

async function callNet(action, data = {}, url) {
  const target = url || apiUrl();
  if (!target) throw new ApiError('App is not connected to a shop yet');
  const isSave = !READS.has(action);
  let rid = null;
  const sig = isSave ? action + '|' + JSON.stringify(data) : '';
  if (isSave) {
    // Exactly the same save as one whose reply was lost: send the same id, so it is not saved twice.
    rid = pendingRid || (lost && lost.sig === sig && Date.now() - lost.at < 120000 ? lost.rid : newRid());
    pendingRid = null;
  }
  const payload = { action, token: token(), data: isSave ? Object.assign({ _rid: rid }, data) : data };
  let body = null, lastErr = null;
  for (let attempt = 0; attempt < 2 && !body; attempt++) {
    try {
      body = await post(target, payload, isSave ? 45000 : 30000);
    } catch (e) {
      lastErr = e;
      if (e && e.name === 'AbortError') break; // already waited long enough: tell the user
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!body) {
    if (isSave) lost = { sig, rid, at: Date.now() };
    if (lastErr && lastErr.name === 'AbortError') throw new ApiError('The shop is taking too long to answer. Please try again.');
    if (lastErr instanceof SyntaxError) throw new ApiError('The shop link did not answer correctly. Check the web app link in Settings.');
    throw new ApiError('No internet, or the shop link is wrong. Please try again.');
  }
  if (!body.ok) {
    if (body.error === 'SESSION_EXPIRED' || body.error === 'Please log in') {
      token(null);
      onExpired();
      throw new ApiError('Please log in again');
    }
    throw new ApiError(body.error || 'Something went wrong');
  }
  if (isSave && lost && lost.sig === sig) lost = null;
  if (isSave) forgetKept(); // something changed: screens read fresh data next time
  if (body.data && body.data._saved === true) throw new ApiError('This was already saved. Please open the list to see it.');
  return body.data;
}
