/* Customer picker used on every entry screen: type mobile or name, tap the match, or add new. */
import { call } from './api.js';
import { h, field, icon, grid } from './ui.js';
import { t } from './i18n.js';

export function customerPicker(query = {}) {
  let chosen = query.c ? { id: query.c, name: query.cn || '', village: query.cv || '', mobile: query.cm || '' } : null;
  let timer = null;
  const box = h('div', { class: 'picker' });
  const q = field(t('Mobile number') + ' / ' + t('Customer'), { type: 'text', placeholder: 'Type mobile or name' });
  q.input.setAttribute('autocomplete', 'off');
  const results = h('div', { class: 'pick-results' });
  const first = field(t('First name'));
  const last = field(t('Surname'));
  const village = field(t('Village'));
  const mobile = field(t('Mobile number'), { type: 'tel' });
  const newForm = h('div', { class: 'pick-new hidden' },
    h('div', { class: 'hint' }, 'New customer — will be saved with this entry'),
    grid(2, first, last), grid(2, mobile, village));

  q.input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(search, 300);
  });

  async function search() {
    const v = q.input.value.trim();
    if (v.length < 2) { results.replaceChildren(); return; }
    try {
      const r = await call('customers.search', { q: v });
      const digits = v.replace(/\D/g, '');
      results.replaceChildren(
        ...r.results.slice(0, 4).map((c) => h('button', { type: 'button', class: 'pick-item', onclick: () => pick(c) },
          h('b', null, c.name), h('span', null, [c.village, c.mobile].filter(Boolean).join(' · ')))),
        h('button', { type: 'button', class: 'pick-item add', onclick: () => {
          openNew(digits.length >= 10 ? { mobile: digits } : { firstName: v.split(' ')[0], lastName: v.split(' ').slice(1).join(' ') });
        } }, icon('plus', 18), h('b', null, t('New customer'))));
    } catch (e) {
      results.replaceChildren(h('div', { class: 'hint bad' }, e.message));
    }
  }

  function pick(c) {
    chosen = c;
    draw();
    box.dispatchEvent(new CustomEvent('picked', { detail: c }));
  }

  function openNew(pref) {
    chosen = null;
    first.input.value = pref.firstName || '';
    last.input.value = pref.lastName || '';
    mobile.input.value = pref.mobile || '';
    newForm.classList.remove('hidden');
    results.replaceChildren();
    (pref.firstName ? village.input : first.input).focus();
  }

  function draw() {
    if (chosen) {
      box.replaceChildren(h('div', { class: 'picked' }, icon('check', 18),
        h('span', null, h('b', null, chosen.name), [chosen.village, chosen.mobile].filter(Boolean).length ? ' · ' + [chosen.village, chosen.mobile].filter(Boolean).join(' · ') : ''),
        h('button', { type: 'button', class: 'link', onclick: () => { chosen = null; draw(); } }, 'Change')));
    } else {
      box.replaceChildren(q, results, newForm);
    }
  }
  draw();

  box.get = () => {
    if (chosen) return { customerId: chosen.id };
    if (!newForm.classList.contains('hidden') && first.input.value.trim()) {
      return { customer: { firstName: first.input.value.trim(), lastName: last.input.value.trim(),
        mobile: mobile.input.value.trim(), village: village.input.value.trim() } };
    }
    throw new Error('Pick the customer first (type mobile or name)');
  };
  box.chosen = () => chosen;
  box.mobile = () => (chosen ? chosen.mobile : mobile.input.value.trim());
  box.name = () => (chosen ? chosen.name : (first.input.value + ' ' + last.input.value).trim());
  return box;
}
