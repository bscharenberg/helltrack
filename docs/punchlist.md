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
- R1 South Korea, R2 Loudenvielle, R3 Leogang results live
- Results fetcher workflow: race-day crons + 30-min polling backstop. Auto-commit fixed 2026-06-14 (see `docs/decisions.md`) — the old commit step `git stash`/`pop`'d around the rebase, which unstaged the `git add`, so `git diff --staged --quiet` was always true and results were fetched then silently dropped. Now commits first, then rebase-and-push with retries.
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
- Rider search view in RESULTS tab — diacritic-normalized lookup across all seasons, picker for ambiguous matches, full history table (#8)

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
| 8 | ~~Rider search in results~~ | — | Done | ~~Filter results.json for a rider name, show rank/time/gap across all rounds~~ — new "Search" sub-view in RESULTS tab, diacritic-normalized lookup across all 16 seasons, picker for ambiguous matches, full history table sorted most recent first (2026-06-12, `69d5bc1`). |
| 9 | Rider comparison | M | Low | Two rider searches side by side. Depends on #8 (done). |
| 10 | Season standings / points table | M | Low | Points per round already in results.json. Aggregate into standings view by season. |
| 42 | ~~Rider-primary search: venue-grouped history cards~~ | — | Done | ~~Group a rider's results by venue~~ — search results now render as venue-grouped cards (most-recent visit first), finals rank as the headline (acid yellow for P1 w/ absolute time, gray + gap otherwise), DNF/DNS/DSQ as a red badge, Q1/Q2/points collapsed behind a tap-to-expand chevron (2026-06-14, `index.html`). |
| 43 | Venue conditions tagging | S | Low | Hand-entered `conditions` enum (`dry`/`wet`/`mixed`/`dusty`/`hot`) + optional `conditionsNote` free text per round in results.json, shown as a muted chip on the venue/year row. Data + display only, no filtering UI yet. Full spec in "Pending PBIs — fantasy picking" below. |
| 44 | Venue cross-year view + rider↔venue loop | M | Medium | Depends on #42. Selecting a venue in Results adds a cross-year top-5 podium stack (respects gender/session toggles, reuses podium styling); the rider card's venue-name tap (from #42) deep-links into it, with back-navigation returning to the rider's search results. Full spec in "Pending PBIs — fantasy picking" below. |
| 33b | ~~Thumbs-down filter feedback~~ | — | Dropped | Filter is clean enough. GA card_open provides sufficient signal. |

### Notes on backlog items
- **#36b / #34**: Combine these — formal audit of 2024 (and now 2009-2023) winners against authoritative sources is still open, though spot-checks during ingest found no errors.
- **#37/#38/#39**: Surfaced by the 2009–2024 DataRide backfill completeness audit (2026-06-10) — see `docs/historical-data.md` §9 for full detail.
- **#41**: Confirm `maxresdefault.jpg` exists for most videos before building — falls back to `hqdefault.jpg` if not.
- **Tire/setup data** (research note, not a PBI) — no clean structured source exists; revisit only if one appears, otherwise too sparse/manual to be worth building.

---

## Pending PBIs — fantasy picking (rider/venue) batch

Three sequenced PBIs aimed at the "fantasy team picking" use case: is this rider
consistent across venues, and who performs well at a given venue. #42 and #44 are
sequenced (#44 depends on #42); #43 is independent.

### PBI 1 (#42) — Rider-primary search: venue-grouped history cards — done (2026-06-14)

**What:** Replace the flat session-list output of rider search with venue-grouped cards where finals rank is the visual headline.

**Shipped as:** `groupRiderByVenue()`, `pickVisitHeadline()`, `renderVisitRow()`, `renderVenueCard()`, `toggleRvcVisit()` + `.rvc-*` CSS classes in `index.html`. `renderRiderSearchResults()` now calls `renderVenueCard()` per venue group instead of building a flat table.

**Note for PBI 3 (#44):** the venue-name element in each card (`.rvc-venue-name`) is plain text with no click handler yet — #44's "wire the venue-name tap" step needs to add that onclick to navigate into the cross-year view.

**Why:** Searching a rider is a fantasy-vetting move — "is this rider consistent across venues, or a one-track wonder?" A flat list of every session weights a Q2 run equally with a finals win, so nothing reads. Grouping by venue with finals rank as the loud element answers the real question at a glance.

**Logic:**
- Group a rider's results by venue, then sort visits within each venue most-recent-year first.
- Per venue block: venue name header + visit count; one row per year showing finals rank (large, acid yellow `#d4f500` for a win/P1, gray `#ccc` otherwise) + session label + time (P1 absolute time, others gap `+x.xxx`).
- Collapse Q1/Q2/splits/bib/points behind a tap — not shown on first render. Expand affordance is a chevron/details target on the row, distinct from the venue-name tap (see PBI 3/#44).
- DNF/DNS/DSQ in finals: show as the headline with a red `DNF` badge — never substitute a better session. (Honesty principle; matches your audience.)
- Default venue-block sort: most-recent-visit first.

**File:** `index.html` (search render logic + CSS). No data changes — reads existing `public/results.json`.

**Done when:**
- Searching a rider returns venue-grouped cards, not a flat session list.
- Finals rank is the dominant visual element; a P1 is acid yellow.
- Each venue shows the rider's cross-year trajectory (e.g. Leogang: 1 / 4 / 2) readable without parsing dates.
- Q1/Q2/splits are hidden until expanded.
- A DNF season shows DNF as headline with red badge, no fabricated better number.

### PBI 2 (#43) — Venue conditions tagging (structured tag + optional note)

**What:** Add a hand-entered conditions field to each round so results can eventually be filtered by track state.

**Why:** Fantasy picking needs "who's good in the mud / heat." This data isn't in the UCI API, but it's trivial to hand-tag (~10 rounds/year). Structured so it's filterable later; with a free-form note for human detail.

**Logic:**
- Add to each round object in `results.json`: `conditions` (enum string, one of `dry`/`wet`/`mixed`/`dusty`/`hot`) and optional `conditionsNote` (free string for texture, e.g. "rained overnight, dried by finals").
- Both optional — absence renders nothing, no layout break.
- Display: small muted condition chip on the venue/year row in both rider and venue views; note shown only in expanded state.
- No filtering UI yet — this PBI only lands the data + display. Filtering is a follow-on once tags exist across enough rounds.

**File:** `public/results.json` (schema + hand-entered values), `index.html` (chip display).

**Done when:**
- A round can carry a `conditions` enum value (`dry`/`wet`/`mixed`/`dusty`/`hot`) and an optional `conditionsNote`.
- Tagged rounds show a condition chip; untagged rounds render normally.
- Enum (not free text) drives the chip, so future filtering can key off it directly.

### PBI 3 (#44) — Venue cross-year view + the rider↔venue loop

**What:** Extend the Results tab so a selected venue can show a cross-year podium stack, and wire the rider card's venue header to deep-link into it.

**Why:** The other fantasy moment — "I'm filling the Leogang slot, who performs here?" The Results tab already answers single-year venue results; this adds the multi-season stack ("last 5 years at Leogang") and makes the rider→venue→rider round-trip fast, which is how someone actually picks a team.

**Logic:**
- In Results, when a venue is selected, add a cross-year view: for the active gender + session, stack each year's top 5 (reuse existing podium styling).
- Respect existing gender + session toggles (this is why venue data lives in Results, not Search — it needs those controls).
- Wire the rider card's venue-name tap (#42) to switch to Results, filtered to that venue, in cross-year view. The chevron/expand tap stays inline; the venue-name tap navigates. Two targets, two intents.
- Back-navigation returns to the rider's search results so the picking loop is fast.

**File:** `index.html` (Results tab render + nav state + cross-link wiring).

**Done when:**
- Selecting a venue in Results offers a cross-year podium stack for the active gender/session.
- Tapping a venue name in a rider card lands on that venue's cross-year view.
- Returning gets the user back to their rider search without re-typing.
- Gender/session toggles work in the cross-year view.

---

## Wordmark/icon batch — done (2026-06-12)

All three PBIs shipped:
- **PBI 1** — `/og-image.png` swapped to designer's final chainsaw-as-T HELLTRACK lockup (1200×630). (`944819f`)
- **PBI 2** — Header icon swapped to rounded-corner chainsaw, recolored `#ceff00`→`#d4f500`, 40px, PWA home-screen icons (`icon-192.png`/`icon-512.png`) untouched. New asset `icon-round-192.png`. (`c179996`)
- **PBI 3** — Header "HELLTRACK" text replaced with inline SVG wordmark (white `#ffffff`, 26px height, `role="img"`/`aria-label`/`<title>` for a11y), subtext unchanged, SW cache bumped `helltrack-v3`→`helltrack-v4`. (`2416bfe`)

**Eyeball check (post-PBI 3)**: `HT-Wordmark.svg` is plain white "HELLTRACK" lettering — no embedded chainsaw, no `#d4f500` accent. The rounded chainsaw icon (PBI 2) is the only chainsaw in the header, so there's no redundancy. Kept both icon and wordmark.

---

## Race Calendar 2026 (reference)
| Round | Venue | Qual | Finals | Slug | Results |
|---|---|---|---|---|---|
| R1 | Mona YongPyong | 2026-04-30 | 2026-05-01 | race-of-south-korea-2026 | ✅ |
| R2 | Loudenvielle | 2026-05-23 | 2026-05-28 | loudenvielle-2026 | ✅ |
| R3 | Leogang | 2026-06-12 | 2026-06-13 | leogang-2026 | ✅ |
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
