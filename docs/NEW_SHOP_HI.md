# नई दुकान — अपना ऐप खुद बनाएं

DukanKaApp मुफ़्त है। आपकी दुकान का सारा हिसाब **आपकी अपनी Google Sheet** में रहता है — किसी और के पास नहीं।

दो रास्ते हैं। **रास्ता 1 सबसे आसान है** — फ़ोन पर भी हो जाता है।

---

# रास्ता 1 — एक लिंक से (5 मिनट, फ़ोन या कंप्यूटर)

**आपको चाहिए:**
- एक Gmail खाता (दुकान के मालिक का)
- डेवलपर से मिला **एक लिंक** (ऐसा दिखता है: `https://script.google.com/macros/s/…/exec`)
- दुकान वाला फ़ोन (QR स्कैन करने के लिए)

छोटे में: **लिंक खोलें → Gmail चुनें → Allow → फ़ॉर्म भरें → (सिर्फ़ अगर कहे) Apps Script API चालू करें → "अपने दुकान ऐप को अनुमति दें" → Allow → QR स्कैन करें। बस।**

## 1. लिंक खोलें और Gmail चुनें

1. डेवलपर का लिंक **Chrome** में खोलें।
2. Gmail में लॉगिन नहीं हैं तो Google **"Sign in"** पेज दिखाएगा → अपना Gmail और पासवर्ड डालें।
   कई खाते हों तो **"Choose an account"** में **दुकान वाला** Gmail चुनें।

## 2. पहली अनुमति (Installer के लिए)

ये स्क्रीन एक-एक करके आएंगी:

1. **"Authorization needed"** / *"… needs your permission"* → **Review permissions** दबाएं → अपना Gmail चुनें।
2. **"Google hasn't verified this app"** — डरें नहीं। यह इसलिए आता है क्योंकि यह छोटा मुफ़्त ऐप है, किसी बड़ी कंपनी का नहीं।
   - नीचे बाईं ओर छोटा सा **Advanced** दबाएं।
   - फिर सबसे नीचे **"Go to DukanKaApp Installer (unsafe)"** दबाएं।
3. अनुमतियों की लिस्ट आएगी (Sheets बनाना, Apps Script प्रोजेक्ट बनाना, आपका ईमेल पता…)।
   - अगर हर लाइन के आगे खाली डिब्बा (checkbox) हो तो ऊपर **"Select all"** पर टिक करें।
   - नीचे जाकर **Allow** (या **Continue**) दबाएं।

> यह Installer आपके ही Google खाते में चलता है। यह आपकी Drive में **सिर्फ़ एक नई शीट** बनाता है — आपकी बाकी फ़ाइलें नहीं खोलता।

## 3. फ़ॉर्म भरें

पेज पर नीले-सुनहरे रंग में **"अपनी दुकान बनाएं / Create your shop"** फ़ॉर्म आएगा:

| खाना | उदाहरण |
| --- | --- |
| दुकान का नाम | Shree Ganesh Jewellers |
| आपका नाम | Vijay |
| मोबाइल | 98XXXXXXXX |
| शहर / गाँव (ज़रूरी नहीं) | Pune |
| लॉगिन नाम (अंग्रेज़ी में, बिना space) | viju |
| PIN (4 से 8 अंक) — दो बार | •••• |

फिर बड़ा सुनहरा बटन **"दुकान बनाएं / Create my shop"** दबाएं।
- घूमता गोला और **"दुकान बन रही है…"** आएगा। **1–2 मिनट** रुकें, पेज बंद न करें।
- PIN याद रखें। ऐप में इसी से लॉगिन होगा। (PIN कहीं लिखा नहीं जाता, डेवलपर को भी नहीं दिखता।)

## 4. (सिर्फ़ अगर कहे) "बस एक बटन चालू करना है"

कुछ Gmail खातों में एक सेटिंग बंद होती है। तब पेज पर यह आएगा:

