# नई दुकान — अपना ऐप खुद बनाएं (10 मिनट)

DukanKaApp मुफ़्त है। आपकी दुकान का सारा हिसाब **आपकी अपनी Google Sheet** में रहता है — किसी और के पास नहीं।

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
