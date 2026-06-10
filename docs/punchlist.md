# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-06-09

## Current State: LIVE ✅
- helltrack.app live with HTTPS, FEED / RESULTS / RIDERS / PITS navigation
- Hourly cache refresh running clean
- Results data: 2025–2026 via UCI JSON API, 2024 via downhillr .rda import
- Shorts strip in feed with duration-based detection (≤60s); seen/dim state on all cards
- PITS tab with TEAMS / MEDIA / PODCASTS / UCI / WATCH sub-tabs; real broadcaster data in watch.json
- Email list via Kit.com (hello@helltrack.app)
- R1 South Korea and R2 Loudenvielle results live
- Results fetcher workflow: targeted crons for Leogang (14:30 UTC June 12 qualifying, 13:30 UTC June 13 finals)

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
| 7 | Real PWA icon | S | Low | Replace placeholder HT icon. Need 192×192 and 512×512 PNG from designer. |
| 36b | 2024 results quality pass | S | Medium | Re-fetch 2024 data via UCI JSON API to replace .rda import. Verify winner accuracy (Bielsko-Biała 2024 men P1 flagged as wrong). Combine with #34 audit. |
| 34 | Results data accuracy audit | M | Medium | Verify all 2024 round winners against authoritative sources. |
| 5 | Historical results 2015–2023 | L | Low | Scrape and integrate 9 years of World Cup DH results. rootsandrain.com or downhillr .rda. Existing scraper at scripts/rootsandrain_pull.py. Series IDs: 2023=series1622, 2022=series1464; 2019–2021 IDs unknown. Check UCI JSON API depth before scraping. |
| 8 | Rider search in results | M | Low | Filter results.json for a rider name, show rank/time/gap across all rounds. Deferred until more data. |
| 9 | Rider comparison | M | Low | Two rider searches side by side. Depends on #8. |
| 10 | Season standings / points table | M | Low | Points per round already in results.json. Aggregate into standings view by season. |
| 33b | ~~Thumbs-down filter feedback~~ | — | Dropped | Filter is clean enough. GA card_open provides sufficient signal. |

### Notes on backlog items
- **#36b / #34**: Combine these — audit 2024 winners, re-fetch from UCI API where it covers 2024, manually correct anything it doesn't.
- **#5 (historical data)**: The UCI JSON API may cover some historical seasons — check API depth first before scraping rootsandrain.

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
