/* New sale: GST bill or estimate, items, old gold taken in the same bill, payment. */
import { call } from '../api.js';
import { S, setting, list, purityFor, rateFor } from '../state.js';
import { h, screen, field, card, grid, seg, busy, toast, num, inr, g3, sec, go, remember, modal, icon } from '../ui.js';
import { customerPicker } from '../picker.js';
import { t } from '../i18n.js';

const KARATS = [{ value: '24K', label: '24K' }, { value: '22K', label: '22K' }, { value: '18K', label: '18K' }, { value: 'Silver', label: 'Ag' }];

export async function render(params, query) {
  const gstReady = setting('gst_enabled', 'true') === 'true' && !!setting('shop_gstin');
  let type = gstReady && remember('bill_type') !== 'EST' ? 'GST' : 'EST';
  const typeSeg = seg([{ value: 'GST', label: t('GST bill') }, { value: 'EST', label: t('Non-GST (estimate)') }], type, (v) => {
    if (v === 'GST' && !gstReady) { toast('Add the shop GSTIN in Settings to make GST bills', 'err'); typeSeg.set('EST'); return; }
    type = v; remember('bill_type', v); recalc();
  });
  const picker = customerPicker(query);
  const names = h('datalist', { id: 'item-names' }, list('item_names').map((n) => h('option', { value: n })));
  const lines = [];
  const linesBox = h('div', { class: 'stack' });
  const olds = [];
  const oldBox = h('div', { class: 'stack' });
  const gstPct = field('GST %', { type: 'num', value: setting('gst_default_pct', '3'), oninput: () => recalc() });
  const gstRow = h('div', { class: 'grid g3' }, gstPct, h('div', { class: 'gst-amt' }));
  const cash = field(t('Cash'), { type: 'num', value: '', oninput: () => { cashTouched = true; recalc(); } });
  const upi = field(t('UPI'), { type: 'num', readonly: true });
  const udhaar = field(t('Baki'), { type: 'num', value: '0', oninput: () => recalc() });
  let cashTouched = false;
  const totalLabel = h('span', { class: 'muted' });
  const totalValue = h('span', { class: 'big' });
  const payNote = h('div', { class: 'sec' });
  const totalsBox = h('div', { class: 'card totals' });

  function addLine(pref = {}) {
    const ln = lineEditor(pref, recalc, () => { lines.splice(lines.indexOf(ln), 1); ln.el.remove(); recalc(); });
    lines.push(ln); linesBox.appendChild(ln.el); recalc();
    return ln;
  }
  function addOld() {
    const o = oldEditor(recalc, () => { olds.splice(olds.indexOf(o), 1); o.el.remove(); recalc(); });
    olds.push(o); oldBox.appendChild(o.el); recalc();
  }

  let last = null;
  function recalc() {
    const isGst = type === 'GST';
    gstRow.style.display = isGst ? '' : 'none';
    let subtotal = 0;
    lines.forEach((l) => { subtotal += l.amount(); });
    const tax = isGst ? Math.round(subtotal * num(gstPct.input.value) / 100 * 100) / 100 : 0;
    gstRow.lastChild.textContent = isGst ? 'GST ' + inr(tax, 2) + ' (CGST + SGST)' : '';
    const invoiceTotal = Math.round(subtotal + tax);
    const oldValue = olds.reduce((a, o) => a + o.amount(), 0);
    const net = invoiceTotal - oldValue;
    if (!cashTouched) cash.input.value = net > 0 ? String(Math.max(net - num(udhaar.input.value), 0)) : '';
    const rest = Math.abs(net) - num(cash.input.value) - (net > 0 ? num(udhaar.input.value) : 0);
    upi.input.value = String(Math.round(rest * 100) / 100);
    payNote.textContent = net >= 0 ? t('PAYMENT') + ' · ' + inr(net) + ' ' + t('to collect') : t('OLD GOLD IS MORE · pay') + ' ' + inr(-net) + ' ' + t('to customer');
    totalLabel.textContent = t(isGst ? 'GST bill' : 'Estimate') + t(net >= 0 ? ' · customer pays' : ' · shop pays');
    totalValue.textContent = inr(Math.abs(net));
    totalsBox.replaceChildren(
      h('div', { class: 'kv' }, h('span', null, 'Items'), h('span', null, inr(subtotal, 2))),
      isGst ? h('div', { class: 'kv' }, h('span', null, 'GST ' + num(gstPct.input.value) + '%'), h('span', null, inr(tax, 2))) : null,
      oldValue ? h('div', { class: 'kv' }, h('span', null, 'Less old gold'), h('span', null, '− ' + inr(oldValue))) : null,
      h('div', { class: 'kv strong' }, h('span', null, net >= 0 ? 'To collect' : 'To pay customer'), h('span', null, inr(Math.abs(net)))));
    last = { net, isGst };
  }

  addLine();
  const save = h('button', { class: 'btn', onclick: () => busy(save, async () => {
    const who = picker.get();
    const payload = Object.assign({}, who, {
      type, gstPct: gstPct.input.value,
      lines: lines.map((l) => l.get()), oldGold: olds.map((o) => o.get()),
      cash: last.net >= 0 ? num(cash.input.value) : num(cash.input.value),
      upi: num(upi.input.value), udhaar: last.net >= 0 ? num(udhaar.input.value) : 0
    });
    if (payload.upi < 0) throw new Error('Cash is more than the amount to collect');
    lines.forEach((l) => l.rememberValues());
    const bill = await call('sale.create', payload);
    toast('Bill ' + bill.billNo + ' saved');
    go('bill/' + bill.id);
  }) }, t('Save bill'));

  const fromStock = h('button', { class: 'add', type: 'button', onclick: () => pickFromStock(addLine) }, icon('box', 18), ' From stock');
  return screen(t('New Sale'), S.rate ? '22K ' + inr(S.rate.g22) + '/g · 24K ' + inr(S.rate.g24) + '/g' : 'Set today\'s rate first',
    [typeSeg, !gstReady ? h('div', { class: 'hint' }, 'GST bills need the shop GSTIN — add it in Settings.') : null,
      sec(t('Customer')), picker,
      sec('ITEMS · every value can be changed'), names, linesBox,
      h('div', { class: 'grid g2' }, h('button', { class: 'add', type: 'button', onclick: () => addLine() }, '+ Add item'), fromStock),
      gstRow,
      sec(t('Old gold taken in') + ' · ' + t('right here, no separate entry')), oldBox,
      h('button', { class: 'add gold', type: 'button', onclick: addOld }, '+ Add old gold / silver'),
      totalsBox, payNote, grid(3, cash, upi, udhaar),
      h('div', { class: 'hint' }, t('Items typed by hand do not change stock. To sell a stock item, use "From stock".')),
      h('div', { class: 'hint' }, 'UPI fills itself with the rest. Put any unpaid amount in Baki — it shows in the Baki list until paid.')],
    [h('div', { class: 'kv foot-total' }, totalLabel, totalValue), save]);
}

