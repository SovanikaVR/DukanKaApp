/**
 * DukanKaApp — backend for small jewellery shops.
 * Runs as a Google Apps Script web app bound to the shop owner's own Google Sheet.
 * All data stays in the owner's Google Drive. No paid services are used.
 *
 * This file is generated into dist/Code.gs by tools/build-gs.js — edit the files in
 * apps-script/src/, not dist/Code.gs.
 */

var APP_VERSION = '1.2.0';

/** Sheet (tab) name -> column headers. The first column is always the row id. */
var SCHEMA = {
  Settings: ['key', 'value'],
  Users: ['id', 'name', 'username', 'role', 'salt', 'pinHash', 'active', 'createdAt'],
  Rates: ['id', 'date', 'g24', 'g22', 'g18', 'silver', 'by', 'at'],
  Customers: ['id', 'firstName', 'lastName', 'mobile', 'village', 'address', 'notes', 'createdAt', 'by'],
  Items: ['id', 'tag', 'name', 'category', 'metal', 'purityPct', 'grossWt', 'netWt', 'pieces',
    'makingPerG', 'costTotal', 'status', 'source', 'sourceId', 'soldBillId', 'addedAt', 'by'],
  Sales: ['id', 'billNo', 'type', 'fy', 'date', 'customerId', 'customerName', 'mobile', 'village',
    'lines', 'oldGold', 'gstPct', 'subtotal', 'tax', 'roundOff', 'invoiceTotal', 'oldValue', 'net',
    'cash', 'upi', 'udhaar', 'costTotal', 'status', 'by', 'at'],
  OldGold: ['id', 'date', 'customerId', 'customerName', 'source', 'billId', 'item', 'metal', 'weight',
    'cutPct', 'customerFine', 'rate', 'amount', 'ourPurityPct', 'ourFine', 'status', 'meltId', 'by', 'at'],
  Loans: ['id', 'date', 'customerId', 'customerName', 'mobile', 'item', 'metal', 'purityPct',
    'grossWt', 'netWt', 'principal', 'ratePct', 'formula', 'minDays', 'status', 'closedAt',
    'notes', 'by', 'at', 'mode'],
  LoanTxns: ['id', 'loanId', 'date', 'type', 'amount', 'interestPart', 'principalPart', 'mode', 'by', 'at', 'status'],
  Orders: ['id', 'date', 'customerId', 'customerName', 'mobile', 'item', 'metal', 'purityPct',
    'estWt', 'makingPerG', 'karigarPerG', 'method', 'rate', 'fixedTotal', 'deliveryDate', 'status',
    'karigarId', 'finalWt', 'finalTotal', 'deliveredAt', 'notes', 'by', 'at'],
  OrderPayments: ['id', 'orderId', 'date', 'amount', 'mode', 'by', 'at'],
  Repairs: ['id', 'date', 'customerId', 'customerName', 'mobile', 'item', 'work', 'wtIn', 'karigarId',
    'karigarRateType', 'karigarRate', 'custRateType', 'custRate', 'deliveryDate', 'status', 'wtOut',
    'karigarCost', 'custCharge', 'returnedAt', 'deliveredAt', 'notes', 'by', 'at'],
  Melts: ['id', 'date', 'oldGoldIds', 'totalWt', 'ourFine', 'paidFine', 'paidAmount', 'barWt',
    'purityPct', 'actualFine', 'cost', 'notes', 'by', 'at'],
  FineLedger: ['id', 'date', 'type', 'grams', 'value', 'refType', 'refId', 'notes', 'by', 'at'],
  Parties: ['id', 'type', 'name', 'mobile', 'notes', 'active', 'createdAt'],
  PartyLedger: ['id', 'partyId', 'date', 'type', 'goldG', 'cash', 'rate', 'refType', 'refId', 'notes', 'by', 'at'],
  Cash: ['id', 'date', 'dir', 'mode', 'amount', 'category', 'refType', 'refId', 'notes', 'by', 'at', 'status'],
  Dues: ['id', 'date', 'customerId', 'customerName', 'mobile', 'amount', 'refType', 'refId', 'notes', 'by', 'at'],
  Audit: ['at', 'user', 'action', 'ref', 'details']
};

/** Default settings written by setup(). Everything here can be changed in the app's Settings. */
var DEFAULT_SETTINGS = {
  shop_name: '[SHOP NAME] Jewellers',
  shop_address: '',
  shop_mobile: '',
  shop_gstin: '',
  shop_state: '',
  gst_enabled: 'true',
  gst_default_pct: '3',
  hsn_code: '7113',
  bill_terms: '',
  making_default_per_g: '150',
  standard_cut_pct: '20',
  standard_purity_pct: '80',
  interest_default_rate: '2',
  interest_min_days: '0',
  purity_24k: '99.9',
  purity_22k: '91.6',
  purity_18k: '75',
  cash_opening: '0',
  cash_opening_date: '',
  report_email: '',
  modules: JSON.stringify({
    girvi: true, sale: true, oldgold: true, orders: true, repair: true, stock: true,
    melt: true, wholesaler: true, karigar: true, cash: true, reports: true
  }),
  formula_interest: 'Principal * Rate / 100 * Days / 30',
  formula_old_fine: 'Weight * (100 - Cut) / 100',
  formula_our_fine: 'Weight * Purity / 100',
  formula_sale_line: 'Weight * Rate + Weight * Making',
  formula_order_total: 'Weight * Rate + Weight * Making',
  formula_repair_charge: 'Weight * RatePerG'
};

/** Actions only the owner may call. */
var OWNER_ONLY = {
  'settings.save': 1, 'users.list': 1, 'users.save': 1, 'sale.void': 1, 'cash.opening': 1,
  'admin.archive': 1, 'admin.backupNow': 1, 'loans.edit': 1, 'loans.void': 1,
  'loans.undoLast': 1, 'orders.edit': 1, 'repairs.edit': 1, 'cash.void': 1, 'stock.update': 1, 'dues.adjust': 1
};
