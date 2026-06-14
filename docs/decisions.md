# Helltrack — Decisions, Learnings, and What Not To Do

## What Worked

### YouTube API: uploads playlist over search.list
- **Decision**: Use uploads playlist endpoint (1 unit/channel) not search.list (100 units/channel)
- **Why**: With 14 channels, search.list would cost 1,400+ units/hourly run = 33,600/day, blowing the 10,000/day free quota instantly
- **How**: Each channel has an uploads playlist ID = channel ID with UC→UU prefix swap

### Cloudflare Worker for Pinkbike RSS
- **Problem**: Direct fetch of Pinkbike RSS returns 403 (Cloudflare bot protection)
- **Solution**: A Cloudflare Worker proxies the request — Cloudflare trusts Cloudflare
- **Worker URL**: helltrack-rss.scharenbergs.workers.dev/?url=[encoded_url]
- **Important**: Worker has an allowlist — must add new domains explicitly

### Node 18+ native fetch — node-fetch no longer needed
- Node 18+ includes `fetch` globally — no package required
- `node-fetch` has been removed from dependencies
- All scripts use native `fetch` directly
- Note: node-fetch@2 was previously used for CommonJS compatibility; if ever rolling back to older Node, use node-fetch@2 (not v3+ which is ESM-only)

### UCI JSON API for results (replaced PDF pipeline)
- **Decision**: Fetch race results from the UCI JSON API directly instead of parsing ChronoRace PDFs
- **Why**: The API returns clean structured JSON — no PDF download, no text extraction, no decompression, no name-deduplication hacks
- **Architecture**: results-fetcher.mjs POSTs to `https://www.ucimtbworldseries.com/api/race-results` with `{"slug": "2026-{venue}-{gender}-elite-dhi-{session}"}` — no auth needed
- **Consequence**: helltrack-results Worker (Browser Rendering) was retired and deleted, Cloudflare Workers Paid plan downgraded to free ($5/mo saved)
- **Historical data caveat**: The UCI API only covers recent seasons. 2024 data was imported from downhillr .rda files. 2015–2023 is a future backlog item.

### downhillr .rda files for 2024 historical data
- **Problem**: 2024 results needed before the UCI API approach was in place
- **Solution**: `pyreadr.read_r(path)` reads R's binary .rda format without R installed — returns dict, first value is DataFrame
- **Caveat**: Some results may be inaccurate (e.g. wrong P1 found at Bielsko-Biała) — manual verification needed

### Tab ID collision bug
- **Problem**: Feed category for Ben Cathro / analysis content has internal key `results` in cache.json. Adding a Results tab with `id:'results'` caused Analysis tab to trigger the results view.
- **Solution**: Use `id:'standings'` internally for the Results tab — label shows "Results" but code checks `activeTab === 'standings'`
- **Lesson**: Never use internal keys that could collide with data-layer keys

### Results nav in sticky header
- **Problem**: Results nav rows (year/venue/field/session) rendered inside #results-view, so they scrolled away and left a gap when user scrolled
- **Solution**: Move nav rows into #header with `display:none` by default, show/hide via JS when tab switches
- **Lesson**: Anything that needs to stay visible on scroll must be inside the sticky header element

### XCO filtering — weight must overpower all boosts
- **Problem**: XCO videos from trusted UCI channel were passing filter because: trusted source boost (4) + "world cup" in tags (2) + "mona yongpyong" venue (4) = 10, exceeding the 10-point XCO exclude penalty
- **Solution**: XCO exclude weight raised to 15, "mtbws highlights" (without dhi) gets -8 separately
- **Lesson**: When a trusted channel posts mixed content, the exclude weight must exceed the sum of ALL possible boosts for that channel

### Shorts detection — duration-based, not thumbnail aspect ratio
- **Problem**: YouTube Shorts were appearing in the main feed and claiming the hero position
- **Attempted**: Thumbnail aspect ratio (thumbnailHeight > thumbnailWidth) — doesn't work because YouTube always returns landscape `maxresdefault.jpg` (1280×720) for ALL videos including Shorts
- **Solution**: Duration-based detection via `videos.list` with `contentDetails` part — ISO 8601 duration ≤60s = Short. Applied to all channels after each channel fetch in `youtube-fetcher.js`
- **Secondary signal**: Portrait thumbnail (height > width) kept as fallback for any non-YouTube sources where aspect ratio may be reliable
- **Additional fix**: Hero card logic skips Shorts; `applySeenState()` covers `.short-card` elements

### Kit.com embed must be static HTML
- **Problem**: Kit.com embed contains its own `<script>` tag and inline styles with quotes
- **Solution**: Must go as static HTML in the body — never inject via JS template literals (backticks/quotes in the embed break JS strings)
- **Placement**: After ~20 feed cards (mid-feed, not bottom) via insertion at render time

### PITS tab static data approach
- **Decision**: PITS tab data (teams, media, podcasts, UCI links) lives in `public/directory.json` and `public/watch.json` — fetched at runtime, not hardcoded in HTML
- **Why**: JSON is easier to update per season without touching index.html; teams/streaming options change annually
- **Exception**: Media and UCI sections are small enough to inline in HTML if needed, but JSON keeps it consistent

