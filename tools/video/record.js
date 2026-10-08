/**
 * Records the Hindi help videos: the real app (Hindi mode) on a phone frame, with "Munim ji"
 * explaining each step in a speech bubble.  node tools/video/record.js [name ...]
 * Output: web/videos/<name>.mp4 + .jpg poster.  Needs Playwright + Chromium + ffmpeg.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }

process.env.PORT = process.env.PORT || '8790';
const server = require('../../tests/dev-server');
const BASE = 'http://localhost:' + process.env.PORT;
const OUT = path.join(__dirname, '..', '..', 'web', 'videos');
const TMP = path.join(require('os').tmpdir(), 'dk-video');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const STAGE = fs.readFileSync(path.join(__dirname, 'stage.html'), 'utf8');

let token = '';
async function api(action, data = {}) {
  const r = await (await fetch(BASE + '/api', { method: 'POST', body: JSON.stringify({ action, token, data }) })).json();
  if (!r.ok) throw new Error(action + ': ' + r.error);
  return r.data;
}

async function seed() {
  token = (await api('auth.login', { username: 'viju', pin: '1234' })).token;
  await api('settings.save', { shop_name: 'श्री गणेश ज्वेलर्स', shop_mobile: '98xxxxxx10', shop_address: 'मेन बाज़ार' });
  await api('rates.save', { g24: 15300, g22: 14030, g18: 11475, silver: 190 });
  await api('cash.opening', { amount: 300000, date: '2026-01-01' });
  const c = await api('customers.save', { firstName: 'Ramesh', lastName: 'Patil', mobile: '9876500011', village: 'Wadgaon' });
  const s = await api('customers.save', { firstName: 'Sunita', lastName: 'More', mobile: '9876500022', village: 'Shirur' });
  await api('sale.create', { type: 'EST', customerId: s.id, lines: [{ name: 'Payal', metal: 'silver', weight: 60, rate: 190, makingPerG: 20 }], cash: 7600, udhaar: 5000 });
  await api('loans.create', { customerId: c.id, item: 'Kangan', grossWt: 20, netWt: 19.5, purityPct: 91.6, principal: 120000, ratePct: 1.5, date: '2026-05-02' });
  await api('stock.add', { items: [{ name: 'Mangalsutra', category: 'Mangalsutra', netWt: 12.5, purityPct: 91.6, costTotal: 170000 }] });
  return c;
}

/* ---------- one video ---------- */
async function record(browser, name, title, endText, fn) {
  const ctx = await browser.newContext({
    viewport: { width: 480, height: 960 }, deviceScaleFactor: 2, locale: 'en-IN', timezoneId: 'Asia/Kolkata',
    recordVideo: { dir: TMP, size: { width: 720, height: 1440 } }
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const cues = []; // when Munim ji starts each line: the phone reads these aloud in Hindi while the video plays
  // The stage is served from the app's own address so the app inside can use its storage.
  await page.route(BASE + '/__stage', (r) => r.fulfill({ contentType: 'text/html', body: STAGE }));
  await page.goto(BASE + '/__stage');
  await page.evaluate((t) => { document.getElementById('title').textContent = t; }, title);
  await page.evaluate((u) => { document.getElementById('app').src = u; }, BASE + '/');
  await page.waitForTimeout(800);
  let frame = page.frames().find((f) => f !== page.mainFrame());
  await frame.evaluate(([api, tok]) => {
    localStorage.clear();
    localStorage.setItem('dk_api', api);
    localStorage.setItem('dk_lang', 'hi');
    localStorage.setItem('dk_last_user', 'viju');
    if (tok) localStorage.setItem('dk_token', tok);
  }, [BASE + '/api', name === 'start' ? '' : token]);
  await page.evaluate((u) => { document.getElementById('app').src = u; }, BASE + '/?v=' + name + (name === 'start' ? '#/login' : '#/home'));
  await page.waitForTimeout(1500);
  const app = page.frameLocator('#app');

  const t = {
    page, app, frame,
    go: async (hash) => { frame = page.frames().find((f) => f !== page.mainFrame()); await frame.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(900); },
    say: async (text, extra = 0) => {
      cues.push({ t: Math.round((Date.now() - t0) / 100) / 10, text });
      await page.evaluate((s) => {
        document.getElementById('say').textContent = s;
        document.querySelector('.munim').classList.add('talking');
      }, text);
      const ms = Math.max(3200, text.length * 95) + extra;
      await page.waitForTimeout(Math.min(ms, 1800));
      await page.evaluate(() => document.querySelector('.munim').classList.remove('talking'));
      await page.waitForTimeout(Math.max(ms - 1800, 0));
    },
    tap: async (loc) => {
      await loc.scrollIntoViewIfNeeded();
      const b = await loc.boundingBox();
      if (b) {
        await page.evaluate(([x, y]) => {
          const d = document.createElement('div'); d.className = 'tap'; d.style.left = x + 'px'; d.style.top = y + 'px';
          document.body.appendChild(d); setTimeout(() => d.remove(), 800);
        }, [b.x + b.width / 2, b.y + b.height / 2]);
      }
      await page.waitForTimeout(450);
      await loc.click();
      await page.waitForTimeout(700);
    },
    type: async (loc, text) => {
      await t.tap(loc);
      await loc.fill('');
      await loc.pressSequentially(String(text), { delay: 80 });
      await page.waitForTimeout(400);
    },
    wait: (ms) => page.waitForTimeout(ms)
  };

  await page.waitForTimeout(1200);
  await fn(t);
  await page.evaluate((s) => {
    document.getElementById('endtext').textContent = s;
    document.getElementById('end').style.display = 'flex';
  }, endText);
  await page.waitForTimeout(2500);
  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  const mp4 = path.join(OUT, name + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '3', '-i', mp4, '-frames:v', '1', '-vf', 'scale=360:-1', '-q:v', '5',
    path.join(OUT, name + '.jpg')]);
  fs.unlinkSync(webm);
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(cues));
  console.log('  ✓ ' + name + ' (' + Math.round(fs.statSync(mp4).size / 1024) + ' KB)');
}

