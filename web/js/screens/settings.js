/* Settings: shop details & GSTIN, standard values, modules on/off, formulas, users, app. */
import { call, apiUrl } from '../api.js';
import { S, isOwner, refresh, modules } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, sec, go, ask, num } from '../ui.js';
import { FIELD_LABELS, invoiceHtml, docCss, BILL_TEMPLATES, BILL_COLORS } from '../bill.js';
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
  ['cash', 'Cash book'], ['reports', 'Reports'], ['liverate', 'Live market rate on Home']];

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
  const live = [f('live_city', 'City (e.g. Nanded)'), f('live_premium_pct', 'Market difference % over world price', 'num'),
    f('live_city_adjust', 'City difference ₹ per 10 g (+ or −)'), f('live_goldapi_key', 'GoldAPI.io key (optional, free plan)')];

  /* ---- Bill design ---- */
  const bf = (key, label, type) => f(key, label, type);
  const gstHead = [bf('shop_tagline', 'Line under the shop name (e.g. सराफ लाईन, जवाहर रोड)'), bf('shop_phones', 'Phone numbers (one per line, with name)', 'textarea'),
    bf('bis_licence', 'BIS / hallmark licence no. (L.No.)')];
  const quoteHead = [bf('quote_title', 'Title (e.g. QUOTATION / कोटेशन)'), bf('quote_shop_name', 'Shop name on quotation (blank = same as GST bill)'),
    bf('quote_tagline', 'Line under the name'), bf('quote_address', 'Address'), bf('quote_phones', 'Phone numbers (one per line)', 'textarea'),
    bf('quote_footer', 'Note printed at the bottom (e.g. मोडतांना मजुरी व …% घट)', 'textarea')];
  // Bill look: design (template) + colour + the shop's fixed rule line with a % filled on each bill.
  const ruleFields = [bf('bill_rule_line', 'Shop rule line on every bill — write ___ where the % goes (e.g. मोडताना ___% घट)'),
    bf('bill_rule_pct', 'Usual % for that line (blank = type on each bill)', 'num')];
  let billTpl = s.bill_template || 'classic', billColor = s.bill_color || 'gold';
  const tplSeg = seg(BILL_TEMPLATES.map(([value, label]) => ({ value, label: t(label) })), billTpl, (v) => { billTpl = v; preview(); });
  const colorBox = h('div', { class: 'chips wrap' });
  const drawColors = () => colorBox.replaceChildren(...Object.entries(BILL_COLORS).map(([k, c]) => h('button', {
    type: 'button', class: 'chip swatch' + (k === billColor ? ' on' : ''), onclick: () => { billColor = k; drawColors(); preview(); }
  }, h('span', { class: 'dot', style: 'background:' + c.a }), t(c.label))));
  drawColors();
  let billLang = s.bill_lang || 'en', rateUnit = s.bill_rate_unit || '10g', mkType = s.making_default_type || 'perg', rcm = s.oldgold_rcm === 'true';
  const langSeg = seg([{ value: 'en', label: 'English' }, { value: 'mr', label: 'मराठी' }, { value: 'hi', label: 'हिंदी' }], billLang, (v) => { billLang = v; preview(); });
  const unitSeg = seg([{ value: '10g', label: 'Rate per 10 g' }, { value: 'g', label: 'Rate per gram' }], rateUnit, (v) => { rateUnit = v; preview(); });
  const mkSeg = seg([{ value: 'perg', label: 'Making ₹ per gram' }, { value: 'pct', label: 'Making %' }], mkType, (v) => { mkType = v; });
  const mkPct = bf('making_default_pct', 'Making % (default)', 'num');
  const silver = [bf('making_default_silver', 'Silver making ₹/g (default)', 'num'), bf('purity_silver', 'Silver purity % (default)', 'num')];
  const rcmSeg = seg([{ value: false, label: 'No GST on old gold bought' }, { value: true, label: 'Show GST (reverse charge) in reports' }], rcm, (v) => { rcm = v; });
  const logos = {};
  const logoPick = (key, label) => {
    let val = s[key] || '';
    const img = h('img', { class: 'logo-prev', alt: '', src: val || undefined });
    const input = h('input', { type: 'file', accept: 'image/*', class: 'hidden' });
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try { val = await shrinkImage(file); img.src = val; logos[key] = val; preview(); } catch (e) { toast(e.message, 'err'); }
    });
    logos.get = logos.get || {};
    return h('div', { class: 'logo-row' }, img, h('div', { class: 'stack grow' }, h('span', { class: 'lbl' }, label),
      h('div', { class: 'row-actions' }, h('button', { class: 'btn2 small', type: 'button', onclick: () => input.click() }, t('Choose picture')),
        h('button', { class: 'link', type: 'button', onclick: () => { val = ''; img.removeAttribute('src'); logos[key] = ''; preview(); } }, t('Remove')))), input);
  };
  const fieldBoxes = (key) => {
    const cur = JSON.parse(s[key] || '{}');
    const box = h('div', { class: 'chips wrap' });
    const state = Object.assign({}, cur);
    FIELD_LABELS.forEach(([k, label]) => {
      const c = h('button', { type: 'button', class: 'chip' + (state[k] ? ' on' : ''), onclick: () => { state[k] = !state[k]; c.classList.toggle('on', !!state[k]); preview(); } }, t(label));
      box.appendChild(c);
    });
    box.state = state;
    return box;
  };
  const gstFields = fieldBoxes('bill_fields_gst');
  const quoteFields = fieldBoxes('bill_fields_quote');
  const prevBox = h('div', { class: 'paper-wrap' }, h('div', { class: 'paper' }));
  let prevType = 'GST';
  const prevSeg = seg([{ value: 'GST', label: 'GST bill' }, { value: 'EST', label: 'Quotation' }], prevType, (v) => { prevType = v; preview(); });
  function preview() {
    const val = (k) => { const el = [...shop, ...gstHead, ...quoteHead].find((x) => x.key === k); return el ? el.input.value : s[k] || ''; };
    const gst = prevType === 'GST';
    const qv = (k) => val(k === 'name' ? 'quote_shop_name' : 'quote_' + k) || val('shop_' + k);
    const sample = {
      type: prevType, billNo: gst ? 'GST/26-27/0001' : 'EST/26-27/0001', date: S.today || '2026-10-09', status: 'ok', notes: '',
      customer: { name: 'Gajanan Gawande', village: 'Ramtirth', mobile: '9049390452' },
      lines: [{ name: 'Gold Bali Pair', weight: 1, grossWt: 1, purityPct: 91.6, rate: 13971.2, makingType: 'pct', makingPct: 2, makingPerG: 0, metalValue: 13971.2, making: 279.42, amount: 14250.62 }],
      oldGold: [], gstPct: gst ? 3 : 0, subtotal: 14250.62, tax: gst ? 427.52 : 0, roundOff: gst ? -0.14 : 0.38, invoiceTotal: gst ? 14678 : 14251, oldValue: 0,
      net: gst ? 14678 : 14251, cash: gst ? 14678 : 14251, upi: 0, udhaar: 0, printOpts: {},
      shop: {
        name: gst ? val('shop_name') : qv('name'), tagline: gst ? val('shop_tagline') : qv('tagline'), address: gst ? val('shop_address') : qv('address'),
        phones: gst ? val('shop_phones') : qv('phones'), mobile: val('shop_mobile'), gstin: val('shop_gstin'), bis: val('bis_licence'), hsn: val('hsn_code'),
        logo: gst ? (logos.shop_logo ?? s.shop_logo) : ((logos.quote_logo ?? s.quote_logo) || (val('quote_shop_name') ? '' : (logos.shop_logo ?? s.shop_logo))),
        terms: gst ? val('bill_terms') : (val('quote_footer') || val('bill_terms')), title: val('quote_title') || 'QUOTATION',
        lang: billLang, rateUnit, fields: (gst ? gstFields : quoteFields).state,
        template: billTpl, color: billColor, ruleLine: val('bill_rule_line')
      }
    };
    sample.printOpts = { rulePct: val('bill_rule_pct') };
    const p = prevBox.firstChild;
    p.innerHTML = `<style>${docCss()}</style>` + invoiceHtml(sample, 'a4');
    requestAnimationFrame(() => {
      p.style.zoom = '1';
      const avail = prevBox.clientWidth - 24;
      if (avail > 0 && p.scrollWidth > avail) p.style.zoom = String(avail / p.scrollWidth);
    });
  }
  [...gstHead, ...quoteHead, ...ruleFields].forEach((x) => x.input.addEventListener('input', preview));
  setTimeout(preview, 0);

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
    [...shop, ...std, ...gstHead, ...quoteHead, ...ruleFields, mkPct, ...silver, ...live].forEach((el) => { data[el.key] = el.input.value.trim(); });
    Object.assign(data, { bill_template: billTpl, bill_color: billColor, bill_lang: billLang, bill_rate_unit: rateUnit, making_default_type: mkType, oldgold_rcm: rcm ? 'true' : 'false',
      bill_fields_gst: JSON.stringify(gstFields.state), bill_fields_quote: JSON.stringify(quoteFields.state) });
    ['shop_logo', 'quote_logo'].forEach((k) => { if (logos[k] !== undefined) data[k] = logos[k]; });
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
  const check = async () => busy(null, async () => {
    const r = await call('admin.check');
    toast(r.ok ? t('Everything looks fine') : r.count + ' ' + t('problems found — see the list'), r.ok ? 'ok' : 'err');
    if (!r.ok) await ask(t('Check my data'), [{ key: 'x', label: r.problems.join('\n'), type: 'textarea', value: t('To undo damage: Google Sheet → Dukan App → Restore from a backup') }], t('OK'));
  });
  const everything = async () => busy(null, async () => {
    const { exportEverything } = await import('./exports.js');
    await exportEverything();
  }, 'Making the file…');

  return screen(t('Settings'), 'Owner only', [
    sec('SHOP DETAILS · printed on every bill'), card(shop[0], shop[1], grid(2, shop[2], shop[4]), shop[3], gstSeg, shop[5]),
    sec('BILL DESIGN'),
    card(h('div', { class: 'f' }, h('span', { class: 'lbl' }, t('Bill design')), tplSeg),
      h('div', { class: 'f' }, h('span', { class: 'lbl' }, t('Bill colour')), colorBox),
      h('div', { class: 'hint' }, t('Logo: add the shop logo picture below. See the preview at the bottom.'))),
    card(h('div', { class: 'f' }, h('span', { class: 'lbl' }, t('Bill language')), langSeg), unitSeg,
      h('div', { class: 'sec' }, t('GST BILL · top of the bill')), gstHead, logoPick('shop_logo', t('Shop logo (picture)')),
      h('div', { class: 'sec' }, t('Show on GST bills')), gstFields),
    card(h('div', { class: 'sec' }, t('QUOTATION (non-GST) · top of the bill')), quoteHead, logoPick('quote_logo', t('Quotation logo (blank = shop logo)')),
      h('div', { class: 'sec' }, t('Show on quotations')), quoteFields),
    card(h('div', { class: 'sec' }, t('RULE LINE · printed on every bill')), ...ruleFields,
      h('div', { class: 'hint' }, t('The % is asked on every new bill (prefilled with the usual %). Left blank, a gap is printed to write by hand.'))),
    card(h('div', { class: 'sec' }, t('PREVIEW')), prevSeg, prevBox,
      h('div', { class: 'hint' }, t('Each bill can still hide or show fields from its own screen.'))),
    sec('STANDARD VALUES · prefilled, always editable on each entry'), card(grid(2, ...std.slice(0, 10)), std[10]),
    card(h('div', { class: 'f' }, h('span', { class: 'lbl' }, t('Making on new bills')), mkSeg), grid(3, mkPct, ...silver)),
    card(h('div', { class: 'f' }, h('span', { class: 'lbl' }, t('Old gold bought from customers')), rcmSeg),
      h('div', { class: 'hint' }, t('In an exchange, GST is charged on the full price of the new jewellery (old gold is not deducted before GST). Gold bought from a private person is normally not taxed; confirm with your CA.'))),
    sec('LIVE MARKET RATE'), card(grid(2, live[0], live[1]), live[2], live[3],
      h('div', { class: 'hint' }, t('Free world gold price × today\'s US$ rate × the market difference. On Home, "Match my city rate" sets the difference from your own 24K rate, so the live rate follows your city. Hide it in Modules.'))),
    sec('MODULES · switch off what this shop does not use'), card(modBoxes, h('div', { class: 'hint' }, 'Switched-off modules hide from the app; their data stays safe.')),
    sec('FORMULAS · old entries keep the formula they were made with'), formulaEls,
    sec('USERS'), card(users.map(userRow), h('button', { class: 'btn2 small', onclick: addUser }, '+ Add user')),
    sec('THIS PHONE'), personal,
    sec('DATA'), card(h('div', { class: 'hint' }, 'Shop link: ' + apiUrl()),
      h('div', { class: 'grid g2' }, h('button', { class: 'btn2 small', onclick: backup }, 'Back up now'),
        h('button', { class: 'btn2 small', onclick: archive }, 'Archive old year')),
      h('button', { class: 'btn2 small', onclick: everything }, '⬇ ' + t('Download all data (Excel)')),
      h('button', { class: 'btn2 small', onclick: check }, t('Check my data')),
      h('div', { class: 'hint' }, t('One Excel file with every list (customers, baki, bills, girvi, orders, repairs, old gold, stock, cash, wholesalers/karigars) plus ready tabs to import parties and items into another app like Vyapar. Your Google Sheet itself is also yours: File → Download → Excel.')),
      h('a', { class: 'link', href: '#/connect' }, 'Change shop link'))
  ], save);
}

/** Makes a picture small enough to keep in the Google Sheet (max ~240 px, PNG/JPEG). */
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 240;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let url = c.toDataURL('image/png');
      if (url.length > 44000) url = c.toDataURL('image/jpeg', 0.8);
      if (url.length > 44000) url = c.toDataURL('image/jpeg', 0.6);
      URL.revokeObjectURL(img.src);
      if (url.length > 44000) reject(new Error('Picture is too big. Use a simpler logo.'));
      else resolve(url);
    };
    img.onerror = () => reject(new Error('Could not read this picture'));
    img.src = URL.createObjectURL(file);
  });
}
