/* ---------- Stock ---------- */

function itemOut_(i) {
  var out = {};
  SCHEMA.Items.forEach(function (k) { out[k] = i[k]; });
  ['purityPct', 'grossWt', 'netWt', 'pieces', 'makingPerG', 'costTotal'].forEach(function (k) { out[k] = num_(i[k]); });
  return out;
}

function stockAdd_(user, d) {
  var items = d.items || [];
  req_(items.length, 'Add at least one item');
  var saved = [];
  var tags = {};
  rows_('Items').forEach(function (i) { if (i.tag) tags[i.tag.toLowerCase()] = 1; });
  // Check every row before saving any, so a mistake in one row never half-saves the others.
  items.forEach(function (it) {
    ['netWt', 'grossWt', 'pieces', 'makingPerG', 'costTotal', 'purityPct'].forEach(function (k) { pos_(it[k], k); });
    req_(num_(it.purityPct) <= 100, 'Purity % should be 100 or less');
    req_(round3_(it.netWt || it.grossWt) > 0, 'Enter the weight for ' + (it.name || 'the item'));
    var tg = String(it.tag || '').trim().toLowerCase();
    if (tg) { req_(!tags[tg], 'Tag ' + it.tag + ' is already used'); tags[tg] = 1; }
  });
  items.forEach(function (it) {
    var net = round3_(it.netWt || it.grossWt);
    var tag = String(it.tag || '').trim();
    if (!tag) tag = 'T' + String(nextCounter_('tag')).padStart(5, '0');
    var rec = {
      id: uid_('I'), tag: tag, name: String(it.name || 'Item').trim(), category: String(it.category || 'Other').trim(),
      metal: it.metal === 'silver' ? 'silver' : 'gold', purityPct: num_(it.purityPct),
      grossWt: round3_(it.grossWt || net), netWt: net, pieces: Math.max(1, Math.round(num_(it.pieces) || 1)),
      makingPerG: num_(it.makingPerG), costTotal: round2_(it.costTotal), status: 'in',
      source: d.source || 'manual', sourceId: d.sourceId || '', soldBillId: '', addedAt: nowIso_(), by: user.username
    };
    insert_('Items', rec);
    saved.push(itemOut_(rec));
  });
  rememberCategories_(saved.map(function (x) { return x.category; }));
  audit_(user, 'stock.add', saved.map(function (x) { return x.id; }).join(','), { count: saved.length });
  return saved;
}

function rememberCategories_(cats) {
  var list = json_(settings_().item_categories, ['Necklace', 'Chain', 'Ring', 'Ear rings', 'Bangles', 'Mangalsutra', 'Pendant', 'Payal', 'Bichhiya', 'Coin']);
  cats.forEach(function (c) { if (c && list.indexOf(c) < 0) list.push(c); });
  setSetting_('item_categories', JSON.stringify(list));
}