/** One bill line. */
function lineEditor(pref, onchange, onremove) {
  let karat = pref.karat || remember('sale_karat') || '22K';
  const name = field(t('Item name'), { value: pref.name || '' });
  name.input.setAttribute('list', 'item-names');
  let saveName = false;
  const saveBtn = h('button', { type: 'button', class: 'save-name', onclick: () => {
    saveName = !saveName; saveBtn.textContent = saveName ? 'Name saved ✓' : 'Save name'; saveBtn.classList.toggle('done', saveName);
  } }, 'Save name');
  const purity = field(t('Purity %'), { type: 'num', value: pref.purityPct || purityFor(karat), oninput: onchange });
  const weight = field(t('Weight (g)'), { type: 'num', value: pref.weight || '', oninput: onchange });
  const rate = field(t('Rate ₹/g'), { type: 'num', value: pref.rate || rateFor(karat), oninput: onchange });
  const making = field(t('Making ₹/g'), { type: 'num', value: pref.makingPerG ?? (remember('making') || setting('making_default_per_g', '150')), oninput: onchange });
  const kseg = seg(KARATS, karat, (v) => {
    karat = v; purity.input.value = purityFor(v) || (v === 'Silver' ? '100' : ''); rate.input.value = rateFor(v); onchange();
  });
  const total = h('div', { class: 'kv strong' });
  const isLot = pref.itemId && pref.lotPieces > 1;
  const pieces = isLot ? field(t('Pieces sold'), { type: 'num', value: '1', hint: t('Lot in stock') + ': ' + pref.lotPieces + ' pcs · ' + g3(pref.lotWt) + ' g' }) : null;
  const tag = pref.itemId ? h('div', { class: 'hint' }, t('From stock') + ': ' + (pref.tag || '') + (pref.name ? ' · ' + pref.name : '') +
    ' · ' + t(isLot ? 'only the weight and pieces sold leave stock' : 'leaves stock when the bill is saved')) : null;
  const el = h('div', { class: 'card' },
    h('div', { class: 'line-top' }, name, saveBtn, h('button', { type: 'button', class: 'x', 'aria-label': 'Remove item', onclick: onremove }, '×')),
    tag,
    h('div', { class: 'karat-row' }, kseg, purity),
    grid(3, weight, rate, making),
    pieces,
    total);
  if (pref.itemId && !isLot) weight.input.readOnly = true;
  const amount = () => {
    const w = num(weight.input.value);
    try { return Math.round(Calc.evalFormula(setting('formula_sale_line'), { Weight: w, Rate: num(rate.input.value), Making: num(making.input.value) }) * 100) / 100; }
    catch (e) { return 0; }
  };
  const obj = {
    el, amount,
    get: () => ({ itemId: pref.itemId || '', name: name.input.value.trim() || 'Item', metal: karat === 'Silver' ? 'silver' : 'gold',
      purityPct: purity.input.value, weight: weight.input.value, rate: rate.input.value, makingPerG: making.input.value, saveName,
      pieces: pieces ? pieces.input.value : undefined }),
    rememberValues: () => { remember('making', making.input.value); remember('sale_karat', karat); }
  };
  const draw = () => {
    const w = num(weight.input.value);
    total.replaceChildren(h('span', null, t('Gold') + ' ' + inr(w * num(rate.input.value)) + ' + ' + t('making') + ' ' + inr(w * num(making.input.value))), h('span', null, inr(amount(), 2)));
  };
  [weight, rate, making].forEach((f) => f.input.addEventListener('input', draw));
  draw();
  return obj;
}

