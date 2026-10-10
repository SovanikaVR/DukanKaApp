/* Add many customers at once: from an Excel / CSV file (old register, old software) or from the phone's contacts.
 * Columns are matched by their heading (Name, Surname, Mobile, Village, Baki…); the owner can change the match. */
import { call } from '../api.js';
import { isOwner } from '../state.js';
import { h, screen, card, busy, toast, sec, inr, go, empty } from '../ui.js';
import { t } from '../i18n.js';
import { readTable } from '../xlsxread.js';
import { xlsxBook } from '../xlsx.js';

const TARGETS = [
  ['name', 'Full name (first word = name, rest = surname)', /^(full\s*name|name|customer|customer\s*name|naam|nav|नाव|नांव|नाम|ग्राहक|party|party\s*name)$/i],
  ['firstName', 'First name', /^(first\s*name|first|पहिले नाव|पहला नाम)$/i],
  ['lastName', 'Surname', /^(surname|last\s*name|last|आडनाव|सरनेम|उपनाम)$/i],
  ['mobile', 'Mobile', /(mobile|phone|mob|contact|number|मोबाइल|मोबाईल|फोन)/i],
  ['village', 'Village', /(village|gaon|gav|city|town|गाव|गांव|गाँव|शहर)/i],
  ['address', 'Address', /(address|पत्ता|पता)/i],
  ['baki', 'Opening baki ₹', /(baki|udhar|udhari|due|balance|outstanding|बाकी|उधारी|उधार)/i]
];