## What Didn't Work

### Sidebar nav on desktop
- **Tried**: Left sidebar with Feed/Results icons for desktop (≥600px)
- **Problem**: Two items in a 64px sidebar looks sparse and broken. Labels floating on the left edge feel undesigned.
- **Decision**: Reverted to full-width top tab bar for both mobile and desktop.

### Bottom nav with app-shell wrapper
- **Tried**: Fixed bottom tab bar wrapping entire content in #app-shell and #main-area divs
- **Problem**: Multiple bugs — sticky header positioning broke, results nav showed on all tabs, Analysis showed results content
- **Decision**: Stripped all of it. Tab bar stays at top.
- **Lesson**: Don't add structural wrapper divs. CSS layout changes cascade in unexpected ways.

### PDF text extraction without pdfjs
- **Tried**: Raw byte extraction of PDF text (BT/ET markers, Tj/TJ operators)
- **Problem**: ChronoRace PDFs use Flate/zlib compression on content streams — raw text extraction finds nothing
- **Solution at the time**: pdfjs-dist handles decompression. Now moot — switched to UCI JSON API.

### Cloudflare Browser Rendering for results (retired)
- **Was**: Cloudflare Worker with Puppeteer scraped ucimtbworldseries.com/results/[slug] for PDF URLs, then results-fetcher.mjs downloaded and parsed the PDFs
- **Why retired**: UCI JSON API provides the same data more cleanly with no infrastructure cost
- **Consequence**: helltrack-results Worker deleted, Workers Paid plan cancelled

### PyPDF/pdf-parse for PDF parsing
- **Tried**: pdf-parse npm package
- **Problem**: Node 24 compatibility issues, quirky exports
- **Solution at the time**: pdfjs-dist. Now moot — no PDFs in the pipeline.

### Puppeteer on GitHub Actions for UCI scraping
- **Considered**: Running Puppeteer headlessly in GitHub Actions CI
- **Problems**: 30-60s spin-up time, flaky in CI, silent failures
- **Decision**: Cloudflare Browser Rendering instead. Then later retired entirely in favor of the JSON API.

### `git stash` around a rebase silently drops staged changes (results auto-commit, fixed 2026-06-14)
- **Symptom**: Leogang (R3) results never appeared on the site even though the `fetch-results.yml` workflow ran on race day and every step reported "success." Run logs showed the fetcher pulling all 6 sessions correctly (Finn Iles, Valentina Höll, full podiums) and writing `results.json` — then the commit step printed `no changes added to commit` / `Everything up-to-date` and committed nothing. Happened on **every** race-day run.
- **Root cause**: The commit step did `git add results.json` → `git stash` → `git pull --rebase` → `git stash pop` → `git diff --staged --quiet || git commit`. `git stash pop` restores changes to the working tree **unstaged**, so by the time `git diff --staged --quiet` ran there was nothing staged — it exited 0 (true), the `|| git commit` was skipped, and `git push` had nothing to push. The fetch worked perfectly and was thrown away at the last step. The job exited 0 throughout, so nothing alerted.
- **Fix**: Commit *first*, then rebase. `git add` → bail early if `git diff --staged --quiet` → otherwise `git commit` → then a retry loop of `git pull --rebase origin main && git push`. Once the change is a real commit (not a working-tree change), rebase replays it cleanly on top of remote HEAD — no stash needed. The retry loop absorbs races with the hourly cache-refresh workflow pushing to the same branch (different files, so no content conflict).
- **Also hardened**: the fetcher's "already complete, skip" guard keyed only on `finals-men`; it now requires **both** `finals-men` and `finals-women` before declaring a round done, so a women's final posted a few minutes after the men's still gets picked up on a later polling run.
- **Lesson**: Never `git stash`/`pop` around a rebase to preserve a change you intend to commit — `pop` unstages it. Commit before you rebase. And a CI job exiting 0 is not proof it did its job; gate on the actual artifact (here, an absent commit) not the green check.

## Content Filter Learnings

### MIN_SCORE = 6 with tiered thresholds
- Base threshold: `MIN_SCORE = 6`
- Trusted YouTube channels and RSS articles: threshold = 6
- Untrusted YouTube channels (UCI, Pinkbike YT, Vital etc): threshold = 10 (MIN_SCORE + 4)
- Rationale: untrusted channels have boilerplate descriptions that mention all disciplines — inflation risk is higher

### Category key 'results' in cache.json is "Analysis" in the UI
- The content filter assigns category id `results` to Ben Cathro / Inside the Tape / analysis content
- The UI label is "Analysis" (changed from "Results" to avoid confusion with the Results data tab)
- DO NOT rename the category key in cache.json — it would break the filter

### Category tags are display-only
- Category badges appear on feed cards (~70% accuracy) but there is no filtering by category in the UI
- Feed is flat chronological; badges are informational only