/* ---------- the videos ---------- */
const lbl = (app, re) => app.getByLabel(re).first();
const btn = (app, name) => app.getByRole('button', { name }).first();

const VIDEOS = {
  start: ['शुरुआत: लॉग इन, आज का भाव, मदद', 'अब आप शुरू कर सकते हैं!', async (t) => {
    const { app } = t;
    await t.go('#/login');
    await t.say('नमस्ते! मैं मुनीम जी। आज मैं आपको DukanKaApp चलाना सिखाऊँगा।');
    await t.say('मालिक ने WhatsApp पर जो लिंक भेजा, उसे खोलें। फिर अपना लॉगिन नाम और पिन डालें।');
    await t.type(lbl(app, 'पिन'), '1234');
    await t.tap(btn(app, 'लॉग इन'));
    await t.wait(1200);
    await t.say('यह होम स्क्रीन है। ऊपर खोज बॉक्स में ग्राहक का नाम, मोबाइल या गाँव लिखकर ढूँढें।');
    await t.say('हर सुबह सबसे पहले आज का भाव डालें। भाव वाली पट्टी दबाएँ।');
    await t.tap(app.locator('.rate-strip'));
    await t.say('24K भाव डालें। 22K और 18K अपने आप भर जाते हैं। ज़रूरत हो तो बदल दें।');
    await t.type(app.locator('input').first(), '15400');
    await t.tap(app.locator('.foot .btn, button.btn').last());
    await t.wait(1000);
    await t.say('बड़े बटन से काम चुनें: गिरवी, नई बिक्री, पुराना सोना, ऑर्डर, स्टॉक, रिपोर्ट।');
    await t.say('नीचे "बाकी (उधार)" और "मदद" भी है। EN / हिं से भाषा बदलती है।');
    await t.tap(app.locator('.pill', { hasText: 'मदद' }));
    await t.say('हर हिस्से की आसान गाइड यहाँ है। हर स्क्रीन पर ऊपर ? दबाकर भी मदद खुलती है।');
    await t.say('सेव करते समय "सेव हो रहा है… रुकिए" दिखे तो रुकिए, दोबारा मत दबाइए। एंट्री दो बार कभी सेव नहीं होगी।');
  }],

  sale: ['नई बिक्री: बिल, पुराना सोना, बाकी', 'बिल बन गया और WhatsApp पर चला गया!', async (t) => {
    const { app } = t;
    await t.go('#/home');
    await t.say('अब एक बिल बनाते हैं। "नई बिक्री" दबाएँ।');
    await t.tap(app.locator('.tile', { hasText: 'नई बिक्री' }));
    await t.say('ऊपर चुनें: GST बिल या बिना GST का एस्टिमेट। आज हम एस्टिमेट बनाते हैं।');
    await t.tap(btn(app, 'बिना GST (एस्टिमेट)'));
    await t.say('ग्राहक का नाम या मोबाइल लिखें और लिस्ट से चुनें।');
    await t.type(app.getByPlaceholder('मोबाइल या नाम लिखें'), 'Ramesh');
    await t.tap(app.locator('.pick-item', { hasText: 'Ramesh' }).first());
    await t.say('आइटम का नाम और वजन डालें। भाव और मेकिंग पहले से भरे हैं, चाहें तो बदल दें।');
    await t.type(lbl(app, 'आइटम नाम'), 'Ring');
    await t.type(app.locator('.card').filter({ has: app.getByLabel('वजन (g)') }).first().getByLabel('वजन (g)'), '4.2');
    await t.say('ग्राहक पुराना सोना दे रहा है? इसी बिल में जोड़ें।');
    await t.tap(btn(app, '+ पुराना सोना / चाँदी जोड़ें'));
    const old = app.locator('.gold-card').last();
    await t.type(old.getByLabel('वजन (g)'), '3');
    await t.say('ग्राहक की कटौती % डालें। उसकी कीमत बिल से घट जाती है। नीचे "हमारा प्योरिटी अंदाज़" सिर्फ दुकान के लिए है, बिल पर नहीं छपता।', 800);
    await t.say('ग्राहक अभी पूरा पैसा नहीं दे रहा? जितना बाकी है वह "बाकी" में डालें। कैश अपने आप कम हो जाएगा।');
    await t.type(app.getByLabel('बाकी', { exact: true }), '5000');
    await t.say('अब "बिल सेव करें" दबाएँ।');
    await t.tap(btn(app, 'बिल सेव करें'));
    await t.wait(1500);
    await t.say('बिल तैयार! "WhatsApp पर PDF भेजें" से ग्राहक को PDF भेजें, या थर्मल / A4 प्रिंटर से प्रिंट करें।');
    await t.say('ये 5000 रुपये अब "बाकी" लिस्ट में दिखेंगे, जब तक ग्राहक दे न दे।');
  }],

  girvi: ['गिरवी: लोन देना, ब्याज, छुड़ाना', 'गिरवी का पूरा हिसाब अपने आप!', async (t) => {
    const { app } = t;
    await t.go('#/loans');
    await t.say('गिरवी लोन में सबसे पुराने लोन पहले दिखते हैं। नया लोन देने के लिए नीचे बटन दबाएँ।');
    await t.tap(app.locator('.foot .btn'));
    await t.type(app.getByPlaceholder('मोबाइल या नाम लिखें'), 'Sunita');
    await t.tap(app.locator('.pick-item', { hasText: 'Sunita' }).first());
    await t.say('आइटम, कैरेट और वजन डालें।');
    await t.type(lbl(app, 'आइटम'), 'Gold chain');
    await t.type(lbl(app, 'कुल वजन (g)'), '10');
    await t.say('लोन राशि और ब्याज (₹ प्रति 100 प्रति महीना) डालें। सुनहरे बॉक्स में आज आइटम की कीमत और लोन % दिखता है।');
    await t.type(lbl(app, /लोन राशि/), '50000');
    await t.say('नीचे हर महीने और हर दिन का ब्याज दिखता है। "सेव करें और रसीद भेजें" दबाएँ।');
    await t.tap(app.locator('.foot .btn'));
    await t.wait(1500);
    await t.say('गिरवी सेव हो गई। यहाँ से रसीद WhatsApp पर भेजें या प्रिंट करें।');
    await t.say('ब्याज दिन के हिसाब से लगता है और महीने वार दिखता है। ग्राहक आए तो "सिर्फ ब्याज", "थोड़ा जमा" या "और लोन" दबाएँ।');
    await t.say('आइटम वापस देना हो तो नीचे "छुड़ाएँ और रसीद भेजें" दबाएँ। ग्राहक पूरा न दे पाए तो बची रकम बाकी में डाल सकते हैं।', 600);
  }],

  orders: ['ऑर्डर: बुकिंग, एडवांस, डिलीवरी', 'ऑर्डर का पूरा हिसाब तैयार!', async (t) => {
    const { app } = t;
    await t.go('#/orders');
    await t.say('ऑर्डर में बनवाने वाला आइटम बुक करते हैं। "+ ऑर्डर बुक करें" दबाएँ।');
    await t.tap(app.locator('.foot .btn'));
    await t.type(app.getByPlaceholder('मोबाइल या नाम लिखें'), 'Ramesh');
    await t.tap(app.locator('.pick-item', { hasText: 'Ramesh' }).first());
    await t.say('दो तरीके हैं: "भाव फिक्स" — आज के भाव पर कीमत तय। या "सिर्फ जमा" — भाव बाद में, जिस दिन बाकी पैसा दे।');
    await t.type(lbl(app, 'आइटम'), 'Necklace');
    await t.type(lbl(app, /अंदाज़ वजन|वजन \(g/), '10');
    await t.say('ग्राहक की मेकिंग और कारीगर की मज़दूरी अलग-अलग डालें। कारीगर वाली सिर्फ दुकान के लिए है।');
    await t.say('एडवांस डालें। नीचे दिखता है डिलीवरी पर कितना बाकी रहेगा।');
    await t.type(lbl(app, /एडवांस/), '50000');
    await t.tap(app.locator('.foot .btn'));
    await t.wait(1500);
    await t.say('ऑर्डर बुक हो गया, रसीद भेजें। आगे: "कारीगर को दें", फिर "आइटम तैयार", फिर "डिलीवर करें और बाकी लें"।');
    await t.say('डिलीवरी पर ग्राहक कम दे तो बची रकम अपने आप बाकी में जाती है। ज़्यादा दिया हो तो ऐप बताता है कितना लौटाना है।', 600);
  }],

  dues: ['बाकी (उधार): सबकी बाकी एक जगह', 'पूरा पैसा मिलते ही नाम हट जाता है!', async (t) => {
    const { app } = t;
    await t.go('#/home');
    await t.say('जिसका भी पैसा बाकी है — बिल, ऑर्डर, रिपेयर या गिरवी से — सब एक लिस्ट में आता है।');
    await t.tap(app.locator('.pill', { hasText: 'बाकी (उधार)' }));
    await t.say('ऊपर कुल बाकी दिखती है। ग्राहक के नाम पर दबाएँ, देखें बाकी कहाँ से आई।');
    await t.tap(app.locator('.due-row', { hasText: 'Sunita' }));
    await t.say('ग्राहक पैसा लाया? "पैसा मिला" दबाएँ। थोड़ा भी ले सकते हैं।');
    await t.tap(btn(app, 'पैसा मिला'));
    await t.type(app.locator('.modal .inp').first(), '2000');
    await t.tap(app.locator('.modal-actions .btn'));
    await t.wait(1200);
    await t.say('अभी 3000 बाकी है, इसलिए नाम लिस्ट में है। बाकी पैसा मिलने पर फिर "पैसा मिला" दबाएँ।');
    await t.tap(app.locator('.due-row', { hasText: 'Sunita' }));
    await t.tap(btn(app, 'पैसा मिला'));
    await t.tap(app.locator('.modal-actions .btn'));
    await t.wait(1200);
    await t.say('सुनीता जी का पूरा पैसा मिल गया, इसलिए उनका नाम लिस्ट से अपने आप हट गया। कैश बुक में भी अपने आप लिखा गया।');
  }],

  mistakes: ['गलती कैसे सुधारें', 'गलती सुधारना आसान, हिसाब हमेशा सही!', async (t) => {
    const { app } = t;
    await t.go('#/bills');
    await t.say('गलती हो गई? घबराइए मत। पुरानी एंट्री मिटती नहीं, मालिक उसे रद्द या सुधार सकता है।');
    await t.tap(app.locator('.row-card').first());
    await t.wait(800);
    await app.getByRole('button', { name: 'बिल रद्द करें' }).first().scrollIntoViewIfNeeded().catch(() => {});
    await t.say('गलत बिल: बिल खोलें और "बिल रद्द करें" दबाएँ। स्टॉक और कैश अपने आप वापस हो जाते हैं। फिर सही बिल बनाएँ।', 600);
    await t.go('#/loans');
    await t.tap(app.locator('.row-card').first());
    await app.locator('.card', { hasText: 'मालिक' }).last().scrollIntoViewIfNeeded();
    await t.wait(500);
    await t.say('गिरवी में नीचे "मालिक: गलती सुधारें" है — जानकारी बदलें, आखिरी जमा वापस लें, या गलती से बनी गिरवी रद्द करें।', 800);
    await t.go('#/cash');
    await t.say('कैश बुक में गलत खर्च "हटाएँ (गलत एंट्री)" से हटता है। ऑर्डर, रिपेयर और स्टॉक में "जानकारी बदलें" है।');
    await t.say('हर बदलाव Google Sheet के Audit टैब में लिखा जाता है — किसने और कब। इसलिए हिसाब हमेशा साफ़ रहता है।');
  }]
};

(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  await seed();
  for (const [name, [title, endText, fn]] of Object.entries(VIDEOS)) {
    if (only.length && !only.includes(name)) continue;
    await record(browser, name, title, endText, fn);
  }
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
