# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-05-21

## Current State: LIVE ✅
- helltrack.app is live with HTTPS
- Hourly cache refresh running clean (stash/pop bug fixed)
- Results tab with 2024-2025-2026 data
- Fox Factory + Frameworks Bicycles channels in pipeline
- Fox Factory channel ID: UCN_B2-bdBtmAq-5TOEU63nQ (trusted/boosted)
- Frameworks Bicycles channel ID: UCiCWNsaEx9swRaCe55XMAuw (filter decides)
- Jack Moir removed from channels (enduro, not DH)
- Feed is clean: 74 items, filter running correctly
- Flat chronological feed with category badges on cards
- Nav simplified to FEED / RESULTS only
- Subhead: "DOWNHILL RACING"
- Scope: Helltrack = DOWNHILL RACING only

---

## Vision / Franchise
Helltrack is the template for a family of discipline-specific racing apps. Each follows the same curation model — one clean destination for fans of that discipline, zero noise. Potential franchise: Downhill Racing (Helltrack), Enduro Racing, XCO Racing, BMX Racing, etc.

Prereq: Helltrack brand cleaned up to "DOWNHILL RACING" first. No enduro language, no scope creep. Sharp identity is what makes the franchise model credible.

---

## Completed ✅

### Infrastructure & Pipeline
- Domain registered (helltrack.app)
- GitHub repos (helltrack + helltrack-results)
- YouTube API key + content pipeline
- Hourly GitHub Actions cache refresh
- Cloudflare Worker proxy for Pinkbike RSS
- Cloudflare Workers Paid + Browser Rendering for UCI results
- PDF parser working (ChronoRace format, all sessions)
- 2024+2025 historical data from downhillr .rda files
- GitHub Action for results-fetcher (race weekend auto-trigger)
- Fox Factory + Frameworks Bicycles channels added (#23)
- Jack Moir removed from channels (enduro content)
- Hourly cache refresh bug fixed — stash/pop issue in build script was preventing cache.json commits (#25)

### Frontend & UI
- Results tab with multi-season UI
- Top 5 visual weight treatment
- Qualifying sessions (Q1/Q2) in results
- 4-row results nav sticky in header
- Bottom sheet preview with source-aware CTAs
- iOS install tip banner (one-time, localStorage dismiss)
- Tab ID collision fixed (standings vs results)
- Hero image on desktop fixed (YouTube items only in hero slot)
- WynTV channel added
- Flat chronological feed with category badges on cards
- Nav simplified to FEED / RESULTS only
- Subhead updated to "DOWNHILL RACING"

### Content & Data
- XCO filtering fixed (weight 15 + mtbws highlights -8)
- XCO and enduro content filter audit complete — #21 (Cink, Sagan, iXS EDC no longer passing)
- Content filter round 2 — lifestyle, product, enduro noise removed (#24)
- South Korea / YongPyong venue keywords
- B Line + UCI DHI highlights surfacing
- MTBWS DHI highlights scoring fixed
- Category item limit bumped 10→20
- Feedback button → Google Form → Google Sheet
- Google Analytics (G-4EY22R6D2J)
- README with licensing clarity
- Unstaged package.json committed

---

## Active Backlog — Priority Order

| Priority | # | Item | Size | Description |
|---|---|---|---|---|
| 1 | 26 | Loudenvielle R2 results | S | Race weekend May 28. Run results-fetcher.mjs after finals. Slug: loudenvielle-2026. |
| 2 | 7 | Real PWA icon | S | Replace placeholder HT icon. Midjourney prompt ready: "app icon, DH mountain bike start gate, flat design, acid yellow on black, minimal, bold, 512x512, no text". Need 192x192 and 512x512 PNG. |
| 3 | 5 | Rootsandrain historical data 2015-2023 | L | Scrape and integrate 9 years of World Cup DH results into results.json. Scraper exists at scripts/rootsandrain_pull.py. Needs data cleaning and merging into multi-season structure. |
| 4 | 15 | Full historical results 1990s+ | L | Extends #5 back to ~1991 using Roots and Rain. Do after #5 is clean and merged. Biggest lift is data cleaning. |
| 5 | 10 | Season standings | M | Aggregate points across rounds for overall championship standings. Points already in results.json per result. |
| 6 | 16 | Split times frontend | M | Show sector splits per rider in results table. Two candidate approaches — decide at build time: A) tap row to expand splits inline below rider, B) sector leader badges showing fastest split holder per sector. Mobile first, don't touch table layout. |
| 7 | 8 | Rider search | M | Search by rider name across all results.json data. Shows career results table: venue, year, session, rank, time, gap. Data already structured for this. |
| 8 | 9 | Rider comparison | M | Two rider searches side by side, same career results data in dual columns. Depends on #8. |
| 9 | 13 | Rider profiles tab | M | Curated static list of ~50-80 elite men/women riders with Instagram permalinks. Research to find handles is the work — code is trivial. Static JSON, no scraping. |
| 10 | 14 | Where to watch / live streams | M | Official stream links broken out by geo. Plus a guide on how to research unofficial/pirate streams yourself — no direct links, just instructions. |
| 11 | 17 | Data viz / splits analysis | XL | Someday/maybe. Sector-by-sector gap charts, where races are won and lost. Depends on #16 being solid first. |
| 12 | 12 | Merch | L | Trademark situation needs navigating. William Allen owns HELLTRACK for live events/merch (IC 016, 025, 041). App/software use is clear. Contact larryaaa2000@yahoo.com or design around with "Helltrack.app" branding. |

---

## Backlog Item Details

### #26 — Loudenvielle R2 results
**Race weekend: May 28, 2026**

```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack
node scripts/results-fetcher.mjs loudenvielle-2026
git add public/results.json
git commit -m 'add results - Round 2 Loudenvielle'
git pull --rebase origin main && git push
```

Run after finals are posted on ucimtbworldseries.com (usually a few hours after the race).

### #5 — Rootsandrain historical data 2015-2023
- Known series URLs:
  - 2025: rootsandrain.com/series2028/2025-whoop-uci-world-cup-dh/
  - 2024: rootsandrain.com/series1831/2024-uci-world-cup-dh/
  - 2023: rootsandrain.com/series1622/2023-uci-world-cup-dh/
  - 2022: rootsandrain.com/series1464/2022-mercedes-benz-uci-world-cup-dh/
  - 2019-2021: series IDs still needed
- Preferred strategy: scrape by venue page (rootsandrain.com/venue[id]/[name]/) — aggregates all years in one place
- Reference: Nathan Tomczyk's repo has a proven BS4 scraper: github.com/nathantomczyk/world_cup_downhill_data_science

### #16 — Split times frontend
- Split data already exists in results.json (s1-s4 per rider)
- Approach A: tap a result row to reveal splits inline below that rider
- Approach B: badge the fastest sector time holder per sector (S1/S2/S3/S4) — minimal, no table bloat
- Do not add columns to the results table
- Mobile first

### #13 — Rider profiles tab
- Not every UCI license holder — just ~50-80 elite men/women fans care about
- Static JSON: rider name + Instagram URL
- Nav tab approach OR inline from results table (tapping a rider name surfaces their IG)
- Inline from results is more useful and less maintenance surface — consider at build time
- Research to find handles is manual curation work, not scraped

### #14 — Where to watch
- Official streams: curated by geo (US, UK, EU, AUS etc.)
- Pirate section: written guide on how to research whether/where to find unofficial streams — no direct links
- Semi-static content, updated per season

---

## PBI Format (for handoff to build chat)

This chat handles backlog and product thinking.
When ready to build an item, request: "give me the PBI for #X"
Build chat receives the PBI and executes — no product decisions there.
