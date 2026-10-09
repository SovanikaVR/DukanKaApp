/**
 * Tiny in-memory stand-in for the Google Apps Script services the backend uses,
 * so the backend can be tested with plain Node:  node tests/backend.test.js
 */
const crypto = require('crypto');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

function makeSheet(name) {
  const sh = {
    name, data: [],
    getName: () => sh.name,
    setName: (n) => { sh.name = n; },
    getLastRow: () => sh.data.length,
    appendRow: (row) => { sh.data.push(row.map(String)); },
    setFrozenRows: () => {},
    getRange: (r, c, nr, nc) => {
      if (typeof r === 'string') return {
        setNumberFormat: () => ({}),
        // Column A search like Google's TextFinder (used to look up one row by id).
        createTextFinder: (text) => ({ matchEntireCell() { return this; }, findNext: () => {
          const i = sh.data.findIndex((row) => String(row[0]) === String(text));
          return i < 0 ? null : { getRow: () => i + 1 };
        } })
      };
      nr = nr || 1; nc = nc || 1;
      return {
        setNumberFormat: () => ({}),
        setFontWeight: () => ({}),
        getValues: () => {
          const out = [];
          for (let i = 0; i < nr; i++) {
            const row = sh.data[r - 1 + i] || [];
            const o = [];
            for (let j = 0; j < nc; j++) o.push(row[c - 1 + j] !== undefined ? row[c - 1 + j] : '');
            out.push(o);
          }
          return out;
        },
        setValues: (vals) => {
          vals.forEach((row, i) => {
            const idx = r - 1 + i;
            while (sh.data.length <= idx) sh.data.push([]);
            row.forEach((v, j) => { sh.data[idx][c - 1 + j] = String(v); });
          });
          return { setFontWeight: () => ({}) };
        },
        clearContent: () => {
          for (let i = 0; i < nr; i++) if (sh.data[r - 1 + i]) sh.data[r - 1 + i] = sh.data[r - 1 + i].map(() => '');
          // drop blank rows at the end
          while (sh.data.length && sh.data[sh.data.length - 1].every((x) => x === '')) sh.data.pop();
        }
      };
    }
  };
  return sh;
}

function makeSpreadsheet(name) {
  const sheets = [];
  const id = crypto.randomUUID();
  return {
    sheets,
    getId: () => id,
    getName: () => name,
    getUrl: () => 'https://docs.google.com/spreadsheets/d/' + id,
    getSheetByName: (n) => sheets.find((s) => s.name === n) || null,
    getSheets: () => sheets,
    insertSheet: (n) => { const s = makeSheet(n); sheets.push(s); return s; },
    deleteSheet: (s) => { sheets.splice(sheets.indexOf(s), 1); }
  };
}

function createContext(now) {
  const active = makeSpreadsheet('Test Shop');
  const others = {};
  const props = {};
  const cache = {};
  let clock = now || new Date('2026-10-08T11:30:00Z');
  const fmt = (d, tz, f) => {
    const ist = new Date(d.getTime() + 5.5 * 3600000);
    const p = (n) => String(n).padStart(2, '0');
    const Y = ist.getUTCFullYear(), M = p(ist.getUTCMonth() + 1), D = p(ist.getUTCDate());
    const h = p(ist.getUTCHours()), m = p(ist.getUTCMinutes()), s = p(ist.getUTCSeconds());
    if (f === 'yyyy-MM-dd') return `${Y}-${M}-${D}`;
    if (f === "yyyy-MM-dd'T'HH:mm:ss") return `${Y}-${M}-${D}T${h}:${m}:${s}`;
    return `${Y}-${M}-${D} ${h}${m}`;
  };
  const ctx = {
    console,
    Date: class extends Date {
      constructor(...a) { if (a.length) super(...a); else super(clock.getTime()); }
      static now() { return clock.getTime(); }
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => active,
      flush: () => {},
      create: (n) => { const s = makeSpreadsheet(n); s.insertSheet('Sheet1'); others[s.getId()] = s; return s; },
      openById: (id) => others[id]
    },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      DigestAlgorithm: { SHA_256: 'sha256', MD5: 'md5' },
      base64EncodeWebSafe: (bytes) => Buffer.from(bytes.map((b) => (b < 0 ? b + 256 : b))).toString('base64url'),
      Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, str) => Array.from(crypto.createHash('sha256').update(str, 'utf8').digest()).map((b) => (b > 127 ? b - 256 : b)),
      formatDate: fmt
    },
    CacheService: { getScriptCache: () => ({
      get: (k) => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = v; }, remove: (k) => { delete cache[k]; },
      getAll: (ks) => { const o = {}; ks.forEach((k) => { if (k in cache) o[k] = cache[k]; }); return o; }
    }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; },
      deleteProperty: (k) => { delete props[k]; }, getProperties: () => Object.assign({}, props)
    }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ text: s, setMimeType() { return this; } }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) }
  };
  ctx.setNow = (d) => { clock = new Date(d); };
  vm.createContext(ctx);
  const code = fs.readFileSync(path.join(__dirname, '..', 'dist', 'Code.gs'), 'utf8');
  vm.runInContext(code, ctx, { filename: 'Code.gs' });
  ctx._active = active;
  return ctx;
}

module.exports = { createContext };