function stockList_(d) {
  var status = d.status || 'in';
  var q = String(d.q || '').toLowerCase();
  return rows_('Items').filter(function (i) {
    if (status !== 'all' && i.status !== status) return false;
    if (d.category && i.category !== d.category) return false;
    if (d.metal && i.metal !== d.metal) return false;
    if (q && (i.tag + ' ' + i.name + ' ' + i.category).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).slice().reverse().slice(0, 300).map(itemOut_);
}

function stockSummary_() {
  var rate = todayRate_();
  var groups = {};
  var totals = { gold: { pieces: 0, netWt: 0, value: 0 }, silver: { pieces: 0, netWt: 0, value: 0 } };
  rows_('Items').forEach(function (i) {
    if (i.status !== 'in') return;
    var key = i.metal + '|' + i.category;
    var g = groups[key] || (groups[key] = { metal: i.metal, category: i.category, pieces: 0, netWt: 0, value: 0 });
    var pcs = num_(i.pieces) || 1;
    var val = itemValue_(i.metal, num_(i.netWt), num_(i.purityPct) || (i.metal === 'silver' ? 100 : 91.6), rate);
    g.pieces += pcs; g.netWt = round3_(g.netWt + num_(i.netWt)); g.value += val;
    var t = totals[i.metal] || totals.gold;
    t.pieces += pcs; t.netWt = round3_(t.netWt + num_(i.netWt)); t.value += val;
  });
  var list = Object.keys(groups).map(function (k) { return groups[k]; });
  list.sort(function (a, b) { return b.netWt - a.netWt; });
  var today = today_();
  var todayBills = {};
  rows_('Sales').forEach(function (b) { if (b.date === today && b.status !== 'void') todayBills[b.id] = 1; });
  var soldToday = rows_('Items').filter(function (i) { return i.soldBillId && todayBills[i.soldBillId]; }).length;
  return { categories: list, totals: totals, soldToday: soldToday,
    categoriesList: json_(settings_().item_categories, []) };
}

function stockUpdate_(user, d) {
  var i = find_('Items', d.id);
  req_(i, 'Item not found');
  var patch = {};
  ['tag', 'name', 'category', 'metal'].forEach(function (k) { if (d[k] !== undefined) patch[k] = String(d[k]); });
  ['purityPct', 'grossWt', 'netWt', 'pieces', 'makingPerG', 'costTotal'].forEach(function (k) {
    if (d[k] !== undefined && d[k] !== '') patch[k] = pos_(d[k], k);
  });
  req_(i.status === 'in' || d.status, 'This item is already sold');
  if (patch.pieces !== undefined) req_(patch.pieces >= 1, 'Pieces should be at least 1');
  if (patch.purityPct !== undefined) req_(patch.purityPct <= 100, 'Purity % should be 100 or less');
  if (d.status) {
    req_(['in', 'removed'].indexOf(d.status) >= 0, 'Bad status');
    req_(i.status !== 'sold', 'This item is sold. To bring it back, cancel its bill.');
    patch.status = d.status;
  }
  var saved = update_('Items', i.id, patch);
  audit_(user, 'stock.update', i.id, patch);
  return itemOut_(saved);
}

/* ---------- Stock photos: kept in Google Drive (folder "DukanKaApp Photos"), never in the sheet,
 * and loaded only when someone opens that item — so lists stay as fast as before. */
function photoFolder_() {
  var s = settings_();
  if (s.photo_folder) { try { return DriveApp.getFolderById(s.photo_folder); } catch (e) { /* deleted: make again */ } }
  var f = DriveApp.createFolder('DukanKaApp Photos');
  setSetting_('photo_folder', f.getId());
  return f;
}

function stockPhotoSet_(user, d) {
  var i = find_('Items', d.id);
  req_(i, 'Item not found');
  var m = /^data:image\/jpeg;base64,(.+)$/.exec(String(d.data || ''));
  if (d.data) req_(m && m[1].length < 400000, 'Photo is too big');
  if (i.photoId) { try { DriveApp.getFileById(i.photoId).setTrashed(true); } catch (e) { /* already gone */ } }
  var id = '';
  if (m) {
    var blob = Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/jpeg', (i.tag || i.id) + '.jpg');
    id = photoFolder_().createFile(blob).getId();
  }
  update_('Items', i.id, { photoId: id });
  audit_(user, 'stock.photo', i.id, { photo: !!id });
  return { id: i.id, photoId: id };
}

function stockPhoto_(d) {
  var i = find_('Items', d.id);
  req_(i && i.photoId, 'No photo');
  var blob = DriveApp.getFileById(i.photoId).getBlob();
  return { id: i.id, photoId: i.photoId, data: 'data:image/jpeg;base64,' + Utilities.base64Encode(blob.getBytes()) };
}

/* ---------- Melting and fine gold stock ---------- */

/** Fine stock is kept per metal: blank metal = gold (entries made before silver was added). */
function fineMetal_(f) { return f.metal === 'silver' ? 'silver' : 'gold'; }

function fineEntry_(user, type, grams, value, refType, refId, notes, date, metal) {
  return insert_('FineLedger', {
    id: uid_('F'), date: validDate_(date), type: type, grams: round3_(grams), value: round2_(value),
    refType: refType || '', refId: refId || '', notes: notes || '', by: user ? user.username : '', at: nowIso_(),
    metal: metal === 'silver' ? 'silver' : 'gold'
  });
}

/**
 * Melting old gold / silver into a bar, with the weight lost on the way:
 *   net in       = old weight − loss already taken off when buying (stones, dirt)
 *   melting loss = net in − bar weight
 *   refining loss= weight lost later at refining / testing (typed)
 *   fine added   = (bar − refining loss) × tested purity
 */
function meltCreate_(user, d) {
  var metal = d.metal === 'silver' ? 'silver' : 'gold';
  var ids = (d.oldGoldIds || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
  req_(ids.length, 'Pick the old items to melt');
  var barWt = round3_(pos_(d.barWt, 'Bar weight')), purity = pos_(d.purityPct, 'Purity');
  req_(barWt > 0 && purity > 0, 'Enter bar weight and tested purity');
  req_(purity <= 100, 'Purity % should be 100 or less');
  var refineLoss = round3_(pos_(d.refineLossG, 'Refining loss'));
  req_(refineLoss < barWt, 'Refining loss should be less than the bar weight');
  pos_(d.cost, 'Charge');
  var totalWt = 0, netIn = 0, ourFine = 0, paidFine = 0, paidAmount = 0;
  ids.forEach(function (gid) {
    var g = find_('OldGold', gid);
    req_(g && g.status === 'stock', 'An item is not in old stock');
    req_((g.metal === 'silver' ? 'silver' : 'gold') === metal, metal === 'silver' ? 'Pick only silver items' : 'Pick only gold items');
    totalWt += num_(g.weight); netIn += num_(g.weight) - num_(g.lossG);
    ourFine += num_(g.ourFine); paidFine += num_(g.customerFine); paidAmount += num_(g.amount);
  });
  req_(barWt <= round3_(totalWt) + 0.0005, 'Bar weight (' + barWt + ' g) cannot be more than the old items melted (' + round3_(totalWt) + ' g)');
  var actualFine = round3_((barWt - refineLoss) * purity / 100);
  var cost = round2_(d.cost);
  var date = validDate_(d.date);
  var rec = {
    id: uid_('M'), date: date, oldGoldIds: ids, totalWt: round3_(totalWt), ourFine: round3_(ourFine),
    paidFine: round3_(paidFine), paidAmount: round2_(paidAmount), barWt: barWt, purityPct: purity,
    actualFine: actualFine, cost: cost, notes: String(d.notes || ''), by: user.username, at: nowIso_(),
    metal: metal, lossG: round3_(netIn - barWt), refineLossG: refineLoss
  };
  insert_('Melts', rec);
  ids.forEach(function (gid) { update_('OldGold', gid, { status: 'melted', meltId: rec.id }); });
  fineEntry_(user, 'melt_in', actualFine, paidAmount + cost, 'melt', rec.id, 'Melted ' + ids.length + ' items', date, metal);
  if (cost > 0) cash_(user, 'out', d.mode === 'upi' ? 'upi' : 'cash', cost, 'melting', 'melt', rec.id, 'Melting / testing charges', date);
  audit_(user, 'melt.create', rec.id, { metal: metal, actualFine: actualFine, lossG: rec.lossG, refineLossG: refineLoss });
  return meltOut_(rec);
}

function meltOut_(m) {
  var rate = rateOn_(m.date) || todayRate_() || { g24: 0, silver: 0 };
  var silver = m.metal === 'silver';
  var actual = num_(m.actualFine);
  var bought = json_(m.oldGoldIds, []);
  var meltLoss = num_(m.lossG), refineLoss = num_(m.refineLossG);
  return {
    id: m.id, date: m.date, metal: silver ? 'silver' : 'gold', items: bought.length, totalWt: num_(m.totalWt),
    ourFine: num_(m.ourFine), paidFine: num_(m.paidFine), paidAmount: num_(m.paidAmount), barWt: num_(m.barWt),
    purityPct: num_(m.purityPct), actualFine: actual, cost: num_(m.cost),
    lossG: meltLoss, refineLossG: refineLoss, totalLossG: round3_(meltLoss + refineLoss),
    lossPct: num_(m.totalWt) ? Math.round((meltLoss + refineLoss) / num_(m.totalWt) * 10000) / 100 : 0,
    vsEstimateG: round3_(actual - num_(m.ourFine)), vsPaidG: round3_(actual - num_(m.paidFine)),
    gainValue: Math.round(actual * num_(silver ? rate.silver : rate.g24) - num_(m.paidAmount) - num_(m.cost))
  };
}

function meltList_(d) {
  var metal = d && d.metal;
  return rows_('Melts').filter(function (m) { return !metal || (m.metal === 'silver' ? 'silver' : 'gold') === metal; })
    .slice().reverse().map(meltOut_);
}

function fineSummary_() {
  var by = { gold: { inHand: 0, valueIn: 0, gramsIn: 0 }, silver: { inHand: 0, valueIn: 0, gramsIn: 0 } };
  rows_('FineLedger').forEach(function (f) {
    var x = by[fineMetal_(f)];
    var g = num_(f.grams);
    x.inHand += g;
    if (g > 0 && num_(f.value) > 0) { x.gramsIn += g; x.valueIn += num_(f.value); }
  });
  var karigarIds = {};
  rows_('Parties').forEach(function (p) { if (p.type === 'karigar') karigarIds[p.id] = 1; });
  var withKarigars = 0;
  rows_('PartyLedger').forEach(function (e) { if (karigarIds[e.partyId]) withKarigars += num_(e.goldG); });
  var oldOf = function (metal) {
    var old = rows_('OldGold').filter(function (g) { return g.status === 'stock' && (g.metal === 'silver' ? 'silver' : 'gold') === metal; });
    return {
      items: old.length,
      weight: round3_(old.reduce(function (a, g) { return a + num_(g.weight); }, 0)),
      lossG: round3_(old.reduce(function (a, g) { return a + num_(g.lossG); }, 0)),
      ourFine: round3_(old.reduce(function (a, g) { return a + num_(g.ourFine); }, 0)),
      paidFine: round3_(old.reduce(function (a, g) { return a + num_(g.customerFine); }, 0)),
      amount: Math.round(old.reduce(function (a, g) { return a + num_(g.amount); }, 0))
    };
  };
  // Weight lost: when buying (less), in melting, in refining — all time, per metal.
  var losses = { gold: { buy: 0, melt: 0, refine: 0 }, silver: { buy: 0, melt: 0, refine: 0 } };
  rows_('OldGold').forEach(function (g) { if (g.status !== 'void') losses[g.metal === 'silver' ? 'silver' : 'gold'].buy += num_(g.lossG); });
  rows_('Melts').forEach(function (m) { var l = losses[m.metal === 'silver' ? 'silver' : 'gold']; l.melt += num_(m.lossG); l.refine += num_(m.refineLossG); });
  ['gold', 'silver'].forEach(function (k) { Object.keys(losses[k]).forEach(function (x) { losses[k][x] = round3_(losses[k][x]); }); });
  return {
    inHand: round3_(by.gold.inHand), withKarigars: round3_(withKarigars),
    avgCostPerG: by.gold.gramsIn ? Math.round(by.gold.valueIn / by.gold.gramsIn) : 0,
    oldGold: oldOf('gold'),
    silver: { inHand: round3_(by.silver.inHand), avgCostPerG: by.silver.gramsIn ? Math.round(by.silver.valueIn / by.silver.gramsIn * 100) / 100 : 0, old: oldOf('silver') },
    losses: losses
  };
}

function fineInHand_(metal) {
  metal = metal === 'silver' ? 'silver' : 'gold';
  return round3_(rows_('FineLedger').reduce(function (a, f) { return a + (fineMetal_(f) === metal ? num_(f.grams) : 0); }, 0));
}
function needFine_(grams, metal) {
  var have = fineInHand_(metal);
  req_(grams <= have + 0.0005, 'Only ' + have + ' g fine ' + (metal === 'silver' ? 'silver' : 'gold') + ' in hand');
}

function issueFineToKarigar_(user, karigarId, grams, refType, refId, notes, date) {
  var p = find_('Parties', karigarId);
  req_(p && p.type === 'karigar', 'Karigar not found');
  needFine_(grams);
  fineEntry_(user, 'karigar_out', -grams, 0, refType, refId, 'To ' + p.name + ': ' + notes, date);
  insert_('PartyLedger', {
    id: uid_('Y'), partyId: p.id, date: validDate_(date), type: 'issue_gold', goldG: round3_(grams), cash: 0,
    rate: '', refType: refType, refId: refId, notes: notes, by: user.username, at: nowIso_()
  });
}

/* ---------- Wholesalers and karigars ---------- */

function partyBalances_(partyId) {
  var gold = 0, silver = 0, cash = 0;
  rows_('PartyLedger').forEach(function (e) {
    if (e.partyId === partyId) { gold += num_(e.goldG); silver += num_(e.silverG); cash += num_(e.cash); }
  });
  return { goldG: round3_(gold), silverG: round3_(silver), cash: round2_(cash) };
}
function partyValue_(b, rate) {
  return Math.round(b.goldG * (rate ? num_(rate.g24) : 0) + b.silverG * (rate ? num_(rate.silver) : 0) + b.cash);
}

function partiesList_(d) {
  var rate = todayRate_();
  return rows_('Parties').filter(function (p) {
    return (!d.type || p.type === d.type) && p.active !== 'false';
  }).map(function (p) {
    var b = partyBalances_(p.id);
    return { id: p.id, type: p.type, name: p.name, mobile: p.mobile, notes: p.notes, goldG: b.goldG, silverG: b.silverG, cash: b.cash,
      valueToday: partyValue_(b, rate) };
  });
}

function partySave_(user, d) {
  req_(d.name, 'Enter the name');
  var rec = { type: d.type === 'karigar' ? 'karigar' : 'wholesaler', name: String(d.name).trim(),
    mobile: cleanMobile_(d.mobile), notes: String(d.notes || '') };
  if (d.id) {
    if (d.active !== undefined) rec.active = d.active ? 'true' : 'false';
    var saved = update_('Parties', d.id, rec);
    audit_(user, 'party.edit', d.id, rec);
    return saved;
  }
  rec.id = uid_('Q'); rec.active = 'true'; rec.createdAt = nowIso_();
  insert_('Parties', rec);
  audit_(user, 'party.add', rec.id, rec);
  return rec;
}

function partyLedger_(id) {
  var p = find_('Parties', id);
  req_(p, 'Not found');
  var entries = rows_('PartyLedger').filter(function (e) { return e.partyId === id; }).map(function (e) {
    return { id: e.id, date: e.date, type: e.type, goldG: num_(e.goldG), silverG: num_(e.silverG), cash: num_(e.cash), rate: num_(e.rate),
      refType: e.refType, refId: e.refId, notes: e.notes, by: e.by };
  }).reverse();
  var b = partyBalances_(id);
  var rate = todayRate_();
  return { party: p, entries: entries, goldG: b.goldG, silverG: b.silverG, cash: b.cash,
    valueToday: partyValue_(b, rate) };
}

/**
 * Wholesaler (positive = we owe them):
 *   purchase      goods taken: goldG / silverG = fine to give (weight × touch %), cash = labour; items optional (to stock)
 *   pay_gold      gave fine gold from our fine stock (goldG grams)
 *   pay_silver    gave fine silver from our fine silver stock (silverG grams)
 *   pay_cash_rate "rate cut": settled grams (gold, or silver when metal = silver) in cash at rate ₹/g
 *   pay_cash      paid cash dues (labour etc.)
 * Karigar (goldG positive = karigar holds our gold, cash positive = we owe labour):
 *   issue_gold, return_gold, job_done (fineUsed, labour), pay_labour
 */
function partyEntry_(user, d) {
  var p = find_('Parties', d.partyId);
  req_(p, 'Not found');
  var date = validDate_(d.date);
  var g = round3_(pos_(d.goldG, 'Grams')), c = round2_(pos_(d.cash, 'Amount')), rate = pos_(d.rate, 'Rate');
  var mode = d.mode === 'upi' ? 'upi' : 'cash';
  var sg = round3_(pos_(d.silverG, 'Silver grams'));
  var e = { id: uid_('Y'), partyId: p.id, date: date, type: d.type, goldG: 0, silverG: 0, cash: 0, rate: '',
    refType: d.refType || '', refId: d.refId || '', notes: String(d.notes || ''), by: user.username, at: nowIso_() };
  if (p.type === 'wholesaler') {
    if (d.type === 'purchase') {
      req_(g > 0 || sg > 0 || c > 0, 'Enter the fine to give or the cash to give');
      e.goldG = g; e.silverG = sg; e.cash = c;
      if (d.items && d.items.length) {
        var added = stockAdd_(user, { items: d.items, source: 'wholesaler', sourceId: e.id });
        e.notes = (e.notes ? e.notes + ' · ' : '') + added.length + ' items to stock';
      }
    } else if (d.type === 'pay_gold') {
      req_(g > 0, 'Enter grams given');
      needFine_(g);
      e.goldG = -g;
      fineEntry_(user, 'wholesaler_out', -g, 0, 'party', p.id, 'To ' + p.name, date);
    } else if (d.type === 'pay_silver') {
      req_(sg > 0, 'Enter grams given');
      needFine_(sg, 'silver');
      e.silverG = -sg;
      fineEntry_(user, 'wholesaler_out', -sg, 0, 'party', p.id, 'To ' + p.name, date, 'silver');
    } else if (d.type === 'pay_cash_rate') {
      req_(g > 0 && rate > 0, 'Enter grams and rate');
      var isAg = d.metal === 'silver';
      if (isAg) e.silverG = -g; else e.goldG = -g;
      e.rate = rate;
      cash_(user, 'out', mode, Math.round(g * rate), 'wholesaler', 'party', p.id, p.name + ' rate cut ' + g + ' g' + (isAg ? ' silver' : ''), date);
    } else if (d.type === 'pay_cash') {
      req_(c > 0, 'Enter the amount');
      e.cash = -c;
      cash_(user, 'out', mode, c, 'wholesaler', 'party', p.id, p.name, date);
    } else throw new Error('Unknown entry type');
  } else {
    if (d.type === 'issue_gold') {
      req_(g > 0, 'Enter grams given');
      needFine_(g);
      e.goldG = g;
      fineEntry_(user, 'karigar_out', -g, 0, 'party', p.id, 'To ' + p.name, date);
    } else if (d.type === 'return_gold') {
      req_(g > 0, 'Enter grams returned');
      e.goldG = -g;
      fineEntry_(user, 'karigar_return', g, 0, 'party', p.id, 'From ' + p.name, date);
    } else if (d.type === 'job_done') {
      req_(g > 0 || c > 0, 'Enter the fine gold used or the labour');
      e.goldG = -g; e.cash = c;
      if (d.items && d.items.length) stockAdd_(user, { items: d.items, source: 'karigar', sourceId: e.id });
    } else if (d.type === 'pay_labour') {
      req_(c > 0, 'Enter the amount');
      e.cash = -c;
      cash_(user, 'out', mode, c, 'karigar-labour', 'party', p.id, p.name, date);
    } else throw new Error('Unknown entry type');
  }
  insert_('PartyLedger', e);
  audit_(user, 'party.' + d.type, p.id, { goldG: e.goldG, silverG: e.silverG, cash: e.cash });
  var led = partyLedger_(p.id);
  if (led.entries && led.entries.length > 60) led.entries = led.entries.slice(0, 60); // keep the reply small
  return led;
}

/* ---------- Cash book ---------- */

function cashBalanceBefore_(date, mode) {
  var s = settings_();
  var openDate = s.cash_opening_date || '0000-00-00';
  var bal = mode === 'cash' ? num_(s.cash_opening) : 0;
  // The opening amount is the drawer at the start of the opening date. Days before it are worked out backwards.
  var back = date < openDate;
  // Only 5 of the 12 columns are needed for the running balance.
  readCols_('Cash', ['date', 'dir', 'mode', 'amount', 'status']).forEach(function (c) {
    if (c.mode !== mode) return;
    var sign = c.dir === 'in' ? 1 : -1;
    if (back) { if (c.date >= date && c.date < openDate) bal -= sign * num_(c.amount); }
    else if (c.date >= openDate && c.date < date) bal += sign * num_(c.amount);
  });
  return round2_(bal);
}

function cashList_(d) {
  var from = readDate_(d.from), to = d.to ? readDate_(d.to) : from;
  var entries = rowsMatching_('Cash', 'date', function (x) { return x >= from && x <= to; }).map(function (c) {
    return { id: c.id, date: c.date, dir: c.dir, mode: c.mode, amount: num_(c.amount), category: c.category,
      refType: c.refType, notes: c.notes, by: c.by, at: c.at };
  }).reverse();
  var sum = function (dir, mode) {
    return round2_(entries.filter(function (e) { return e.dir === dir && e.mode === mode; })
      .reduce(function (a, e) { return a + e.amount; }, 0));
  };
  var opening = cashBalanceBefore_(from, 'cash');
  var cashIn = sum('in', 'cash'), cashOut = sum('out', 'cash');
  return { from: from, to: to, entries: entries, opening: opening, cashIn: cashIn, cashOut: cashOut,
    closing: round2_(opening + cashIn - cashOut), upiIn: sum('in', 'upi'), upiOut: sum('out', 'upi') };
}

function cashAdd_(user, d) {
  var amt = round2_(pos_(d.amount, 'Amount'));
  req_(amt > 0, 'Enter the amount');
  var dir = d.dir === 'in' ? 'in' : 'out';
  var rec = cash_(user, dir, d.mode === 'upi' ? 'upi' : 'cash', amt, dir === 'out' ? 'expense' : 'other-income',
    'manual', '', String(d.notes || d.category || ''), d.date);
  audit_(user, 'cash.add', rec.id, rec);
  return rec;
}

function cashOpening_(user, d) {
  req_(d.amount !== '' && d.amount !== undefined && !isNaN(parseFloat(String(d.amount).replace(/,/g, ''))), 'Enter the cash in the drawer');
  pos_(d.amount, 'Opening cash');
  setSetting_('cash_opening', String(round2_(d.amount)));
  setSetting_('cash_opening_date', validDate_(d.date));
  audit_(user, 'cash.opening', '', d);
  return { ok: true };
}
