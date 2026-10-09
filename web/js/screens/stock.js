/* Stock: summary by category, item list, add items. */
import { call } from '../api.js';
import { list as settingList, purityFor, isViewer, isOwner } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, inr, g3, go, empty, chips, num, ask, remember } from '../ui.js';
import { t } from '../i18n.js';
import { exportCsvButton } from './exports.js';

export async function render(params, query) {
  const metal = query.m || 'gold';
  const cat = query.c || '';
  const [sum, items] = await Promise.all([call('stock.summary'), call('stock.list', { metal, category: cat })]);
  const tot = sum.totals[metal] || { pieces: 0, netWt: 0, value: 0 };
  const cats = sum.categories.filter((c) => c.metal === metal);
  const remove = async (i) => {
    const v = await ask('Remove from stock?', [{ key: 'why', label: 'Reason (lost, sent back, own use…)', value: '' }], 'Remove');
    if (!v) return;
    await busy(null, async () => { await call('stock.update', { id: i.id, status: 'removed' }); toast('Removed'); go('stock?m=' + metal + '&c=' + encodeURIComponent(cat)); });
  };
  const edit = async (i) => {
    const v = await ask(t('Correct stock item'), [
      { key: 'name', label: t('Item'), type: 'text', value: i.name },
      { key: 'category', label: 'Category', type: 'text', value: i.category },
      { key: 'grossWt', label: 'Gross wt (g)', type: 'num', value: String(i.grossWt) },
      { key: 'netWt', label: 'Net wt (g)', type: 'num', value: String(i.netWt) },
      { key: 'pieces', label: 'Pieces', type: 'num', value: String(i.pieces) },
      { key: 'purityPct', label: t('Purity %'), type: 'num', value: String(i.purityPct || '') },
      { key: 'makingPerG', label: t('Making ₹/g'), type: 'num', value: String(i.makingPerG || '') },
      { key: 'costTotal', label: 'Our cost ₹ (total)', type: 'num', value: String(i.costTotal || '') }]);
    if (!v) return;
    await busy(null, async () => { await call('stock.update', Object.assign({ id: i.id }, v)); toast('Saved'); go('stock?m=' + metal + '&c=' + encodeURIComponent(cat)); });
  };
  return screen(t('Stock'), 'Today: ' + sum.soldToday + ' sold', [
    h('div', { class: 'stat-row' },
      h('div', { class: 'stat' }, h('span', null, metal === 'gold' ? 'Gold in shop' : 'Silver in shop'), h('b', null, tot.pieces + ' pcs · ' + g3(tot.netWt) + ' g')),
      h('div', { class: 'stat' }, h('span', null, 'Value today'), h('b', null, inr(tot.value)))),
    chips([{ label: 'Gold', value: 'gold', on: metal === 'gold' }, { label: 'Silver', value: 'silver', on: metal === 'silver' }],
      (v) => go('stock?m=' + v)),
    cats.length ? h('div', { class: 'card table' },
      h('div', { class: 'trow head' }, h('span', null, 'CATEGORY'), h('span', null, 'PIECES'), h('span', { class: 'r' }, 'WEIGHT')),
      cats.map((c) => h('a', { class: 'trow' + (c.category === cat ? ' on' : ''), href: '#/stock?m=' + metal + (c.category === cat ? '' : '&c=' + encodeURIComponent(c.category)) },
        h('b', null, c.category), h('span', null, c.pieces), h('span', { class: 'r' }, g3(c.netWt) + ' g')))) : empty('No ' + metal + ' items in stock'),
    h('div', { class: 'sec' }, (cat || 'ALL') + ' · ITEMS'),
    items.length ? items.map((i) => h('div', { class: 'row-card' },
      h('div', { class: 'kv' }, h('b', null, (i.tag ? i.tag + ' · ' : '') + i.name), h('b', null, g3(i.netWt) + ' g')),
      h('div', { class: 'kv muted' }, h('span', null, i.category + (i.purityPct ? ' · ' + i.purityPct + '%' : '') + (i.pieces > 1 ? ' · ' + i.pieces + ' pcs' : '')),
        h('span', { class: 'row-actions' },
          isOwner() ? h('button', { class: 'link', onclick: () => edit(i) }, t('Edit')) : null,
          isOwner() ? h('button', { class: 'link', onclick: () => remove(i) }, 'Remove') : null)))) : empty('Nothing here'),
    h('div', { class: 'hint' }, t('Selling from stock: in New Sale tap "From stock". Then the item leaves stock by itself (for a lot, only the weight / pieces sold). Items typed by hand in a bill do not change stock.'))
  ], isViewer() ? null : h('a', { class: 'btn', href: '#/stock-add?m=' + metal }, '+ Add stock'), { right: exportCsvButton('stock', () => ({ status: 'in' })) });
}

export async function add(params, query) {
  const cats = settingList('item_categories');
  const rows = [];
  const box = h('div', { class: 'stack' });
  const addRow = () => {
    let metal = query.m === 'silver' ? 'silver' : 'gold';
    const name = field(t('Item'), {});
    const category = field('Category', { value: remember('stock_cat'), placeholder: t('Type or pick (e.g. Ring)') });
    category.input.setAttribute('list', 'cats');
    const purity = field(t('Purity %'), { type: 'num', value: metal === 'silver' ? '100' : purityFor('22K') });
    const gross = field('Gross wt (g)', { type: 'num' });
    const net = field('Net wt (g)', { type: 'num' });
    const pcs = field('Pieces', { type: 'num', value: '1' });
    const making = field(t('Making ₹/g'), { type: 'num' });
    const cost = field('Our cost ₹ (total)', { type: 'num' });
    const tag = field('Tag (blank = auto)', {});
    gross.input.addEventListener('input', () => { if (!net.input.dataset.touched) net.input.value = gross.input.value; });
    net.input.addEventListener('input', () => { net.input.dataset.touched = '1'; });
    const mseg = seg([{ value: 'gold', label: 'Gold' }, { value: 'silver', label: 'Silver' }], metal, (v) => { metal = v; purity.input.value = v === 'silver' ? '100' : purityFor('22K'); });
    const el = card(mseg, grid(2, name, category), grid(3, gross, net, purity), grid(3, pcs, making, cost), tag);
    rows.push({ get: () => ({ metal, name: name.input.value, category: category.input.value, purityPct: purity.input.value,
      grossWt: gross.input.value, netWt: net.input.value, pieces: pcs.input.value, makingPerG: making.input.value,
      costTotal: cost.input.value, tag: tag.input.value }) });
    box.appendChild(el);
  };
  addRow();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const items = rows.map((r) => r.get()).filter((i) => num(i.netWt) > 0 || num(i.grossWt) > 0);
    rows.forEach((x) => { const c = x.get().category; if (c) remember('stock_cat', c); });
    const r = await call('stock.add', { items });
    toast(r.length + ' item(s) added · tags ' + r.map((x) => x.tag).join(', '));
    go('stock');
  }) }, 'Save to stock');
  return screen('Add stock', 'For goods bought on credit, use the Wholesaler screen instead', [
    h('datalist', { id: 'cats' }, cats.map((c) => h('option', { value: c }))), box,
    h('button', { class: 'add', type: 'button', onclick: addRow }, '+ Another item'),
    h('div', { class: 'hint' }, 'Small same-type items (bichhiya, small payal) can be one row: total weight + number of pieces.')
  ], save, { back: '#/stock' });
}
