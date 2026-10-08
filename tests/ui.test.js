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
  const step = async (name, fn) => { await fn(); console.log('  ✓ ' + name); };
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
    await page.locator('.card').first().getByLabel('Weight (g)').fill('4.2');
    await page.getByRole('button', { name: '+ Add old gold / silver' }).click();
    const old = page.locator('.gold-card').last();
    await old.getByRole('textbox', { name: 'Old item' }).fill('Old ear rings');
    await old.getByLabel('Weight (g)').fill('3');
    await old.getByLabel(/Customer cut/).fill('25');
    await page.locator('.foot .big', { hasText: '25,131' }).waitFor();
    await shot('03-sale');
    await page.getByRole('button', { name: 'Save bill' }).click();
    await page.getByText('EST/').first().waitFor();
    await page.locator('.paper').getByText('ESTIMATE', { exact: true }).waitFor();
    await shot('04-bill');
  });

  await step('GSTIN in settings, then GST bill', async () => {
    await page.goto(BASE + '/#/settings');
    await page.getByLabel('GSTIN (15 characters)').fill('27ABCDE1234F1Z5');
    await page.getByLabel('Shop name').fill('Shree Ganesh Jewellers');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await toastGone();
    await page.goto(BASE + '/#/sale');
    await page.getByRole('button', { name: 'GST bill' }).click();
    await page.getByPlaceholder('Type mobile or name').fill('ganesh');
    await page.locator('.pick-item', { hasText: 'Ganesh Patil' }).click();
    await page.getByLabel('Item name').fill('Ring 22K');
    await page.locator('.card').first().getByLabel('Weight (g)').fill('4.2');
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
    await page.locator('.paper').getByText('NET PAYABLE', { exact: true }).waitFor();
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
    await page.getByText('Girvi saved').waitFor();
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
      'parties/wholesaler', 'parties/karigar', 'cash', 'bills', 'search', 'oldgold', 'home']) {
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
