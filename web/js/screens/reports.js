/* Reports: today, this month, where things stand. Works on phone and as the computer dashboard. */
import { call } from '../api.js';
import { S, modOn } from '../state.js';
import { h, screen, field, inr, fdate, g3, go, chips, toast } from '../ui.js';
import { downloadPdf, sharePdf, docCss } from '../bill.js';

export async function render(params, query) {
  const tab = query.t || 'today';
  const tabs = chips([{ label: 'Today', value: 'today', on: tab === 'today' }, { label: 'Month', value: 'month', on: tab === 'month' },
    { label: 'Where things stand', value: 'position', on: tab === 'position' }], (v) => go('reports?t=' + v));
  let body;
  if (tab === 'month') body = await month(query.m);
  else if (tab === 'position') body = await position();
  else body = await today(query.d);
  return screen('Reports', S.settings.shop_name, [tabs, body], null, { back: '#/home' });
}

const kvRow = (a, b, cls) => h('div', { class: 'kv ' + (cls || '') }, h('span', { class: 'muted' }, a), h('span', null, b));

async function today(dateQ) {
  const date = dateQ || S.today;
  const d = await call('reports.daily', { date });
  const pick = field('Date', { type: 'date', value: date });
  pick.input.addEventListener('change', () => go('reports?t=today&d=' + pick.input.value));
  const html = () => reportHtml(d);
  return h('div', { class: 'stack wide-grid' },
    pick,
    h('div', { class: 'card' },
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Profit · ' + fdate(date)), h('b', { class: 'big ' + (d.profit >= 0 ? 'good' : 'bad') }, inr(d.profit))),
      kvRow('Sales (' + d.sales.count + ' bills' + (d.unknownCostLines ? ', making only where cost is not known' : '') + ')', inr(d.parts.sales)),
      modOn('girvi') ? kvRow('Girvi interest received', inr(d.parts.interest)) : null,
      modOn('repair') ? kvRow('Repair profit', inr(d.parts.repair)) : null,
      modOn('orders') ? kvRow('Order making profit', inr(d.parts.making)) : null,
      modOn('melt') ? kvRow('Melting gain', inr(d.parts.melting)) : null,
      kvRow('Expenses', '− ' + inr(d.parts.expenses))),
    h('div', { class: 'card' }, h('div', { class: 'sec' }, 'CASH'),
      kvRow('Opening', inr(d.cash.opening)), kvRow('In', '+ ' + inr(d.cash.cashIn)), kvRow('Out', '− ' + inr(d.cash.cashOut)),
      kvRow('Should be in drawer', inr(d.cash.closing), 'strong'), kvRow('UPI in / out', inr(d.cash.upiIn) + ' / ' + inr(d.cash.upiOut))),
    h('div', { class: 'card' }, h('div', { class: 'sec' }, 'WORK DONE'),
      kvRow('Bills', d.sales.count + ' (' + d.sales.gst + ' GST) · ' + inr(d.sales.total)),
      modOn('girvi') ? kvRow('New girvi', d.loans.newCount + ' · ' + inr(d.loans.newAmount) + ' · released ' + d.loans.closed) : null,
      modOn('oldgold') ? kvRow('Old gold bought', g3(d.oldGold.weight) + ' g · ' + inr(d.oldGold.amount)) : null,
      modOn('orders') ? kvRow('Orders booked / delivered', d.orders.booked + ' / ' + d.orders.delivered) : null),
    h('div', { class: 'grid g2' },
      h('button', { class: 'btn', onclick: () => sharePdf(html(), 'report-' + date + '.pdf', S.settings.shop_name + ' report ' + fdate(date)).catch((e) => toast(e.message, 'err')) }, 'Share on WhatsApp'),
      h('button', { class: 'btn2', onclick: () => downloadPdf(html(), 'report-' + date + '.pdf').catch((e) => toast(e.message, 'err')) }, 'Download PDF')));
}

async function month(mq) {
  const m = mq || S.today.slice(0, 7);
  const r = await call('reports.month', { month: m });
  const pick = field('Month', { value: m });
  pick.input.type = 'month';
  pick.input.addEventListener('change', () => go('reports?t=month&m=' + pick.input.value));
  const max = Math.max(1, ...r.days.map((d) => Math.abs(d.profit)));
  return h('div', { class: 'stack' }, pick,
    h('div', { class: 'card' },
      h('div', { class: 'kv' }, h('span', { class: 'muted' }, 'Profit this month'), h('b', { class: 'big' }, inr(r.profit))),
      kvRow('Sales', inr(r.parts.sales)), kvRow('Girvi interest', inr(r.parts.interest)), kvRow('Repair', inr(r.parts.repair)),
      kvRow('Order making', inr(r.parts.making)), kvRow('Melting', inr(r.parts.melting)), kvRow('Expenses', '− ' + inr(r.parts.expenses))),
    h('div', { class: 'card' }, h('div', { class: 'sec' }, 'PROFIT BY DAY'),
      h('div', { class: 'bars', role: 'img', 'aria-label': 'Profit by day' }, r.days.map((d) => h('div', { class: 'bar', title: fdate(d.date) + ': ' + inr(d.profit) },
        h('span', { class: 'bar-v' }, d.profit ? Math.round(d.profit / 1000) + 'k' : ''),
        h('div', { class: 'bar-fill' + (d.profit < 0 ? ' neg' : ''), style: { height: Math.round(Math.abs(d.profit) / max * 140) + 'px' } }),
        h('span', { class: 'bar-l' }, String(+d.date.slice(8))))))));
}

