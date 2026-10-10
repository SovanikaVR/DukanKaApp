/* Melting: pick old gold or silver, enter bar weight + tested purity (+ refining loss); fine stock and weight lost. */
import { call } from '../api.js';
import { S, isViewer } from '../state.js';
import { h, screen, field, card, grid, busy, toast, num, inr, fdate, g3, sec, go, empty, chips } from '../ui.js';
import { t } from '../i18n.js';
import { exportCsvButton } from './exports.js';

export async function render(params, query) {
  const metal = query.m === 'silver' ? 'silver' : 'gold';
  const ag = metal === 'silver';
  const [fine, old, melts] = await Promise.all([call('fine.summary'), call('oldgold.list', { status: 'stock' }), call('melt.list', { metal })]);
  const items = old.filter((g) => (g.metal === 'silver' ? 'silver' : 'gold') === metal);
  const picked = new Set(items.map((g) => g.id));
  const bar = field(t('Bar weight after melting (g)'), { type: 'num' });
  const purity = field(t('Purity % (tested)'), { type: 'num' });
  const refine = field(t('Weight lost in refining / testing (g)'), { type: 'num', value: '' });
  const cost = field(t('Melting / testing charge (₹)'), { type: 'num' });
  const totals = h('div', { class: 'stack' });
  const result = h('div', { class: 'card good-card' });
  const rate = S.rate ? (ag ? S.rate.silver : S.rate.g24) : 0;
  const draw = () => {
    const sel = items.filter((g) => picked.has(g.id));
    const wt = sel.reduce((a, g) => a + g.weight, 0), less = sel.reduce((a, g) => a + (g.lossG || 0), 0);
    const our = sel.reduce((a, g) => a + g.ourFine, 0), paid = sel.reduce((a, g) => a + g.customerFine, 0), amount = sel.reduce((a, g) => a + g.amount, 0);
    const netIn = wt - less;
    totals.replaceChildren(
      h('div', { class: 'kv strong' }, h('span', null, sel.length + ' ' + t('items') + ' · ' + g3(wt) + ' g'), h('span', null, t('Our estimate') + ' ' + g3(our) + ' g')),
      less ? h('div', { class: 'kv muted' }, h('span', null, t('Less taken off when buying')), h('span', null, '− ' + g3(less) + ' g = ' + g3(netIn) + ' g')) : null);
    const b = num(bar.input.value), rl = num(refine.input.value);
    const actual = Math.max(0, b - rl) * num(purity.input.value) / 100;
    const meltLoss = netIn - b;
    result.style.display = b ? '' : 'none';
    result.replaceChildren(
      h('div', { class: 'sec' }, t('WEIGHT LOST')),
      h('div', { class: 'kv' }, h('span', null, t('In melting') + ' (' + g3(netIn) + ' → ' + g3(b) + ' g)'), h('b', { class: meltLoss > 0 ? 'bad' : '' }, g3(meltLoss) + ' g')),
      rl ? h('div', { class: 'kv' }, h('span', null, t('In refining / testing')), h('b', { class: 'bad' }, g3(rl) + ' g')) : null,
      h('div', { class: 'kv' }, h('span', null, t('Total lost')), h('b', null, g3(meltLoss + rl + less) + ' g' + (wt ? ' (' + Math.round((meltLoss + rl + less) / wt * 1000) / 10 + '%)' : ''))),
      purity.input.value ? [
        h('div', { class: 'sec' }, t('FINE')),
        h('div', { class: 'kv' }, h('span', null, t('Paid customers for')), h('span', null, g3(paid) + ' g · ' + inr(amount))),
        h('div', { class: 'kv' }, h('span', null, t('Actual fine') + ' ' + g3(Math.max(0, b - rl)) + ' × ' + num(purity.input.value) + '%'), h('b', null, g3(actual) + ' g')),
        h('div', { class: 'kv' }, h('span', null, t('vs our estimate')), h('span', { class: actual - our >= 0 ? 'good' : 'bad' }, (actual - our >= 0 ? '+' : '') + g3(actual - our) + ' g · ' + inr((actual - our) * rate))),
        h('div', { class: 'kv strong' }, h('span', null, t('Real gain vs what we paid')), h('span', { class: actual - paid >= 0 ? 'good' : 'bad' }, (actual - paid >= 0 ? '+' : '') + g3(actual - paid) + ' g · ' + inr(actual * rate - amount - num(cost.input.value))))] : null);
  };
  [bar, purity, refine, cost].forEach((f) => f.input.addEventListener('input', draw));
  const list = items.length ? card(items.map((g) => {
    const cb = h('input', { type: 'checkbox', checked: true, onchange: () => { if (cb.checked) picked.add(g.id); else picked.delete(g.id); draw(); } });
    return h('label', { class: 'check-row' }, cb, h('span', { class: 'grow' }, g.item + ' · ' + g.customerName + ' · ' + fdate(g.date)),
      h('span', null, g3(g.weight) + ' g' + (g.lossG ? ' (−' + g3(g.lossG) + ')' : '')));
  }), totals) : empty(ag ? t('No old silver waiting to be melted') : t('No old gold waiting to be melted'));
  draw();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const m = await call('melt.create', { metal, oldGoldIds: [...picked], barWt: bar.input.value, purityPct: purity.input.value, refineLossG: refine.input.value, cost: cost.input.value });
    toast(g3(m.actualFine) + ' g ' + (ag ? t('fine silver') : t('fine gold')) + ' ' + t('added to stock') + ' · ' + t('lost') + ' ' + g3(m.totalLossG) + ' g');
    go('melt' + (ag ? '?m=silver' : ''));
  }) }, t('Add to fine stock'));
  const L = (fine.losses || {})[metal] || { buy: 0, melt: 0, refine: 0 };
  const inHand = ag ? (fine.silver || {}).inHand || 0 : fine.inHand;
  const oldW = ag ? ((fine.silver || {}).old || {}).weight || 0 : fine.oldGold.weight;
  return screen(t('Melting & fine gold'), t('Old waiting') + ': ' + g3(oldW) + ' g', [
    chips([{ label: t('Gold'), value: 'gold', on: !ag }, { label: t('Silver'), value: 'silver', on: ag }], (v) => go('melt' + (v === 'silver' ? '?m=silver' : ''))),
    h('div', { class: 'stat-row' },
      h('div', { class: 'stat' }, h('span', null, ag ? t('Fine silver in hand') : t('Fine in hand')), h('b', null, g3(inHand) + ' g')),
      ag ? null : h('div', { class: 'stat' }, h('span', null, t('With karigars')), h('b', null, g3(fine.withKarigars) + ' g')),
      h('div', { class: 'stat' }, h('span', null, t('Weight lost (all time)')), h('b', null, g3(L.buy + L.melt + L.refine) + ' g'))),
    h('div', { class: 'hint' }, t('Lost when buying') + ' ' + g3(L.buy) + ' g · ' + t('in melting') + ' ' + g3(L.melt) + ' g · ' + t('in refining') + ' ' + g3(L.refine) + ' g'),
    isViewer() ? null : [sec(t('NEW MELT BATCH · pick old items')), list, sec(t('AFTER MELTING')), grid(2, bar, purity), grid(2, refine, cost), result],
    sec(t('PAST BATCHES')),
    melts.length ? melts.slice(0, 20).map((m) => h('div', { class: 'row-card' },
      h('div', { class: 'kv' }, h('b', null, fdate(m.date) + ' · ' + m.items + ' ' + t('items')), h('b', null, g3(m.actualFine) + ' g ' + t('fine'))),
      h('div', { class: 'kv muted' }, h('span', null, g3(m.totalWt) + ' g → ' + t('bar') + ' ' + g3(m.barWt) + ' g @ ' + m.purityPct + '%'),
        h('span', { class: m.vsPaidG >= 0 ? 'good' : 'bad' }, (m.vsPaidG >= 0 ? '+' : '') + g3(m.vsPaidG) + ' g ' + t('vs paid'))),
      m.totalLossG ? h('div', { class: 'kv muted small' }, h('span', null, t('Lost') + ': ' + t('melting') + ' ' + g3(m.lossG) + ' g' + (m.refineLossG ? ' · ' + t('refining') + ' ' + g3(m.refineLossG) + ' g' : '')),
        h('span', null, m.lossPct + '%')) : null)) : empty(t('No batches yet'))
  ], isViewer() || !items.length ? null : save, { right: exportCsvButton('oldgold', () => ({})) });
}
