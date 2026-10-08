/* App-wide state loaded after login. */
import { call } from './api.js';

export const S = { user: null, settings: {}, rate: null, today: '', version: '' };

export async function refresh() {
  const b = await call('bootstrap');
  Object.assign(S, b);
  return S;
}

export function modules() {
  try { return JSON.parse(S.settings.modules || '{}'); } catch (e) { return {}; }
}
export function modOn(name) {
  const m = modules();
  return m[name] !== false;
}
export const isOwner = () => S.user && S.user.role === 'owner';
export const isViewer = () => S.user && S.user.role === 'viewer';

export function setting(key, fallback = '') {
  const v = S.settings[key];
  return v === undefined || v === '' ? fallback : v;
}

export function list(key) {
  try { return JSON.parse(S.settings[key] || '[]'); } catch (e) { return []; }
}

/** Purity % for a karat button, from Settings (22K -> 91.6 by default). */
export function purityFor(k) {
  if (k === '24K') return setting('purity_24k', '99.9');
  if (k === '22K') return setting('purity_22k', '91.6');
  if (k === '18K') return setting('purity_18k', '75');
  return '';
}

/** Today's per-gram rate for a karat. */
export function rateFor(k) {
  const r = S.rate || {};
  if (k === '24K') return r.g24 || '';
  if (k === '22K') return r.g22 || '';
  if (k === '18K') return r.g18 || '';
  if (k === 'Silver') return r.silver || '';
  return '';
}