1. नीला बटन **"सेटिंग खोलें / Open settings"** दबाएं। नया टैब खुलेगा (`script.google.com/home/usersettings`)।
2. वहाँ **"Google Apps Script API"** के सामने वाला बटन दबाकर **On** करें।
3. पिछले टैब पर लौटें → **"फिर से कोशिश करें / Try again"** दबाएं।
   - फ़ॉर्म दोबारा नहीं भरना पड़ता, और दूसरी शीट नहीं बनती — जहाँ रुका था वहीं से आगे बढ़ता है।
   - फिर भी न हो तो 1–2 मिनट रुककर दोबारा दबाएं।

## 5. "अपने दुकान ऐप को अनुमति दें" (एक बार)

पेज पर **"✅ … बन गई!"** आएगा। अब आख़िरी कदम:

1. बड़ा सुनहरा बटन **"अपने दुकान ऐप को अनुमति दें / Allow your shop app (one time)"** दबाएं। नया टैब खुलेगा।
2. वही स्क्रीन फिर से आएंगी, पर इस बार **आपके अपने दुकान ऐप** के लिए:
   - **Review permissions** → अपना Gmail चुनें
   - **"Google hasn't verified this app"** → **Advanced** → **"Go to Shree Ganesh Jewellers — DukanKaApp (unsafe)"** (आपकी दुकान का नाम)
   - **Select all** (अगर दिखे) → **Allow**
3. 10–20 सेकंड में पेज खुलेगा: **"✅ आपकी दुकान तैयार है!"** — ऐप खोलने का बटन, **QR कोड**, **WhatsApp पर भेजें** और आपका **लॉगिन नाम**।
   - यही लिंक आपके Gmail पर भी आ जाता है (बाद के लिए संभालकर रखें)।

> यह दूसरी अनुमति क्यों? आपकी दुकान का ऐप आपकी शीट के साथ आपके खाते में चलता है। वह शीट में हिसाब लिखता है (Sheets), रोज़ रात बैकअप बनाता है (Drive), रिपोर्ट ईमेल करता है (Mail) और खुद को अपडेट करता है (Apps Script)। Google हर नए ऐप के लिए मालिक से एक बार पूछता है।

**अगर Allow वाला पेज न आए** और *"Authorization is required"* या कोई error दिखे: Installer पेज पर नीचे **"आपकी Google Sheet"** लिंक खोलें → कंप्यूटर पर 20 सेकंड रुकें (फ़ोन पर Chrome में ⋮ → **Desktop site**) → मेनू **Dukan App → Show my app link** → Allow → फिर Installer पेज पर **"अपने दुकान ऐप को अनुमति दें"** एक बार और दबाएं।

## 6. QR स्कैन करें — हो गया ✅

नीचे **"दोनों रास्तों के बाद"** वाले **कदम 7** (दुकान के फ़ोन पर ऐप लगाएं) और **कदम 8** (कर्मचारी जोड़ें) करें। QR फ़ोन की स्क्रीन पर हो तो "ऐप खोलें" बटन दबाएं या लिंक WhatsApp पर भेजकर दुकान वाले फ़ोन पर खोलें।

बाद में दूसरी दुकान बनानी हो तो Installer पेज पर **"एक और दुकान बनाएं"** दबाएं।

---

# रास्ता 2 — टेम्पलेट शीट की कॉपी से (10 मिनट, कंप्यूटर)

रास्ता 1 न चले (जैसे किसी कंपनी/स्कूल वाले Google खाते में) तो यह करें।

**आपको चाहिए:**
- एक Gmail खाता (दुकान के मालिक का)
- यह काम **एक बार कंप्यूटर/लैपटॉप पर** करें
  - कंप्यूटर न हो तो फ़ोन के **Chrome** में **⋮ → "Desktop site"** पर टिक लगाकर करें
  - Google Sheets का फ़ोन वाला ऐप "Dukan App" मेनू नहीं दिखाता
- दुकान वाला फ़ोन (QR स्कैन करने के लिए)
- डेवलपर से मिला **"कॉपी लिंक"** (आख़िर में `/copy` होता है)

---

## कदम 1 — शीट की कॉपी बनाएं

