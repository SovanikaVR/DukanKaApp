/* Customer search, profile and edit. */
import { call } from '../api.js';
import { modOn, isViewer, isOwner } from '../state.js';
import { h, screen, field, card, grid, busy, toast, inr, fdate, g3, icon, empty, go, sec, ask, miniLoading } from '../ui.js';
import { t } from '../i18n.js';
import { exportCsvButton } from './exports.js';
import { sendBakiReminder } from '../baki.js';
import { rememberCustomer, recentCustomers, rememberWords, recentWords, forgetRecent } from '../recent.js';

export async function search(params, query) {
  let village = query.v || '';
  const q = field(t('Search name, surname, mobile…'), { value: query.q || '' });
  q.input.setAttribute('autofocus', '');
  q.input.setAttribute('autocomplete', 'off');
  const villages = h('div', { class: 'chips' });
  const list = h('div', { class: 'list' }, miniLoading());
  const count = h('div', { class: 'hint' });
  let timer;
  q.input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 250); });

  // Keep the search in the address, so Back from a customer brings the same search and results again.
  const keepInUrl = () => {
    const v = q.input.value.trim();
    const qs = [v ? 'q=' + encodeURIComponent(v) : '', village ? 'v=' + encodeURIComponent(village) : ''].filter(Boolean).join('&');
    try { history.replaceState(history.state, '', '#/search' + (qs ? '?' + qs : '')); } catch (e) { /* ignore */ }
  };
  const recentBox = h('div');
  const drawRecent = () => {
    const words = recentWords(), cust = recentCustomers();
    if (q.input.value.trim() || (!words.length && !cust.length)) { recentBox.replaceChildren(); return; }
    recentBox.replaceChildren(
      h('div', { class: 'kv' }, sec(t('Recent searches')),
        h('button', { type: 'button', class: 'link', onclick: () => { forgetRecent(); drawRecent(); } }, t('Clear'))),
      words.length ? h('div', { class: 'chips' }, ...words.map((w) => h('button', { type: 'button', class: 'chip', onclick: () => { q.input.value = w; run(); } }, w))) : null,
      ...cust.map((c) => h('a', { class: 'row-card', href: '#/customer/' + c.id },
        h('div', { class: 'kv' }, h('b', null, c.name), h('span', { class: 'muted' }, c.mobile)),
        c.village ? h('div', { class: 'muted' }, c.village) : null)),
      sec(t('All customers')));
  };

  async function run() {
    keepInUrl();
    drawRecent();
    try {
      const r = await call('customers.search', { q: q.input.value.trim(), village });
      villages.replaceChildren(
        h('button', { class: 'chip' + (village ? '' : ' on'), onclick: () => { village = ''; run(); } }, 'All'),
        ...r.villages.map((v) => h('button', { class: 'chip' + (v === village ? ' on' : ''), onclick: () => { village = v; run(); } }, v)));
      count.textContent = r.total + ' found' + (r.results[0] && r.results[0].matched ? ' · matched on ' + r.results[0].matched : '');
      list.replaceChildren(...(r.results.length ? r.results.map((c) => h('a', { class: 'row-card', href: '#/customer/' + c.id,
        onclick: () => { rememberWords(q.input.value); rememberCustomer(c); } },
        h('div', { class: 'kv' }, h('b', null, c.name), h('span', { class: 'muted' }, c.mobile)),
        h('div', { class: 'muted' }, c.village || ''),
        h('div', { class: 'tags' },
          c.loans ? h('span', { class: 'tag gold' }, c.loans + ' girvi') : null,
          c.orders ? h('span', { class: 'tag' }, c.orders + ' order') : null,
          c.repairs ? h('span', { class: 'tag' }, c.repairs + ' repair') : null))) : [empty('No customer found')]));
    } catch (e) { list.replaceChildren(h('div', { class: 'error-box' }, e.message)); }
  }
  run();
  return screen('Find customer', null, [q, recentBox, sec(t('Village')), villages, count, list],
    isViewer() ? null : h('div', { class: 'grid g2' }, h('a', { class: 'btn2', href: '#/customer-edit/new' }, '+ ' + t('New customer')),
      isOwner() ? h('a', { class: 'btn2', href: '#/customers-import' }, '⬆ ' + t('Import many')) : null), { right: exportCsvButton('customers', () => ({})) });
}

