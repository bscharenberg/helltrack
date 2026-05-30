# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-05-28

## Current State: LIVE ✅ — LAUNCHED
- helltrack.app is live with HTTPS
- Announced on Pinkbike, Reddit, and DMs to key people (Martin Whiteley etc.)
- Hourly cache refresh running clean
- Results tab with 2025-2026 data (men + women elite, all rounds)
- 2024 data dropped — bad source data, re-import deferred (#36b)
- Fox Factory + Frameworks Bicycles channels in pipeline
- Jack Moir removed from channels (enduro, not DH)
- Content filter clean and tuned through multiple rounds
- Nav: FEED / RESULTS / RIDERS
- Subhead: "DOWNHILL RACING"
- Seen/watched state on cards
- Riders tab live — 154 men, 62 women, IG links, search, My Riders
- Email signup live (Make the Cut / Kit.com) — welcome email sending from hello@helltrack.app
- Security hardened and re-verified pre-launch ✅
- GA card_open tracking live
- PWA icon: handed off to designer

---

## Vision / Franchise
Helltrack is the template for a family of discipline-specific racing apps. Each follows the same curation model — one clean destination for fans of that discipline, zero noise. Potential franchise: Downhill Racing (Helltrack), Enduro Racing, XCO Racing, BMX Racing, etc.

---

## Design Decisions

### Helltrack = UCI DH only (locked May 23, 2026)
Helltrack covers UCI Downhill racing exclusively — no EWS/enduro, no freeride, no slopestyle, no XCO, no trail riding, no road, no BMX. This applies to content filter, results data, riders tab, and all future features.

### Aesthetic
- Dark #111 background, acid yellow #d4f500 accent
- Barlow Condensed typography, bold, all caps for labels
- Timing-screen / race-plate energy — not lifestyle, not outdoor adventure
- Mobile-first, full-width on desktop

### Feed philosophy
- "Newspaper not an inbox" — no unread state, no notification pressure
- Flat chronological feed with category badges
- MAX_AGE_DAYS=30 — no backlog, always fresh

### Navigation
- Top tab bar only — no sidebar, no bottom nav
- Tabs: FEED / RESULTS / RIDERS (+ TEAMS when built)
- Results nav rows sticky in header, hidden on other tabs

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
- 2025 historical data clean and live (men + women elite, all rounds)
- GitHub Action for results-fetcher (race weekend auto-trigger)
- Fox Factory + Frameworks Bicycles channels added (#23)
- Jack Moir removed from channels (enduro content)
- Hourly cache refresh bug fixed (#25)
- build-riders.js script added
- Security hardening complete (#29) — re-verified pre-launch
- Custom license file updated
- Kit.com email signup live — welcome email from hello@helltrack.app

### Frontend & UI
- Results tab with multi-season UI
- Top 5 visual weight treatment
- Qualifying sessions (Q1/Q2) in results
- 4-row results nav sticky in header
- Bottom sheet preview with source-aware CTAs
- iOS install tip banner
- Tab ID collision fixed
- Hero image on desktop fixed
- WynTV channel added
- Flat chronological feed with category badges
- Nav: FEED / RESULTS / RIDERS
- Subhead: "DOWNHILL RACING"
- Seen/watched state on feed cards (#27) ✅
- Riders tab — search, My Riders, IG links (#28 Stages 1-3) ✅
- Paddock renamed to Pits (#35) ✅
- GA card_open event tracking (#33) ✅
- Email signup form embedded mid-feed (#32) ✅
- Dynamic season pills — only shows years with data (#36a) ✅

### Content & Data
- XCO filtering fixed
- Content filter rounds 1-5 complete
- Content filter further tuned May 28 — DH-specific rider content from Pinkbike and YouTube surfacing correctly
- South Korea / YongPyong venue keywords
- MTBWS DHI highlights scoring fixed
- Category item limit bumped 10→20
- Feedback button → Google Form → Google Sheet
- Google Analytics live
- 217 rider roster compiled, IG handles researched
- 2025 women's elite results fixed — all rounds verified ✅
- 2024 bad data removed — re-import deferred (#36b)

---

## Active Backlog — Priority Order

| Priority | # | Item | Size | Description |
|---|---|---|---|---|
| 1 | 26 | Loudenvielle R2 results | S | Race day today May 28. Run results-fetcher.mjs after finals. Slug: loudenvielle-2026. |
| 2 | 7 | Real PWA icon | S | Handed off to designer. Waiting on 192x192.png and 512x512.png. |
| 3 | 38 | Deep link sharing | M | Share button generates helltrack.app/?v=[id]. Opens app with card sheet open. Growth mechanic. |
| 4 | 36b | 2024 results proper fix | M | Re-fetch from UCI PDFs. See details below. |
| 5 | 30 | Teams tab | M | Needs scoping. See details below. |
| 6 | 37 | Hub tab | M | Links to teams, how to watch, Pinkbike, UCI, commentators. Name TBD. |
| 7 | 5 | Rootsandrain historical data 2015-2023 | L | UCI DH only. Scraper exists. See details below. |
| 8 | 15 | Full historical results 1990s+ | L | Extends #5. Do after #5 clean. |
| 9 | 10 | Season standings | M | Aggregate points across rounds. Already in results.json. |
| 10 | 16 | Split times frontend | M | Sector splits per rider. Mobile first. |
| 11 | 8 | Rider search in results | M | Career results table by rider name. |
| 12 | 9 | Rider comparison | M | Two riders side by side. Depends on #8. |
| 13 | 32b | Franchise waitlist page | S | Dedicated Kit.com page for Enduro/XCO/BMX/Road interest. |
| 14 | 33b | Thumbs-down feedback button | S | "Not relevant" on bottom sheet fires GA event. Depends on #33. |
| 15 | 34 | Rider name signals in content filter | S | Use riders.csv for +3 keyword boosts. Deferred. |
| 16 | 14 | Where to watch / live streams | M | Official stream links by geo + guide. |
| 17 | 17 | Data viz / splits analysis | XL | Someday. Sector gap charts. Depends on #16. |
| 18 | 12 | Merch | L | Trademark situation. Contact larryaaa2000@yahoo.com. |

---

## Backlog Item Details

### #26 — Loudenvielle R2 results
**Race day: May 28, 2026**
```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack
node scripts/results-fetcher.mjs loudenvielle-2026
git add public/results.json
git commit -m 'add results - Round 2 Loudenvielle'
git pull --rebase origin main && git push
```
Run after finals are posted on ucimtbworldseries.com (usually a few hours after the race).

### #36b — 2024 results proper fix
**Root cause**: `.rda` import via `rootsandrain_pull.py` pulled semi-finals as finals for at least Fort William, Bielsko-Biała, Les Gets. Women's data absent entirely.

**Fix options:**
- (a) Update Worker to scrape per-session raceCategory URLs: `ucimtbworldseries.com/results/raceCategory/uci-dhi-world-cup-[venue]-men-elite-dhi-finals/2024`
- (b) Use ChronoRace blob storage directly: `chronorace.blob.core.windows.net/webresources/20240519_dhi/`
- (c) Fold into Rootsandrain historical import (#5)

**Also needed**: Season pill hides 2024 until data returns (handled by #36a already).

### #38 — Deep link sharing
- Share button on bottom sheet generates `helltrack.app/?v=[video_id]` URL
- On app load: check for `?v=` param — if found, locate item in cache and open its bottom sheet
- Graceful fallback: if item not in cache (aged out), just open app normally
- On mobile: triggers native share sheet with deep link URL
- Growth mechanic — shared links bring new users directly into the app

### #30 — Teams tab
**Needs scoping. Open questions:**
- Team data source: results.json (changes yearly) or static teams.json?
- Scope: factory teams only or all teams?
- Nav position: FEED / RESULTS / RIDERS / TEAMS?
- Rider-team linkage: most recent result or manually curated?

### #37 — Hub tab (name TBD)
- Links to factory team IG profiles
- How to watch races (official streams by geo)
- Links to Pinkbike, UCI, key commentator accounts
- DH influencer accounts
- Semi-static content, updated per season
- Name options: HUB, PIT BOARD, RESOURCES — TBD

### #7 — PWA icon
- Handed off to designer
- Waiting on: 192x192.png and 512x512.png
- `git add icon-192.png icon-512.png && git commit -m 'new PWA icon' && git pull --rebase origin main && git push`

### Riders roster maintenance
- Source of truth: `scripts/riders.csv`
- To update: edit CSV, run `node scripts/build-riders.js`, commit both files

### #5 — Rootsandrain historical data 2015-2023
**Scope: UCI DH World Cup only — no enduro.**
**Source of truth**: UCI official PDFs (2019+), Rootsandrain (2015-2018)
- 2023: rootsandrain.com/series1622/2023-uci-world-cup-dh/
- 2022: rootsandrain.com/series1464/2022-mercedes-benz-uci-world-cup-dh/
- 2019-2021: series IDs still needed
- Existing scraper: scripts/rootsandrain_pull.py
- Reference: github.com/nathantomczyk/world_cup_downhill_data_science

### #16 — Split times frontend
- Data exists in results.json (s1-s4 per rider)
- Approach A: tap row to expand splits inline
- Approach B: fastest sector badges per sector
- No new columns in results table
- Mobile first

### #14 — Where to watch
- Official streams by geo (US, UK, EU, AUS)
- Pirate section: written guide only, no direct links

---

## PBI Format (for handoff to build chat)

This chat handles backlog and product thinking.
When ready to build an item, request: "give me the PBI for #X"
Build chat receives the PBI and executes — no product decisions there.
