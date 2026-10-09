# DukanKaApp one-link installer (developer notes)

This folder is a **separate Apps Script project**, not part of the shop backend and not part of `dist/`.
You deploy it **once**. Its `/exec` link is **the one link** you give to every new shop:

> open the link → sign in → Allow → fill the form → (only if asked) switch on the Apps Script API →
> **Allow your shop app** → Allow → the shop is ready, scan the QR.

The owner-facing steps (Hindi) are *रास्ता 1* in [docs/NEW_SHOP_HI.md](../docs/NEW_SHOP_HI.md).

## What it does

The web app runs **as the visitor** (`executeAs: USER_ACCESSING`), so everything is created in the shop
owner's own Google account:

| Step | Call |
| --- | --- |
| 1. Sheet | `SpreadsheetApp.create("<Shop> — DukanKaApp")`, first tab renamed **Setup**, plain-text key/value rows: `shop_name, shop_mobile, shop_city, owner_name, owner_username` (lowercase), `owner_salt` (`Utilities.getUuid()`), `owner_pinHash` (= `hashPin_` in `apps-script/src/03_auth.js`: SHA-256 of `salt + ':' + pin`, lowercase hex), `installed_by, installed_at`. The PIN itself is never stored. |
| 2. Project | `POST https://script.googleapis.com/v1/projects` `{title, parentId: <spreadsheetId>}` (bound to the sheet) |
| 3. Code | downloads `dist/Code.gs` + `dist/appsscript.json` from `raw.githubusercontent.com/SovanikaVR/DukanKaApp/main/dist/` (cached 30 min in the script cache — public code only), then `PUT /v1/projects/{id}/content` `{files:[{name:'Code',type:'SERVER_JS'},{name:'appsscript',type:'JSON'}]}` |
| 4. Version | `POST /v1/projects/{id}/versions` `{description}` |
| 5. Deploy | `POST /v1/projects/{id}/deployments` `{versionNumber, manifestFileName:'appsscript', description}`; the URL is the `WEB_APP` entry point (fallback `https://script.google.com/macros/s/<deploymentId>/exec`) |
| 6. Hand-over | appends `webapp_url` and `deployment_id` rows to the Setup tab |

Progress is saved after every step in the visitor's **UserProperties** (`dukan_install_v1`: sheet id/url,
script id, version, deployment id, URL, shop name, login name — no PIN, salt or hash). **Try again** resumes
from the failed step and never makes a second sheet. **Make another shop / Start over** forgets that record
(the files already made stay in the owner's Drive).

The shop's own script is a different OAuth client, so it needs the owner's own consent once. The page's
**Allow your shop app** button opens `<exec>?setup=1`; after **Allow**, the shop backend finishes the shop
itself in `finishInstall_()` (`apps-script/src/22_install_finish.js`: tabs, settings, owner login from the
salt + hash, nightly trigger, deployment ids for auto-update, one email with the link, Setup tab deleted)
and `installReadyPage_(e)` shows *"Your shop is ready"* with the link, QR and WhatsApp button.

**Email:** the installer does **not** send mail, so it does not need the sensitive `script.send_mail` scope
(one less line on the permission screen and in a verification review). The shop backend, which already has
`script.send_mail`, emails the owner the app link once when it finishes.

The installer refuses to install if the `dist/Code.gs` on GitHub has no `finishInstall_` (an older backend could
never finish the shop). **Push the built `dist/` that contains `22_install_finish.js` (and the
`doGet`/`doPost` wiring) before handing out the link.**

## Create the installer (once)

Use the developer's Google account (not a shop's).

1. Open **https://script.google.com** → **New project**. Rename it (top left) to **DukanKaApp Installer** —
   owners see *"Go to DukanKaApp Installer (unsafe)"* on the permission screen.
2. Replace everything in `Code.gs` with [`installer/Code.gs`](Code.gs).
3. ⚙️ **Project Settings** → tick **Show "appsscript.json" manifest file in editor**. Open `appsscript.json`
   and replace it with [`installer/appsscript.json`](appsscript.json). 💾 **Save**.
4. **Deploy → New deployment** → ⚙️ *Select type* → **Web app**:
   - **Description:** `installer v1`
   - **Execute as:** **User accessing the web app**
   - **Who has access:** **Anyone with Google account**
   - **Deploy**. (Google may ask you to authorize first — allow it.)
5. Copy the **Web app URL** (ends with `/exec`). **This is THE one link** to give shops.
6. Test it yourself with a second (test) Gmail account from start to finish, on a phone.

**Updating the installer later:** paste the new code → **Deploy → Manage deployments → ✏️ Edit →
Version: New version → Deploy**. The link stays the same. Do not make a *New deployment* (that gives a new link).

**Scopes** (`installer/appsscript.json`):

| Scope | Why |
| --- | --- |
| `spreadsheets` | create the shop's sheet and write the Setup tab |
| `drive.file` | the sheet is a Drive file made by this app (non-sensitive; the installer never sees other files) |
| `script.projects` | create the bound project and upload the code |
| `script.deployments` | deploy the web app |
| `script.external_request` | `UrlFetchApp`: call the Apps Script API and download the code from GitHub |
| `userinfo.email` | record `installed_by` |

