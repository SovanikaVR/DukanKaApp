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
  'oldgold.list', 'loans.list', 'loans.get', 'orders.list', 'orders.get', 'repairs.list', 'stock.list', 'stock.summary',
  'melt.list', 'fine.summary', 'parties.list', 'parties.ledger', 'cash.list', 'reports.daily', 'reports.month',
  'reports.position', 'users.list', 'dues.list', 'home.summary', 'auth.login', 'auth.logout']);

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
export async function call(action, data = {}, url) {
  const target = url || apiUrl();
  if (!target) throw new ApiError('App is not connected to a shop yet');
  const isSave = !READS.has(action);
  const payload = { action, token: token(), data: isSave ? Object.assign({ _rid: newRid() }, data) : data };
  let body = null, lastErr = null;
  for (let attempt = 0; attempt < 2 && !body; attempt++) {
    try {
      body = await post(target, payload, isSave ? 60000 : 45000);
    } catch (e) {
      lastErr = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!body) {
    if (lastErr && lastErr.name === 'AbortError') throw new ApiError('Internet is very slow. Please check and try again.');
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
  return body.data;
}
