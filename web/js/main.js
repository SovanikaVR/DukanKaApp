/* DukanKaApp — router and app shell. */
import { apiUrl, token, onSessionExpired, wipeLocal, preload, refreshNow } from './api.js';
import { syncCustomers } from './custlocal.js';
import { S, refresh, modOn, isOwner, isViewer, loadCached, clearCached } from './state.js';
import { h, icon, toast, loading, go, todayStr, friendly, isSaving } from './ui.js';
import { t, setLang, getLang } from './i18n.js';

const app = document.getElementById('app');

// Screen loaders. Each module exports render(params, query) -> Node.
const ROUTES = [
  ['connect', () => import('./screens/start.js'), 'connect'],
  ['login', () => import('./screens/start.js'), 'login'],
  ['home', () => import('./screens/start.js'), 'home'],
  ['rate', () => import('./screens/rate.js'), 'render'],
  ['search', () => import('./screens/customers.js'), 'search'],
  ['customer/:id', () => import('./screens/customers.js'), 'profile'],
  ['customer-edit/:id', () => import('./screens/customers.js'), 'edit'],
  ['customers-import', () => import('./screens/importcust.js'), 'render'],
  ['sale', () => import('./screens/sale.js'), 'render'],
  ['bill/:id', () => import('./screens/billview.js'), 'render'],
  ['bills', () => import('./screens/billview.js'), 'list'],
  ['bills-export', () => import('./screens/exports.js'), 'bills'],
  ['oldgold', () => import('./screens/oldgold.js'), 'render'],
  ['loans', () => import('./screens/loans.js'), 'list'],
  ['loan-new', () => import('./screens/loans.js'), 'create'],
  ['loan/:id', () => import('./screens/loans.js'), 'view'],
  ['orders', () => import('./screens/orders.js'), 'list'],
  ['order-new', () => import('./screens/orders.js'), 'create'],
  ['order/:id', () => import('./screens/orders.js'), 'view'],
  ['repairs', () => import('./screens/repairs.js'), 'list'],
  ['repair-new', () => import('./screens/repairs.js'), 'create'],
  ['repair/:id', () => import('./screens/repairs.js'), 'view'],
  ['stock', () => import('./screens/stock.js'), 'render'],
  ['stock-add', () => import('./screens/stock.js'), 'add'],
  ['melt', () => import('./screens/melt.js'), 'render'],
  ['parties/:type', () => import('./screens/parties.js'), 'list'],
  ['party/:id', () => import('./screens/parties.js'), 'view'],
  ['cash', () => import('./screens/cash.js'), 'render'],
  ['reports', () => import('./screens/reports.js'), 'render'],
  ['settings', () => import('./screens/settings.js'), 'render'],
  ['bill-design', () => import('./screens/billdesign.js'), 'render'],
  ['dues', () => import('./screens/dues.js'), 'render'],
  ['help', () => import('./screens/help.js'), 'index'],
  ['help/:topic', () => import('./screens/help.js'), 'topic']
];

function match(path) {
  for (const [pattern, loader, fn] of ROUTES) {
    const pp = pattern.split('/'), xp = path.split('/');
    if (pp.length !== xp.length) continue;
    const params = {};
    let ok = true;
    pp.forEach((p, i) => {
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(xp[i]);
      else if (p !== xp[i]) ok = false;
    });
    if (ok) return { loader, fn, params, name: pattern };
  }
  return null;
}

