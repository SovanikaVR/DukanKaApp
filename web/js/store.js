/* The phone's own storage for the shop's saved screens and customer list (IndexedDB: much bigger than localStorage).
 * If the phone does not allow it (private mode), everything still works, just without keeping data. */

const DB = 'dukankaapp', VER = 1, STORES = ['kept', 'cust'];
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      if (!('indexedDB' in self)) return resolve(null);
      const req = indexedDB.open(DB, VER);
      req.onupgradeneeded = () => { STORES.forEach((s) => { if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
      setTimeout(() => resolve(null), 3000); // never wait long for storage
    } catch (e) { resolve(null); }
  });
  return dbp;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve) => {
    if (!db) return resolve(undefined);
    try {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      const r = fn(s);
      t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      t.onerror = () => resolve(undefined);
      t.onabort = () => resolve(undefined);
    } catch (e) { resolve(undefined); }
  }));
}

export const idbGet = (store, key) => tx(store, 'readonly', (s) => s.get(key));
export const idbPut = (store, key, val) => tx(store, 'readwrite', (s) => s.put(val, key));
export const idbDel = (store, key) => tx(store, 'readwrite', (s) => s.delete(key));
export const idbClear = (store) => tx(store, 'readwrite', (s) => s.clear());

/** Every [key, value] of a store. */
export function idbAll(store) {
  return open().then((db) => new Promise((resolve) => {
    if (!db) return resolve([]);
    try {
      const out = [];
      const req = db.transaction(store, 'readonly').objectStore(store).openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { out.push([c.key, c.value]); c.continue(); } else resolve(out); };
      req.onerror = () => resolve(out);
    } catch (e) { resolve([]); }
  }));
}
