# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-06-05 (session 2)

## Current State: LIVE ✅ — LAUNCHED
- helltrack.app is live with HTTPS
- Launched — announced on Pinkbike, Reddit, and DMs to key people (Martin Whiteley etc.)
- Hourly cache refresh running clean
- Results tab with 2025-2026 data (men + women elite, all rounds)
- 2025 women's elite results fixed — all rounds verified ✅
- 2024 data dropped — bad source data, re-import deferred (#36b)
- Fox Factory + Frameworks Bicycles channels in pipeline
- Jack Moir removed from channels (enduro, not DH)
- Content filter clean and tuned through multiple rounds — further tuned May 28
- Nav: FEED / RESULTS / RIDERS
- Subhead: "DOWNHILL RACING"
- Seen/watched state on cards
- Riders tab live — 154 men, 62 women, IG links, search, My Riders
- Email signup live (Make the Cut / Kit.com) — Kit.com welcome email sending from hello@helltrack.app
- Security hardened and re-verified pre-launch ✅
- GA card_open tracking live
- PWA icon: handed off to designer
- **Results fetcher migrated to UCI JSON API** — no more PDFs, Worker retired, no auth needed. 6 sessions/venue (finals + Q1 + Q2, men + women elite). Points come directly from API.
- Pits tab live — TEAMS / MEDIA / PODCASTS / UCI / WATCH pill nav, real broadcaster data in watch.json, factory teams + media + podcasts in directory.json
- Seen/dim state extended to Shorts strip (#40b)
- Content filter: ben cathro dropped from +6 rule → knee pad product articles no longer pass
- Results fetcher workflow: Leogang dates corrected (06-12/06-13), targeted crons added for post-session timing

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
- My Riders — save/filter riders from Riders tab (#28c) ✅

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
- Results fetcher migrated to UCI JSON API — no PDFs, no Worker ✅
- Loudenvielle R2 results fetched and live (#26) ✅
- Season standings live in Results tab (#10) ✅
- UCI Shorts Strip — horizontal scroll strip of portrait clips ✅
- Shorts detection extended to all channels (duration-based via videos.list) ✅
- Font sizes bumped — tabs 11→14px, metadata 11→13px, badges 9→11px, section labels 10→13px ✅
- Deep link sharing live — Web Share API on mobile, clipboard fallback on desktop (#38) ✅
- 30-min results polling on race days, finals guard prevents spurious commits (#39) ✅
- Dead deps removed, helltrack-results Worker deleted, Cloudflare downgraded to Free (#40) ✅

---

## Active Backlog — Priority Order

| Priority | # | Item | Size | Description |
|---|---|---|---|---|
| 1 | 7 | Real PWA icon | S | Handed off to designer. Waiting on 192x192.png and 512x512.png. |
| 2 | 36b | 2024 results proper fix | M | Re-fetch via UCI JSON API (slug pattern same as 2026). See details below. |
| 3 | 33b | Thumbs-down feedback button | S | "Not relevant" on bottom sheet fires GA event. Race weekend = best feedback signal. |
| 4 | 5 | Rootsandrain historical data 2015-2023 | L | UCI DH only. Scraper exists. See details below. |
| 5 | 15 | Full historical results 1990s+ | L | Extends #5. Do after #5 clean. |
| 6 | 16 | Split times frontend | M | Sector splits per rider. Mobile first. |
| 7 | 8 | Rider search in results | M | Career results table by rider name. |
| 8 | 9 | Rider comparison | M | Two riders side by side. Depends on #8. |
| 9 | 32b | Franchise waitlist page | S | Dedicated Kit.com page for Enduro/XCO/BMX/Road interest. |
| 10 | 34 | Rider name signals in content filter | S | Use riders.csv for +3 keyword boosts. Deferred. |
| 12 | 17 | Data viz / splits analysis | XL | Someday. Sector gap charts. Depends on #16. |
| 13 | 12 | Merch | L | Trademark situation. Contact larryaaa2000@yahoo.com. |

---

## Backlog Item Details

### #36b — 2024 results proper fix
**Root cause**: `.rda` import via `rootsandrain_pull.py` pulled semi-finals as finals for at least Fort William, Bielsko-Biała, Les Gets. Women's data absent entirely.

**Fix** (updated — no longer needs PDFs or Worker): Use the UCI JSON API directly. The slug pattern is the same as 2026 but with `2024-` prefix. Add a `CALENDAR_2024` array to `results-fetcher.mjs` and run per venue. E.g.:
```
node scripts/results-fetcher.mjs fort-william-2024
```
Verify slugs work before adding all venues (UCI may use different venue names for 2024).

**Also needed**: Season pill hides 2024 until data returns (handled by #36a already).

### #37 — Pits tab
**Nav label**: PITS (short, fits mobile). Full nav becomes: FEED / RESULTS / RIDERS / PITS.
**Sections inside the tab:**
1. **How to Watch** — geography-organized streaming options. Pulled from `public/watch.json`. Updated once per season, no deploy needed beyond cache.
2. **Teams** — factory teams with IG + YouTube links. Pulled from `public/directory.json`.
3. **Media** — Pinkbike, Vital, Fast as French, WynTV, Martin Whiteley, Inside the Tape. Same file.
4. **UCI Official** — results page, calendar, athlete database. Same file.
**Riders NOT included** — Riders tab stays separate at top-level nav. Too valuable and interactive to bury.
**Data files to create:**
- `public/watch.json` — structure:
```json
{
  "lastUpdated": "2026-03-01",
  "regions": [
    {
      "region": "North America",
      "options": [
        { "name": "Red Bull TV", "url": "...", "cost": "free", "notes": "Best free option" },
        { "name": "FloBikes", "url": "...", "cost": "subscription", "notes": "Most reliable" }
      ]
    }
  ]
}
```
- `public/directory.json` — teams + media links, semi-static, update per season
**Maintenance**: `watch.json` updated once per season. `directory.json` updated when teams change rosters or new media channels emerge.
**Done when**: PITS tab renders with all 4 sections, outbound links work, how-to-watch organized by geography.

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
