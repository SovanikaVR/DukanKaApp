/* Shop pictures kept on this phone. Answers from the shop carry only "img:<ref>"; the picture itself
 * is downloaded once (when it changes) and drawn from here — bills and app start stay small and fast. */
import { call } from './api.js';
import { S } from './state.js';

const KEY = 'dk_img';
let store = null;
function load() {
  if (store) return store;
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { store = {}; }
  return store;
}

/** "img:ref" -> data URL (or '' if not here yet); a data URL or '' is returned as it is. */
export function imgSrc(v) {
  if (!v || typeof v !== 'string') return '';
  if (!v.startsWith('img:')) return v;
  return load()[v] || '';
}

let pending = null;
/** Makes sure every picture the shop uses is on the phone. Cheap when nothing changed. */
export function ensureImages(more = []) {
  const refs = ['shop_logo', 'quote_logo', 'bill_pic_right'].map((k) => S.settings && S.settings[k]).concat(more)
    .filter((v) => v && String(v).startsWith('img:'));
  const have = load();
  if (refs.every((r) => have[r])) return Promise.resolve();
  if (pending) return pending;
  pending = call('settings.images').then((imgs) => {
    store = Object.assign({}, imgs); // only the current pictures are kept
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage full: still works this session */ }
  }).catch(() => {}).finally(() => { pending = null; });
  return pending;
}
