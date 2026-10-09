# DukanKaApp — setup guide

Each shop uses **its own Google account and its own Google Sheet**. Nothing is paid for, and no shop can see another shop's data.

There are three parts:

- **Part A** is done once, by you, for the app itself.
- **Part A2** is done once, by you: the template sheet that every shop copies.
- **Part B** is done once for every shop **by the shop owner**, with no technical steps:
  copy link → *Start here* → fill a form → scan a QR code.
  The step-by-step owner guide in simple Hindi is **[NEW_SHOP_HI.md](NEW_SHOP_HI.md)** — send that to new shops.
- **Part C (advanced)** is the old manual path, if the easy path cannot be used.

---

## Part A — publish the app (one time)

1. On GitHub, open the repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, pick **GitHub Actions**.
3. Push to `main`, or open **Actions → Deploy app → Run workflow**.
4. After a minute the app is live at:
   **https://sovanikavr.github.io/DukanKaApp/**

From then on, every push to `main` updates the app for every shop.

---

## Part A2 — the template sheet (one time)

Follow *"For the developer"* at the end of **[NEW_SHOP_HI.md](NEW_SHOP_HI.md)**. In short:

1. New sheet → **Extensions → Apps Script** → name the project **DukanKaApp** → paste `dist/Code.gs` and `dist/appsscript.json` → Save.
2. Run **`prepareTemplate`** once from the editor (adds the Hindi START tab; refuses if the sheet holds shop data).
3. **Share → Anyone with the link → Viewer**, and send shops the link ending in **`/copy`**:
   `https://docs.google.com/spreadsheets/d/<TEMPLATE_ID>/copy`

The template must never hold shop data. Do not run *Start here* in it and do not deploy it.

---

## Part B — set up a shop (easy path, once per shop)

The owner follows **[NEW_SHOP_HI.md](NEW_SHOP_HI.md)**. What happens:

1. **Make a copy** from the `/copy` link. This copies the sheet and its script into the owner's Drive.
2. **Dukan App → ▶ Start here / सुरू करा.** Google asks for permission once
   (*"Google hasn't verified this app"* → **Advanced → Go to DukanKaApp (unsafe) → Allow**).
3. A sidebar asks for shop name, owner name, mobile, login name and PIN. **Create my shop**:
   - creates every tab and the default settings, writes the shop name and mobile,
   - creates the owner login,
   - turns on the nightly backup + report trigger,
   - publishes the web app through the Apps Script API (*Execute as: Me*, *Anyone*), with no Deploy menu.
4. If the owner's **Google Apps Script API** switch is off, the sidebar shows one step:
   open https://script.google.com/home/usersettings → **Google Apps Script API → On** → **Try again**.
   If publishing fails for another reason, the sidebar shows the manual Deploy steps (Hindi + English)
   and a box to paste the `/exec` URL.
5. The sidebar shows the shop's app link `https://sovanikavr.github.io/DukanKaApp/?api=<web app URL>`,
   a QR code to scan with the shop phone, **Send on WhatsApp** and **Email me the link**.
   **Dukan App → Show my app link** shows it again later.

Then do **step 6 below** (first things in the app).

---

## Part C — set up a shop by hand (advanced)

Use this only if the easy path cannot be used. Do this on a computer, signed in with the **shop owner's Gmail**.

### 1. Make the Google Sheet

1. Open **https://sheets.new**.
2. Name the sheet, for example *Shree Ganesh Jewellers – Ledger*.

### 2. Paste the backend

1. In the sheet, open **Extensions → Apps Script**.
2. Delete everything in `Code.gs`.
3. Paste the full contents of [`dist/Code.gs`](../dist/Code.gs) (on GitHub, use the **Raw** button, then copy all).
4. Click ⚙️ **Project Settings** and tick **Show "appsscript.json" manifest file**.
5. Go back to the editor and open `appsscript.json`. Replace its contents with [`dist/appsscript.json`](../dist/appsscript.json).
6. Click 💾 **Save**.

### 3. Run setup

1. Go back to the sheet tab and reload the page. A new menu, **Dukan App**, appears.
2. Click **Dukan App → Advanced (manual setup) → 1. Set up this sheet**.
3. Google asks for permission. Choose the owner's account.
   - You will see **"Google hasn't verified this app"**. This is normal: it is the shop's own script.
   - Click **Advanced → Go to … (unsafe) → Allow**.
4. Enter the owner's name, a short login name (for example `viju`) and a 4–8 digit PIN.
5. All the tabs are created.

### 4. Publish the backend as a web app

1. In Apps Script, click **Deploy → New deployment**.
2. Click ⚙️ next to *Select type* and choose **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
3. Click **Deploy** and copy the **Web app URL**. It ends with `/exec`.
4. Back in the sheet, run **Dukan App → Advanced (manual setup) → 2. Turn on nightly backup + email report**.

