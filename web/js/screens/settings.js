/* Settings: shop details & GSTIN, standard values, modules on/off, formulas, users, app. */
import { call, apiUrl } from '../api.js';
import { S, isOwner, refresh, modules } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, sec, go, ask, num } from '../ui.js';
import { getLang, setLang, t } from '../i18n.js';

const FORMULAS = [
  ['formula_interest', 'Girvi interest', { Principal: 60000, Rate: 2, Days: 116 }],
  ['formula_old_fine', 'Old gold — fine for customer', { Weight: 10, Cut: 20 }],
  ['formula_our_fine', 'Old gold — our fine (shop only)', { Weight: 10, Purity: 80 }],
  ['formula_sale_line', 'Sale — one item', { Weight: 4.2, Rate: 14030, Making: 150 }],
  ['formula_order_total', 'Order price', { Weight: 10, Rate: 15300, Making: 150 }],
  ['formula_repair_charge', 'Repair charge per gram', { Weight: 10, RatePerG: 150 }]
];
const DEFAULTS = {
  formula_interest: 'Principal * Rate / 100 * Days / 30', formula_old_fine: 'Weight * (100 - Cut) / 100',
  formula_our_fine: 'Weight * Purity / 100', formula_sale_line: 'Weight * Rate + Weight * Making',
  formula_order_total: 'Weight * Rate + Weight * Making', formula_repair_charge: 'Weight * RatePerG'
};
const MODULES = [['girvi', 'Girvi loans'], ['sale', 'Sales & bills'], ['oldgold', 'Buy old gold'], ['orders', 'Orders'],
  ['repair', 'Repair'], ['stock', 'Stock'], ['melt', 'Melting'], ['wholesaler', 'Wholesaler'], ['karigar', 'Karigar'],
  ['cash', 'Cash book'], ['reports', 'Reports']];