export async function profile({ id }) {
  const d = await call('customers.get', { id });
  const c = d.customer;
  rememberCustomer({ id: c.id, name: d.name, mobile: c.mobile, village: c.village });
  const pre = `c=${c.id}&cn=${encodeURIComponent(d.name)}&cv=${encodeURIComponent(c.village)}&cm=${c.mobile}`;
  const wa = c.mobile ? 'https://wa.me/91' + c.mobile : null;
  const header = h('div', { class: 'stat-row' },
    stat('Girvi due', inr(d.girviDue)), stat('Order advance', inr(d.orderAdvance)), stat('Baki', inr(d.udhaar)));

  const loans = d.loans.filter((l) => l.status === 'open').map((l) => h('a', { class: 'row-card', href: '#/loan/' + l.id },
    h('div', { class: 'kv' }, h('b', null, l.item + ' · ' + g3(l.netWt) + ' g'), h('span', { class: 'link' }, 'Release ›')),
    h('div', { class: 'muted' }, inr(l.principal) + ' @ ₹' + l.ratePct + ' · ' + t('since') + ' ' + fdate(l.date) + ' (' + l.days + ' ' + t('days') + ') · ' + t('Due') + ' ' + inr(l.totalDue))));
  const orders = d.orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').map((o) => h('a', { class: 'row-card', href: '#/order/' + o.id },
    h('div', { class: 'kv' }, h('b', null, o.item + ' · ~' + g3(o.estWt) + ' g'), h('span', { class: 'tag ' + (o.rateFixed ? '' : 'gold') }, o.rateFixed ? 'Rate fixed' : 'Rate not fixed')),
    h('div', { class: 'muted' }, inr(o.paid) + ' deposited' + (o.deliveryDate ? ' · delivery ' + fdate(o.deliveryDate) : ''))));
  const repairs = d.repairs.filter((r) => r.status !== 'delivered').map((r) => h('a', { class: 'row-card', href: '#/repair/' + r.id },
    h('div', { class: 'kv' }, h('b', null, r.work + ': ' + r.item), h('span', { class: 'tag' }, r.status.replace('_', ' ')))));
  const history = [
    ...d.sales.map((s) => ({ date: s.date, el: h('a', { href: '#/bill/' + s.id }, fdate(s.date) + ' · ' + (s.type === 'GST' ? 'GST bill ' : 'Estimate ') + s.billNo + ' · ' + inr(s.net) + (s.status === 'void' ? ' (cancelled)' : '')) })),
    ...d.oldGold.map((g) => ({ date: g.date, el: h('span', null, fdate(g.date) + ' · Old ' + g.metal + ' ' + (g.source === 'sale' ? 'in exchange' : 'sold to shop') + ' · ' + g.item + ' ' + g3(g.weight) + ' g, cut ' + g.cutPct + '%, fine ' + g3(g.customerFine) + ' g · ' + (g.status === 'melted' ? 'melted' : 'in old gold stock')) })),
    ...d.loans.filter((l) => l.status === 'closed').map((l) => ({ date: l.closedAt, el: h('span', null, fdate(l.closedAt) + ' · Girvi released · ' + l.item) })),
    ...d.orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled').map((o) => ({ date: o.deliveredAt || o.date,
      el: h('a', { href: '#/order/' + o.id }, fdate(o.deliveredAt || o.date) + ' · ' + t('Order') + ' ' + t(o.status === 'delivered' ? 'Delivered' : 'Cancelled') + ' · ' + o.item) })),
    ...d.repairs.filter((r) => r.status === 'delivered').map((r) => ({ date: r.deliveredAt,
      el: h('a', { href: '#/repair/' + r.id }, fdate(r.deliveredAt) + ' · ' + t('Repair') + ' · ' + r.item + ' · ' + inr(r.custCharge)) })),
    ...(d.dues || []).map((x) => ({ date: x.date, el: h('a', { href: '#/dues' }, fdate(x.date) + ' · ' + t('Baki') + ' ' + (x.amount < 0 ? '− ' : '+ ') + inr(Math.abs(x.amount))) }))
  ].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 25).map((x) => h('div', { class: 'hist' }, x.el));

  return screen(d.name, [c.village, c.mobile].filter(Boolean).join(' · '), [
    header,
    h('div', { class: 'row-actions' },
      wa ? h('a', { class: 'pill', href: wa, target: '_blank', rel: 'noopener' }, icon('wa', 18), 'WhatsApp') : null,
      c.mobile ? h('a', { class: 'pill', href: 'tel:+91' + c.mobile }, icon('phone', 18), 'Call') : null,
      isViewer() ? null : h('a', { class: 'pill', href: '#/customer-edit/' + c.id }, 'Edit'),
      d.udhaar > 0 && !isViewer() ? h('button', { class: 'pill', onclick: () => payUdhaar(c.id, d.udhaar) }, 'Baki received') : null,
      d.udhaar > 0 && c.mobile ? h('button', { class: 'pill', onclick: () => sendBakiReminder({ customerName: d.name, mobile: c.mobile, due: d.udhaar,
        since: (d.dues || []).reduce((m, x) => (!m || x.date < m ? x.date : m), '') }) }, '💬 ' + t('WhatsApp reminder')) : null),
    modOn('girvi') ? [sec('GIRVI · ' + loans.length + ' OPEN'), loans.length ? loans : empty('No open girvi')] : null,
    modOn('orders') ? [sec('ORDERS · ' + orders.length + ' PENDING'), orders.length ? orders : empty('No pending orders')] : null,
    modOn('repair') && repairs.length ? [sec('REPAIRS'), repairs] : null,
    sec('HISTORY'), history.length ? h('div', { class: 'card' }, history) : empty('Nothing yet')
  ], isViewer() ? null : h('div', { class: 'grid g3' },
    modOn('girvi') ? h('a', { class: 'btn small', href: '#/loan-new?' + pre }, '+ Girvi') : null,
    modOn('sale') ? h('a', { class: 'btn small', href: '#/sale?' + pre }, '+ Sale') : null,
    modOn('orders') ? h('a', { class: 'btn small', href: '#/order-new?' + pre }, '+ Order') : null), { back: '#/search' });
}