`script.container.ui` and `script.send_mail` are deliberately **not** requested.

## Google's limits for an unverified app — read before handing the link out widely

**Known (Google's published policy, as of 2025–26):**
- The installer is a single OAuth client used by many people, and it asks for **sensitive** scopes
  (at least `spreadsheets`, `script.projects`, `script.deployments`). While it is **unverified**:
  - every visitor sees *"Google hasn't verified this app"* and must click **Advanced → Go to … (unsafe)**;
  - Google applies a **lifetime cap of 100 new users** to unverified apps that request sensitive or restricted
    scopes. Users who already authorized keep working; after 100, new users get an error
    (*"This app is blocked"* / *"… has reached its user cap"*) instead of the consent screen.
- **Verification** lifts the cap and removes the warning. Roughly:
  1. Switch the installer project from the default Apps Script-managed Cloud project to a **standard Google
     Cloud project** you own (Project Settings → Google Cloud Platform project → Change project), enable the
     **Apps Script API** in that Cloud project.
  2. Set up the **OAuth consent screen** (Google Auth Platform → Branding / Audience / Data access): app name,
     logo, support email, **home page, privacy policy and terms on an authorized domain you have verified**
     in Google Search Console, user type **External**, publishing status **In production**.
  3. List the scopes and write a justification for each sensitive scope; record a **YouTube (unlisted) demo
     video** of the whole flow showing the consent screen and how each scope is used.
  4. Submit for verification. Sensitive-scope reviews usually take from a few days to several weeks.
  - Do **not** add restricted scopes (e.g. full `drive`) to the installer: restricted scopes also need a paid
    yearly third-party security assessment (CASA). That is why the installer uses `drive.file`.
- **Each shop's own backend project is not affected by this cap.** It is created in, owned by and authorized
  only by the shop owner (personal use of one's own script); the owner still sees the *unverified* warning
  once, as in the template path today.

**To verify yourself before relying on it (things that change or that we could not test here):**
- In your Cloud project's **Data access** page, which of the six scopes Google currently classifies as
  sensitive (`script.external_request` and `userinfo.email` are normally non-sensitive; `drive.file` is
  non-sensitive).
- Whether the 100-user cap counts per Cloud project as described, and the exact error text at the cap.
- Whether a `*.github.io` site can be the verified authorized domain for the privacy policy, or whether you
  need your own domain (`github.io` is on the public suffix list, but check Search Console + the consent
  screen accept it).
- The **Apps Script API quotas** (Cloud console → APIs & Services → Apps Script API → Quotas) — each shop
  uses about 5 calls; and the per-user daily limits for `UrlFetchApp` and spreadsheet creation (Apps Script
  quotas page). These are counted against each **visitor**, not against you.
- Google Workspace (company/school) accounts: the admin may block unverified apps or the Apps Script API,
  and the deployment URL has the form `/a/macros/<domain>/s/…/exec`. Such shops can use the template path.

## Privacy: where each shop's data lives

- Each shop's data lives **only in the shop owner's own Google Drive**: the sheet, its bound script, backups
  and archives are created in and owned by the owner's account.
- The installer project keeps **nothing about shops**: no script properties, no sheet, no logs of form data.
  The only stored things are (a) the visitor's own progress record in *their* UserProperties (private to
  them, ids only — no PIN, salt or hash), and (b) the public GitHub code in the script cache.
- Apps Script execution logs of the installer (visible to you as the project owner) contain only error
  messages — never the form. Do not add `console.log(form)` when debugging.
- The shop's sheet holds the salt + PIN hash only until the first request to its web app; `finishInstall_`
  copies it into the Users tab (as `createUser_` would) and deletes the Setup tab.

## Things to test with a real Google account (cannot be tested offline)

1. First open: consent screen for the installer, *unverified* screen, granular checkboxes (**Select all**), then the form.
2. `projects.create` with `parentId` = a spreadsheet made with only `spreadsheets` + `drive.file` scopes →
   a project bound to the sheet (sheet → Extensions → Apps Script shows it; `onOpen` menu appears).
3. A user with the **Apps Script API off** gets the *api_off* screen; after turning it on, **Try again**
   continues without a second sheet.
4. Deployment from the API with the shop manifest (`USER_DEPLOYING`, `ANYONE_ANONYMOUS`) → the `WEB_APP`
   entry point URL is returned.
5. The owner opening `<exec>?setup=1` gets Google's authorization screen for the new project (not just
   *"Authorization is required"*). If it does not, the documented fallback is the sheet menu
   **Dukan App → Show my app link** → Allow, then the button again.
6. After Allow: `finishInstall_` runs inside the web app request (setupTabs_ on ~19 tabs within the time
   limit), the owner can log in with the PIN typed in the installer, nightly trigger exists, email arrives,
   Setup tab is gone, Audit has an `install` row.
7. Phones (anonymous `POST`s) work right after; **Dukan App → Show my app link** and **Update now** work
   (deployment id stored).
8. GitHub raw download from Google's servers (rate limits / 429) and the script-cache chunking (Code.gs ≈ 200 KB).
