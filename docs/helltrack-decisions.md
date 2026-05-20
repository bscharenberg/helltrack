# Helltrack — Decisions, Learnings, and What Not To Do

## What Worked

### YouTube API: uploads playlist over search.list
- **Decision**: Use uploads playlist endpoint (1 unit/channel) not search.list (100 units/channel)
- **Why**: With 11 channels, search.list would cost 1,100 units/hourly run = 26,400/day, blowing the 10,000/day free quota instantly
- **How**: Each channel has an uploads playlist ID = channel ID with UC→UU prefix swap

### Cloudflare Worker for Pinkbike RSS
- **Problem**: Direct fetch of Pinkbike RSS returns 403 (Cloudflare bot protection)
- **Solution**: A Cloudflare Worker proxies the request — Cloudflare trusts Cloudflare
- **Worker URL**: helltrack-rss.scharenbergs.workers.dev/?url=[encoded_url]
- **Important**: Worker has an allowlist — must add new domains explicitly

### node-fetch v2 for CommonJS compatibility
- **Problem**: node-fetch v3+ is ESM only, breaks require() in build scripts
- **Solution**: Always use node-fetch@2 for CJS scripts

### pdfjs-dist for ChronoRace PDF parsing
- **Why pdfjs not pdf-parse**: pdf-parse has Node 24 compatibility issues, quirky exports
- **Import**: Must use ESM (`import * as pdfjsLib from './node_modules/pdfjs-dist/legacy/build/pdf.mjs'`)
- **Script extension**: Must be `.mjs` to use ESM imports
- **Data type**: pdfjs requires `new Uint8Array(arrayBuffer)` not `Buffer`
- **Text duplication**: pdfjs renders each glyph multiple times — consecutive dedup on split tokens

### UCI ID as PDF row anchor
- **Problem**: ChronoRace PDFs have names repeated 4x, inconsistent spacing, mixed case
- **Solution**: UCI ID (10-11 digit number) is unique per rider per row — use as anchor, extract name/rank before it, times/gap/points after it
- **Gotcha**: UCI IDs are 10 OR 11 digits — regex must be `\d{10,11}` not `\d{10}`

### Finish time = largest time in row
- **Problem**: Each row has 4 split times then finish time, all in M:SS.mmm format
- **Solution**: Finish time is always the LARGEST value — reduce by `secs` comparison
- **Don't**: Try to filter by "time > 1 minute" — sector 3 splits can also exceed 1 minute

### Cloudflare Browser Rendering for UCI results page
- **Problem**: ucimtbworldseries.com/results/[slug] is JavaScript-rendered — raw fetch gets no PDF links
- **Solution**: Cloudflare Workers Paid ($5/mo) + Browser Rendering API + @cloudflare/puppeteer
- **Architecture split**: Worker only scrapes PDF URLs (fast, no CPU limit hit), GitHub Actions downloads and parses PDFs (no CPU limit)
- **Why split**: Parsing 11 PDFs in one Worker request hits Cloudflare CPU time limit (Error 1102)

### pyreadr for downhillr .rda files
- **Problem**: downhillr historical data is in R's binary .rda format
- **Solution**: `pip install pyreadr` reads .rda without R installed
- **Usage**: `pyreadr.read_r(path)` returns dict, first value is the DataFrame

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

## What Didn't Work

### Sidebar nav on desktop
- **Tried**: Left sidebar with Feed/Results icons for desktop (≥600px)
- **Problem**: Two items in a 64px sidebar looks sparse and broken. The labels "FEED" and "RESULTS" floating on the left edge feels undesigned.
- **Decision**: Reverted to full-width top tab bar for both mobile and desktop. Simple is better.

### Bottom nav with app-shell wrapper
- **Tried**: Fixed bottom tab bar (Feed/Results) wrapping entire content in #app-shell and #main-area divs
- **Problem**: Introduced multiple bugs — sticky header positioning broke (top:53px leaked), results nav showed on all tabs, Analysis showed results content
- **Decision**: Stripped all of it. Results tab in the horizontal scrolling tab bar, second position after All.
- **Lesson**: Don't add structural wrapper divs unless absolutely necessary. CSS layout changes cascade in unexpected ways.

### PDF text extraction without pdfjs
- **Tried**: Raw byte extraction of PDF text (BT/ET markers, Tj/TJ operators)
- **Problem**: ChronoRace PDFs use Flate/zlib compression on content streams — raw text extraction finds nothing
- **Solution**: pdfjs-dist handles decompression properly