let renderSeq = 0;
async function render() {
  if (window._dkUpdate && !isSaving()) { window._dkUpdate = false; location.reload(); return; }
  const seq = ++renderSeq;
  const raw = location.hash.replace(/^#\/?/, '') || 'home';
  const [path, qs] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  if (!apiUrl() && path !== 'connect') return go('connect');
  if (apiUrl() && !token() && path !== 'login' && path !== 'connect') return go('login');
  if (token() && !S.user && path !== 'login' && path !== 'connect') {
    if (loadCached(todayStr())) {
      // Open at once with today's saved copy; fresh settings and rate arrive in the background.
      const before = JSON.stringify(S.rate);
      // A new-entry screen just opened with an older rate: open it again with the fresh rate.
      const FORMS = ['home', 'sale', 'loan-new', 'order-new', 'oldgold', 'rate'];
      const bg = (again) => refresh().then(() => { if (FORMS.includes(path) && seq === renderSeq && (path === 'home' || JSON.stringify(S.rate) !== before)) render(); })
        .catch(() => { if (again && token()) setTimeout(() => bg(false), 8000); });
      bg(true);
    } else {
      app.replaceChildren(loading());
      try { await refresh(); } catch (e) {
        if (seq !== renderSeq) return;
        if (!token()) return go('login');
        return showError(e, null);
      }
    }
  }
  const m = match(path);
  if (!m) return go('home', { replace: true });
  const blocked = blockedReason(m.name, m.params);
  if (blocked) {
    app.replaceChildren(shell(h('div', { class: 'screen' }, h('main', { class: 'body' },
      h('div', { class: 'error-box' }, t(blocked)), h('a', { class: 'btn', href: '#/home' }, t('Home')))), m.name));
    return;
  }
  currentParams = m.params;
  app.replaceChildren(shell(loading(), m.name));
  try {
    const mod = await m.loader();
    const view = await mod[m.fn](m.params, query);
    if (seq !== renderSeq) return;
    app.replaceChildren(shell(view, m.name));
    if (!window._dkKeepScroll) window.scrollTo(0, 0);
    if (!window._dkPreloaded && S.user) { window._dkPreloaded = true; backgroundSync(2500); }
    const first = app.querySelector('[autofocus]');
    if (first) first.focus();
  } catch (e) {
    if (seq !== renderSeq) return;
    showError(e, m.name);
  }
}

/** Something failed while opening a screen: say it simply and offer Try again. */
const MODULE_OF = {
  sale: 'sale', bills: 'sale', 'bills-export': 'sale', 'bill/:id': 'sale', oldgold: 'oldgold', loans: 'girvi', 'loan-new': 'girvi', 'loan/:id': 'girvi',
  orders: 'orders', 'order-new': 'orders', 'order/:id': 'orders', repairs: 'repair', 'repair-new': 'repair', 'repair/:id': 'repair',
  stock: 'stock', 'stock-add': 'stock', melt: 'melt', cash: 'cash', reports: 'reports'
};
const WRITE_ONLY = { sale: 1, oldgold: 1, 'stock-add': 1, 'loan-new': 1, 'order-new': 1, 'repair-new': 1, 'customer-edit/:id': 1 };
function blockedReason(name, params) {
  if (!S.user) return '';
  let mod = MODULE_OF[name];
  if (name === 'parties/:type') {
    if (params.type !== 'wholesaler' && params.type !== 'karigar') return 'Page not found';
    mod = params.type;
  }
  if (mod && !modOn(mod)) return 'This part of the app is switched off in Settings.';
  if (isViewer() && WRITE_ONLY[name]) return 'View-only login: you can see records but not add new ones.';
  return '';
}

/** Something failed while opening a screen: say it simply and offer Try again. */
function showError(e, name) {
  console.error(e);
  let msg = e && e.message ? e.message : String(e);
  // The app was just updated and this page still has the old version: load the new one.
  if (/does not provide an export|Failed to fetch dynamically imported module|error loading dynamically imported/i.test(msg) && !sessionStorage.getItem('dk_reloaded')) {
    try { sessionStorage.setItem('dk_reloaded', '1'); } catch (x) { /* ignore */ }
    location.reload();
    return;
  }
  if (/undefined|null|is not a function|reading/i.test(msg)) msg = 'Could not open this screen. Please try again.';
  if (/Failed to fetch|dynamically imported module|Importing a module/i.test(msg)) msg = 'No internet, or the app was just updated. Please try again.';
  const view = h('div', { class: 'screen' }, h('main', { class: 'body' },
    h('div', { class: 'error-box' }, msg),
    h('button', { class: 'btn', onclick: () => render() }, t('Try again')),
    h('a', { class: 'btn2', href: '#/home' }, t('Home'))));
  app.replaceChildren(name ? shell(view, name) : view);
}

window.addEventListener('unhandledrejection', (ev) => {
  const m = ev.reason && ev.reason.message ? ev.reason.message : '';
  if (m) toast(friendly(ev.reason), 'err');
});

const ACTIVE = {
  'bill/:id': 'bills', 'bills-export': 'bills', 'loan-new': 'loans', 'loan/:id': 'loans', 'order-new': 'orders', 'order/:id': 'orders',
  'repair-new': 'repairs', 'repair/:id': 'repairs', 'stock-add': 'stock', 'rate': 'home', 'search': 'home',
  'customer/:id': 'home', 'customer-edit/:id': 'home', 'customers-import': 'home', 'help/:topic': 'help', 'bill-design': 'settings'
};
let currentParams = {};

function activeOf(name) {
  if (name === 'parties/:type') return 'parties/' + currentParams.type;
  if (name === 'party/:id') return window._dkPartyType ? 'parties/' + window._dkPartyType : '';
  return ACTIVE[name] || name;
}

/** On a wide screen (computer) a side menu is shown next to the screen. */
function shell(view, name) {
  if (!S.user || name === 'login' || name === 'connect') return view;
  const items = [
    ['home', 'Home', 'box', true],
    ['sale', 'New Sale', 'bill', modOn('sale')],
    ['bills', 'Bills', 'bill', modOn('sale')],
    ['loans', 'Girvi Loan', 'lock', modOn('girvi')],
    ['orders', 'Orders', 'order', modOn('orders')],
    ['repairs', 'Repair', 'wrench', modOn('repair')],
    ['oldgold', 'Buy Old Gold', 'swap', modOn('oldgold')],
    ['stock', 'Stock', 'box', modOn('stock')],
    ['melt', 'Melting', 'flame', modOn('melt')],
    ['parties/wholesaler', 'Wholesaler', 'truck', modOn('wholesaler')],
    ['parties/karigar', 'Karigar', 'hammer', modOn('karigar')],
    ['cash', 'Cash book', 'cash', modOn('cash')],
    ['reports', 'Reports', 'chart', modOn('reports')],
    ['dues', 'Baki (dues)', 'cash', true],
    ['settings', 'Settings', 'gear', true],
    ['help', 'Help', 'help', true]
  ].filter((x) => x[3]);
  const nav = h('nav', { class: 'side', 'aria-label': 'Menu' },
    h('div', { class: 'side-shop' }, S.settings.shop_name || 'DukanKaApp'),
    items.map(([p, label, ic]) => h('a', { class: 'nav' + (activeOf(name) === p ? ' on' : ''), href: '#/' + p },
      icon(ic, 18), h('span', t(label)))));
  return h('div', { class: 'layout' }, nav, h('div', { class: 'content' }, view));
}

/* ---------- Keep the phone's copy fresh in the background ----------
 * After the app opens (and some seconds after each save) the main screens and the customer list are loaded into
 * the phone, one request at a time, so tapping them later is instant. */
function mainScreens() {
  const list = [['home.summary', {}], ['dues.list', { q: '' }]];
  if (modOn('girvi')) list.push(['loans.list', { status: 'open', q: '' }]);
  if (modOn('sale')) list.push(['sale.list', { q: '', from: '', to: '', fy: '' }]);
  if (modOn('stock')) list.push(['stock.summary', {}], ['stock.list', { metal: 'gold', category: '' }]);
  if (modOn('orders')) list.push(['orders.list', { status: 'pending' }]);
  if (modOn('repair')) list.push(['repairs.list', { status: 'pending' }]);
  return list;
}
let bgTimer = null;
function backgroundSync(delay) {
  clearTimeout(bgTimer);
  bgTimer = setTimeout(async () => {
    if (!token() || !S.user || !navigator.onLine) return;
    await syncCustomers(true);
    await preload(mainScreens());
  }, delay);
}
document.addEventListener('dk-saved', () => backgroundSync(8000));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') backgroundSync(3000); });
window.addEventListener('online', () => backgroundSync(1000));

// Small "Updating…" note while fresh data is being fetched in the background.
const syncChip = document.createElement('div');
syncChip.className = 'sync-chip';
syncChip.setAttribute('aria-live', 'polite');
document.addEventListener('dk-sync', (e) => {
  syncChip.textContent = '↻ ' + t('Updating…');
  syncChip.classList.toggle('on', e.detail > 0);
  if (!syncChip.isConnected) document.body.appendChild(syncChip);
});

// Pull down on a list to get fresh data from the shop now.
(function pullToRefresh() {
  let startY = null, pulled = 0;
  const tip = document.createElement('div');
  tip.className = 'pull-tip';
  const route = () => { const m = match((location.hash.replace(/^#\/?/, '') || 'home').split('?')[0]); return m ? m.name : ''; };
  window.addEventListener('touchstart', (e) => {
    startY = window.scrollY <= 0 && !document.querySelector('.modal-wrap') && !FORM_ROUTES.has(route()) ? e.touches[0].clientY : null;
    pulled = 0;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (startY === null) return;
    pulled = e.touches[0].clientY - startY;
    if (pulled > 20) {
      if (!tip.isConnected) document.body.appendChild(tip);
      tip.textContent = pulled > 80 ? '↻ ' + t('Release to refresh') : '↓ ' + t('Pull to refresh');
      tip.style.opacity = String(Math.min(1, pulled / 80));
    }
  }, { passive: true });
  window.addEventListener('touchend', () => {
    if (startY !== null && pulled > 80) { refreshNow(); render(); syncCustomers(true); }
    startY = null; pulled = 0; tip.remove();
  });
})();

// Fonts load after the first screen is drawn: a slow network never keeps the app blank (system font until then).
window.addEventListener('load', () => {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans+Devanagari:wght@400;500;600&display=swap';
  document.head.appendChild(l);
});

onSessionExpired(() => { S.user = null; clearCached(); wipeLocal(); go('login'); });
window.addEventListener('hashchange', render);

// A screen was shown from the phone's saved copy and fresher data just arrived: redraw it,
// unless the user is typing in a form or a dialog is open.
const FORM_ROUTES = new Set(['sale', 'loan-new', 'order-new', 'repair-new', 'stock-add', 'oldgold', 'customer-edit/:id', 'rate', 'settings', 'bill-design', 'connect', 'login', 'bills-export']);
let freshTimer = null;
document.addEventListener('dk-fresh', () => {
  clearTimeout(freshTimer);
  freshTimer = setTimeout(() => {
    const raw = location.hash.replace(/^#\/?/, '') || 'home';
    const m = match(raw.split('?')[0]);
    if (!m || FORM_ROUTES.has(m.name) || isSaving() || document.querySelector('.modal-wrap')) return;
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
    const y = window.scrollY;
    render().then(() => window.scrollTo(0, y));
  }, 250);
});
document.addEventListener('dk-lang', () => render());

// A link like https://.../?api=<web app url> connects the app to a shop in one tap.
(function readLinkParams() {
  const p = new URLSearchParams(location.search);
  const api = p.get('api');
  if (api && /^https:\/\/script\.google\.com\//.test(api)) {
    apiUrl(api);
    history.replaceState(null, '', location.pathname + location.hash);
  }
})();

setLang(getLang());
render();

// The date changed while the app stayed open (overnight): load today's rate and date again.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S.user && S.today && S.today !== todayStr()) refresh().then(render).catch(() => {});
});

if ('serviceWorker' in navigator) {
  // A new version took over: reload once so every screen comes from the same version.
  const hadController = !!navigator.serviceWorker.controller;
  // Not at once (a form may be half filled): the new version loads on the next screen change.
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) window._dkUpdate = true; });
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
window.addEventListener('load', () => setTimeout(() => { try { sessionStorage.removeItem('dk_reloaded'); } catch (x) { /* ignore */ } }, 10000));
void isOwner;
