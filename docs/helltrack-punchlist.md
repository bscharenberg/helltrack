# Helltrack — Product Backlog & Punch List

**Last updated**: 2026-05-23

## Current State: LIVE ✅
- helltrack.app is live with HTTPS
- Hourly cache refresh running clean (stash/pop bug fixed)
- Results tab with 2024-2025-2026 data
- Fox Factory + Frameworks Bicycles channels in pipeline
- Fox Factory channel ID: UCN_B2-bdBtmAq-5TOEU63nQ (trusted/boosted)
- Frameworks Bicycles channel ID: UCiCWNsaEx9swRaCe55XMAuw (filter decides)
- Jack Moir removed from channels (enduro, not DH)
- Content filter clean: UCI channel de-trusted, enduro/XCO excludes solid, category routing fixed
- Feed routing correct: News 1 item, Paddock 16 items, all DHI content passing
- Flat chronological feed with category badges on cards
- Nav: FEED / RESULTS / RIDERS
- Subhead: "DOWNHILL RACING"
- Seen/watched state on cards (dims after Watch or Read clicked)
- Riders tab live — 154 men, 62 women, IG outbound links, Men/Women toggle
- riders.csv source of truth in scripts/, build-riders.js script added
- PWA icon: handed off to designer (192x192 + 512x512 PNG needed)
- ⚠️ Security hardening needed before weekend launch — see #29

---

## Vision / Franchise
Helltrack is the template for a family of discipline-specific racing apps. Each follows the same curation model — one clean destination for fans of that discipline, zero noise. Potential franchise: Downhill Racing (Helltrack), Enduro Racing, XCO Racing, BMX Racing, etc.

Prereq: Helltrack brand cleaned up to "DOWNHILL RACING" first. No enduro language, no scope creep. Sharp identity is what makes the franchise model credible.

---

## Design Decisions

### Helltrack = UCI DH only (locked May 23, 2026)
Helltrack covers UCI Downhill racing exclusively — no EWS/enduro, no freeride, no slopestyle, no XCO, no trail riding, no road, no BMX. This applies to:
- Content filter: any non-DH content must be excluded regardless of source
- Results data: DH World Cup and World Championships only — no enduro results
- Riders tab: UCI DH license holders only
- Future features: all scoped to DH

If a channel posts mixed content (e.g. UCI MTB World Series), only DHI content passes. The exclude weight for XCO and enduro must always overpower any positive signals.

