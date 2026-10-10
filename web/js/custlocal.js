/* Customer list kept on the phone: search is instant (and works without internet).
 * Synced from the shop when the app opens, after every save, and when the search screen opens. Only new
 * customers are downloaded, unless a customer was edited somewhere (then the whole list once). */
import { call, apiUrl, token } from './api.js';
import { idbGet, idbPut } from './store.js';

let list = null;          // { api, n, e, rows: [[id, first, last, mobile, village], …] }
let loading = null;
let syncing = null;
let lastSync = 0;

function load() {
  if (list) return Promise.resolve(list);
  if (!loading) loading = idbGet('cust', 'list').then((v) => { list = v && v.api === apiUrl() ? v : { api: apiUrl(), n: 0, e: '', rows: [] }; return list; });
  return loading;
}

/** Brings the phone's list up to date (cheap when nothing changed). */
export function syncCustomers(force) {
  if (!token()) return Promise.resolve();
  if (syncing) return syncing;
  if (!force && Date.now() - lastSync < 20000) return Promise.resolve();
  syncing = load().then(async (l) => {
    const r = await call('customers.sync', { n: l.n, e: l.e });
    const rows = r.from === 0 ? r.rows : l.rows.slice(0, r.from).concat(r.rows);
    list = { api: apiUrl(), n: rows.length, e: r.e, rows };
    lastSync = Date.now();
    await idbPut('cust', 'list', list);
  }).catch(() => {}).finally(() => { syncing = null; });
  return syncing;
}

export async function hasLocalCustomers() { const l = await load(); return l.rows.length > 0; }

/** Same rules as the shop's search: name start, surname start, both words, mobile digits, village. */
export async function searchLocal(q, village) {
  const l = await load();
  q = String(q || '').trim().toLowerCase().replace(/\s+/g, ' ');
  village = String(village || '').trim().toLowerCase();
  let digits = q.replace(/\D/g, '');
  if (digits.length > 10 && /^(91|0)/.test(digits)) digits = digits.slice(-10);
  const words = q.split(' ');
  const scored = [];
  const villages = {};
  for (const [id, first, last, mobile, vil] of l.rows) {
    if (vil) villages[vil] = (villages[vil] || 0) + 1;
    if (village && String(vil).toLowerCase() !== village) continue;
    const fn = String(first).toLowerCase(), ln = String(last).toLowerCase(), vl = String(vil).toLowerCase();
    let s = 0, m = '';
    if (!q) s = 1;
    else if (fn.startsWith(q)) { s = 5; m = 'name'; } else if (ln.startsWith(q)) { s = 4; m = 'surname'; }
    else if ((fn + ' ' + ln).includes(q) || (ln + ' ' + fn).includes(q)) { s = 3; m = 'name'; }
    else if (words.length > 1 && words.every((w) => (fn + ' ' + ln + ' ' + vl).includes(w))) { s = 3; m = 'name'; }
    else if (digits.length >= 3 && String(mobile).includes(digits)) { s = 2; m = 'mobile'; }
    else if (vl.startsWith(q)) { s = 1; m = 'village'; }
    if (s) scored.push({ id, first, last, mobile, vil, s, m });
  }
  scored.sort((a, b) => b.s - a.s || (a.first < b.first ? -1 : 1));
  return {
    results: scored.slice(0, 40).map((x) => ({ id: x.id, name: (x.first + ' ' + x.last).trim(), firstName: x.first, lastName: x.last,
      mobile: x.mobile, village: x.vil, matched: x.m, local: true })),
    total: scored.length,
    villages: Object.keys(villages).sort((a, b) => villages[b] - villages[a]).slice(0, 12),
    local: true
  };
}