### 5. Put the app on phones

1. Make the shop's own link:
   `https://sovanikavr.github.io/DukanKaApp/?api=` followed by the Web app URL.
2. Send that link on WhatsApp to the owner and each employee.
3. Open it in **Chrome**, then tap **⋮ → Add to Home screen** (or **Install app**).
4. Log in with the login name and PIN.

### 6. First things in the app (owner)

1. **Settings → Shop details:**
   - Enter the shop name, address, phone and state.
   - If the shop makes GST bills, enter the **GSTIN** and keep *Allow GST bills* on. Otherwise switch it off.
2. **Settings → Standard values:**
   - Set the standard cut %, our purity %, making ₹/g and girvi rate.
   - These are only starting values. Every entry can still be changed while entering it.
3. **Settings → Modules:** switch off anything the shop does not use, for example Girvi. It can be switched back on any time.
4. **Settings → Users:** add employees with their own login name and PIN.
   - Use the **View only** role for a partner or CA.
5. **Cash book → Set opening cash** with the cash in the drawer today.
6. Every morning, set **Today's rate** from the home screen. It takes one tap with *Same as yesterday*.

---

## Printing

**Normal printer (A4 / A5)**
- On the bill screen, tap **A4 / A5**.
- Choose a Wi-Fi printer, or *Save as PDF*.

**Bluetooth thermal printer (58 mm or 80 mm)**
1. Pair the printer with the phone in Android Bluetooth settings.
2. Install a free print-service app, for example **"ESC POS Bluetooth Print Service"** or **RawBT**, from the Play Store. Choose the printer inside that app.
3. In DukanKaApp, go to **Settings → Thermal printer paper** and pick 58 mm or 80 mm.
4. On the bill screen, tap **Thermal**. The phone's print screen opens; choose the thermal printer.

Before buying printers for many shops, test one printer model first.

---

## WhatsApp

**Send PDF on WhatsApp**
1. The app makes the PDF on the phone.
2. Pick **WhatsApp**, then the customer's chat. The PDF goes as a file.

**Open customer's chat**
- Opens that customer's chat with the bill summary already typed. Tap Send.

Both ways are free. Fully automatic sending would need the paid WhatsApp Business API, so it is not used.

---

## Updating a shop to a new version

**Phone app**
- Updates by itself after a push to `main`.

**Backend — automatic (default)**
- Bump `APP_VERSION` in `apps-script/src/00_config.js`, run `npm run build`, and push `dist/` to `main`.
- Every night (after the backup) each shop downloads
  `https://raw.githubusercontent.com/SovanikaVR/DukanKaApp/main/dist/Code.gs` and `dist/appsscript.json`.
  If the version there is newer, it replaces its own code through the Apps Script API, makes a new version
  and moves its web app to it. **The web app URL stays the same.** New tabs or settings are added the next night.
- Each result is written to the **Audit** tab (action `auto.update`).
- If the new `appsscript.json` adds **new permissions (oauthScopes)**, a shop does not update by itself
  (the app would stop until the owner allows them). The owner gets one email asking to run
  **Dukan App → Update now** → Allow → **Update now** again.
- Owners can update at once with **Dukan App → Update now**, and switch this off with
  **Dukan App → Auto-update on / off**.
- ⚠️ Whoever can push to `main` changes the code in every shop. Protect the branch.
- Shops set up by hand (Part C) also update, as long as the project has exactly one web app deployment
  and the owner's Apps Script API switch is on.

**Backend — by hand (if auto-update is off)**
1. Paste the new `dist/Code.gs` into Apps Script and Save.
2. Click **Deploy → Manage deployments → ✏️ Edit**.
3. Set **Version: New version** and click **Deploy**. The web app URL stays the same.
4. Run **Dukan App → Advanced (manual setup) → 1. Set up this sheet** once more. It only adds anything new and never deletes data.

**Upgrading a shop made before the Start-here installer existed:** paste the new `dist/Code.gs` **and**
`dist/appsscript.json` (it now lists its permissions), Save, reload the sheet, run any **Dukan App** menu item
and **Allow**, then do steps 2–3 above. From then on it updates itself.

---

## Safety and data

- All data lives in the owner's Google Drive.
- Every night the whole sheet is copied into the Drive folder *DukanKaApp Backups*, and the last 30 copies are kept.
- Wrong PINs are blocked after 5 tries for 10 minutes.
- When the owner switches a user off, that phone is logged out.
- Nothing is ever deleted. Corrections are new entries (for example *Cancel bill*), and every change is written to the *Audit* tab.
- **Old years:** once a financial year is over, use **Settings → Archive old year** (owner). Its bills move to their own Google Sheet, so the main sheet stays fast. Old bills can still be searched from **Bills** by entering the year, for example `25-26`.
- **Forgot the owner PIN:** in the sheet, use **Dukan App → Reset an owner PIN**.