### Parsing PDF by rank number regex
- **Tried**: Matching "1." or "P 2." rank patterns in text
- **Problem**: The repeated name text (4x) confused the lazy quantifier in the name capture group. The `/` in team names like "COMMENCAL/MUC-OFF" wasn't matched by `[\w\s\-'.]+?`
- **Solution**: Use UCI ID as anchor instead — it's unique, unambiguous, always present

### Puppeteer on GitHub Actions for UCI scraping
- **Considered**: Running Puppeteer headlessly in GitHub Actions CI to scrape ucimtbworldseries.com
- **Problems**: 30-60s spin-up time, Puppeteer in CI is flaky, silent failures
- **Decision**: Cloudflare Browser Rendering is purpose-built for this, more reliable, $5/mo

### PyPDF/pdf-parse for PDF parsing
- **Tried**: pdf-parse npm package
- **Problem**: Node 24 compatibility issues, quirky exports (not a function error)
- **Solution**: pdfjs-dist

## Content Filter Learnings

### MIN_SCORE = 4 is correct
- With BOOST_SCORE = 4 for trusted channels, a trusted channel video needs 0 additional keyword matches
- Non-trusted sources need at least 4 points from keywords alone
- This correctly lets Jack Moir / Bernard Kerr vlogs through while filtering noise from GoPro etc.

### Category key 'results' in cache.json is "Analysis" in the UI
- The content filter assigns category id `results` to Ben Cathro / Inside the Tape / analysis content
- The UI label is "Analysis" (changed from "Results" to avoid confusion with the Results data tab)
- DO NOT rename the category key in cache.json — it would break the filter

### Venue keywords matter more than discipline
- Adding "south korea" and "yongpyong" to venue list immediately unlocked a flood of relevant content
- Venue names are high-signal because they appear in titles even when discipline isn't mentioned
- Always add new 2026 venue names to the filter when season calendar is known

### "MTBWS HIGHLIGHTS" pattern
- The UCI channel posts: "MTBWS HIGHLIGHTS 🇰🇷 [Gender] Elite [XCO/DHI] | [Year] [Venue]"
- XCO highlights should be filtered; DHI highlights should pass
- Current solution: "mtbws highlights" gets -8, "dhi" gets +4, "xco" gets -15
- Net for DHI highlights: 4(trusted) + 4(dhi) - 8(mtbws highlights) = 0 — FAILS
- Fix needed: add 'mtbws highlights dhi' as a positive term to counteract

## Design Decisions

### Option A (dark, acid yellow) was the right aesthetic
- Tested vs Option B (pure black, blood orange) and Option C (warm paper, gold)
- Option A won: timing-screen energy, matches YT/Commencal/Mondraker brand language
- Acid yellow #d4f500 has subtle 80s neon echo without being garish

### Top 5 with visual weight (not top 3)
- UCI honors top 3 podium officially
- Riders culturally recognize top 5 as significant
- Design: 1-3 get gold/silver/bronze treatment, 4-5 get elevated card style
- 6+ go in the full results table below

### Names formatted as "Vermette Asa" not "VERMETTE ASA"
- ChronoRace PDFs store names in ALL CAPS
- formatName() converts: split on space, capitalize first letter, lowercase rest
- Edge cases: compound names, accents — acceptable for now

### Results nav: 4 rows is correct for long-term
- Year → Venue → Field → Session hierarchy supports going back to 1991
- Combining Year + Venue in one scrolling row gets unwieldy at 200+ venues
- Keep them separate even though it looks like a lot of chrome right now

## Deployment Learnings

### Always `git pull --rebase origin main && git push`
- GitHub Actions commits cache.json every hour
- Straight `git push` fails if Action ran between your last pull and push
- `git pull --rebase` is the safe pattern every time

### Service worker caches aggressively
- After pushing new cache.json, browser may serve old version for minutes
- Hard refresh (Cmd+Shift+R) forces network fetch
- For testing: unregister service workers in DevTools → Application → Service Workers

### GitHub Pages serves from /public folder on main branch
- The folder picker in GitHub Pages settings sometimes fails to show /public
- If it doesn't appear, the root (/) setting with index.html at root works fine
- We moved all PWA files (index.html, manifest.json, service-worker.js, icons) to repo root

### Manifest start_url must match actual URL
- During GitHub Pages era: `/helltrack/`
- After custom domain: `/`
- Service worker scope must match

### Smart quotes break git commit -m
- Always use single quotes for commit messages in terminal: `git commit -m 'message'`
- macOS autocorrects to smart quotes in some contexts, which breaks the shell string

## Things to Research/Consider Later

### Rootsandrain historical data (2015-2023)
- Series URLs confirmed: 2025=series2028, 2024=series1831, 2023=series1622, 2022=series1464
- Existing Python scraper in scripts/rootsandrain_pull.py
- Venue-page approach preferred: rootsandrain.com/venue69/leogang/ shows all years
- Nathan Tomczyk's repo has a proven BS4 scraper: github.com/nathantomczyk/world_cup_downhill_data_science

### Rider search / history view
- data is already structured for it (results.json has rider name/nat per result)
- Filter all rounds for a rider name match, show rank/time/gap at each venue
- Comparison view: two rider searches side by side
- Deferred until 3+ rounds of 2026 data available

### iOS install prompt
- `beforeinstallprompt` only fires on Android Chrome
- iOS Safari requires manual: Share → Add to Home Screen
- Need a small banner or instructions for iOS users

### Content categories — potential future additions
- WynTV (Wyn Masters) — not currently in channel list
- Roots and Rain results — structured results data
- Martin Whiteley (@captain23mw) — stats/historical context