/** Old gold / silver taken in this bill: customer cut % on the bill, our purity estimate kept for the shop. */
export function oldEditor(onchange, onremove) {
  let metal = 'gold';
  const item = field('Old item', { value: '' });
  const weight = field(t('Weight (g)'), { type: 'num', oninput: onchange });
  const cut = field(t('Customer cut %') + ' ' + t('(on bill)'), { type: 'num', value: setting('standard_cut_pct', '20'), oninput: onchange });
  const rate = field('24K rate ₹/g', { type: 'num', value: rateFor('24K'), oninput: onchange });
  const pur = field(t('Our purity estimate %'), { type: 'num', value: setting('standard_purity_pct', '80'), oninput: onchange });
  const mseg = seg([{ value: 'gold', label: 'Gold' }, { value: 'silver', label: 'Silver' }], metal, (v) => {
    metal = v; rate.input.value = v === 'silver' ? rateFor('Silver') : rateFor('24K');
    rate.querySelector('.lbl').textContent = v === 'silver' ? 'Silver rate ₹/g' : '24K rate ₹/g'; onchange();
  });
  const custLine = h('div', { class: 'kv strong gold-text' });
  const ourLine = h('div', { class: 'shop-only-calc' });
  const el = h('div', { class: 'card gold-card' },
    h('div', { class: 'line-top' }, item, h('button', { type: 'button', class: 'x', 'aria-label': 'Remove old item', onclick: onremove }, '×')),
    mseg, grid(2, weight, cut), rate, custLine,
    h('div', { class: 'shop-only' }, h('div', { class: 'shop-only-title' }, icon('lock', 14), ' SHOP ONLY · not printed on bill'),
      h('div', { class: 'grid g2' }, pur, ourLine)));
  const calc = () => {
    const w = num(weight.input.value);
    let cf = 0, of = 0;
    try { cf = Calc.evalFormula(setting('formula_old_fine'), { Weight: w, Cut: num(cut.input.value) }); } catch (e) { /* ignore */ }
    try { of = Calc.evalFormula(setting('formula_our_fine'), { Weight: w, Purity: num(pur.input.value) }); } catch (e) { /* ignore */ }
    return { cf: Math.round(cf * 1000) / 1000, of: Math.round(of * 1000) / 1000, amt: Math.round(cf * 1000) / 1000 * num(rate.input.value) };
  };
  const draw = () => {
    const c = calc();
    custLine.replaceChildren(h('span', null, t('Customer gets for') + ' ' + g3(c.cf) + ' g ' + t('fine')), h('span', null, '− ' + inr(Math.round(c.amt))));
    const m = c.of - c.cf;
    ourLine.replaceChildren(h('div', null, 'Our fine: ', h('b', null, g3(c.of) + ' g')),
      h('div', { class: m >= 0 ? 'good' : 'bad' }, 'Margin: ' + (m >= 0 ? '+' : '') + g3(m) + ' g · ' + inr(m * num(rate.input.value))));
  };
  [weight, cut, rate, pur].forEach((f) => f.input.addEventListener('input', draw));
  draw();
  return {
    el,
    amount: () => Math.round(calc().amt),
    get: () => ({ item: item.input.value.trim() || 'Old item', metal, weight: weight.input.value, cutPct: cut.input.value,
      rate: rate.input.value, ourPurityPct: pur.input.value })
  };
}

