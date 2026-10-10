/**
 * Tiny in-memory stand-in for the Google Apps Script services the backend uses,
 * so the backend can be tested with plain Node:  node tests/backend.test.js
 */
const crypto = require('crypto');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Counts of Google service calls, so tests/perf.js can show what each screen costs on real Google.
const OPS = { calls: 0, read: 0, written: 0, appends: 0, finds: 0, cache: 0, props: 0 };
function makeSheet(name) {
  const sh = {
    name, data: [],
    getName: () => sh.name,
    setName: (n) => { sh.name = n; },
    getLastRow: () => { OPS.calls++; return sh.data.length; },
    appendRow: (row) => { OPS.calls++; OPS.appends++; OPS.written += row.length; sh.data.push(row.map(String)); },
    setFrozenRows: () => {},
    getRange: (r, c, nr, nc) => {
      if (typeof r === 'string') return {
        setNumberFormat: () => ({}),
        // Column A search like Google's TextFinder (used to look up one row by id).
        createTextFinder: (text) => ({ matchEntireCell() { return this; }, findNext: () => {
          OPS.calls++; OPS.finds++;
          const i = sh.data.findIndex((row) => String(row[0]) === String(text));
          return i < 0 ? null : { getRow: () => i + 1 };
        } })
      };
      nr = nr || 1; nc = nc || 1;
      return {
        setNumberFormat: () => ({}),
        setFontWeight: () => ({}),
        getValues: () => {
          OPS.calls++; OPS.read += nr * nc;
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
          OPS.calls++; OPS.written += vals.length * (vals[0] ? vals[0].length : 0);
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
      formatDate: fmt,
      base64Decode: (b) => Array.from(Buffer.from(b, 'base64')),
      base64Encode: (bytes) => Buffer.from(bytes.map((b) => (b < 0 ? b + 256 : b))).toString('base64'),
      newBlob: (bytes, type, name) => ({ bytes, type, name, getBytes: () => bytes })
    },
    // Google Drive kept in memory (stock photos).
    DriveApp: (() => {
      const files = {}; let n = 0;
      const folder = (id) => ({ getId: () => id, createFile: (blob) => { const fid = 'file' + (++n); files[fid] = { blob, trashed: false }; return { getId: () => fid }; } });
      return {
        createFolder: () => folder('folder1'), getFolderById: (id) => folder(id),
        getFileById: (id) => { const f = files[id]; if (!f) throw new Error('no file'); return { getBlob: () => f.blob, setTrashed: (v) => { f.trashed = v; } }; },
        _files: files
      };
    })(),
    // Live-rate services answered with fixed sample numbers (no internet in tests).
    UrlFetchApp: { fetch: (url) => {
      const body = /XAU/.test(url) ? { price: 4183.4, updatedAt: '2026-10-09T11:45:20Z' } : /XAG/.test(url) ? { price: 60.28, updatedAt: '2026-10-09T11:06:19Z' }
        : /er-api/.test(url) ? { result: 'success', rates: { INR: 96.83 } } : null;
      return { getResponseCode: () => (body ? 200 : 404), getContentText: () => JSON.stringify(body || {}) };
    } },
    CacheService: { getScriptCache: () => ({
      get: (k) => { OPS.cache++; return k in cache ? cache[k] : null; }, put: (k, v) => { OPS.cache++; cache[k] = v; }, remove: (k) => { OPS.cache++; delete cache[k]; },
      putAll: (o) => { OPS.cache++; Object.assign(cache, o); },
      getAll: (ks) => { OPS.cache++; const o = {}; ks.forEach((k) => { if (k in cache) o[k] = cache[k]; }); return o; }
    }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => { OPS.props++; return k in props ? props[k] : null; }, setProperty: (k, v) => { OPS.props++; props[k] = v; },
      deleteProperty: (k) => { OPS.props++; delete props[k]; }, getProperties: () => { OPS.props++; return Object.assign({}, props); }
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
  ctx._ops = OPS;
  ctx._cache = cache;
  return ctx;
}

module.exports = { createContext };
