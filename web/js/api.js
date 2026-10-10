/* Talks to the shop's own Apps Script web app. */
import { idbAll, idbPut, idbDel, idbClear } from './store.js';

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
const READS = new Set(['ping', 'bootstrap', 'settings.images', 'rates.list', 'customers.search', 'customers.get', 'sale.list', 'sale.get',
  'oldgold.list', 'loans.list', 'loans.get', 'orders.list', 'orders.get', 'repairs.list', 'stock.list', 'stock.summary', 'stock.photo',
  'melt.list', 'fine.summary', 'parties.list', 'parties.ledger', 'cash.list', 'reports.daily', 'reports.month',
  'reports.position', 'users.list', 'dues.list', 'home.summary', 'auth.login', 'auth.logout', 'customers.sync']);

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
/* ---------- Instant screens: answers are kept on the phone and updated in the background ----------
 * Every list / screen answer is kept in the phone's storage (IndexedDB) for a day. Opening a screen shows the kept
 * answer at once and asks the shop for the fresh one in the background; if it changed, 'dk-fresh' redraws the screen.
 * After a save, kept answers are NOT thrown away: they are marked old and still shown at once (with "Updating…"),
 * except for a few seconds right after the save — the screen you go to after saving always waits for fresh data,
 * so a payment never shows the old baki. Pull down on a list (or the ↻ button) to fetch fresh data now. */
const NO_KEEP = new Set(['ping', 'auth.login', 'auth.logout', 'bootstrap', 'settings.images', 'export.list', 'sale.export', 'stock.photo', 'customers.sync']);
const KEEP_MS = 24 * 3600 * 1000;
const MAX_KEPT = 200;
const kept = new Map();
const keepKey = (action, data) => token().slice(-8) + '|' + action + '|' + JSON.stringify(data || {}); // per login: never shows one user's data to another
let freshUntil = 0; // reads before this time wait for the shop (right after a save, or pull-to-refresh)
let busyBg = 0;
const syncEvent = () => document.dispatchEvent(new CustomEvent('dk-sync', { detail: busyBg }));

const keptReady = (async () => {
  try { localStorage.removeItem('dk_kept'); } catch (e) { /* old versions kept answers here */ }
  const all = await idbAll('kept');
  const now = Date.now();
  all.sort((a, b) => b[1].t - a[1].t).forEach(([k, v], i) => {
    if (now - v.t < KEEP_MS && i < MAX_KEPT) kept.set(k, v); else idbDel('kept', k);
  });
})();

function keep(key, s) {
  const v = { t: Date.now(), s };
  kept.set(key, v);
  idbPut('kept', key, v);
  if (kept.size > MAX_KEPT) {
    const oldest = [...kept.entries()].sort((a, b) => a[1].t - b[1].t)[0];
    if (oldest) { kept.delete(oldest[0]); idbDel('kept', oldest[0]); }
  }
}

/** After logging out (or being logged out) nothing of the shop stays on this phone: saved screens, customer list, pictures. */
export function wipeLocal() {
  try {
    Object.keys(localStorage).forEach((k) => { if (/^dk_/.test(k) && !['dk_api', 'dk_lang', 'dk_paper', 'dk_thermal', 'dk_token'].includes(k)) localStorage.removeItem(k); });
  } catch (e) { /* ignore */ }
  kept.clear();
  idbClear('kept'); idbClear('cust');
}

export function forgetKept() { kept.clear(); idbClear('kept'); }

/** Pull-to-refresh: the next screen reads wait for fresh data from the shop. */
export function refreshNow() { freshUntil = Date.now() + 6000; }

/** Is a fresh-enough answer for this read already on the phone? (used by the background pre-load) */
export function haveFresh(action, data, maxAgeMs) {
  const hit = kept.get(keepKey(action, data));
  return !!hit && Date.now() - hit.t < maxAgeMs && !hit.old;
}

export async function call(action, data = {}, url) {
  if (!url && READS.has(action) && !NO_KEEP.has(action) && token()) {
    await keptReady;
    const key = keepKey(action, data);
    const hit = kept.get(key);
    const fresh = () => callNet(action, data).then((d) => {
      const s = JSON.stringify(d);
      if (s.length < 600000) keep(key, s);
      return { d, changed: !hit || hit.s !== s };
    });
    if (hit && Date.now() - hit.t < KEEP_MS && Date.now() > freshUntil) {
      busyBg++; syncEvent();
      fresh().then((r) => { if (r.changed) document.dispatchEvent(new CustomEvent('dk-fresh', { detail: action })); })
        .catch(() => {}).finally(() => { busyBg--; syncEvent(); });
      return JSON.parse(hit.s);
    }
    try { return (await fresh()).d; } catch (e) {
      if (hit) return JSON.parse(hit.s); // no internet: the kept answer is better than nothing
      throw e;
    }
  }
  return callNet(action, data, url);
}

/** Loads answers into the phone in the background (one at a time), so the first tap on a screen is instant too. */
export async function preload(list) {
  await keptReady;
  for (const [action, data] of list) {
    if (!token() || haveFresh(action, data, 10 * 60 * 1000)) continue;
    try {
      busyBg++; syncEvent();
      const d = await callNet(action, data);
      const s = JSON.stringify(d);
      if (s.length < 600000) keep(keepKey(action, data), s);
    } catch (e) { break; } // offline or slow: try again next time
    finally { busyBg--; syncEvent(); }
  }
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
  if (isSave) {
    // Something changed. Kept answers stay (shown at once, refreshed in the background), but for a few seconds
    // every read waits for the shop: the screen opened right after a save always shows the new data.
    kept.forEach((v) => { v.old = true; });
    freshUntil = Date.now() + 6000;
    document.dispatchEvent(new CustomEvent('dk-saved', { detail: action }));
  }
  if (body.data && body.data._saved === true) throw new ApiError('This was already saved. Please open the list to see it.');
  return body.data;
}
