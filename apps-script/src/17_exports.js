/* ---------- Excel / CSV export of any list ---------- */

/**
 * export.list {module, from, to} -> {title, columns, rows}
 * The app turns this into a CSV file that opens in Excel / Google Sheets.
 * Purchase cost and profit columns go only to the owner.
 */
function exportList_(user, d) {
  var owner = user && user.role === 'owner';
  var from = d.from ? readDate_(d.from) : '0000-00-00';
  var to = d.to ? readDate_(d.to) : '9999-99-99';
  var inRange = function (date) { return date >= from && date <= to; };
  var m = String(d.module || '');
  var out;
  if (m === 'bills') {
    out = {
      title: 'Bills', columns: ['Date', 'Bill no', 'Type', 'Customer', 'Mobile', 'Village', 'Items', 'Net wt (g)', 'Taxable / items', 'GST %',
        'CGST', 'SGST', 'Round off', 'Invoice total', 'Old gold', 'Net', 'Cash', 'UPI', 'Baki', 'Status', 'Note'],
      rows: rows_('Sales').filter(function (b) { return inRange(b.date) && (!d.type || d.type === 'all' || b.type === d.type); }).map(function (b) {
        var lines = json_(b.lines, []);
        var tax = num_(b.tax), cg = Math.round(tax / 2 * 100) / 100;
        return [b.date, b.billNo, b.type === 'GST' ? 'GST' : 'Quotation', b.customerName, b.mobile, b.village,
          lines.map(function (l) { return l.name; }).join(', '), round3_(lines.reduce(function (a, l) { return a + num_(l.weight); }, 0)),
          num_(b.subtotal), num_(b.gstPct), cg, round2_(tax - cg), num_(b.roundOff), num_(b.invoiceTotal), num_(b.oldValue), num_(b.net),
          num_(b.cash), num_(b.upi), num_(b.udhaar), b.status === 'void' ? 'Cancelled' : 'OK', b.notes || ''];
      })
    };
  } else if (m === 'girvi') {
    var list = loansList_({ status: d.status || 'all' }).filter(function (l) { return inRange(l.date); });
    out = {
      title: 'Girvi', columns: ['Date', 'Customer', 'Mobile', 'Item', 'Metal', 'Net wt (g)', 'Loan ₹', 'Rate ₹/100/month', 'Days',
        'Interest due', 'Total due', 'Value today', 'Loan %', 'Status', 'Closed on'],
      rows: list.map(function (l) {
        return [l.date, l.customerName, l.mobile, l.item, l.metal, l.netWt, l.principal, l.ratePct, l.days, l.interestDue, l.totalDue,
          l.valueToday, l.ltvPct, l.status, l.closedAt || ''];
      })
    };
  } else if (m === 'oldgold') {
    out = {
      title: 'Old gold', columns: ['Date', 'Customer', 'Item', 'Metal', 'Weight (g)', 'Less / loss (g)', 'Cut %', 'Customer fine (g)', 'Rate', 'Amount',
        'From', 'Status'].concat(owner ? ['Our purity %', 'Our fine (g)'] : []),
      rows: rows_('OldGold').filter(function (g) { return inRange(g.date) && g.status !== 'void'; }).map(function (g) {
        return [g.date, g.customerName, g.item, g.metal, num_(g.weight), num_(g.lossG), num_(g.cutPct), num_(g.customerFine), num_(g.rate), num_(g.amount),
          g.source === 'sale' ? 'In a bill' : 'Bought', g.status].concat(owner ? [num_(g.ourPurityPct), num_(g.ourFine)] : []);
      })
    };
  } else if (m === 'orders') {
    out = {
      title: 'Orders', columns: ['Booked', 'Customer', 'Mobile', 'Item', 'Approx wt (g)', 'Final wt (g)', 'Rate', 'Making ₹/g', 'Price',
        'Paid', 'Balance', 'Delivery date', 'Status', 'Delivered on'],
      rows: rows_('Orders').filter(function (o) { return inRange(o.date); }).map(orderSummary_).map(function (o) {
        return [o.date, o.customerName, o.mobile, o.item, o.estWt, o.finalWt || '', o.rate || 'Not fixed', o.makingPerG,
          o.finalTotal || o.estTotal || '', o.paid, o.balance === null ? '' : o.balance, o.deliveryDate, o.status, o.deliveredAt || ''];
      })
    };
  } else if (m === 'repairs') {
    out = {
      title: 'Repairs', columns: ['Date', 'Customer', 'Mobile', 'Item', 'Work', 'Weight in', 'Weight out', 'Customer charge',
        'Karigar cost', 'Status', 'Given back on'],
      rows: rows_('Repairs').filter(function (r) { return inRange(r.date); }).map(repairOut_).map(function (r) {
        return [r.date, r.customerName, r.mobile, r.item, r.work, r.wtIn, r.wtOut || '', r.custCharge || r.estCustCharge,
          r.karigarCost || r.estKarigarCost, r.status, r.deliveredAt || ''];
      })
    };
  } else if (m === 'stock') {
    out = {
      title: 'Stock', columns: ['Tag', 'Item', 'Category', 'Metal', 'Purity %', 'Gross wt', 'Net wt', 'Pieces', 'Making ₹/g', 'Status', 'Added']
        .concat(owner ? ['Our cost ₹'] : []),
      rows: rows_('Items').filter(function (i) { return (d.status || 'in') === 'all' || i.status === (d.status || 'in'); }).map(function (i) {
        return [i.tag, i.name, i.category, i.metal, num_(i.purityPct), num_(i.grossWt), num_(i.netWt), num_(i.pieces), num_(i.makingPerG),
          i.status, String(i.addedAt).slice(0, 10)].concat(owner ? [num_(i.costTotal)] : []);
      })
    };
  } else if (m === 'dues') {
    var dl = duesList_({});
    out = {
      title: 'Baki', columns: ['Customer', 'Mobile', 'Village', 'Baki ₹', 'Since', 'Last entry'],
      rows: dl.list.map(function (r) { return [r.customerName, r.mobile, r.village || '', r.due, r.since, r.last]; })
    };
  } else if (m === 'cash') {
    out = {
      title: 'Cash book', columns: ['Date', 'In / out', 'Mode', 'Amount', 'What', 'Note', 'By'],
      rows: rows_('Cash').filter(function (c) { return inRange(c.date); }).map(function (c) {
        return [c.date, c.dir === 'in' ? 'In' : 'Out', c.mode === 'upi' ? 'UPI' : 'Cash', num_(c.amount), c.category, c.notes, c.by];
      })
    };
  } else if (m === 'parties') {
    out = {
      title: 'Wholesalers & karigars', columns: ['Type', 'Name', 'Mobile', 'Gold (fine g) +we owe / −they hold', 'Cash ₹ +we owe', 'Notes'],
      rows: partiesList_({}).map(function (p) { return [p.type === 'karigar' ? 'Karigar' : 'Wholesaler', p.name, p.mobile, p.goldG, p.cash, p.notes || '']; })
    };
  } else if (m === 'customers') {
    var due = {};
    rows_('Dues').forEach(function (x) { due[x.customerId] = (due[x.customerId] || 0) + num_(x.amount); });
    out = {
      title: 'Customers', columns: ['First name', 'Surname', 'Mobile', 'Village', 'Address', 'Baki ₹'],
      rows: rows_('Customers').map(function (c) { return [c.firstName, c.lastName, c.mobile, c.village, c.address, round2_(due[c.id] || 0)]; })
    };
  } else {
    throw new Error('Nothing to export for ' + m);
  }
  out.from = d.from || '';
  out.to = d.to || '';
  return out;
}
