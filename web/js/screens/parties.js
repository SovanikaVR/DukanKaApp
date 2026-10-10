/* Wholesaler and karigar accounts: gold (fine grams) and cash, both ways. */
import { call } from '../api.js';
import { S, purityFor, isViewer, setting, list as settingList } from '../state.js';
import { h, screen, busy, toast, inr, fdate, g3, go, empty, ask, num, confirmBox } from '../ui.js';
import { t } from '../i18n.js';

const ENTRY_LABEL = {
  purchase: 'Bought goods', pay_gold: 'Gave fine gold', pay_silver: 'Gave fine silver', pay_cash_rate: 'Paid cash (rate cut)', pay_cash: 'Paid cash',
  issue_gold: 'Gave gold', return_gold: 'Gold returned', job_done: 'Job done', pay_labour: 'Paid labour'
};

export async function list({ type }) {
  const rows = await call('parties.list', { type });
  const isW = type === 'wholesaler';
  const add = async () => {
    const v = await ask(isW ? 'New wholesaler' : 'New karigar', [{ key: 'name', label: 'Name', value: '' }, { key: 'mobile', label: t('Mobile number'), type: 'tel', value: '' }]);
    if (!v) return;
    await busy(null, async () => { const p = await call('parties.save', Object.assign({ type }, v)); toast('Added'); go('party/' + p.id); });
  };
  const tg = rows.reduce((a, p) => a + p.goldG, 0), tc = rows.reduce((a, p) => a + p.cash, 0), ts = rows.reduce((a, p) => a + (p.silverG || 0), 0);
  return screen(t(isW ? 'Wholesaler' : 'Karigar'), isW ? 'What we owe' : 'Our gold with them · labour we owe', [
    h('div', { class: 'stat-row' },
      h('div', { class: 'stat' }, h('span', null, isW ? 'Gold to give' : 'Our gold with karigars'), h('b', null, g3(tg) + ' g')),
      isW && ts ? h('div', { class: 'stat' }, h('span', null, t('Silver to give')), h('b', null, g3(ts) + ' g')) : null,
      h('div', { class: 'stat' }, h('span', null, isW ? 'Cash to give' : 'Labour to pay'), h('b', null, inr(tc)))),
    rows.length ? rows.map((p) => h('a', { class: 'row-card', href: '#/party/' + p.id },
      h('div', { class: 'kv' }, h('b', null, p.name), h('b', null, g3(p.goldG) + ' g' + (p.silverG ? ' · Ag ' + g3(p.silverG) + ' g' : ''))),
      h('div', { class: 'kv muted' }, h('span', null, p.mobile || ''), h('span', null, (isW ? 'Cash ' : 'Labour ') + inr(p.cash) + (isW ? ' · today ' + inr(p.valueToday) : ''))))) :
      empty('None added yet')
  ], isViewer() ? null : h('button', { class: 'btn', onclick: add }, isW ? '+ Add wholesaler' : '+ Add karigar'));
}