function stat(label, value) {
  return h('div', { class: 'stat' }, h('span', null, label), h('b', null, value));
}

async function payUdhaar(customerId, due) {
  const v = await ask('Baki received · due ' + inr(due), [
    { key: 'amount', label: 'Amount (₹)', type: 'num', value: String(Math.round(due)) },
    { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' }]);
  if (!v) return;
  await busy(null, async () => {
    await call('dues.pay', { customerId, amount: v.amount, mode: v.mode });
    toast('Saved');
    go('customer/' + customerId);
  });
}

export async function edit({ id }) {
  let c = { firstName: '', lastName: '', mobile: '', village: '', address: '', notes: '' };
  if (id !== 'new') c = (await call('customers.get', { id })).customer;
  const f = {
    firstName: field(t('First name'), { value: c.firstName }), lastName: field(t('Surname'), { value: c.lastName }),
    mobile: field(t('Mobile number'), { type: 'tel', value: c.mobile }), village: field(t('Village'), { value: c.village }),
    address: field('Address', { value: c.address }), notes: field('Notes', { type: 'textarea', value: c.notes })
  };
  f.firstName.input.setAttribute('autofocus', '');
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const data = { id: id === 'new' ? '' : id };
    Object.keys(f).forEach((k) => { data[k] = f[k].input.value; });
    const r = await call('customers.save', data);
    toast('Customer saved');
    go('customer/' + r.id);
  }) }, t('Save'));
  return screen(id === 'new' ? t('New customer') : 'Edit customer', null,
    [card(grid(2, f.firstName, f.lastName), grid(2, f.mobile, f.village), f.address, f.notes)], save,
    { back: id === 'new' ? '#/search' : '#/customer/' + id });
}