### Venue keywords matter more than discipline
- Adding "south korea" and "yongpyong" to venue list immediately unlocked a flood of relevant content
- Venue names are high-signal because they appear in titles even when discipline isn't mentioned
- Always add new 2026 venue names to the filter when season calendar is known

### "MTBWS HIGHLIGHTS" pattern
- The UCI channel posts: "MTBWS HIGHLIGHTS 🇰🇷 [Gender] Elite [XCO/DHI] | [Year] [Venue]"
- XCO highlights should be filtered; DHI highlights should pass
- Solution: "mtbws highlights" gets -8, "dhi" gets +4, "xco" gets -15
- Added 'mtbws highlights dhi' as a positive term (+8) to counteract the penalty
- Net for DHI highlights: 4(trusted) + 4(dhi) - 8(mtbws highlights) + 8(mtbws highlights dhi) = 8 ✅
- Net for XCO highlights: 4(trusted) - 8(mtbws highlights) - 15(xco) = -19 — correctly dropped ✅

### Paddock/media figure keyword weights
- High-profile DH-only athletes (Bruni, Goldstone, Holl, etc.): weight 6 — passes on name alone
- Paddock figures / legends who post mixed content (Cathro, Minnaar, Kerr, Wyn Masters): weight 2 — requires supporting DH signal to pass
- Ben Cathro was briefly in the +6 rule — caused knee pad product articles to pass (score 8 for RSS). Fixed by moving to +2 only.

## Design Decisions

### Option A (dark, acid yellow) was the right aesthetic
- Tested vs Option B (pure black, blood orange) and Option C (warm paper, gold)
- Option A won: timing-screen energy, matches YT/Commencal/Mondraker brand language
- Acid yellow #d4f500 has subtle 80s neon echo without being garish

### Top 5 with visual weight (not top 3)
- UCI honors top 3 podium officially
- Riders culturally recognize top 5 as significant
- Design: 1-3 get gold/silver/bronze treatment, 4-5 get elevated card style, 6+ in full table

### Names formatted as "Vermette Asa" not "VERMETTE ASA"
- Race result data stores names in ALL CAPS
- formatName() converts: split on space, capitalize first letter, lowercase rest

### Results nav: 4 rows is correct for long-term
- Year → Venue → Field → Session hierarchy supports going back to 1991
- Combining Year + Venue in one scrolling row gets unwieldy at 200+ venues
- Keep them separate even though it looks like a lot of chrome right now

### Rounded pills over sharp corners
- Results selectors and sub-tabs use rounded pills
- Sharp corners were tested and feel like form elements/tables, not navigation
- The timing-screen energy comes from palette and typography, not corner radius

### FREE/PAID badges in PITS → WATCH
- FREE badge: `background: transparent; border: 1px solid #d4f500; color: #d4f500` — earns the acid accent
- PAID badge: `background: transparent; border: 1px solid #888; color: #888` — muted, factual, no alarm

## Deployment Learnings

### Always stash before pull
- GitHub Actions commits cache.json every hour
- Straight `git push` fails if Action ran between your last pull and push
- Pattern: `git stash && git pull --rebase origin main && git stash pop && git push`

### cache.json conflicts during rebase
- Frequent — Actions commits cache.json while you're working
- Resolution: `git checkout --theirs public/cache.json && git add public/cache.json`
- Then continue: `git rebase --continue` or `git stash pop && git push`

### Service worker caches aggressively
- After pushing changes, browser may serve old version for minutes
- Hard refresh (Cmd+Shift+R) forces network fetch
- For testing: unregister service workers in DevTools → Application → Service Workers

### Smart quotes break git commit -m
- Always use single quotes: `git commit -m 'message'`
- macOS autocorrects to smart quotes in some contexts, breaking the shell string

### cp to deploy silently fails
- The `cp ~/Downloads/file.js scripts/file.js` pattern silently fails on this machine
- Always edit files directly on disk using Python string replace in Claude Code

## Things to Research/Consider Later

### Historical data (2015–2023)
- downhillr .rda files available for some years; rootsandrain.com is another source
- Series URLs confirmed: 2025=series2028, 2024=series1831, 2023=series1622, 2022=series1464
- Rootsandrain venue-page approach: rootsandrain.com/venue69/leogang/ shows all years
- Nathan Tomczyk's repo has a proven BS4 scraper: github.com/nathantomczyk/world_cup_downhill_data_science
- 2019-2021 series IDs still need to be identified
- The UCI JSON API may cover some historical seasons — worth checking API depth before scraping

### Rider search / history view
- Data is already structured for it (results.json has rider name/nat per result)
- Filter all rounds for a rider name match, show rank/time/gap at each venue
- Comparison view: two rider searches side by side
- Deferred until more rounds of data are available

### Franchise model
- Core pipeline is mostly config: channel list, keyword weights, venue slugs, results source
- Strongest candidate after DH: Helltrack Enduro (EWS, adjacent culture)
- Prerequisite: prove retention on DH first before expanding
- Decision criteria: returning users week-over-week across multiple race rounds in GA