1. कॉपी लिंक खोलें। अपने Gmail से लॉगिन हों।
2. स्क्रीन पर लिखा आएगा: **"Copy document?"** / **"Make a copy"**।
   - नीचे छोटा सा लिख सकता है: *"The attached Apps Script file will also be copied"* — यह ठीक है, ऐप इसी में है।
3. नीला बटन **Make a copy** दबाएं।
4. आपकी अपनी शीट खुलेगी। उसमें **START** नाम का पन्ना होगा, जिस पर यही कदम लिखे हैं।

## कदम 2 — "Dukan App" मेनू खोलें

1. 10–20 सेकंड रुकें। ऊपर मेनू में (Help के पास) **Dukan App** आएगा।
   - न दिखे तो पेज **रीलोड** करें।
   - नीचे दाएं कोने में एक छोटा संदेश भी आ सकता है: *"Menu Dukan App → ▶ Start here"*।
2. **Dukan App → ▶ Start here / सुरू करा** दबाएं।

## कदम 3 — Google की अनुमति (सिर्फ़ एक बार)

आपको ये स्क्रीन एक-एक करके दिखेंगी:

1. **"Authorization required"** → **Continue** (या **Review permissions**) दबाएं।
2. **"Choose an account"** → अपना Gmail चुनें।
3. **"Google hasn't verified this app"** — डरें नहीं।
   - यह इसलिए आता है क्योंकि ऐप आपकी अपनी शीट में चलता है, किसी कंपनी का नहीं।
   - नीचे बाईं ओर छोटा सा **Advanced** दबाएं।
   - फिर सबसे नीचे **"Go to DukanKaApp (unsafe)"** (या "Go to Untitled project (unsafe)") दबाएं।
4. अगली स्क्रीन पर लिस्ट आएगी (Sheets, Drive, ईमेल भेजना, आदि) → नीचे जाकर **Allow** दबाएं।
5. अगर इसके बाद कुछ न खुले, तो **Dukan App → ▶ Start here** एक बार **फिर** दबाएं।

> ये अनुमतियाँ क्यों? शीट में हिसाब लिखने (Sheets), रोज़ रात बैकअप बनाने (Drive), रिपोर्ट ईमेल करने (Mail) और ऐप को अपने-आप चालू/अपडेट करने (Apps Script) के लिए। आपका डेटा आपके Google खाते से बाहर नहीं जाता।

## कदम 4 — फ़ॉर्म भरें

दाईं ओर एक पट्टी (sidebar) खुलेगी: **"अपनी दुकान बनाएं"**। भरें:

| खाना | उदाहरण |
| --- | --- |
| दुकान का नाम | Shree Ganesh Jewellers |
| आपका नाम | Vijay |
| मोबाइल | 98XXXXXXXX |
| लॉगिन नाम (अंग्रेज़ी में, बिना space) | viju |
| PIN (4 से 8 अंक) — दो बार | •••• |

फिर बड़ा बटन **"दुकान बनाएं / Create my shop"** दबाएं।
- "बन रहा है…" लिखा आएगा। **1 मिनट** तक रुकें, पट्टी बंद न करें।
- PIN याद रखें। ऐप में इसी से लॉगिन होगा।

## कदम 5 — अगर "बस एक बटन चालू करना है" लिखा आए

कुछ Gmail खातों में एक सेटिंग बंद होती है। पट्टी में बताया जाएगा:

1. नीला बटन **"Settings खोलें"** दबाएं। नया टैब खुलेगा (script.google.com/home/usersettings)।
2. वहाँ **"Google Apps Script API"** के सामने वाला बटन **On** करें।
3. शीट वाले टैब पर वापस आएं → **"फिर से कोशिश करें / Try again"** दबाएं।
   - फिर भी न हो तो 1–2 मिनट रुककर दोबारा दबाएं।

अगर पट्टी **"आख़िरी कदम हाथ से"** दिखाए, तो उसमें लिखे 6 कदम करें (Deploy → New deployment → Web app → Execute as: **Me** → Who has access: **Anyone** → Deploy → लिंक कॉपी करके पट्टी में चिपकाएं → सेव करें)। या डेवलपर को फ़ोन करें।

