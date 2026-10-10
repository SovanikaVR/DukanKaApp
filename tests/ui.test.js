/**
 * Clicks through the main flows in a real (headless) Chrome against the local test server.
 *   node tests/ui.test.js      (needs Playwright + Chromium; set CHROME_PATH if not found)
 */
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const server = require('./dev-server');

const shots = path.join(__dirname, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const BASE = 'http://localhost:8787';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const shot = (n) => page.screenshot({ path: path.join(shots, n + '.png'), fullPage: true });
  const step = async (name, fn) => {
    try { await fn(); } catch (e) { await shot('FAIL'); console.log('ERRORS:', errors); throw e; }
    console.log('  ✓ ' + name);
  };
  const toastGone = () => page.waitForTimeout(300);

  await page.goto(BASE);
  await page.evaluate(() => localStorage.setItem('dk_api', location.origin + '/api'));
  await page.goto(BASE + '/#/login');

  await step('login', async () => {
    await page.getByLabel('Login name').fill('viju');
    await page.getByLabel('PIN').fill('1234');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.getByText('Set today\'s rate').waitFor();
    await shot('01-home-no-rate');
  });

  await step('set today\'s rate', async () => {
    await page.locator('.rate-strip').click();
    await page.getByLabel('24K (fine)').fill('15300');
    await page.getByLabel('22K').fill('14030');
    await page.getByLabel('Fine silver').fill('190');
    await page.getByRole('button', { name: 'Save today\'s rate' }).click();
    await page.locator('.rate-vals', { hasText: '22K ₹14,030' }).waitFor();
    await shot('02-home');
  });

  await step('estimate bill with old gold in the same bill', async () => {
    await page.goto(BASE + '/#/sale');
    await page.getByPlaceholder('Type mobile or name').fill('Ganesh Patil');
    await page.getByRole('button', { name: 'New customer' }).click();
    await page.locator('.pick-new').getByLabel('Mobile number').fill('9011077342');
    await page.locator('.pick-new').getByLabel('Village').fill('Wadgaon');
    await page.getByLabel('Item name').fill('Ring 22K');
    await page.getByRole('button', { name: 'Save name' }).click();
    await page.locator('.card').first().getByLabel('Net weight (g)').fill('4.2');
    await page.getByRole('button', { name: '+ Add old gold / silver' }).click();
    const old = page.locator('.gold-card').last();
    await old.getByRole('textbox', { name: 'Old item' }).fill('Old ear rings');
    await old.getByLabel('Weight (g)').fill('3');
    await old.getByLabel(/Customer cut/).fill('25');
    await page.locator('.foot .big', { hasText: '25,131' }).waitFor();
    await shot('03-sale');
    await page.getByRole('button', { name: 'Save bill' }).click();
    await page.getByText('EST/').first().waitFor();
    await page.locator('.paper').getByText('QUOTATION', { exact: true }).waitFor();
    await shot('04-bill');
  });

  await step('GSTIN in settings, then GST bill', async () => {
    await page.goto(BASE + '/#/settings');
    await page.getByLabel('GSTIN (15 characters)').fill('27ABCDE1234F1Z5');
    await page.getByLabel('Shop name', { exact: true }).fill('Shree Ganesh Jewellers');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await toastGone();
    await page.goto(BASE + '/#/sale');
    await page.getByRole('button', { name: 'GST bill' }).click();
    await page.getByPlaceholder('Type mobile or name').fill('ganesh');
    await page.locator('.pick-item', { hasText: 'Ganesh Patil' }).click();
    await page.getByLabel('Item name').fill('Ring 22K');
    await page.locator('.card').first().getByLabel('Net weight (g)').fill('4.2');
    await page.getByRole('button', { name: '+ Add old gold / silver' }).click();
    const old = page.locator('.gold-card').last();
    await old.getByLabel('Weight (g)').fill('3');
    await old.getByLabel(/Customer cut/).fill('25');
    await page.locator('.foot .big', { hasText: '26,918' }).waitFor();
    await page.getByRole('button', { name: 'Save bill' }).click();
    await page.locator('.paper').getByText('TAX INVOICE', { exact: true }).waitFor();
    await page.locator('.paper').getByText('GSTIN: 27ABCDE1234F1Z5').waitFor();
    await shot('05-gst-bill');
    await page.getByRole('button', { name: '58 mm', exact: true }).click();
    await page.locator('.paper').getByText('Net payable', { exact: true }).waitFor();
    await shot('06-thermal');
  });

  await step('girvi loan then release', async () => {
    await page.goto(BASE + '/#/loan-new');
    await page.getByPlaceholder('Type mobile or name').fill('Ramesh Patil');
    await page.getByRole('button', { name: 'New customer' }).click();
    await page.getByLabel('Item', { exact: true }).fill('Gold chain');
    await page.getByLabel('Gross weight (g)').fill('12.65');
    await page.getByLabel('Net weight (g)').fill('12.4');
    await page.getByLabel('Loan amount (₹)').fill('60000');
    await page.getByLabel('Date').fill('2026-06-14');
    await page.getByText('Interest ₹1,200 per month').waitFor();
    await shot('07-loan-new');
    await page.getByRole('button', { name: 'Save & send receipt' }).click();
    await page.getByText('Girvi saved').first().waitFor();
    await shot('08-loan-view');
  });

  await step('order (deposit only) and repair', async () => {
    await page.goto(BASE + '/#/order-new');
    await page.getByPlaceholder('Type mobile or name').fill('ramesh');
    await page.locator('.pick-item', { hasText: 'Ramesh Patil' }).click();
    await page.getByRole('button', { name: 'Only deposit' }).click();
    await page.getByLabel('Item', { exact: true }).fill('Necklace');
    await page.getByLabel('Weight (g, approx)').fill('20');
    await page.getByLabel('Amount deposited (₹)').fill('50000');
    await page.getByRole('button', { name: 'Save order & send receipt' }).click();
    await page.getByText('Order booked').first().waitFor();
    await shot('09-order');
  });

  await step('reports + other screens open without errors', async () => {
    for (const r of ['reports', 'reports?t=position', 'reports?t=month', 'loans', 'orders', 'repairs', 'repair-new', 'stock', 'stock-add', 'melt',
      'parties/wholesaler', 'parties/karigar', 'cash', 'bills', 'search', 'oldgold', 'dues', 'help', 'help/sale', 'home']) {
      await page.goto(BASE + '/#/' + r);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(250);
      const err = await page.locator('.error-box').count();
      if (err) throw new Error('Error box on ' + r + ': ' + await page.locator('.error-box').first().textContent());
    }
    await page.goto(BASE + '/#/melt');
    await page.waitForLoadState('networkidle');
    await shot('10-melt');
  });

  await step('double tap saves one bill; Back does not reopen the filled form', async () => {
    await page.goto(BASE + '/#/home');
    await page.goto(BASE + '/#/sale?cid=');
    await page.getByPlaceholder('Type mobile or name').fill('ramesh');
    await page.locator('.pick-item', { hasText: 'Ramesh Patil' }).click();
    await page.getByLabel('Item name').fill('Bichhiya');
    await page.locator('.card').first().getByLabel('Net weight (g)').fill('2');
    await page.getByLabel('Baki', { exact: true }).fill('5000');
    const before = await page.evaluate(async () => (await (await fetch('/api', { method: 'POST', body: JSON.stringify({ action: 'sale.list', token: localStorage.getItem('dk_token'), data: {} }) })).json()).data.length);
    const save = page.getByRole('button', { name: 'Save bill' });
    await save.dblclick();
    await page.locator('.paper').waitFor();
    const after = await page.evaluate(async () => (await (await fetch('/api', { method: 'POST', body: JSON.stringify({ action: 'sale.list', token: localStorage.getItem('dk_token'), data: {} }) })).json()).data.length);
    if (after !== before + 1) throw new Error('expected 1 new bill, got ' + (after - before));
    await page.goBack();
    await page.waitForTimeout(500);
    if (/#\/sale/.test(page.url())) throw new Error('Back returned to the sale form: ' + page.url());
  });

  await step('baki list: shows the customer, then pay back removes them', async () => {
    await page.goto(BASE + '/#/dues');
    await page.locator('.card', { hasText: 'Ramesh Patil' }).first().waitFor();
    await shot('12-dues');
    await page.locator('.due-row', { hasText: 'Ramesh Patil' }).click();
    await page.getByRole('button', { name: 'Payment received' }).click();
    // nothing typed: a stray Save must not clear the baki
    await page.locator('.modal').getByRole('button', { name: 'Save' }).click();
    await page.getByText('Type the amount the customer gave').waitFor();
    await page.locator('.due-row', { hasText: 'Ramesh Patil' }).waitFor();
    await page.getByRole('button', { name: 'Payment received' }).click();
    await page.locator('.modal').getByLabel(/Amount received/).fill('5000');
    await page.locator('.modal').getByRole('button', { name: 'Save' }).click();
    await page.locator('.modal').getByText('Baki will be fully cleared').waitFor();
    await page.locator('.modal').getByRole('button', { name: 'Yes, received' }).click();
    await page.getByText('Fully paid').waitFor();
    await page.getByText('Nobody owes anything').waitFor();
    // the owner can see who cleared it, and undo a wrong payment
    await page.getByRole('button', { name: 'Cleared (60 days)' }).click();
    await page.locator('.due-row', { hasText: 'Ramesh Patil' }).click();
    await page.getByText(/by viju/).first().waitFor();
    await page.getByRole('button', { name: 'Not paid? Undo this payment' }).click();
    await page.locator('.modal').getByRole('button', { name: 'Undo payment' }).click();
    await page.locator('.due-total', { hasText: '5,000' }).waitFor(); // baki is back in the Owing list
    await shot('12b-dues-undo');
    await page.locator('.due-row', { hasText: 'Ramesh Patil' }).click();
    await page.getByRole('button', { name: 'Payment received' }).click();
    await page.locator('.modal').getByLabel(/Amount received/).fill('5000');
    await page.locator('.modal').getByRole('button', { name: 'Save' }).click();
    await page.locator('.modal').getByRole('button', { name: 'Yes, received' }).click();
    await page.getByText('Nobody owes anything').waitFor();
  });

  await step('negative typed in a number box is ignored', async () => {
    await page.goto(BASE + '/#/order-new');
    const f = page.getByLabel('Advance paid (₹)');
    await f.fill('-500');
    if ((await f.inputValue()).includes('-')) throw new Error('minus sign accepted');
  });

  await step('owner tools on girvi + help pages + Hindi mode', async () => {
    await page.goto(BASE + '/#/loans');
    await page.locator('.row-card').first().click();
    await page.getByRole('button', { name: 'Edit details' }).waitFor();
    await page.goto(BASE + '/#/help');
    await page.getByText('Girvi (gold loan)').click();
    await page.getByText('How to do it').waitFor();
    await shot('13-help');
    await page.goto(BASE + '/#/home');
    await page.getByRole('button', { name: 'हिं' }).click();
    await page.locator('.tile', { hasText: 'नई बिक्री' }).waitFor();
    await shot('14-home-hindi');
    await page.goto(BASE + '/#/sale');
    await page.getByText('बिल सेव करें').waitFor();
    await shot('15-sale-hindi');
    await page.goto(BASE + '/#/home');
    await page.getByRole('button', { name: 'EN' }).click();
    await page.locator('.tile', { hasText: 'New Sale' }).waitFor();
    const hindi = await page.evaluate(() => {
      const txt = document.querySelector('#app').innerText.replace('हिं', '');
      return /[ऀ-ॿ]/.test(txt);
    });
    if (hindi) throw new Error('Hindi text visible in English mode');
  });

  await step('desktop layout shows side menu', async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + '/#/reports?t=position');
    await page.locator('.side').waitFor();
    await page.waitForLoadState('networkidle');
    await shot('11-desktop-reports');
  });

  await browser.close();
  server.close();
  if (errors.length) { console.error('Page errors:\n' + errors.join('\n')); process.exit(1); }
  console.log('UI flows passed');
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
