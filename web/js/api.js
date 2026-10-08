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

/**
 * call('sale.create', {...}) -> data. POST with text/plain so the browser sends it
 * without a CORS pre-flight (Apps Script does not answer OPTIONS requests).
 */
export async function call(action, data = {}, url) {
  const target = url || apiUrl();
  if (!target) throw new ApiError('App is not connected to a shop yet');
  let res;
  try {
    res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: token(), data }),
      redirect: 'follow'
    });
  } catch (e) {
    throw new ApiError('No internet, or the shop link is wrong. Please try again.');
  }
  let body;
  try { body = await res.json(); } catch (e) {
    throw new ApiError('The shop link did not answer correctly. Check the web app link in Settings.');
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