## कदम 6 — ऐप तैयार! ✅

पट्टी में दिखेगा **"आपका ऐप तैयार है!"** और:
- **"इस फ़ोन/कंप्यूटर पर खोलें"** — ऐप सीधे खुल जाएगा
- **QR कोड**
- **"WhatsApp पर भेजें"** — लिंक अपने या कर्मचारी के WhatsApp पर भेजें
- **"मुझे ईमेल करें"** — लिंक आपके Gmail पर आ जाएगा (बाद के लिए संभालकर रखें)
- आपका **लॉगिन नाम** याद दिलाने के लिए

बाद में लिंक फिर चाहिए हो तो: शीट में **Dukan App → Show my app link / ऐप लिंक**।

---

# दोनों रास्तों के बाद / After either path

## कदम 7 — दुकान के फ़ोन पर ऐप लगाएं

1. दुकान के फ़ोन का **कैमरा** या **Google Lens** खोलें और कंप्यूटर स्क्रीन पर दिख रहे **QR कोड** पर रखें।
2. जो लिंक दिखे उसे दबाएं — ऐप **Chrome** में खुलेगा। (दूसरे ब्राउज़र में खुले तो लिंक कॉपी करके Chrome में खोलें।)
3. Chrome में ऊपर दाएं **⋮** → **Add to Home screen** (या **Install app**) → **Add**।
4. होम स्क्रीन पर DukanKaApp का आइकन आ जाएगा। उसे खोलें।
5. **लॉगिन नाम** और **PIN** डालें। बस!

## कदम 8 — कर्मचारी जोड़ें

1. ऐप में **Settings → Users** खोलें (सिर्फ़ मालिक को दिखता है)।
2. कर्मचारी का नाम, लॉगिन नाम और PIN डालें। Role चुनें:
   - **Employee** — रोज़ का काम (बिल, गिरवी, आदि)
   - **View only** — सिर्फ़ देख सकता है (पार्टनर या CA के लिए)
3. कर्मचारी को **वही ऐप लिंक** WhatsApp पर भेजें (कदम 6 वाला बटन)। वह कदम 7 करे और अपने लॉगिन नाम/PIN से लॉगिन करे।
4. कोई काम छोड़ दे तो **Settings → Users** में उसे बंद (off) करें — उसका फ़ोन तुरंत लॉग-आउट हो जाएगा।

## पहले दिन ऐप में

1. **Settings → Shop details** — पता, फ़ोन, GSTIN (GST बिल बनाते हों तो)।
2. **Settings → Standard values** — कट %, मजूरी ₹/ग्राम, गिरवी ब्याज।
3. **Cash book → Set opening cash** — आज गल्ले में कितना कैश है।
4. हर सुबह होम स्क्रीन पर **आज का भाव** डालें।

## अपने-आप होने वाले काम

- **हर रात 9:30 बजे** पूरी शीट का बैकअप आपके Google Drive के *DukanKaApp Backups* फ़ोल्डर में (आख़िरी 30 रखे जाते हैं) और दिन की रिपोर्ट आपके ईमेल पर।
- **अपडेट अपने-आप:** नया वर्ज़न आने पर रात में खुद लग जाता है। ऐप का लिंक **नहीं बदलता**।
  - कभी ईमेल आए *"DukanKaApp: नया अपडेट"* — तो शीट खोलें → **Dukan App → Update now** → Allow → फिर **Update now**।
  - अपडेट बंद/चालू: **Dukan App → Auto-update on / off**।

## कुछ गड़बड़ हो तो

| दिक्कत | क्या करें |
| --- | --- |
| "Dukan App" मेनू नहीं दिखता | पेज रीलोड करें, 20 सेकंड रुकें। फ़ोन पर हों तो Chrome में "Desktop site" चालू करें। |
| Start here दबाया, कुछ नहीं हुआ | अनुमति के बाद एक बार फिर दबाएं। |
| मालिक का PIN भूल गए | शीट में **Dukan App → Reset an owner PIN**। |
| ऐप का लिंक खो गया | **Dukan App → Show my app link**, या "मुझे ईमेल करें" वाला ईमेल देखें। |
| 5 बार गलत PIN | 10 मिनट रुकें, फिर कोशिश करें। |

