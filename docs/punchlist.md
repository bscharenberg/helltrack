# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-06-12

## Current State: LIVE ✅
- helltrack.app live with HTTPS, FEED / RESULTS / RIDERS / PITS navigation
- Hourly cache refresh running clean
- Results data: 2025–2026 via UCI JSON API (replaced/corrected), 2009–2024 backfilled via
  UCI DataRide JSON API (16 seasons, see `docs/historical-data.md` §7/§9). DNF/DSQ/DNS riders
  kept and listed last with no finish number.
- Shorts strip in feed with duration-based detection (≤60s); seen/dim state on all cards
- PITS tab with TEAMS / MEDIA / PODCASTS / UCI / WATCH sub-tabs; real broadcaster data in watch.json
- Email list via Kit.com (hello@helltrack.app)
- R1 South Korea and R2 Loudenvielle results live
- Results fetcher workflow: targeted crons for Leogang (14:30 UTC June 12 qualifying, 13:30 UTC June 13 finals)
- Branding finalized: chainsaw icon (192×192/512×512), header icon + white wordmark lockup, OG/Twitter share card and meta tags live

---

## Completed ✅

### Infrastructure & Pipeline
- Domain registered (helltrack.app)
- GitHub repos (helltrack + helltrack-results)
- YouTube API key + content pipeline
- Hourly GitHub Actions cache refresh
- Cloudflare Worker proxy for Pinkbike RSS (helltrack-rss, free plan)
- PDF parser (ChronoRace format) — built and later retired
- Browser Rendering Worker (helltrack-results) — built and later retired
- Migrated results pipeline to UCI JSON API (no PDFs, no Worker)
- Retired helltrack-results Worker, downgraded Cloudflare to free (#40)
- 2024 historical data from downhillr .rda files
- GitHub Action for results-fetcher (race weekend auto-trigger with targeted crons)

### Frontend & UI
- Results tab with multi-season UI
- Top 5 visual weight treatment (gold/silver/bronze + elevated 4-5)
- Qualifying sessions (Q1/Q2) in results
- 4-row results nav sticky in header
- Bottom sheet preview with source-aware CTAs
- iOS install tip banner (one-time, localStorage dismiss)
- Tab ID collision fixed (standings vs results internally)
- Shorts strip (duration-based detection ≤60s, horizontal scroll, portrait cards)
- Seen/dim state on feed cards and Shorts (45% opacity, persists in localStorage)
- PITS tab with sub-tab nav (TEAMS / MEDIA / PODCASTS / UCI / WATCH)
- RIDERS tab with Men/Women toggle, Instagram links
- Kit.com email signup form (mid-feed, static HTML embed, Barlow Condensed styled)
- Email hello@helltrack.app via Cloudflare routing + Kit sending domain
- Kit.com welcome automation (fires immediately on signup)
- Deep link sharing — Web Share API on mobile, clipboard fallback on desktop (#38)
- In-app YouTube player in bottom sheet — embedded iframe via YouTube IFrame Player API, "Open in YouTube →" secondary link, falls back to "Watch on YouTube" CTA if embedding is disabled (#40)

### Content & Data
- XCO filtering fixed (weight 15 + mtbws highlights -8)
- South Korea / YongPyong venue keywords
- MTBWS DHI highlights scoring fixed
- Category item limit bumped 10→20
- Fox Factory channel added (trusted source)
- Frameworks Bicycles channel added
- Just Ride (Red Bull) channel added
- WynTV channel added
- Feedback button → Google Form → Google Sheet
- Google Analytics (G-4EY22R6D2J)
- Content filter: ben cathro dropped from +6 athlete rule → product/lifestyle articles no longer pass
- watch.json: real broadcaster data (US, Canada, UK, Europe, Australia, New Zealand, Everywhere)
- directory.json: factory teams, media outlets, podcasts, UCI official links

---

## Active Backlog

| # | Item | Size | Priority | Description |
|---|---|---|---|---|
| 7 | ~~Real PWA icon~~ | — | Done | ~~Replace placeholder HT icon~~ — replaced with chainsaw logo (icon-192.png/icon-512.png, #d4f500), header updated to icon + white wordmark lockup, OG/Twitter meta tags added (2026-06-12). |
| 41 | Dynamic OG image for video shares (Cloudflare Worker) | S | Low | Static `og:image` can't differ between homepage and `?v=` video shares. Worker (same pattern as helltrack-rss) checks for `?v=` param: if present, injects that video's YouTube thumbnail (`maxresdefault.jpg`, fallback `hqdefault.jpg`) as `og:image` (+ optionally `og:title`); if absent, serves the static brand card. Needs route binding on helltrack.app domain (not just workers.dev). Est. ~1 hour. Build when share volume justifies it. |
| 36b | 2024 results quality pass | S | Medium | ~~Re-fetch 2024 data via UCI JSON API~~ — done as part of the 2009–2024 DataRide backfill (2026-06-10). Bielsko-Biała 2024 winner now sourced from DataRide; re-verify against #34. |
| 34 | Results data accuracy audit | M | Medium | Verify all 2024 round winners against authoritative sources. Podiums spot-checked against known history during the DataRide backfill (all seasons 2009-2024) — looked correct, but a formal audit hasn't been done. |
| 5 | ~~Historical results 2015–2023~~ | — | Done | ~~Scrape and integrate~~ — superseded by the 2009–2024 UCI DataRide backfill (2026-06-10). See `docs/historical-data.md` §7/§9. |
| 37 | results.json file size (8.0 MB) | M | Medium | After the 2009–2024 backfill, results.json grew from ~150 KB to 8.0 MB. Decide: split into `results-<year>.json` lazy-loaded per season, or keep monolithic. See `docs/historical-data.md` §8. |
| 38 | 2023–2024 finals-women possibly truncated | M | Medium | Most 2023–2024 World Cup rounds show only ~10–13 finals-women rows (vs ~15–18 in 2021–22, ~32–40 at Worlds), with no DNF/DSQ/DNS entries. DataRide's own Results endpoint returns only those rows — unclear if this is a DataRide data gap (need PDF supplement) or a real 2023+ format change (smaller finals fields at regular rounds). Needs research before deciding on a fix. See `docs/historical-data.md` §9. |
| 39 | 2022 Lenzerheide missing qualifying-men | S | Low | DataRide has no Men Elite qualifying race for this competition. Likely a genuine source gap; no known fix. See `docs/historical-data.md` §9. |
| 8 | Rider search in results | M | Low | Filter results.json for a rider name, show rank/time/gap across all rounds. Now has 16 years of data to work with. |
| 9 | Rider comparison | M | Low | Two rider searches side by side. Depends on #8. |
| 10 | Season standings / points table | M | Low | Points per round already in results.json. Aggregate into standings view by season. |
| 33b | ~~Thumbs-down filter feedback~~ | — | Dropped | Filter is clean enough. GA card_open provides sufficient signal. |

### Notes on backlog items
- **#36b / #34**: Combine these — formal audit of 2024 (and now 2009-2023) winners against authoritative sources is still open, though spot-checks during ingest found no errors.
- **#37/#38/#39**: Surfaced by the 2009–2024 DataRide backfill completeness audit (2026-06-10) — see `docs/historical-data.md` §9 for full detail.
- **#41**: Confirm `maxresdefault.jpg` exists for most videos before building — falls back to `hqdefault.jpg` if not.

---

## Pending PBIs — wordmark/icon batch (queued, model: Sonnet)

Written 2026-06-12, not yet built. PBI 1 (OG image swap) supersedes the generated `og-image.png` — designer's final file is a straight drop-in, no code change.

**PBI 1 — Swap OG share image**
- **What**: Replace generated OG image with designer's final version (chainsaw-as-T lockup)
- **Logic**: Replace `/og-image.png` in repo root with the new file. No code change — meta tags already point to this filename. Confirm file is 1200×630 before swapping.
- **File**: `/og-image.png`
- **Done when**: opengraph.xyz shows the new card; raw URL `helltrack.app/og-image.png` loads the new image

**PBI 2 — Header icon to rounded-corner version**
- **What**: Swap the header app icon to the rounded-corner variant
- **Logic**: In `index.html` header, replace icon source with the rounded-corner green chainsaw asset. Recolor to `#d4f500` if source is still `#ceff00`. Keep size 40px. Do NOT change the PWA home-screen icons (`icon-192.png`/`icon-512.png`) — those stay square-source for the iOS mask.
- **File**: `/index.html` (header), icon asset
- **Done when**: Header shows rounded-corner chainsaw; home-screen PWA icon unchanged

**PBI 3 — Replace header wordmark text with SVG wordmark**
- **What**: Replace Barlow Condensed "HELLTRACK" header text with the designer's SVG wordmark
- **Logic**:
  1. Replace the "HELLTRACK" text element in the header with inline SVG (or `<img>`) of `HT-Wordmark.svg`
  2. Confirm SVG fill is white `#ffffff`, accent `#d4f500`
  3. Add `alt="Helltrack"` (if `<img>`) or `role="img"` + `aria-label="Helltrack"` + `<title>Helltrack</title>` (if inline SVG)
  4. Constrain by height (~26–28px) so it scales cleanly; width auto
  5. Keep "DOWNHILL RACING" subtext below in muted gray
  6. Bump service worker cache `helltrack-v3` → `helltrack-v4`
- **File**: `/index.html` (header markup + styles), `service-worker.js`, wordmark SVG
- **Done when**: Header shows SVG wordmark (crisp at all densities) next to rounded icon, subtext unchanged, screen reader announces "Helltrack"

**Flag to eyeball after PBI 3**: the icon and the wordmark both contain a chainsaw — check the header live with both side by side. If redundant, drop the separate icon and let the wordmark carry the header alone.

---

## Race Calendar 2026 (reference)
| Round | Venue | Qual | Finals | Slug | Results |
|---|---|---|---|---|---|
| R1 | Mona YongPyong | 2026-04-30 | 2026-05-01 | race-of-south-korea-2026 | ✅ |
| R2 | Loudenvielle | 2026-05-23 | 2026-05-28 | loudenvielle-2026 | ✅ |
| R3 | Leogang | 2026-06-12 | 2026-06-13 | leogang-2026 | Upcoming |
| R4 | Lenzerheide | 2026-06-20 | 2026-06-21 | lenzerheide-2026 | — |
| R5 | La Thuile | 2026-07-04 | 2026-07-05 | la-thuile-2026 | — |
| R6 | Pal Arinsal | 2026-07-11 | 2026-07-12 | pal-arinsal-2026 | — |
| R7 | Les Gets | 2026-08-22 | 2026-08-23 | les-gets-2026 | — |
| Worlds | Val di Sole | 2026-08-29 | 2026-08-30 | val-di-sole-2026 | — |
| R8 | Whistler | 2026-09-26 | 2026-09-27 | whistler-2026 | — |
| R9 | Lake Placid | 2026-10-03 | 2026-10-04 | lake-placid-2026 | — |

---

## PBI Format (for handoff to Claude Code)
When ready to build, write:
- **What**: one sentence
- **Why**: user/product reason
- **Logic**: exact change needed
- **File**: which file(s)
- **Done when**: specific, testable criteria
