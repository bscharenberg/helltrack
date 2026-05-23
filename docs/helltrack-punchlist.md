# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-05-22

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
- Nav: FEED / RESULTS / RIDERS
- Subhead: "DOWNHILL RACING"
- Seen/watched state on cards (dims after Watch or Read clicked)
- Riders tab live — 154 men, 62 women, IG outbound links, Men/Women toggle
- riders.csv source of truth in scripts/, build-riders.js script added
- PWA icon: handed off to designer (192x192 + 512x512 PNG needed)
- ⚠️ Security hardening needed before weekend launch — see #29
- ⚠️ UCI channel still leaking XCO/enduro content — see #31

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
- Hourly cache refresh bug fixed — stash/pop issue in build script (#25)
- build-riders.js script added — reads scripts/riders.csv, writes public/riders.json

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
- Nav: FEED / RESULTS / RIDERS
- Subhead updated to "DOWNHILL RACING"
- Seen/watched state on feed cards — dims at 45% opacity after Watch/Read clicked (#27)
- Riders tab — 154 men, 62 women, IG outbound links, Men/Women toggle (#28 Stage 1)

### Content & Data
- XCO filtering fixed (weight 15 + mtbws highlights -8)
- XCO and enduro content filter audit complete — #21 (Cink, Sagan, iXS EDC no longer passing)
- Content filter round 2 — lifestyle, product, enduro noise removed (#24)
- South Korea / YongPyong venue keywords
- B Line + UCI DHI highlights surfacing
- MTBWS DHI highlights scoring fixed
- Category item limit bumped 10→20
- Feedback button → Google Form → Google Sheet
- Google Analytics (G-4EY22R6D2H)
- README with licensing clarity
- Unstaged package.json committed
- 217 rider roster compiled from results.json, IG handles researched manually
- Erlangsen typo duplicate fixed in riders.csv

---

## Active Backlog — Priority Order

| Priority | # | Item | Size | Description |
|---|---|---|---|---|
| 1 | 26 | Loudenvielle R2 results | S | Race weekend May 28. Run results-fetcher.mjs after finals. Slug: loudenvielle-2026. |
| 2 | 29 | Security hardening | M | Pre-launch checklist. API key restriction, secret rotation, robots.txt, Cloudflare hardening, 2FA, quota alerts. See docs/helltrack-security.md. |
| 3 | 31 | Content filter round 3 (bug) | S | UCI channel still leaking XCO and enduro content. Start dedicated build chat, upload content-filter.js first. Score known bad items before changing anything. |
| 4 | 28b | Rider search | S | Search field at top of Riders tab, filters list as you type. Stage 2 of #28. |
| 5 | 28c | Fantasy team picker | M | Pick up to 6 riders, localStorage, bubbles to top. Stage 3 of #28. |
| 6 | 32 | Email subscriber list + franchise waitlist | S | 32a: Helltrack update list (Kit.com, free tier, linked from app). 32b: Franchise interest waitlist by discipline (Enduro/XCO/BMX/Road). Same tool, two forms. |
| 7 | 30 | Teams tab | M | New tab: factory teams with IG links + roster under each team. Needs scoping — see details below. |
| 8 | 7 | Real PWA icon | S | Handed off to designer. Waiting on 192x192.png and 512x512.png. |
| 9 | 5 | Rootsandrain historical data 2015-2023 | L | Scrape and integrate 9 years of World Cup DH results into results.json. |
| 10 | 15 | Full historical results 1990s+ | L | Extends #5 back to ~1991. Do after #5 is clean and merged. |
| 11 | 10 | Season standings | M | Aggregate points across rounds for overall championship standings. |
| 12 | 16 | Split times frontend | M | Show sector splits per rider in results table. Mobile first. |
| 13 | 8 | Rider search in results | M | Search by rider name across all results.json. Career results table. |
| 14 | 9 | Rider comparison | M | Two rider searches side by side. Depends on #8. |
| 15 | 14 | Where to watch / live streams | M | Official stream links by geo + guide for finding unofficial streams. |
| 16 | 17 | Data viz / splits analysis | XL | Someday/maybe. Sector-by-sector gap charts. Depends on #16. |
| 17 | 12 | Merch | L | Trademark situation. Contact larryaaa2000@yahoo.com or design around "Helltrack.app" branding. |

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

### #29 — Security hardening
**Do before weekend launch.** Full checklist in `docs/helltrack-security.md`.

Summary:
- Audit git history for committed secrets
- Restrict YouTube API key to helltrack.app referrer in Google Cloud Console
- Rotate YouTube API key + update GitHub Secret + local .env
- Add robots.txt to repo root
- Enable Cloudflare Bot Fight Mode + verify SSL is Full (strict)
- Enable 2FA on GitHub + Google + Cloudflare (authenticator app, not SMS)
- Set YouTube API quota alert at 80% in Google Cloud Console
- Add Worker referrer check to RSS proxy + results Worker

### #31 — Content filter round 3 (bug)
**Symptom**: UCI MTB World Series YouTube channel still surfacing XCO and enduro content despite previous filter fixes.
**Approach**:
- Start a dedicated build chat for this
- Upload `scripts/content-filter.js` as first step
- Score each known bad item before changing anything
- Identify why each is passing — trusted channel boost overpowering excludes?
- Add targeted excludes, test all known good DH items still pass
- Rebuild cache and validate live feed
**Constraints**: XCO exclude weight must always overpower sum of all possible boosts. Do not touch MIN_SCORE or BOOST_SCORE.

### #28b — Rider search
- Search input at top of Riders tab, above Men/Women toggle
- Filters both lists simultaneously as user types
- Case-insensitive match on name
- When search active: hide toggle, show flat list with gender label per card
- Clear button (×) inside input to reset
- Placeholder: "Search riders..."
- Min 44px height tap target on mobile

### #28c — Fantasy team picker
- Pick up to 6 riders from Riders tab
- Stored in localStorage
- "My Team" section at top of Riders tab
- Tap to add, tap again to remove
- No weekly reset — user manages manually
- Works across Men and Women

### #32 — Email subscriber list + franchise waitlist
- **32a**: Helltrack update list — Kit.com (free tier), simple form, linked from helltrack.app. For users who want to know when new features ship.
- **32b**: Franchise interest waitlist — separate Kit.com form with discipline selector (Enduro / XCO / BMX / Road). Captures demand signal before building anything new.
- Both are Kit.com hosted forms — no backend needed, no build chat required
- helltrack.app just needs a small "Stay in the loop" link or button pointing to the form

### #30 — Teams tab
**Needs scoping before building. Open questions:**
- Team data source: scrape from results.json (changes year to year) or static teams.json curated manually?
- Scope: factory teams only or all teams including privateers?
- Nav position: FEED / RESULTS / RIDERS / TEAMS or different?
- Rider-team linkage: show current team based on most recent result, or manually curated?

### #7 — PWA icon
- Handed off to designer
- Waiting on: 192x192.png and 512x512.png
- When received: drop both into repo root
- `git add icon-192.png icon-512.png && git commit -m 'new PWA icon' && git pull --rebase origin main && git push`

### Riders roster maintenance
- Source of truth: `scripts/riders.csv`
- To update: edit CSV, run `node scripts/build-riders.js`, commit both files
- `git add scripts/riders.csv public/riders.json && git commit -m 'update riders roster'`

### #5 — Rootsandrain historical data 2015-2023
- Known series URLs:
  - 2025: rootsandrain.com/series2028/2025-whoop-uci-world-cup-dh/
  - 2024: rootsandrain.com/series1831/2024-uci-world-cup-dh/
  - 2023: rootsandrain.com/series1622/2023-uci-world-cup-dh/
  - 2022: rootsandrain.com/series1464/2022-mercedes-benz-uci-world-cup-dh/
  - 2019-2021: series IDs still needed
- Preferred strategy: scrape by venue page (rootsandrain.com/venue[id]/[name]/)
- Reference: github.com/nathantomczyk/world_cup_downhill_data_science

### #16 — Split times frontend
- Split data already exists in results.json (s1-s4 per rider)
- Approach A: tap a result row to reveal splits inline below that rider
- Approach B: badge the fastest sector time holder per sector
- Do not add columns to the results table
- Mobile first

### #14 — Where to watch
- Official streams: curated by geo (US, UK, EU, AUS etc.)
- Pirate section: written guide only — no direct links
- Semi-static content, updated per season

---

## PBI Format (for handoff to build chat)

This chat handles backlog and product thinking.
When ready to build an item, request: "give me the PBI for #X"
Build chat receives the PBI and executes — no product decisions there.