async function position() {
  const p = await call('reports.position');
  const tile = (label, value, href) => h('a', { class: 'stat', href }, h('span', null, label), h('b', null, value));
  return h('div', { class: 'stack' },
    h('div', { class: 'tiles-wide' },
      modOn('girvi') ? tile('Girvi loans out · ' + p.loans.count, inr(p.loans.principal), '#/loans') : null,
      modOn('girvi') ? tile('Interest due so far', inr(p.loans.interestDue), '#/loans') : null,
      modOn('wholesaler') ? tile('To wholesalers', g3(p.wholesalers.goldG) + ' g + ' + inr(p.wholesalers.cash), '#/parties/wholesaler') : null,
      modOn('orders') ? tile('Order advances held · ' + p.orders.pending, inr(p.orders.advanceHeld), '#/orders') : null,
      modOn('stock') ? tile('Gold stock', g3(p.stock.totals.gold.netWt) + ' g', '#/stock') : null,
      modOn('melt') ? tile('Old gold not melted', g3(p.fine.oldGold.weight) + ' g', '#/melt') : null,
      modOn('melt') ? tile('Fine gold in hand', g3(p.fine.inHand) + ' g', '#/melt') : null,
      modOn('karigar') ? tile('Gold with karigars', g3(p.karigars.goldG) + ' g', '#/parties/karigar') : null,
      tile('Cash in drawer', inr(p.cash.inDrawer), '#/cash')),
    modOn('girvi') ? h('div', { class: 'card' }, h('div', { class: 'sec' }, 'GIRVI'),
      kvRow('Gold / silver held', g3(p.loans.goldWt) + ' g / ' + g3(p.loans.silverWt) + ' g'),
      kvRow('Value today', inr(p.loans.valueToday)), kvRow('Total to collect', inr(p.loans.totalDue), 'strong'),
      kvRow('Over 12 months', String(p.loans.over12Months), p.loans.over12Months ? 'bad' : ''),
      h('div', { class: 'table-scroll' }, h('table', { class: 'tbl' },
        h('tr', null, h('th', null, 'Customer'), h('th', null, 'Item'), h('th', null, 'Since'), h('th', { class: 'r' }, 'Due')),
        p.loans.oldest.map((l) => h('tr', null, h('td', null, h('a', { href: '#/loan/' + l.id }, l.customerName)), h('td', null, l.item + ' ' + g3(l.netWt) + ' g'),
          h('td', null, fdate(l.date)), h('td', { class: 'r' }, inr(l.totalDue))))))) : null,
    modOn('orders') ? h('div', { class: 'card' }, h('div', { class: 'sec' }, 'PENDING ORDERS'),
      kvRow('Due today / late', p.orders.dueToday + ' / ' + p.orders.late, p.orders.late ? 'bad' : ''),
      kvRow('Gold promised at fixed rate', g3(p.orders.fixedGoldG) + ' g'),
      h('div', { class: 'table-scroll' }, h('table', { class: 'tbl' },
        h('tr', null, h('th', null, 'Customer'), h('th', null, 'Item'), h('th', null, 'Rate'), h('th', { class: 'r' }, 'Paid'), h('th', null, 'Delivery')),
        p.orders.list.map((o) => h('tr', null, h('td', null, h('a', { href: '#/order/' + o.id }, o.customerName)), h('td', null, o.item),
          h('td', null, o.rateFixed ? inr(o.rate) : 'Not fixed'), h('td', { class: 'r' }, inr(o.paid)), h('td', null, o.deliveryDate ? fdate(o.deliveryDate) : '—')))))) : null,
    modOn('stock') ? h('div', { class: 'card' }, h('div', { class: 'sec' }, 'STOCK BY CATEGORY'),
      p.stock.categories.map((c) => kvRow(c.category + ' (' + c.metal + ')', c.pieces + ' pcs · ' + g3(c.netWt) + ' g'))) : null);
}

function reportHtml(d) {
  const r = (a, b) => `<div class="kv"><span>${a}</span><span>${b}</span></div>`;
  return `<style>${docCss()}</style><div class="doc a4"><div class="hd"><div><div class="shop">${S.settings.shop_name}</div></div><div class="r"><div class="title">DAILY REPORT</div><div>${fdate(d.date)}</div></div></div>
  <div class="sum wide">${r('<b>Profit</b>', '<b>₹' + Calc.inr(d.profit) + '</b>')}${r('Sales (' + d.sales.count + ' bills)', '₹' + Calc.inr(d.parts.sales))}${r('Girvi interest', '₹' + Calc.inr(d.parts.interest))}
  ${r('Repair profit', '₹' + Calc.inr(d.parts.repair))}${r('Order making', '₹' + Calc.inr(d.parts.making))}${r('Melting gain', '₹' + Calc.inr(d.parts.melting))}${r('Expenses', '−₹' + Calc.inr(d.parts.expenses))}
  <br>${r('Cash opening', '₹' + Calc.inr(d.cash.opening))}${r('Cash in / out', '₹' + Calc.inr(d.cash.cashIn) + ' / ₹' + Calc.inr(d.cash.cashOut))}${r('<b>Cash in drawer</b>', '<b>₹' + Calc.inr(d.cash.closing) + '</b>')}${r('UPI in / out', '₹' + Calc.inr(d.cash.upiIn) + ' / ₹' + Calc.inr(d.cash.upiOut))}</div></div>`;
}