export async function view({ id }) {
  const d = await call('parties.ledger', { id });
  const p = d.party;
  window._dkPartyType = p.type;
  const isW = p.type === 'wholesaler';
  const rate24 = S.rate ? S.rate.g24 : '';
  const entry = (type, fields, extra, confirmText) => async () => {
    const v = await ask(ENTRY_LABEL[type], fields.concat([{ key: 'date', label: t('Date'), type: 'date', value: S.today }, { key: 'notes', label: 'Note', value: '' }]));
    if (!v) return;
    if (confirmText && !await confirmBox(ENTRY_LABEL[type], confirmText(v))) return;
    await busy(null, async () => {
      await call('parties.entry', Object.assign({ partyId: id, type }, extra ? extra(v) : {}, v));
      toast('Saved');
      go('party/' + id);
    });
  };
  const mode = { key: 'mode', label: 'Paid by', options: [{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }], value: 'cash' };
  // Bought goods: the purity (touch) % decides the fine to give — e.g. 100 g goods at 92% → 92 g fine.
  const purchase = async () => {
    const v = await ask('Bought goods', [
      { key: 'karat', label: t('Metal / karat of the goods'), options: [{ value: '22K', label: '22K' }, { value: '18K', label: '18K' }, { value: '24K', label: '24K' }, { value: 'Silver', label: t('Silver') }], value: '22K' },
      { key: 'grossWt', label: 'Goods weight (g)', type: 'num', value: '' },
      { key: 'touch', label: t('Purity % for the fine to give (touch) — blank = karat purity'), type: 'num', value: '' },
      { key: 'cash', label: 'Labour / cash to pay (₹)', type: 'num', value: '' },
      { key: 'addStock', label: 'Add to stock now?', options: [{ value: 'yes', label: 'Yes, as one lot' }, { value: 'no', label: 'No, I will add items' }], value: 'yes' },
      { key: 'name', label: 'Item / lot name', value: '' },
      { key: 'category', label: 'Category', value: '' },
      { key: 'date', label: t('Date'), type: 'date', value: S.today }]);
    if (!v) return;
    const silver = v.karat === 'Silver';
    const itemPurity = silver ? num(setting('purity_silver', '100')) : num(purityFor(v.karat || '22K'));
    const touch = num(v.touch) || itemPurity;
    if (touch > 100) { toast(t('Purity % should be 100 or less'), 'err'); return; }
    const wt = num(v.grossWt);
    const fine = Math.round(wt * touch / 100 * 1000) / 1000;
    if (!fine && !num(v.cash)) { toast(t('Enter the goods weight'), 'err'); return; }
    const metalName = silver ? t('fine silver') : t('fine gold');
    if (!await confirmBox(t('Bought goods'), g3(wt) + ' g × ' + touch + '% = ' + g3(fine) + ' g ' + metalName + ' ' + t('to give') +
      (num(v.cash) ? ' + ' + inr(num(v.cash)) : '') + '. ' + t('OK?'))) return;
    await busy(null, async () => {
      const rateG = silver ? num(S.rate ? S.rate.silver : 0) : num(rate24);
      const items = v.addStock === 'yes' && wt > 0 ? [{ name: v.name || 'Lot from ' + p.name, category: (v.category || '').trim() || 'Other', metal: silver ? 'silver' : 'gold',
        purityPct: itemPurity, grossWt: v.grossWt, netWt: v.grossWt, costTotal: Math.round(fine * rateG + num(v.cash)) }] : [];
      await call('parties.entry', Object.assign({ partyId: id, type: 'purchase', cash: v.cash, date: v.date, items,
        notes: g3(wt) + ' g ' + (silver ? 'silver' : v.karat) + ' @ ' + touch + '%' + (v.name ? ' · ' + v.name : '') }, silver ? { silverG: fine } : { goldG: fine }));
      toast('Saved');
      go('party/' + id);
    });
  };
  const buttons = isW ? [
    h('button', { class: 'btn2 small', onclick: purchase }, 'Bought goods'),
    h('button', { class: 'btn2 small', onclick: entry('pay_gold', [{ key: 'goldG', label: 'Fine gold given (g)', type: 'num', value: '' }]) }, 'Give fine gold'),
    h('button', { class: 'btn2 small', onclick: entry('pay_cash_rate', [{ key: 'goldG', label: t('Grams settled') + ' · ' + t('owed') + ' ' + g3(d.goldG) + ' g', type: 'num', value: '' }, { key: 'rate', label: 'Rate ₹/g', type: 'num', value: String(rate24) }, mode], null, (v) => t('Cash to pay') + ': ' + inr(num(v.goldG) * num(v.rate)) + '. ' + t('OK?')) }, 'Pay cash (rate cut)'),
    h('button', { class: 'btn2 small', onclick: entry('pay_cash', [{ key: 'cash', label: 'Amount (₹)', type: 'num', value: '' }, mode]) }, 'Pay cash dues'),
    h('button', { class: 'btn2 small', onclick: entry('pay_silver', [{ key: 'silverG', label: t('Fine silver given (g)') + (d.silverG ? ' · ' + t('owed') + ' ' + g3(d.silverG) + ' g' : ''), type: 'num', value: '' }]) }, t('Give fine silver')),
    d.silverG > 0 ? h('button', { class: 'btn2 small', onclick: entry('pay_cash_rate', [{ key: 'goldG', label: t('Silver grams settled') + ' · ' + t('owed') + ' ' + g3(d.silverG) + ' g', type: 'num', value: '' },
      { key: 'rate', label: t('Silver rate ₹/g'), type: 'num', value: String(S.rate ? S.rate.silver || '' : '') }, mode], () => ({ metal: 'silver' }),
      (v) => t('Cash to pay') + ': ' + inr(num(v.goldG) * num(v.rate)) + '. ' + t('OK?')) }, t('Silver rate cut')) : null
  ] : [
    h('button', { class: 'btn2 small', onclick: entry('issue_gold', [{ key: 'goldG', label: 'Fine gold given (g)', type: 'num', value: '' }]) }, 'Give gold'),
    h('button', { class: 'btn2 small', onclick: entry('return_gold', [{ key: 'goldG', label: 'Gold returned (g)', type: 'num', value: '' }]) }, 'Gold returned'),
    h('button', { class: 'btn2 small', onclick: entry('job_done', [{ key: 'goldG', label: 'Fine gold used (g)', type: 'num', value: '' }, { key: 'cash', label: 'Labour (₹)', type: 'num', value: '' }]) }, 'Job done'),
    h('button', { class: 'btn2 small', onclick: entry('pay_labour', [{ key: 'cash', label: 'Amount (₹)', type: 'num', value: '' }, mode]) }, 'Pay labour')
  ];
  return screen(p.name, isW ? 'Wholesaler' : 'Karigar', [
    h('div', { class: 'stat-row' },
      h('div', { class: 'stat' }, h('span', null, isW ? 'Gold to give' : 'Our gold with him'), h('b', null, g3(d.goldG) + ' g')),
      isW && (d.silverG || d.entries.some((e) => e.silverG)) ? h('div', { class: 'stat' }, h('span', null, t('Silver to give')), h('b', null, g3(d.silverG) + ' g')) : null,
      h('div', { class: 'stat' }, h('span', null, isW ? 'Cash to give' : 'Labour to pay'), h('b', null, inr(d.cash)))),
    isW ? h('div', { class: 'hint' }, 'At today\'s rate: ' + inr(d.valueToday) + ' in total') : null,
    isViewer() ? null : h('div', { class: 'grid g2' }, buttons),
    h('div', { class: 'sec' }, 'ACCOUNT · NEWEST FIRST'),
    d.entries.length ? d.entries.map((e) => h('div', { class: 'row-card' },
      h('div', { class: 'kv' }, h('b', null, ENTRY_LABEL[e.type] || e.type),
        h('b', { class: (e.goldG || e.silverG) > 0 === isW ? 'bad' : 'good' }, e.goldG ? (e.goldG > 0 ? '+ ' : '− ') + g3(Math.abs(e.goldG)) + ' g' : e.silverG ? (e.silverG > 0 ? '+ ' : '− ') + 'Ag ' + g3(Math.abs(e.silverG)) + ' g' : '')),
      h('div', { class: 'kv muted' }, h('span', null, fdate(e.date) + (e.notes ? ' · ' + e.notes : '') + (e.rate ? ' · @' + inr(e.rate) : '')),
        h('span', null, e.cash ? (e.cash > 0 ? '+ ' : '− ') + inr(Math.abs(e.cash)) : '')))) : empty('No entries yet')
  ], null, { back: '#/parties/' + p.type });
}
