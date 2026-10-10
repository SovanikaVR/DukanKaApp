# DukanKaApp — architecture, speed and security (v1.9)

## How it is built

```
Phone (PWA on GitHub Pages)                 Shop owner's Google account
┌──────────────────────────────┐   HTTPS    ┌───────────────────────────────────────────┐
│ screens (lazy loaded)        │──POST────▶ │ Apps Script web app (doPost)              │
│ kept answers (localStorage)  │◀──JSON──── │  ├ login / session (Script Properties)    │
│ pictures store (dk_img)      │            │  ├ read cache (CacheService, per tab)     │
│ service worker (app files)   │            │  └ Google Sheet: one tab per record type  │
└──────────────────────────────┘            │    Drive: backups, stock photos           │
                                            └───────────────────────────────────────────┘
```

* The Google Sheet is the only database. It belongs to the shop; the app never stores data anywhere else.
* Every request is one Apps Script run. The slow parts are calls to the Sheet and the number of cells read.

## Speed: what was slow and what changed (v1.9)

Measured with `node tests/perf.js` (counts every Sheet call for a 2-year shop: 4,000 customers, 8,000 bills, 25,000 cash rows).
Times are estimates for real Apps Script.

| Screen (first open) | before v1.9 | v1.9 |
|---|---|---|
| Home | ~240 s (4,013 Sheet calls) | ~1.5 s |
| Baki list | ~240 s, 489 KB to the phone | ~1.5 s, 22 KB |
| Customer page | ~7 s (396k cells) | ~3 s (50k cells) |
| Find customer | ~2.6 s | ~1.7 s |
| Today report | ~11 s (693k cells) | ~5 s |
| Cash book | ~4.4 s | ~2.8 s |
| Bills list | ~3.2 s | ~0.7 s |
| Any screen opened again | full time again after **any** save | ~0.5 s unless a save changed **its** tabs |

1. **N+1 lookups removed.** One-row look-ups (Google TextFinder) were done once per customer inside lists. Now after
   3 look-ups in a request the whole tab is read once (`find_`).
2. **Index reads** (`rowsMatching_`): read one column (customer id / date), then only the matching rows. Falls back
   to a full read when matches are spread out (cost-based).
3. **Column reads** (`readCols_`): counts and balances read only the 2–5 columns they need.
4. **Tail reads** (`tailRows_`): the bills list reads only the newest rows.
5. **Read cache per tab**: each cached answer remembers which tabs it used; a save bumps only the tabs it wrote
   (`_touched`, `_written`, `sv_<tab>` versions). Saving a bill no longer clears the girvi list or stock.
6. **Pictures once**: logos travel as `img:<ref>`; the picture is downloaded once and kept on the phone.
7. **Smaller answers**: Baki list is paged (100 at a time, "Show more").
8. **Fonts never block** the first screen (loaded after the app is drawn).

### Next step when a shop has many years of data: year-end close
Tabs grow forever; the today report and cash book still read a date column of all history. A yearly
"close" that moves finished records (bills, cash, closed girvi, delivered orders, audit) to a year file and
carries forward opening balances (cash, baki per customer, wholesaler/karigar, fine stock) keeps every tab
small for ever. The bills part exists already (Settings → Archive old year).

## Security review (v1.9)

| Area | Finding | Done |
|---|---|---|
| PIN guessing | Lockout lived in the cache (can be emptied); 4-digit owner PINs | Lockout in Script Properties: 5 wrong → 15 min, doubling up to 24 h; owner emailed; owner PIN ≥ 6 digits for new/changed PINs; new PIN unlocks |
| Lost phone / staff leaves | No way to end other sessions | Settings → Users → **Log out all other phones** |
| Data left on phone | Logout kept saved screens, recent customers, pictures | Logout / expiry wipe all shop data from the phone |
| Staff copying data | Any employee could export full customer / girvi lists | Exports are owner-only |
| Code injection (XSS) | Two bill-design values were put into page markup unchecked | Only known values accepted; all text escaped |
| Page rules | No Content Security Policy | CSP: own files, Apps Script and Google Fonts only; no plugins, no outside scripts |
| Auto-update supply chain | Shops updated from `main` | Shops update from the `stable` branch, moved only after tests |
| Sheet sharing | Not checked | "Check my data" warns if the Sheet is open to anyone with the link, or lists other editors |
| Formula injection | Text starting with "=" | Already prefixed; all columns are plain-text format |

### Things only the owner / developer can do
* Turn on 2-step verification for the Google account that owns the Sheet, and for the GitHub account.
* GitHub: protect `main` and `stable` (no force-push, only you can push).
* Keep the Sheet's "General access" at **Restricted**; do not add editors you do not need.
* Use a 6–8 digit owner PIN; give staff their own logins (never share the owner login).

### Accepted limits (Google Apps Script)
* The web app URL is public by design; everything behind it needs a login token (two random UUIDs, 30 days).
* PIN hashes are salted SHA-256 inside the owner's own Sheet; anyone who can open the Sheet already sees all data.
* `doGet` shows the shop name and app version (used by the "connect" screen).
