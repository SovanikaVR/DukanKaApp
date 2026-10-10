/* Bill designer (owner): the shop designs its own GST bill and quotation, with a live preview.
 * Start from a ready design (bill book / tax invoice / classic / simple), then change colours, the top of the bill,
 * pictures, columns (on/off, order, own names), totals, and the bottom (terms, rule line, thank-you line). */
import { call } from '../api.js';
import { S, isOwner, refresh } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, sec, go } from '../ui.js';
import { invoiceHtml, docCss, designFor, DESIGN_PRESETS, COLOR_PAIRS, COLUMNS, COL_FIELD, FIELD_LABELS } from '../bill.js';
import { t } from '../i18n.js';

const FIXED_COLS = ['sr', 'desc', 'amount'];
const OTHER_FIELDS = ['billNo', 'purityInName', 'words', 'payment', 'oldGold', 'sign', 'ruleLine'];

export async function render() {
  if (!isOwner()) return screen(t('Bill designer'), null, [h('div', { class: 'hint' }, t('Only the owner can change the bill design.'))]);
  const s = S.settings;
  const vals = Object.assign({}, s); // every setting this screen changes, saved together
  const parse = (v, d) => { try { return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const designs = {
    GST: designFor({ design: parse(s.bill_design_gst, null), template: s.bill_template, color: s.bill_color }),
    EST: designFor({ design: parse(s.bill_design_quote, null) || parse(s.bill_design_gst, null), template: s.bill_template, color: s.bill_color })
  };
  let quoteSame = !s.bill_design_quote;
  const fields = { GST: parse(s.bill_fields_gst, {}), EST: parse(s.bill_fields_quote, {}) };
  let type = 'GST', paper = 'a4', big = false;

  /* ---------- preview ---------- */
  const paperBox = h('div', { class: 'paper' });
  const prevBox = h('div', { class: 'paper-wrap design-prev' }, paperBox);
  function preview() {
    const gst = type === 'GST';
    const v = (k) => vals[k] || '';
    const qv = (k) => v(k === 'name' ? 'quote_shop_name' : 'quote_' + k) || v('shop_' + k);
    const D = gst || !quoteSame ? designs[type] : designs.GST;
    const sample = {
      type, billNo: gst ? 'GST/26-27/0001' : 'EST/26-27/0001', date: S.today || '2026-10-10', status: 'ok', notes: '',
      customer: { name: 'Gajanan Gawande', village: 'Ramtirth', mobile: '9049390452' },
      lines: [
        { name: 'Gold Bali Pair', weight: 4.2, grossWt: 4.3, purityPct: 91.6, rate: 13971.2, makingType: 'pct', makingPct: 8, metalValue: 58679.04, making: 4694.32, amount: 63373.36, metal: 'gold' },
        { name: 'Silver Payal', weight: 52, grossWt: 52, purityPct: 92.5, rate: 230, makingType: 'perg', makingPerG: 20, metalValue: 11960, making: 1040, amount: 13000, metal: 'silver' }],
      oldGold: [], gstPct: gst ? 3 : 0, subtotal: 76373.36, tax: gst ? 2291.2 : 0, roundOff: gst ? 0.44 : -0.36, invoiceTotal: gst ? 78665 : 76373,
      oldValue: 0, net: gst ? 78665 : 76373, cash: 50000, upi: gst ? 28665 : 26373, udhaar: 0, printOpts: { rulePct: v('bill_rule_pct') },
      shop: {
        name: gst ? v('shop_name') : qv('name'), tagline: gst ? v('shop_tagline') : qv('tagline'), address: gst ? v('shop_address') : qv('address'),
        phones: gst ? v('shop_phones') : qv('phones'), mobile: v('shop_mobile'), gstin: v('shop_gstin'), bis: v('bis_licence'), hsn: v('hsn_code'),
        logo: gst ? v('shop_logo') : (v('quote_logo') || (v('quote_shop_name') ? '' : v('shop_logo'))), picRight: v('bill_pic_right'),
        terms: gst ? v('bill_terms') : (v('quote_footer') || v('bill_terms')), title: v('quote_title') || 'QUOTATION',
        lang: v('bill_lang') || 'en', rateUnit: v('bill_rate_unit') || '10g', fields: fields[type], ruleLine: v('bill_rule_line'), design: D
      }
    };
    paperBox.innerHTML = `<style>${docCss()}</style>` + invoiceHtml(sample, paper);
    requestAnimationFrame(() => {
      paperBox.style.zoom = '1';
      const avail = prevBox.clientWidth - 16;
      // Fit the whole bill, or (🔍) show it at reading size and scroll around.
      if (avail > 0 && paperBox.scrollWidth > avail) paperBox.style.zoom = String(big ? Math.min(1, (avail / paperBox.scrollWidth) * 2.2) : avail / paperBox.scrollWidth);
      prevBox.classList.toggle('big', big);
    });
  }
  let timer;
  const later = () => { clearTimeout(timer); timer = setTimeout(preview, 120); };

  /* ---------- small building blocks ---------- */
  const D = () => designs[type];
  const txt = (key, label, opts = {}) => { // a shop setting (text)
    const el = field(t(label), Object.assign({ value: vals[key] || '' }, opts));
    el.input.addEventListener('input', () => { vals[key] = el.input.value; later(); });
    return el;
  };
  const dtxt = (key, label, opts = {}) => { // a design text
    const el = field(t(label), Object.assign({ value: D()[key] || '' }, opts));
    el.input.addEventListener('input', () => { D()[key] = el.input.value; later(); });
    return el;
  };
  const choose = (label, key, options) => h('div', { class: 'f' }, h('span', { class: 'lbl' }, t(label)),
    seg(options.map(([value, l]) => ({ value, label: t(l) })), D()[key], (v) => { D()[key] = v; preview(); }));
  const onOff = (label, key) => {
    const cb = h('input', { type: 'checkbox', checked: !!D()[key] });
    cb.addEventListener('change', () => { D()[key] = cb.checked; preview(); });
    return h('label', { class: 'check-row' }, cb, h('span', { class: 'grow' }, t(label)));
  };
  const picture = (key, label) => {
    const img = h('img', { class: 'logo-prev', alt: '', src: vals[key] || undefined });
    const input = h('input', { type: 'file', accept: 'image/*', class: 'hidden' });
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try { vals[key] = await shrinkImage(file); img.src = vals[key]; preview(); } catch (e) { toast(e.message, 'err'); }
    });
    return h('div', { class: 'logo-row' }, img, h('div', { class: 'stack grow' }, h('span', { class: 'lbl' }, t(label)),
      h('div', { class: 'row-actions' }, h('button', { class: 'btn2 small', type: 'button', onclick: () => input.click() }, t('Choose picture')),
        h('button', { class: 'link', type: 'button', onclick: () => { vals[key] = ''; img.removeAttribute('src'); preview(); } }, t('Remove')))), input);
  };

  /* ---------- the editor for one bill type ---------- */
  const editorBox = h('div', { class: 'stack' });
  function drawEditor() {
    const gst = type === 'GST';
    if (!gst && quoteSame) {
      editorBox.replaceChildren(card(
        h('div', { class: 'hint' }, t('Quotations now use the same design as the GST bill (with the quotation title and its own header text).')),
        quoteHead(),
        h('button', { class: 'btn2', type: 'button', onclick: () => { quoteSame = false; designs.EST = JSON.parse(JSON.stringify(designs.GST)); drawEditor(); preview(); } },
          t('Give quotations their own design'))));
      return;
    }
    // 1. ready designs
    const presets = h('div', { class: 'preset-grid' }, Object.entries(DESIGN_PRESETS).map(([k, p]) => h('button', {
      type: 'button', class: 'preset' + (D().layout === k ? ' on' : ''),
      onclick: () => {
        const keep = { aboveName: D().aboveName, subName: D().subName, special: D().special, cols: D().cols, labels: D().labels };
        designs[type] = Object.assign({}, p, keep, { layout: k });
        delete designs[type].label;
        drawEditor(); preview();
      }
    }, h('span', { class: 'preset-sw', style: `background:${p.header === 'band' ? p.main : p.soft};border-color:${p.main}` },
      h('span', { style: `background:${p.main}` })), h('b', null, t(p.label)), h('span', { class: 'hint' }, t(PRESET_HINT[k])))));

    // 2. colours
    const main = h('input', { type: 'color', value: D().main }), soft = h('input', { type: 'color', value: D().soft });
    main.addEventListener('input', () => { D().main = main.value; later(); });
    soft.addEventListener('input', () => { D().soft = soft.value; later(); });
    const pairs = h('div', { class: 'chips wrap' }, COLOR_PAIRS.map(([m, so]) => h('button', {
      type: 'button', class: 'chip swatch2', title: m, onclick: () => { D().main = m; D().soft = so; main.value = m; soft.value = so; preview(); }
    }, h('span', { class: 'dot', style: 'background:' + m }), h('span', { class: 'dot', style: 'background:' + so }))));

    // 5. columns: on/off, order, own heading
    const colBox = h('div', { class: 'stack col-list' });
    const drawCols = () => {
      const order = D().cols;
      COLUMNS.forEach(([k]) => { if (!order.includes(k)) order.push(k); });
      colBox.replaceChildren(...order.map((k, i) => {
        const def = (COLUMNS.find(([c]) => c === k) || [k, k])[1];
        const fixed = FIXED_COLS.includes(k);
        const fk = COL_FIELD[k];
        const on = fixed || (fk ? fields[type][fk] !== undefined ? !!fields[type][fk] : DEFAULT_ON[fk] : true);
        const cb = h('input', { type: 'checkbox', checked: on, disabled: fixed });
        cb.addEventListener('change', () => { fields[type][fk] = cb.checked; preview(); });
        const name = h('input', { class: 'inp', value: D().labels[k] || '', placeholder: t(def) });
        name.addEventListener('input', () => { const v = name.value.trim(); if (v) D().labels[k] = v; else delete D().labels[k]; later(); });
        const move = (dir) => { const j = i + dir; if (j < 0 || j >= order.length) return; [order[i], order[j]] = [order[j], order[i]]; drawCols(); preview(); };
        return h('div', { class: 'col-row' + (on ? '' : ' off') }, cb, name,
          h('button', { type: 'button', class: 'btn2 tiny', 'aria-label': 'Up', onclick: () => move(-1) }, '↑'),
          h('button', { type: 'button', class: 'btn2 tiny', 'aria-label': 'Down', onclick: () => move(1) }, '↓'));
      }));
    };
    drawCols();
    const others = h('div', { class: 'chips wrap' }, FIELD_LABELS.filter(([k]) => OTHER_FIELDS.includes(k)).map(([k, label]) => {
      const cur = () => (fields[type][k] !== undefined ? !!fields[type][k] : DEFAULT_ON[k] !== false);
      const c = h('button', { type: 'button', class: 'chip' + (cur() ? ' on' : ''), onclick: () => { fields[type][k] = !cur(); c.classList.toggle('on', cur()); preview(); } }, t(label));
      return c;
    }));

    editorBox.replaceChildren(
      sec(t('1 · START FROM A READY DESIGN')), card(presets, h('div', { class: 'hint' }, t('Then change anything below. Your shop texts and columns are kept.'))),
      sec(t('2 · COLOURS')), card(pairs, grid(2, h('label', { class: 'f' }, h('span', { class: 'lbl' }, t('Main colour')), main),
        h('label', { class: 'f' }, h('span', { class: 'lbl' }, t('Light colour')), soft))),
      sec(t('3 · TOP OF THE BILL')), card(
        choose('Top style', 'header', [['band', 'Coloured band'], ['light', 'Light'], ['plain', 'Plain']]),
        dtxt('topLine', 'Line at the very top (e.g. ॥ श्री ॥)'),
        dtxt('aboveName', 'Line above the shop name (e.g. owner / firm name)'),
        gst ? txt('shop_name', 'Shop name') : txt('quote_shop_name', 'Shop name on quotation (blank = same as GST bill)'),
        dtxt('subName', 'Small text after the name (e.g. (अहमदपुरकर))'),
        choose('Name size', 'nameSize', [['m', 'Medium'], ['l', 'Large'], ['xl', 'Extra large']]),
        gst ? txt('shop_tagline', 'Line under the name (e.g. सराफ लाईन, जवाहर रोड)') : txt('quote_tagline', 'Line under the name'),
        gst ? txt('shop_address', 'Address') : txt('quote_address', 'Address'),
        dtxt('special', 'Special line (e.g. 91.60 चे दागिने बदलताना डाग व बट्टा लागणार नाही)'),
        gst ? txt('shop_phones', 'Phone numbers (one per line, with name)', { type: 'textarea' }) : txt('quote_phones', 'Phone numbers (one per line)', { type: 'textarea' }),
        gst ? txt('bis_licence', 'BIS / hallmark licence no. (L.No.)') : txt('quote_title', 'Title (e.g. QUOTATION / कोटेशन)'),
        onOff('Address and phones in a coloured strip under the top', 'addressBand'),
        choose('Bill title (TAX INVOICE / QUOTATION)', 'titlePos', [['right', 'Top right'], ['center', 'Centre, under the top']])),
      sec(t('4 · PICTURES')), card(
        onOff('Left picture', 'picLeft'), gst ? picture('shop_logo', 'Shop logo / jewellery picture') : picture('quote_logo', 'Quotation picture (blank = shop logo)'),
        onOff('Right picture', 'picRight'), picture('bill_pic_right', 'Right picture (e.g. BIS hallmark logo)'),
        onOff('Shop logo faint in the background', 'watermark')),
      sec(t('5 · CUSTOMER')), card(choose('Customer details', 'cust', [['lines', 'Lines: नांव ___ गांव ___'], ['box', 'Box: NAME / ADDRESS / PHONE']])),
      sec(t('6 · TABLE COLUMNS')), card(h('div', { class: 'hint' }, t('Tick to print. Type your own heading. ↑ ↓ to change the order.')), colBox,
        choose('Empty space in the table', 'rows', [['short', 'Small'], ['tall', 'Big (bill-book look)']]),
        onOff('Total weight row under the items', 'totalWeight')),
      sec(t('7 · TOTALS')), card(choose('Totals', 'totals', [['table', 'Inside the table'], ['box', 'Box on the right']]),
        h('div', { class: 'lbl' }, t('Also print')), others),
      sec(t('8 · BOTTOM OF THE BILL')), card(
        gst ? txt('bill_terms', 'Terms (one per line)', { type: 'textarea', rows: 4 }) : txt('quote_footer', 'Terms on quotations (blank = same as GST bill)', { type: 'textarea', rows: 4 }),
        onOff('Terms in a coloured band', 'footerBand'),
        txt('bill_rule_line', 'Shop rule line on every bill — write ___ where the % goes (e.g. मोडताना ___% घट)'),
        txt('bill_rule_pct', 'Usual % for that line (blank = type on each bill)', { type: 'num' }),
        dtxt('thanks', 'Thank-you line (e.g. Thanks, visit again)'),
        onOff('Double border around the page', 'frame'),
        choose('Text size', 'font', [['s', 'Small'], ['m', 'Normal'], ['l', 'Big']])),
      !gst ? h('button', { class: 'link', type: 'button', onclick: () => { quoteSame = true; drawEditor(); preview(); } }, t('Use the GST bill design for quotations')) : null);
  }
  const quoteHead = () => h('div', { class: 'stack' }, txt('quote_title', 'Title (e.g. QUOTATION / कोटेशन)'),
    txt('quote_shop_name', 'Shop name on quotation (blank = same as GST bill)'), txt('quote_tagline', 'Line under the name'),
    txt('quote_address', 'Address'), txt('quote_phones', 'Phone numbers (one per line)', { type: 'textarea' }),
    picture('quote_logo', 'Quotation picture (blank = shop logo)'),
    txt('quote_footer', 'Terms on quotations (blank = same as GST bill)', { type: 'textarea', rows: 3 }));

  const typeSeg = seg([{ value: 'GST', label: 'GST bill' }, { value: 'EST', label: 'Quotation' }], type, (v) => { type = v; drawEditor(); preview(); });
  const paperSeg = seg([{ value: 'a4', label: 'A4' }, { value: 'a5', label: 'A5' }], paper, (v) => { paper = v; preview(); });
  const common = card(
    h('div', { class: 'f' }, h('span', { class: 'lbl' }, t('Bill language')), seg([{ value: 'en', label: 'English' }, { value: 'mr', label: 'मराठी' }, { value: 'hi', label: 'हिंदी' }],
      vals.bill_lang || 'en', (v) => { vals.bill_lang = v; preview(); })),
    seg([{ value: '10g', label: 'Rate per 10 g' }, { value: 'g', label: 'Rate per gram' }], vals.bill_rate_unit || '10g', (v) => { vals.bill_rate_unit = v; preview(); }));
  const zoomBtn = h('button', { type: 'button', class: 'btn2 small', 'aria-label': 'Zoom', onclick: () => { big = !big; zoomBtn.textContent = big ? '↙' : '🔍'; preview(); } }, '🔍');
  drawEditor();
  setTimeout(preview, 0);
  window.addEventListener('resize', later);

  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const data = {};
    ['shop_name', 'shop_tagline', 'shop_address', 'shop_phones', 'bis_licence', 'shop_logo', 'bill_pic_right', 'bill_terms', 'bill_rule_line', 'bill_rule_pct',
      'quote_title', 'quote_shop_name', 'quote_tagline', 'quote_address', 'quote_phones', 'quote_logo', 'quote_footer', 'bill_lang', 'bill_rate_unit']
      .forEach((k) => { if ((vals[k] || '') !== (s[k] || '')) data[k] = String(vals[k] || '').trim(); });
    const clean = (d) => { const o = Object.assign({}, d); delete o.label; return JSON.stringify(o); };
    data.bill_design_gst = clean(designs.GST);
    data.bill_design_quote = quoteSame ? '' : clean(designs.EST);
    data.bill_fields_gst = JSON.stringify(fields.GST);
    data.bill_fields_quote = JSON.stringify(fields.EST);
    await call('settings.save', data);
    await refresh();
    toast(t('Bill design saved'));
    go('settings');
  }) }, t('Save bill design'));

  return screen(t('Bill designer'), t('Design your own bill'), [
    h('div', { class: 'design-top' }, h('div', { class: 'design-bar' }, typeSeg, paperSeg, zoomBtn), prevBox),
    common, editorBox
  ], save);
}

const DEFAULT_ON = { billNo: true, gross: true, net: true, purity: true, purityInName: false, hsn: true, huid: false, rate: true, making: true,
  makingAmt: false, metalValue: false, words: true, payment: true, oldGold: true, sign: true, ruleLine: true };
const PRESET_HINT = {
  classic: 'Light top with a border',
  book: 'Like a printed bill book: ॥ श्री ॥, dark top, terms band',
  invoice: 'Like a computer tax invoice: big name, address strip, totals box',
  simple: 'Black and white'
};

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
      if (url.length > 44000) reject(new Error('Picture is too big. Use a simpler picture.'));
      else resolve(url);
    };
    img.onerror = () => reject(new Error('Could not read this picture'));
    img.src = URL.createObjectURL(file);
  });
}