async function pickFromStock(addLine) {
  const q = field('Tag or name', {});
  const results = h('div', { class: 'list' });
  let chosen = null;
  const runSearch = async () => {
    try {
      const items = await call('stock.list', { q: q.input.value.trim() });
      results.replaceChildren(...items.slice(0, 20).map((i) => h('button', { type: 'button', class: 'pick-item', onclick: () => {
        chosen = i; document.querySelector('.modal-actions .btn').click();
      } }, h('b', null, (i.tag ? i.tag + ' · ' : '') + i.name), h('span', null, g3(i.netWt) + ' g · ' + (i.purityPct || '') + '%'))));
    } catch (e) { results.replaceChildren(h('div', { class: 'error-box' }, e.message)); }
  };
  let timer;
  q.input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(runSearch, 250); });
  runSearch();
  setTimeout(() => q.input.focus(), 50);
  const ok = await modal('Pick from stock', h('div', { class: 'stack' }, q, results), [{ label: 'Use', value: true }]);
  if (!ok || !chosen) return;
  const karat = chosen.metal === 'silver' ? 'Silver' : (chosen.purityPct >= 99 ? '24K' : chosen.purityPct >= 90 ? '22K' : '18K');
  const lot = chosen.pieces > 1;
  addLine({ itemId: chosen.id, tag: chosen.tag, name: chosen.name, weight: lot ? '' : chosen.netWt, purityPct: chosen.purityPct,
    lotPieces: chosen.pieces, lotWt: chosen.netWt,
    karat, makingPerG: chosen.makingPerG || undefined });
}
