/* Melting: pick old gold, enter bar weight + tested purity; fine gold stock. */
import { call } from '../api.js';
import { S, isViewer } from '../state.js';
import { h, screen, field, card, grid, busy, toast, num, inr, fdate, g3, sec, go, empty } from '../ui.js';

export async function render() {
  const [fine, old, melts] = await Promise.all([call('fine.summary'), call('oldgold.list', { status: 'stock' }), call('melt.list')]);
  const gold = old.filter((g) => g.metal === 'gold');
  const picked = new Set(gold.map((g) => g.id));
  const bar = field('Bar weight (g)', { type: 'num' });
  const purity = field('Purity % (tested)', { type: 'num' });
  const cost = field('Melting / testing charge (₹)', { type: 'num' });
  const totals = h('div', { class: 'kv strong' });
  const result = h('div', { class: 'card good-card' });
  const draw = () => {
    const sel = gold.filter((g) => picked.has(g.id));
    const wt = sel.reduce((a, g) => a + g.weight, 0), our = sel.reduce((a, g) => a + g.ourFine, 0),
      paid = sel.reduce((a, g) => a + g.customerFine, 0), amount = sel.reduce((a, g) => a + g.amount, 0);
    totals.replaceChildren(h('span', null, sel.length + ' items · ' + g3(wt) + ' g'), h('span', null, 'Our estimate ' + g3(our) + ' g'));
    const actual = num(bar.input.value) * num(purity.input.value) / 100;
    const rate = S.rate ? S.rate.g24 : 0;
    result.style.display = actual ? '' : 'none';
    result.replaceChildren(
      h('div', { class: 'kv' }, h('span', null, 'Paid customers for'), h('span', null, g3(paid) + ' g fine · ' + inr(amount))),
      h('div', { class: 'kv' }, h('span', null, 'Actual fine ' + g3(bar.input.value) + ' × ' + num(purity.input.value) + '%'), h('b', null, g3(actual) + ' g')),
      h('div', { class: 'kv' }, h('span', null, 'vs our estimate'), h('span', { class: actual - our >= 0 ? 'good' : 'bad' }, (actual - our >= 0 ? '+' : '') + g3(actual - our) + ' g · ' + inr((actual - our) * rate))),
      h('div', { class: 'kv strong' }, h('span', null, 'Real gain vs what we paid'), h('span', { class: actual - paid >= 0 ? 'good' : 'bad' }, (actual - paid >= 0 ? '+' : '') + g3(actual - paid) + ' g · ' + inr(actual * rate - amount - num(cost.input.value)))));
  };
  [bar, purity, cost].forEach((f) => f.input.addEventListener('input', draw));
  const list = gold.length ? card(gold.map((g) => {
    const cb = h('input', { type: 'checkbox', checked: true, onchange: () => { if (cb.checked) picked.add(g.id); else picked.delete(g.id); draw(); } });
    return h('label', { class: 'check-row' }, cb, h('span', { class: 'grow' }, g.item + ' · ' + g.customerName + ' · ' + fdate(g.date)),
      h('span', null, g3(g.weight) + ' g'));
  }), totals) : empty('No old gold waiting to be melted');
  draw();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const m = await call('melt.create', { oldGoldIds: [...picked], barWt: bar.input.value, purityPct: purity.input.value, cost: cost.input.value });
    toast(g3(m.actualFine) + ' g fine added to stock');
    go('melt');
  }) }, 'Add to fine stock');
  return screen('Melting & fine gold', 'Old gold waiting: ' + g3(fine.oldGold.weight) + ' g', [
    h('div', { class: 'stat-row' },
      h('div', { class: 'stat' }, h('span', null, 'Fine in hand'), h('b', null, g3(fine.inHand) + ' g')),
      h('div', { class: 'stat' }, h('span', null, 'With karigars'), h('b', null, g3(fine.withKarigars) + ' g')),
      h('div', { class: 'stat' }, h('span', null, 'Avg cost'), h('b', null, inr(fine.avgCostPerG) + '/g'))),
    isViewer() ? null : [sec('NEW MELT BATCH · pick old gold'), list, sec('AFTER MELTING'), grid(2, bar, purity), cost, result],
    sec('PAST BATCHES'),
    melts.length ? melts.slice(0, 20).map((m) => h('div', { class: 'row-card' },
      h('div', { class: 'kv' }, h('b', null, fdate(m.date) + ' · ' + m.items + ' items'), h('b', null, g3(m.actualFine) + ' g fine')),
      h('div', { class: 'kv muted' }, h('span', null, 'Bar ' + g3(m.barWt) + ' g @ ' + m.purityPct + '%'),
        h('span', { class: m.vsPaidG >= 0 ? 'good' : 'bad' }, (m.vsPaidG >= 0 ? '+' : '') + g3(m.vsPaidG) + ' g vs paid')))) : empty('No batches yet')
  ], isViewer() || !gold.length ? null : save);
}
