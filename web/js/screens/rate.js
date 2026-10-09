/* Today's rate. */
import { call } from '../api.js';
import { S, setting, isViewer } from '../state.js';
import { h, screen, field, card, grid, busy, toast, num, inr, fdate, go } from '../ui.js';
import { t } from '../i18n.js';

export async function render() {
  const r = S.rate || {};
  const g24 = field('24K (fine)', { type: 'num', value: r.g24 || '' });
  const g22 = field('22K', { type: 'num', value: r.g22 || '' });
  const g18 = field('18K', { type: 'num', value: r.g18 || '' });
  const ag = field('Fine silver', { type: 'num', value: r.silver || '' });
  g24.input.setAttribute('autofocus', '');
  // A 22K / 18K rate the shop set by hand today is kept when 24K is changed.
  const auto = (p) => Math.round(num(r.g24) * num(p) / 100);
  let touched22 = !!(r.isToday && r.g22 && num(r.g22) !== auto(setting('purity_22k', '91.6')));
  let touched18 = !!(r.isToday && r.g18 && num(r.g18) !== auto(setting('purity_18k', '75')));
  g22.input.addEventListener('input', () => { touched22 = true; });
  g18.input.addEventListener('input', () => { touched18 = true; });
  g24.input.addEventListener('input', () => {
    const v = num(g24.input.value);
    if (!touched22) g22.input.value = v ? Math.round(v * num(setting('purity_22k', '91.6')) / 100) : '';
    if (!touched18) g18.input.value = v ? Math.round(v * num(setting('purity_18k', '75')) / 100) : '';
  });
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    S.rate = await call('rates.save', { g24: g24.input.value, g22: g22.input.value, g18: g18.input.value, silver: ag.input.value });
    toast('Rate saved for today');
    go('home');
  }) }, 'Save today\'s rate');
  const history = h('div', { class: 'hint' }, t('Loading…'));
  call('rates.list').then((list) => {
    history.replaceChildren(...list.slice(0, 7).map((x) =>
      h('div', { class: 'kv small' }, h('span', null, fdate(x.date)), h('span', null, '24K ' + inr(x.g24) + ' · 22K ' + inr(x.g22) + (x.silver ? ' · Ag ' + inr(x.silver) : '')))));
  }).catch(() => history.replaceChildren());

  return screen(t("Today's rate"), fdate(S.today) + ' · used for all bills today', [
    r.g24 && !r.isToday && !isViewer() ? h('button', { class: 'btn2', onclick: () => busy(null, async () => {
      S.rate = await call('rates.save', { g24: r.g24, g22: r.g22, g18: r.g18, silver: r.silver });
      toast('Same rate as ' + fdate(r.date) + ' saved for today');
      go('home');
    }) }, 'Same as ' + fdate(r.date)) : null,
    card(h('div', { class: 'sec gold' }, 'GOLD · per gram'), g24, grid(2, g22, g18),
      h('div', { class: 'hint' }, '22K and 18K fill in from 24K (' + setting('purity_22k', '91.6') + '% and ' + setting('purity_18k', '75') + '%). Type over them if your rate is different.')),
    card(h('div', { class: 'sec' }, 'SILVER · per gram'), ag),
    h('div', { class: 'sec' }, 'Last days'), history
  ], isViewer() ? null : save);
}
