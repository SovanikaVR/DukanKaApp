/**
 * Local test server: serves the web app and answers API calls with the real backend code
 * running on an in-memory sheet.   node tests/dev-server.js   →  http://localhost:8787
 * In the app, the shop link is set to http://localhost:8787/api automatically by the UI test.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createContext } = require('./mock-gas');

const g = createContext(new Date());
Object.keys(g.SCHEMA).forEach((n) => g.sheet_(n));
Object.keys(g.DEFAULT_SETTINGS).forEach((k) => g.insert_('Settings', { key: k, value: g.DEFAULT_SETTINGS[k] }));
g.setSetting_('cash_opening_date', '2026-01-01');
g.createUser_('Viju', 'viju', 'owner', '1234');

const root = path.join(__dirname, '..', 'web');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/api')) {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      g._rowsCache = {};
      const out = g.doPost({ postData: { contents: body } });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(out.text);
    });
    return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const port = process.env.PORT || 8787;
server.listen(port, () => console.log('Dev server on http://localhost:' + port));
module.exports = server;