**ध्यान दें:** ऐप का लिंक सिर्फ़ अपनी दुकान के लोगों को दें। शीट को किसी के साथ "Share" न करें।

---

### English summary (for the shop owner)

**Path 1 — one link (phone or computer):**
1. Open the installer link from the developer → sign in with the shop's Gmail.
2. *Authorization needed* → **Review permissions** → pick your Gmail → *"Google hasn't verified this app"* → **Advanced → Go to DukanKaApp Installer (unsafe)** → tick **Select all** if shown → **Allow**.
3. Fill in shop name, your name, mobile, city (optional), login name and a 4–8 digit PIN twice → **Create my shop**. Wait 1–2 minutes.
4. Only if asked: open the settings link, switch **Google Apps Script API** On, come back, **Try again** (nothing is created twice).
5. Tap **Allow your shop app (one time)** → the same permission screens for *"<Shop> — DukanKaApp"* → **Allow**.
6. The *"Your shop is ready"* page shows the app link, QR, WhatsApp button and your login name (also emailed). Scan the QR with the shop phone → **Chrome → ⋮ → Add to Home screen** → log in.

**Path 2 — copy the template sheet (computer):**

1. Open the copy link from the developer → **Make a copy** (do this once on a computer, or in phone Chrome with "Desktop site" ticked).
2. In your copy, menu **Dukan App → ▶ Start here**.
3. Google asks permission: Continue → pick your Gmail → *"Google hasn't verified this app"* → **Advanced → Go to … (unsafe) → Allow**. Click **Start here** again if nothing opens.
4. Fill in shop name, your name, mobile, login name and a 4–8 digit PIN (twice) → **Create my shop**. Wait up to a minute.
5. If it asks you to switch on the **Google Apps Script API**: open the link, turn it **On**, come back, **Try again**.
6. The panel shows your app link, a QR code, WhatsApp and email buttons. Scan the QR with the shop phone, open in **Chrome → ⋮ → Add to Home screen**, log in.
7. Add staff in the app: **Settings → Users**, then send them the same link.
8. Backup + report every night at 9:30 pm; updates install themselves (the link never changes). **Dukan App → Show my app link** shows the link again.

---

## डेवलपर के लिए — टेम्पलेट शीट (सिर्फ़ एक बार) / For the developer: the template sheet (once)

Every shop copies **one template sheet**. Make it once, with **your own** Google account:

1. Open **https://sheets.new**. Name it e.g. *DukanKaApp — new shop*.
2. **Extensions → Apps Script.**
   - Rename the project (top left) to **DukanKaApp** — owners then see "Go to DukanKaApp (unsafe)" on the permission screen.
   - Delete everything in `Code.gs` and paste all of [`dist/Code.gs`](../dist/Code.gs) (GitHub → Raw → copy all).
   - ⚙️ **Project Settings** → tick **Show "appsscript.json" manifest file**. Open `appsscript.json` and replace it with [`dist/appsscript.json`](../dist/appsscript.json).
   - 💾 **Save**.
3. In the editor, pick the function **`prepareTemplate`** in the toolbar and click **Run** (allow the permissions). It:
   - refuses if the sheet has any users (a template must not be a shop),
   - removes triggers and stored keys,
   - writes the big Hindi **START** tab the owner sees after copying.
4. Do **not** run *Start here* or *Set up this sheet* in the template, and do not deploy it. **The template must contain no shop data.**
5. Close the editor. In the sheet: **Share → General access → Anyone with the link → Viewer**.
6. Copy the sheet's link and change the end from `/edit…` to **`/copy`**:
   `https://docs.google.com/spreadsheets/d/<TEMPLATE_ID>/copy`
   This is the link you send to new shops.

**Updating the template:** after changing the backend, paste the new `dist/Code.gs` (and `dist/appsscript.json` if it changed) into the template the same way, so new shops start on the newest code. Existing shops update themselves from GitHub every night (see *Updates* in [SETUP.md](SETUP.md)).
