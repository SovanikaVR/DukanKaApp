/* Search history kept on this phone: the last customers opened/picked and the last search words.
 * Kept per shop (by app link), so two shops on one phone never mix. */
import { apiUrl } from './api.js';

const KEY = 'dk_recent';
const MAX_CUST = 12, MAX_WORDS = 8;

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (d.api === apiUrl()) return { api: d.api, cust: d.cust || [], words: d.words || [] };
  } catch (e) { /* ignore */ }
  return { api: apiUrl(), cust: [], words: [] };
}
function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } }

/** c: {id, name, mobile, village} */
export function rememberCustomer(c) {
  if (!c || !c.id || String(c.id).startsWith('new')) return;
  const d = load();
  d.cust = [{ id: c.id, name: c.name || '', mobile: c.mobile || '', village: c.village || '' },
    ...d.cust.filter((x) => x.id !== c.id)].slice(0, MAX_CUST);
  save(d);
}
export function recentCustomers() { return load().cust; }

export function rememberWords(q) {
  q = String(q || '').trim();
  if (q.length < 2) return;
  const d = load();
  d.words = [q, ...d.words.filter((w) => w.toLowerCase() !== q.toLowerCase() && !q.toLowerCase().startsWith(w.toLowerCase()))].slice(0, MAX_WORDS);
  save(d);
}
export function recentWords() { return load().words; }

export function forgetRecent(id) {
  const d = load();
  if (id) d.cust = d.cust.filter((x) => x.id !== id); else { d.cust = []; d.words = []; }
  save(d);
}