### Aesthetic
- Dark #111 background, acid yellow #d4f500 accent
- Barlow Condensed typography, bold, all caps for labels
- Timing-screen / race-plate energy — not lifestyle, not outdoor adventure
- Mobile-first, full-width on desktop, no artificial constraints

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
- Content filter rounds 3-5 — full scope lockdown (#31) ✅
  - UCI MTB World Series removed from TRUSTED_SOURCES
  - Venue keyword weight dropped 4→2
  - Enduro terms flipped from INCLUDE (+5) to EXCLUDE (-8)
  - Added elite dhi/junior dhi as include terms at weight +10
  - Category routing fixed: News 20→1, Paddock 2→16
  - All UCI XCO/enduro/lifestyle drops cleanly
  - All DHI highlights, full races, junior races pass and route correctly
- South Korea / YongPyong venue keywords
- B Line + UCI DHI highlights surfacing
- MTBWS DHI highlights scoring fixed ✅
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
| 2 | 29 | Security hardening | M | Pre-launch checklist. See docs/helltrack-security.md. |
| 3 | 35 | Rename Paddock → Pits | XS | Display label only. Internal key stays `paddock`. Two-line change in index.html and content-filter.js. |
| 4 | 33 | Passive click signal via GA4 | S | Fire card_open GA event on bottom sheet open. 3 lines of JS. |
| 5 | 28b | Rider search | S | Search field at top of Riders tab, filters list as you type. Stage 2 of #28. |
| 6 | 28c | Fantasy team picker | M | Pick up to 6 riders, localStorage, bubbles to top. Stage 3 of #28. |
| 7 | 32 | Email subscriber list + franchise waitlist | S | 32a: Helltrack update list (Kit.com). 32b: Franchise interest waitlist by discipline. |
| 8 | 30 | Teams tab | M | New tab: factory teams with IG links + roster. Needs scoping — see details below. |
| 9 | 7 | Real PWA icon | S | Handed off to designer. Waiting on 192x192.png and 512x512.png. |
| 10 | 5 | Rootsandrain historical data 2015-2023 | L | UCI DH World Cup only — no enduro. Scraper exists at scripts/rootsandrain_pull.py. |
| 11 | 15 | Full historical results 1990s+ | L | Extends #5 back to ~1991. Do after #5 is clean and merged. |
| 12 | 10 | Season standings | M | Aggregate points across rounds for overall championship standings. |
| 13 | 16 | Split times frontend | M | Show sector splits per rider in results table. Mobile first. |
| 14 | 8 | Rider search in results | M | Search by rider name across all results.json. Career results table. |
| 15 | 9 | Rider comparison | M | Two rider searches side by side. Depends on #8. |
| 16 | 33b | Thumbs-down feedback button | S | "Not relevant" on bottom sheet fires GA event. Depends on #33. |
| 17 | 34 | Rider name signals in content filter | S | Use riders.csv to generate +3 keyword boosts at build time. Deferred until post-Loudenvielle data in. |
| 18 | 14 | Where to watch / live streams | M | Official stream links by geo + guide for unofficial streams. |
| 19 | 17 | Data viz / splits analysis | XL | Someday/maybe. Sector-by-sector gap charts. Depends on #16. |
| 20 | 12 | Merch | L | Trademark situation. Contact larryaaa2000@yahoo.com or design around "Helltrack.app" branding. |

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

### #35 — Rename Paddock → Pits
- Change display label from "Paddock" to "Pits" in `index.html` and `content-filter.js`
- Internal category key stays `paddock` throughout — do not rename the key
- Add a comment at both change points: `// display label is "Pits" — internal key stays 'paddock'`
- Two-line change, low risk

### #33 — Passive click signal via GA4
**File needed**: `index.html` — find bottom sheet open handler, add 3 lines.

```javascript
gtag('event', 'card_open', {
  video_id: item.id,
  channel: item.channelName,
  category: item.category,
  score: item.score
});
```

**Done when**: `card_open` events appear in GA4 Realtime when tapping cards on helltrack.app.

### #33b — Thumbs-down feedback button (depends on #33)
- Small "not relevant" button on bottom sheet
- One tap fires: `gtag('event', 'card_thumbsdown', { video_id, channel, category, score })`
- No backend — GA is the database
- Review monthly, use to identify new exclude terms for content filter

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
- **32a**: Helltrack update list — Kit.com (free tier), linked from helltrack.app
- **32b**: Franchise interest waitlist — discipline selector (Enduro / XCO / BMX / Road)
- Both Kit.com hosted — no backend, no build chat needed
- helltrack.app needs a small "Stay in the loop" link pointing to the form

### #30 — Teams tab
**Needs scoping before building. Open questions:**
- Team data source: from results.json (changes year to year) or static teams.json?
- Scope: factory teams only or all teams including privateers?
- Nav position: FEED / RESULTS / RIDERS / TEAMS?
- Rider-team linkage: most recent result or manually curated?

### #7 — PWA icon
- Handed off to designer
- Waiting on: 192x192.png and 512x512.png
- When received: drop both into repo root
- `git add icon-192.png icon-512.png && git commit -m 'new PWA icon' && git pull --rebase origin main && git push`

### #34 — Rider name signals in content filter
- Use `scripts/riders.csv` to generate a list of rider last names as +3 include keywords at build time
- Inject into `INCLUDE_KEYWORDS` dynamically in `build-cache.js` or `content-filter.js`
- Deferred until post-Loudenvielle — evaluate feed quality with current filter first
- If implemented: last names only (not full names), weight +3, no impact on XCO/enduro excludes

### Riders roster maintenance
- Source of truth: `scripts/riders.csv`
- To update: edit CSV, run `node scripts/build-riders.js`, commit both files
- `git add scripts/riders.csv public/riders.json && git commit -m 'update riders roster'`

### #5 — Rootsandrain historical data 2015-2023
**Scope: UCI DH World Cup only — no enduro results.**
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
