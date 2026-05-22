# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-05-21

## Current State: LIVE ✅
- helltrack.app is live with HTTPS
- Hourly cache refresh running clean
- Results tab with 2024-2025-2026 data
- WynTV channel added to feed
- Hero image on desktop fixed (Pinkbike items demoted from hero slot)
- Flat chronological feed with category badges on cards
- Nav simplified to FEED / RESULTS only
- Subhead updated to "DOWNHILL RACING"
- Scope decision made: Helltrack = DOWNHILL RACING (not enduro, not freeride, not XCO)
- Content filter tightened: XCO and enduro terms removed/reweighted
- Fox Factory + Frameworks Bicycles channels added to pipeline
- Fox Factory channel ID: UCN_B2-bdBtmAq-5TOEU63nQ (trusted/boosted)
- Frameworks Bicycles channel ID: UCiCWNsaEx9swRaCe55XMAuw (filter decides)
- ⚠️ Known bug: service worker serving stale cache.json — fix in progress (#25)

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

### Frontend & UI
- Results tab with multi-season UI
- Top 5 visual weight treatment
- Qualifying sessions (Q1/Q2) in results
- 4-row results nav sticky in header
- Bottom sheet preview with source-aware CTAs
- iOS install tip banner (one-time, localStorage dismiss)
- Tab ID collision fixed (standings vs results)
- Analysis tab working correctly
- Hero image on desktop fixed (YouTube items only in hero slot)
- WynTV channel added
- Flat chronological feed with category badges on cards
- Nav simplified to FEED / RESULTS only
- Subhead updated to "DOWNHILL RACING"

### Content & Data
- XCO filtering fixed (weight 15 + mtbws highlights -8)
- XCO and enduro content filter audit complete — #21 (Cink, Sagan, iXS EDC no longer passing)
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
| 1 | 25 | Service worker serving stale feed | S | SW is cache-first for cache.json — feed never updates for returning visitors. Fix SW to network-first + wire refresh button to force-fetch and re-render. |
| 2 | 24 | Content filter round 2 | S | Enduro builder series, product content, lifestyle noise still passing. Known bad items identified. See details below. |
| 3 | 7 | Real PWA icon | S | Replace placeholder HT icon with something authentic. Midjourney prompt ready: "app icon, DH mountain bike start gate, flat design, acid yellow on black, minimal, bold, 512x512, no text". Need 192x192 and 512x512 PNG. |
| 4 | 5 | Rootsandrain historical data 2015-2023 | L | Scrape and integrate 9 years of World Cup DH results into results.json. Scraper exists at scripts/rootsandrain_pull.py. Needs data cleaning and merging into multi-season structure. |
| 5 | 15 | Full historical results 1990s+ | L | Extends #5 back to ~1991 using Roots and Rain. Do after #5 is clean and merged. Biggest lift is data cleaning. |
| 6 | 10 | Season standings | M | Aggregate points across rounds for overall championship standings. Points already in results.json per result. |
| 7 | 16 | Split times frontend | M | Show sector splits per rider in results table. Two candidate approaches — decide at build time: A) tap row to expand splits inline below rider, B) sector leader badges showing fastest split holder per sector. Mobile first, don't touch table layout. |
| 8 | 8 | Rider search | M | Search by rider name across all results.json data. Shows career results table: venue, year, session, rank, time, gap. Data already structured for this. |
| 9 | 9 | Rider comparison | M | Two rider searches side by side, same career results data in dual columns. Depends on #8. |
| 10 | 13 | Rider profiles tab | M | Curated static list of ~50-80 elite men/women riders with Instagram permalinks. Research to find handles is the work — code is trivial. Static JSON, no scraping. |
| 11 | 14 | Where to watch / live streams | M | Official stream links broken out by geo. Plus a guide on how to research unofficial/pirate streams yourself — no direct links, just instructions. |
| 12 | 17 | Data viz / splits analysis | XL | Someday/maybe. Sector-by-sector gap charts, where races are won and lost. Depends on #16 being solid first. |
| 13 | 12 | Merch | L | Trademark situation needs navigating. William Allen owns HELLTRACK for live events/merch (IC 016, 025, 041). App/software use is clear. Contact larryaaa2000@yahoo.com or design around with "Helltrack.app" branding. |

---

## Backlog Item Details

### #25 — Service worker serving stale feed
**Diagnosis confirmed 2026-05-21:**
- GitHub Actions running clean and green (cache.json updating hourly on server)
- Cache-busted fetch returns `2026-05-20T03:52:54.458Z` — yesterday morning
- SW is intercepting cache.json fetch and serving stale cached version

**Fix:**
1. `service-worker.js` — change cache.json fetch strategy from cache-first to network-first (fetch from network, fall back to cache only if offline)
2. `index.html` — wire the existing refresh button (top-right ↺ icon) to force-fetch cache.json with a cache-buster, re-render the feed, and spin the icon while loading

**Files needed from Bryon:** `service-worker.js`, `index.html`

**Done when:** Feed shows content built within the last hour on a fresh visit. Refresh button fetches and re-renders visibly.

### #24 — Content filter round 2
**Known bad items still passing as of 2026-05-19:**
- "Building the ultimate Enduro rider with Simona Kuchyňková" — enduro exclude not matching
- "Building the ultimate Enduro rider with Charlie Murray" — enduro exclude not matching
- "Building the ultimate Enduro rider with Dan Booker" — enduro exclude not matching
- "Fox 36 SL - The Lightest 36 EVER!" — trail fork product content, no DH signal
- "13 Cool Jobs in the Mountain Bike Industry Right Now" — industry lifestyle noise
- "Your Bike. Your Choice. Your Trail." — generic lifestyle, no DH signal
- "Two different approaches to post race celebrations from Charlie Aldridge and Luca Martin" — vague, passes on athlete name recognition probably
- "How Specialized introduced mountain biking to the world" — history/marketing

**Approach:**
1. Paste current `content-filter.js` into chat first — don't assume what's in it
2. Score each known bad item to see why it's passing
3. Add targeted excludes: "enduro rider", "your trail", "cool jobs", "introduced mountain biking"
4. Test all known good DH items still pass after changes
5. Rebuild cache and validate live feed

**Constraints:**
- XCO exclude weight must always overpower sum of all possible boosts for trusted channels
- Do not touch MIN_SCORE or BOOST_SCORE values
- Test before every commit — never change filter and commit blind
- Rebuild cache after every filter change: `node scripts/build-cache.js`

**Files touched:** `scripts/content-filter.js`, then rebuild `public/cache.json`

**Done when:** All known bad items score below 4 and are dropped. Known good DH items still pass. Live feed shows no enduro or lifestyle noise.

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
