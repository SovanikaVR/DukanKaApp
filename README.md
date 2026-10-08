# DukanKaApp

DukanKaApp is a free register for small jewellery shops. It runs on the phone as an installable web app and on the computer as a web dashboard.

All data lives in the shop owner's **own Google Sheet**. There are no servers to run and no monthly fee.

**Setting up a shop:** see **[docs/SETUP.md](docs/SETUP.md)**.

## What it does (version 1)

| Module | What it covers |
| --- | --- |
| Customers | <ul><li>One profile per customer, with all their girvi, orders, repairs, bills and old gold</li><li>Search by name, then surname, then mobile, then village</li></ul> |
| Today's rate | <ul><li>24K / 22K / 18K / silver per gram</li><li>22K and 18K fill in from 24K</li><li>"Same as yesterday" button</li></ul> |
| Sale | <ul><li>**GST bill or Non-GST estimate**</li><li>Item name, karat, purity, weight, rate, making and GST % are all editable</li><li>Old gold or silver taken **inside the same bill**: the customer cut % is printed, and our own purity estimate is kept for the shop only</li><li>Cash, UPI and udhaar</li></ul> |
| Bills | <ul><li>A4 tax invoice or estimate, plus 58 / 80 mm thermal receipt</li><li>Share the PDF on WhatsApp, open the customer's chat, print, download</li><li>Search bills, including archived years</li></ul> |
| Girvi | <ul><li>Day-wise interest, shown month by month</li><li>Interest-only payment, part payment, top-up, release</li><li>Item value today and loan %</li><li>Receipts</li></ul> |
| Orders | <ul><li>Rate fixed at booking, or only a deposit with the rate set on the day the balance is paid</li><li>Customer making vs karigar labour</li><li>Give to karigar, mark ready, deliver</li></ul> |
| Repair / polish | <ul><li>Karigar cost vs customer charge (per gram or fixed) gives the repair profit</li><li>Weight in and weight out</li></ul> |
| Buy old gold | <ul><li>Same customer cut / shop purity split as in Sale</li></ul> |
| Melting & fine gold | <ul><li>Our estimate vs tested purity vs what we paid gives the real gain</li><li>Fine gold stock</li></ul> |
| Wholesaler | <ul><li>Fine gold and cash dues</li><li>Bought goods, give fine gold, rate cut (pay in cash), pay dues</li></ul> |
| Karigar | <ul><li>Gold with karigar, labour due, jobs</li></ul> |
| Stock | <ul><li>Pieces or lots by category, value today</li><li>Remove from stock</li><li>Sold items leave stock automatically</li></ul> |
| Cash book | <ul><li>Every money movement recorded automatically</li><li>Expenses, opening cash, what should be in the drawer</li></ul> |
| Reports | <ul><li>Today, month and "where things stand"</li><li>Nightly email with a PDF</li><li>Desktop dashboard with a side menu</li></ul> |
| Settings | <ul><li>Shop details and GSTIN</li><li>Standard values</li><li>**Modules on/off**</li><li>**Admin-editable formulas** with a test box</li><li>Users with owner / employee / view-only roles and PIN login</li></ul> |

Old entries always keep the formula and rates they were made with.

## How it is built

```
web/            the app (plain HTML/CSS/JS modules, no build step) — hosted free on GitHub Pages
  js/screens/   one file per screen
  js/bill.js    invoice / receipt layouts, print, PDF, WhatsApp
apps-script/    backend source (Google Apps Script, runs in the owner's Google account)
shared/calc.js  formula engine + girvi interest, used by BOTH the app and the backend
dist/           generated: Code.gs + appsscript.json to paste into Apps Script
tests/          backend tests on an in-memory sheet, browser click-through test
tools/build.js  builds dist/ and copies calc.js into the app
```

**Backend**
- The Apps Script web app answers `POST {action, token, data}`.
- PIN logins create 30-day sessions.
- Writes go through a lock, so 2–4 people can work at the same time.
- Every sheet cell is plain text, so Sheets never changes dates or numbers.

**Data**
- One spreadsheet per shop, with these tabs: Settings, Users, Rates, Customers, Items, Sales, OldGold, Loans, LoanTxns, Orders, OrderPayments, Repairs, Melts, FineLedger, Parties, PartyLedger, Cash, Audit.
- Bills store data, not PDFs. Any PDF can be made again exactly.
- Finished financial years can be moved to their own file.

## Developing

```bash
npm test                 # build + formula tests + full backend scenario on a fake Google Sheet
node tests/dev-server.js # app + backend locally at http://localhost:8787 (owner: viju / 1234)
node tests/ui.test.js    # click through the main flows in headless Chrome (Playwright)
```

Edit `shared/calc.js` or `apps-script/src/*`, then run `npm run build` and commit `dist/` as well.