export async function render() {
  if (!isOwner()) return screen(t('Import customers'), null, [h('div', { class: 'hint' }, t('Only the owner can import customers.'))]);
  let table = null; // { head: [...], rows: [[...]] }
  let map = {};
  const work = h('div', { class: 'stack' });

  const fileInput = h('input', { type: 'file', accept: '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', class: 'hidden' });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    try {
      const rows = await readTable(f);
      if (rows.length < 2) throw new Error(t('The file has no rows under the heading row'));
      setTable(rows[0].map((x, i) => String(x || '').trim() || t('Column') + ' ' + (i + 1)), rows.slice(1));
    } catch (e) { toast(e.message, 'err'); }
    fileInput.value = '';
  });
  const canContacts = 'contacts' in navigator && 'select' in (navigator.contacts || {});
  const fromContacts = async () => {
    try {
      const list = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      if (!list || !list.length) return;
      setTable(['Name', 'Mobile'], list.map((c) => [String((c.name || [])[0] || '').trim(), String((c.tel || [])[0] || '')]));
    } catch (e) { toast(e.message, 'err'); }
  };
  const sample = () => {
    const blob = xlsxBook([{ name: 'Customers', columns: ['Name', 'Surname', 'Mobile', 'Village', 'Baki'],
      rows: [['Ramesh', 'Patil', '9822041127', 'Wadgaon', 2500], ['Sunita', 'Jadhav', '9764420915', 'Akot', '']] }]);
    const a = h('a', { href: URL.createObjectURL(blob), download: 'customers-sample.xlsx' });
    document.body.appendChild(a); a.click(); a.remove();
  };

  function setTable(head, rows) {
    table = { head, rows: rows.filter((r) => r.some((c) => String(c || '').trim())) };
    map = {};
    TARGETS.forEach(([k, , re]) => { const i = head.findIndex((x) => re.test(String(x).trim())); if (i >= 0 && !Object.values(map).includes(i)) map[k] = i; });
    if (map.name !== undefined && map.firstName !== undefined) delete map.name;
    draw();
  }

  /** Customer rows as they will be saved. */
  function build() {
    const get = (r, k) => (map[k] !== undefined ? String(r[map[k]] ?? '').trim() : '');
    return table.rows.map((r, i) => {
      let first = get(r, 'firstName'), last = get(r, 'lastName');
      if (!first && map.name !== undefined) {
        const parts = get(r, 'name').split(/\s+/).filter(Boolean);
        first = parts[0] || ''; if (!last) last = parts.slice(1).join(' ');
      }
      return { row: i + 2, firstName: first, lastName: last, mobile: get(r, 'mobile'), village: get(r, 'village'), address: get(r, 'address'), baki: get(r, 'baki') };
    });
  }

  function draw() {
    if (!table) { work.replaceChildren(); return; }
    const selects = TARGETS.map(([k, label]) => {
      const sel = h('select', { class: 'inp', onchange: () => { if (sel.value === '') delete map[k]; else map[k] = +sel.value; draw(); } },
        h('option', { value: '' }, '— ' + t('not in file') + ' —'),
        table.head.map((x, i) => h('option', { value: String(i), selected: map[k] === i }, x)));
      return h('label', { class: 'f' }, h('span', { class: 'lbl' }, t(label)), sel);
    });
    const people = build();
    const ok = people.filter((p) => p.firstName);
    const digits = (m) => String(m || '').replace(/\D/g, '').slice(-10);
    const badMobile = ok.filter((p) => p.mobile && digits(p.mobile).length !== 10).length;
    const baki = ok.reduce((a, p) => a + (parseFloat(String(p.baki).replace(/[₹,\s]/g, '')) || 0), 0);
    const go2 = h('button', { class: 'btn', onclick: () => run(ok, go2) }, t('Import') + ' ' + ok.length + ' ' + t('customers'));
    work.replaceChildren(
      sec(t('2 · MATCH THE COLUMNS')), card(h('div', { class: 'hint' }, table.rows.length + ' ' + t('rows found. Check which column is which.')), selects),
      sec(t('3 · CHECK')), card(
        h('div', { class: 'kv' }, h('span', null, t('Customers to add')), h('b', null, ok.length)),
        badMobile ? h('div', { class: 'kv' }, h('span', null, t('Mobile not 10 digits (will be skipped)')), h('b', { class: 'bad' }, badMobile)) : null,
        baki ? h('div', { class: 'kv' }, h('span', null, t('Opening baki (goes to the Baki list)')), h('b', null, inr(baki))) : null,
        h('div', { class: 'hint' }, t('Customers already saved (same mobile and name) are skipped, so importing the same file again is safe.')),
        h('div', { class: 'imp-prev' }, ok.slice(0, 8).map((p) => h('div', { class: 'kv small' },
          h('span', null, [p.firstName, p.lastName].filter(Boolean).join(' ') + (p.village ? ' · ' + p.village : '')),
          h('span', { class: 'muted' }, (p.mobile || '') + (p.baki ? ' · ' + t('baki') + ' ' + p.baki : ''))))),
        ok.length > 8 ? h('div', { class: 'hint' }, '+ ' + (ok.length - 8) + ' ' + t('more')) : null),
      ok.length ? go2 : empty(t('No names found. Match the name column above.')));
  }

  async function run(people, btn) {
    await busy(btn, async () => {
      let added = 0, bakiN = 0, bakiT = 0;
      const skipped = [];
      for (let i = 0; i < people.length; i += 400) {
        const r = await call('customers.import', { rows: people.slice(i, i + 400) });
        added += r.added; bakiN += r.bakiCustomers; bakiT += r.baki; skipped.push(...r.skipped);
        btn.textContent = t('Saving…') + ' ' + Math.min(i + 400, people.length) + ' / ' + people.length;
      }
      const why = {};
      skipped.forEach((s) => { why[s.reason] = (why[s.reason] || 0) + 1; });
      work.replaceChildren(card(
        h('div', { class: 'kv strong' }, h('span', null, t('Customers added')), h('b', { class: 'good' }, added)),
        bakiN ? h('div', { class: 'kv' }, h('span', null, t('With opening baki')), h('b', null, bakiN + ' · ' + inr(bakiT))) : null,
        Object.keys(why).map((k) => h('div', { class: 'kv' }, h('span', { class: 'muted' }, t('Skipped') + ': ' + t(k)), h('b', null, why[k]))),
        skipped.length ? h('details', null, h('summary', null, t('See skipped rows')),
          skipped.slice(0, 100).map((s) => h('div', { class: 'small muted' }, t('Row') + ' ' + s.row + (s.name ? ' · ' + s.name : '') + ' — ' + t(s.reason)))) : null,
        h('div', { class: 'row-actions' }, h('a', { class: 'btn2 small', href: '#/search' }, t('See customers')), bakiN ? h('a', { class: 'btn2 small', href: '#/dues' }, t('Baki list')) : null)));
      toast(added + ' ' + t('customers added'));
    }, t('Saving customers…'));
  }

  return screen(t('Import customers'), t('Add many customers at once'), [
    h('div', { class: 'hint' }, t('Have your customers in an Excel sheet, an old register typed in Excel, or another app? Bring them all in one go. Columns needed: Name and Mobile. Village, Surname and Baki are optional.')),
    sec(t('1 · CHOOSE')),
    card(
      h('button', { class: 'btn2', onclick: () => fileInput.click() }, '📄 ' + t('Choose Excel / CSV file')),
      canContacts ? h('button', { class: 'btn2', onclick: fromContacts }, '👥 ' + t('Pick from phone contacts')) : null,
      h('button', { class: 'link', onclick: sample }, '⬇ ' + t('Download a sample Excel to fill')),
      fileInput),
    work
  ], null, { back: '#/search' });
}
