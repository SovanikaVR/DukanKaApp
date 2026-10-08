/* First-run connect, login, and home. */
import { call, apiUrl, token } from '../api.js';
import { S, refresh, modOn, isViewer, clearCached } from '../state.js';
import { h, field, busy, toast, icon, inr, fdate, go } from '../ui.js';
import { t, getLang, setLang } from '../i18n.js';

export function connect() {
  const url = field('Shop web app link', { value: apiUrl(), placeholder: 'https://script.google.com/macros/s/…/exec' });
  url.input.setAttribute('autofocus', '');
  const status = h('div', { class: 'hint' });
  const btn = h('button', { class: 'btn', onclick: () => busy(btn, async () => {
    const v = url.input.value.trim();
    if (!/^https:\/\/script\.google\.com\/.+\/exec/.test(v)) throw new Error('Paste the full web app link that ends with /exec');
    const r = await call('ping', {}, v);
    apiUrl(v);
    toast('Connected to ' + (r.shop || 'shop'));
    go('login');
  }) }, 'Connect');
  return h('div', { class: 'screen start' },
    h('main', { class: 'body narrow' },
      h('div', { class: 'brand' }, h('div', { class: 'brand-mark' }, 'D'), h('div', null,
        h('div', { class: 'brand-name' }, 'DukanKaApp'), h('div', { class: 'brand-sub' }, 'Jewellery shop register'))),
      h('p', null, 'Connect this phone to your shop. The owner gets this link after setting up the Google Sheet (see the setup guide).'),
      url, status, btn));
}

export function login() {
  const u = field(t('Login name'), { value: localStorageGet('dk_last_user') });
  const p = field(t('PIN'), { type: 'pin' });
  (u.input.value ? p.input : u.input).setAttribute('autofocus', '');
  const btn = h('button', { class: 'btn', type: 'submit' }, t('Log in'));
  const form = h('form', { class: 'stack', onsubmit: (e) => { e.preventDefault(); doLogin(); } }, u, p, btn);
  async function doLogin() {
    await busy(btn, async () => {
      const r = await call('auth.login', { username: u.input.value.trim(), pin: p.input.value.trim() });
      token(r.token);
      localStorageSet('dk_last_user', u.input.value.trim());
      await refresh();
      go('home');
    });
  }
  return h('div', { class: 'screen start' },
    h('main', { class: 'body narrow' },
      h('div', { class: 'brand' }, h('div', { class: 'brand-mark' }, 'D'), h('div', null,
        h('div', { class: 'brand-name' }, 'DukanKaApp'), h('div', { class: 'brand-sub' }, 'Log in to your shop'))),
      form,
      h('a', { class: 'link', href: '#/connect' }, 'Change shop link')));
}

function localStorageGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

export async function home() {
  const r = S.rate;
  const rateStrip = h('a', { class: 'rate-strip' + (r && r.isToday ? '' : ' warn'), href: '#/rate' },
    h('div', null,
      h('div', { class: 'rate-label' }, r && r.isToday ? t("Today's rate") + ' · ' + t('per gram') : 'Set today\'s rate'),
      r ? h('div', { class: 'rate-vals' },
        h('span', null, '24K ' + inr(r.g24)), h('span', null, '22K ' + inr(r.g22)),
        r.silver ? h('span', null, 'Ag ' + inr(r.silver)) : null) : h('div', { class: 'rate-vals' }, 'No rate yet')),
    h('span', { class: 'rate-edit' }, r && !r.isToday ? 'Rate from ' + fdate(r.date) : t('Edit')));

  const tiles = [
    ['girvi', 'loans', 'lock', 'Girvi Loan'],
    ['sale', 'sale', 'bill', 'New Sale'],
    ['oldgold', 'oldgold', 'swap', 'Buy Old Gold'],
    ['orders', 'orders', 'order', 'Orders'],
    ['stock', 'stock', 'box', 'Stock'],
    ['reports', 'reports', 'chart', 'Reports']
  ].filter((x) => modOn(x[0]) && !(isViewer() && ['sale', 'oldgold'].includes(x[0])));
  const more = [
    ['repair', 'repairs', 'Repair'], ['sale', 'bills', 'Bills'], ['melt', 'melt', 'Melting'],
    ['wholesaler', 'parties/wholesaler', 'Wholesaler'], ['karigar', 'parties/karigar', 'Karigar'],
    ['cash', 'cash', 'Cash book'], ['dues', 'dues', 'Baki (dues)'], ['help', 'help', 'Help']
  ].filter((x) => x[0] === 'dues' || x[0] === 'help' || modOn(x[0]));

  const attention = h('div', { class: 'card attention' }, h('div', { class: 'sec' }, t('Needs attention today')), h('div', { class: 'hint' }, t('Loading…')));
  loadAttention(attention);

  const langBtn = (code, label) => h('button', {
    class: getLang() === code ? 'on' : '', onclick: () => { setLang(code); document.dispatchEvent(new Event('dk-lang')); }
  }, label);

  return h('div', { class: 'screen home' },
    h('header', { class: 'home-top' },
      h('div', { class: 'home-row' },
        h('div', null,
          h('div', { class: 'shop-name' }, S.settings.shop_name || 'My Shop'),
          h('div', { class: 'top-sub' }, fdate(S.today) + ' · ' + S.user.name + ' (' + S.user.role + ')')),
        h('div', { class: 'lang' }, langBtn('en', 'EN'), langBtn('hi', 'हिं'))),
      h('a', { class: 'search-box', href: '#/search' }, icon('search'), h('span', null, t('Search name, surname, mobile…')))),
    h('main', { class: 'body' },
      rateStrip,
      h('div', { class: 'tiles' }, tiles.map(([, path, ic, label]) =>
        h('a', { class: 'tile', href: '#/' + path }, icon(ic, 28), h('span', { class: 'tile-label' }, t(label))))),
      more.length ? h('div', { class: 'pills' }, more.map(([, path, label]) => h('a', { class: 'pill', href: '#/' + path }, t(label)))) : null,
      attention,
      h('div', { class: 'home-foot' },
        h('a', { class: 'pill', href: '#/settings' }, icon('gear', 18), t('Settings')),
        h('button', { class: 'pill', onclick: logout }, icon('logout', 18), t('Log out')))));
}

async function logout() {
  try { await call('auth.logout'); } catch (e) { /* ignore */ }
  token(null);
  S.user = null;
  clearCached();
  go('login');
}

async function loadAttention(box) {
  try {
    const p = await call('home.summary');
    const row = (label, n, href, cls) => h('a', { class: 'att-row', href }, h('span', null, t(label)), h('b', { class: cls || '' }, String(n)));
    box.replaceChildren(h('div', { class: 'sec' }, t('Needs attention today')),
      row('Customers with baki (dues)', p.duesCount ? p.duesCount + ' · ' + inr(p.duesTotal) : 0, '#/dues', p.duesCount ? 'bad' : ''),
      modOn('orders') ? row('Order deliveries due', p.ordersDueToday, '#/orders') : null,
      modOn('orders') && p.ordersLate ? row('Late orders', p.ordersLate, '#/orders', 'bad') : null,
      modOn('girvi') ? row('Loans older than 12 months', p.loansOld, '#/loans', p.loansOld ? 'bad' : '') : null,
      modOn('repair') ? row('Repairs ready to hand over', p.repairsReady, '#/repairs', 'good') : null);
  } catch (e) {
    box.replaceChildren(h('div', { class: 'sec' }, t('Needs attention today')), h('div', { class: 'hint' }, e.message),
      h('button', { class: 'btn2 small', onclick: () => loadAttention(box) }, t('Try again')));
  }
}
