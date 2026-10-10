/* Service worker: keeps the app screens on the phone so it opens fast. Shop data always comes live. */
const VERSION = 'dk-v1.6.0';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/app.css', './js/calc.js', './js/main.js', './js/api.js',
  './js/ui.js', './js/i18n.js', './js/i18n-hi.js', './js/help-content.js', './js/xlsx.js', './js/pdf.js', './js/state.js', './js/picker.js', './js/recent.js', './js/bill.js',
  './js/screens/start.js', './js/screens/rate.js', './js/screens/customers.js', './js/screens/sale.js',
  './js/screens/billview.js', './js/screens/oldgold.js', './js/screens/loans.js', './js/screens/orders.js',
  './js/screens/repairs.js', './js/screens/stock.js', './js/screens/melt.js', './js/screens/parties.js',
  './js/screens/cash.js', './js/screens/reports.js', './js/screens/settings.js', './js/screens/dues.js', './js/screens/help.js', './js/screens/exports.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // API, fonts, CDN: straight to network
  if (url.pathname.includes('/videos/')) return; // videos stream from the network
  // App files: open from the phone at once (fast), and fetch the newest copy in the background for next time.
  e.respondWith(caches.open(VERSION).then((c) => c.match(e.request, { ignoreSearch: true }).then((hit) => {
    const net = fetch(e.request).then((res) => {
      if (res && res.ok) c.put(e.request, res.clone());
      return res;
    });
    if (hit) { net.catch(() => {}); return hit; }
    return net.catch(() => c.match('./index.html'));
  })));
});