export async function render() {
  const thermal = (() => { try { return localStorage.getItem('dk_thermal') || '58'; } catch (e) { return '58'; } })();
  const personal = card(
    h('div', { class: 'f' }, h('span', { class: 'lbl' }, 'Language'),
      seg([{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिंदी' }], getLang(), (v) => { setLang(v); document.dispatchEvent(new Event('dk-lang')); })),
    h('div', { class: 'f' }, h('span', { class: 'lbl' }, 'Thermal printer paper'),
      seg([{ value: '58', label: '58 mm' }, { value: '80', label: '80 mm' }], thermal, (v) => { try { localStorage.setItem('dk_thermal', v); } catch (e) { /* ignore */ } })),
    h('div', { class: 'hint' }, 'Logged in as ' + S.user.name + ' (' + S.user.role + ')'));
  if (!isOwner()) return screen(t('Settings'), null, [sec('THIS PHONE'), personal]);

  const s = S.settings;
  const f = (key, label, type) => { const el = field(label, { type, value: s[key] || '' }); el.key = key; return el; };
  const shop = [f('shop_name', 'Shop name'), f('shop_gstin', 'GSTIN (15 characters)'), f('shop_address', 'Address'),
    f('shop_mobile', 'Shop phone', 'tel'), f('shop_state', 'State'), f('bill_terms', 'Terms printed on bills', 'textarea')];
  shop[1].input.style.textTransform = 'uppercase';
  let gstOn = s.gst_enabled !== 'false';
  const gstSeg = seg([{ value: true, label: 'Allow GST bills' }, { value: false, label: 'No GST bills' }], gstOn, (v) => { gstOn = v; });
  const std = [f('gst_default_pct', 'GST % (default)', 'num'), f('hsn_code', 'HSN code'), f('standard_cut_pct', 'Standard customer cut %', 'num'),
    f('standard_purity_pct', 'Standard our purity %', 'num'), f('making_default_per_g', 'Making ₹/g (default)', 'num'),
    f('interest_default_rate', 'Girvi ₹ per 100 / month', 'num'), f('interest_min_days', 'Girvi minimum days', 'num'),
    f('purity_24k', '24K purity %', 'num'), f('purity_22k', '22K purity %', 'num'), f('purity_18k', '18K purity %', 'num'),
    f('report_email', 'Send nightly report to (email)')];

  const mods = modules();
  const modBoxes = MODULES.map(([k, label]) => {
    const cb = h('input', { type: 'checkbox', checked: mods[k] !== false });
    const row = h('label', { class: 'check-row' }, cb, h('span', { class: 'grow' }, label));
    row.key = k; row.cb = cb;
    return row;
  });

  const formulaEls = FORMULAS.map(([key, label, sample]) => {
    const ta = field(label, { type: 'textarea', value: s[key] || DEFAULTS[key] });
    ta.input.classList.add('mono');
    const vars = Object.keys(sample).map((k) => { const el = field(k, { type: 'num', value: String(sample[k]) }); el.k = k; return el; });
    const out = h('div', { class: 'kv test-out' });
    const test = () => {
      const v = {};
      vars.forEach((x) => { v[x.k] = num(x.input.value); });
      try { out.className = 'kv test-out good'; out.replaceChildren(h('span', null, 'Test result'), h('b', null, Calc.inr(Calc.evalFormula(ta.input.value, v), 2))); }
      catch (e) { out.className = 'kv test-out bad'; out.replaceChildren(h('span', null, e.message)); }
    };
    [ta, ...vars].forEach((x) => x.input.addEventListener('input', test));
    test();
    const wrap = card(ta, h('div', { class: 'hint' }, 'Names you can use: ' + Object.keys(sample).join(', ') + ' · + − × ÷ ( ) min max round'),
      grid(Math.min(vars.length, 3), vars), out,
      h('button', { class: 'link', type: 'button', onclick: () => { ta.input.value = DEFAULTS[key]; test(); } }, 'Back to default'));
    wrap.key = key; wrap.ta = ta;
    return wrap;
  });

  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const data = {};
    [...shop, ...std].forEach((el) => { data[el.key] = el.input.value.trim(); });
    data.gst_enabled = gstOn ? 'true' : 'false';
    const m = {};
    modBoxes.forEach((r) => { m[r.key] = r.cb.checked; });
    data.modules = JSON.stringify(m);
    formulaEls.forEach((w) => { data[w.key] = w.ta.input.value.trim(); });
    await call('settings.save', data);
    await refresh();
    toast('Settings saved');
    go('settings');
  }) }, 'Save settings');

  const users = await call('users.list');
  const userRow = (u) => h('div', { class: 'kv' }, h('span', null, u.name + ' (' + u.username + ')' + (u.active ? '' : ' · off')),
    h('button', { class: 'link', onclick: () => editUser(u) }, u.role));
  const addUser = async () => {
    const v = await ask('Add user', [{ key: 'name', label: 'Name', value: '' }, { key: 'username', label: 'Login name', value: '' },
      { key: 'pin', label: '4–8 digit PIN', type: 'num', value: '' },
      { key: 'role', label: 'Role', options: [{ value: 'employee', label: 'Employee' }, { value: 'owner', label: 'Owner' }, { value: 'viewer', label: 'View only' }], value: 'employee' }]);
    if (v) await busy(null, async () => { await call('users.save', v); toast('User added'); go('settings'); });
  };
  const editUser = async (u) => {
    const v = await ask('Edit ' + u.name, [
      { key: 'role', label: 'Role', options: [{ value: 'employee', label: 'Employee' }, { value: 'owner', label: 'Owner' }, { value: 'viewer', label: 'View only' }], value: u.role },
      { key: 'active', label: 'Can log in', options: [{ value: true, label: 'Yes' }, { value: false, label: 'No (switched off)' }], value: u.active },
      { key: 'pin', label: 'New PIN (blank = keep)', type: 'num', value: '' }]);
    if (v) await busy(null, async () => { await call('users.save', Object.assign({ id: u.id }, v)); toast('Saved'); go('settings'); });
  };
  const archive = async () => {
    const v = await ask('Move a finished year to its own file', [{ key: 'fy', label: 'Year (e.g. 25-26)', value: '' }], 'Move bills');
    if (v) await busy(null, async () => { const r = await call('admin.archive', { fy: v.fy }); toast(r.moved + ' bills moved'); });
  };
  const backup = async () => busy(null, async () => { const r = await call('admin.backupNow'); toast('Backup saved: ' + r.name); });

  return screen(t('Settings'), 'Owner only', [
    sec('SHOP DETAILS · printed on every bill'), card(shop[0], shop[1], grid(2, shop[2], shop[4]), shop[3], gstSeg, shop[5]),
    sec('STANDARD VALUES · prefilled, always editable on each entry'), card(grid(2, ...std.slice(0, 10)), std[10]),
    sec('MODULES · switch off what this shop does not use'), card(modBoxes, h('div', { class: 'hint' }, 'Switched-off modules hide from the app; their data stays safe.')),
    sec('FORMULAS · old entries keep the formula they were made with'), formulaEls,
    sec('USERS'), card(users.map(userRow), h('button', { class: 'btn2 small', onclick: addUser }, '+ Add user')),
    sec('THIS PHONE'), personal,
    sec('DATA'), card(h('div', { class: 'hint' }, 'Shop link: ' + apiUrl()),
      h('div', { class: 'grid g2' }, h('button', { class: 'btn2 small', onclick: backup }, 'Back up now'),
        h('button', { class: 'btn2 small', onclick: archive }, 'Archive old year')),
      h('a', { class: 'link', href: '#/connect' }, 'Change shop link'))
  ], save);
}
