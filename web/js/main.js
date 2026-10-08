/* DukanKaApp — router and app shell. */
import { apiUrl, token, onSessionExpired } from './api.js';
import { S, refresh, modOn, isOwner, loadCached, clearCached } from './state.js';
import { h, icon, toast, loading, go } from './ui.js';
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
  ['sale', () => import('./screens/sale.js'), 'render'],
  ['bill/:id', () => import('./screens/billview.js'), 'render'],
  ['bills', () => import('./screens/billview.js'), 'list'],
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
  const seq = ++renderSeq;
  const raw = location.hash.replace(/^#\/?/, '') || 'home';
  const [path, qs] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  if (!apiUrl() && path !== 'connect') return go('connect');
  if (apiUrl() && !token() && path !== 'login' && path !== 'connect') return go('login');
  if (token() && !S.user && path !== 'login' && path !== 'connect') {
    if (loadCached()) {
      // Open at once with the saved copy; fresh settings and rate arrive in the background.
      refresh().then(() => { if (path === 'home' && seq === renderSeq) render(); }).catch((e) => toast(e.message, 'err'));
    } else {
      app.replaceChildren(loading());
      try { await refresh(); } catch (e) {
        if (seq !== renderSeq) return;
        if (!token()) return go('login');
        return showError(e, null);
      }
    }
  }
  const m = match(path) || match('home');
  currentParams = m.params;
  app.replaceChildren(shell(loading(), m.name));
  try {
    const mod = await m.loader();
    const view = await mod[m.fn](m.params, query);
    if (seq !== renderSeq) return;
    app.replaceChildren(shell(view, m.name));
    window.scrollTo(0, 0);
    const first = app.querySelector('[autofocus]');
    if (first) first.focus();
  } catch (e) {
    if (seq !== renderSeq) return;
    showError(e, m.name);
  }
}

/** Something failed while opening a screen: say it simply and offer Try again. */
function showError(e, name) {
  console.error(e);
  let msg = e && e.message ? e.message : String(e);
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
  if (m) toast(/undefined|reading/.test(m) ? 'Something went wrong. Please try again.' : m, 'err');
});

const ACTIVE = {
  'bill/:id': 'bills', 'loan-new': 'loans', 'loan/:id': 'loans', 'order-new': 'orders', 'order/:id': 'orders',
  'repair-new': 'repairs', 'repair/:id': 'repairs', 'stock-add': 'stock', 'rate': 'home', 'search': 'home',
  'customer/:id': 'home', 'customer-edit/:id': 'home', 'help/:topic': 'help'
};
let currentParams = {};
function activeOf(name) {
  if (name === 'parties/:type') return 'parties/' + currentParams.type;
  if (name === 'party/:id') return '';
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

onSessionExpired(() => { S.user = null; clearCached(); go('login'); });
window.addEventListener('hashchange', render);
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
void isOwner;
