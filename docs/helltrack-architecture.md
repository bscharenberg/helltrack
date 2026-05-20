# Helltrack — Architecture Reference

## Identity
- **App name**: Helltrack
- **Tagline**: "Me, I ride for me." — Cru Jones, RAD (1986)
- **Domain**: helltrack.app (registered Porkbun, ~$15/yr renewal)
- **Purpose**: UCI downhill and enduro race content aggregator + historical results database
- **GitHub**: github.com/bscharenberg/helltrack
- **Local path**: ~/Documents/Bryon Knowledge Base/Helltrack/

## Hosting (all free except domain)
| Service | Purpose | URL |
|---|---|---|
| GitHub Pages | Static hosting | bscharenberg.github.io/helltrack |
| GitHub Actions | Hourly cache refresh CI/CD | .github/workflows/refresh.yml |
| Cloudflare Worker (free) | Pinkbike RSS proxy | helltrack-rss.scharenbergs.workers.dev |
| Cloudflare Workers Paid ($5/mo) | UCI results page scraper (Browser Rendering) | helltrack-results.scharenbergs.workers.dev |
| Google Analytics | Usage tracking | G-4EY22R6D2J |
| Google Forms | User feedback | https://forms.gle/sRySzSFzzwDyKNrWA |

## Content Pipeline

### Sources
- **11 YouTube channels** via uploads playlist API (1 unit/channel vs 100 for search.list)
- **Pinkbike RSS** via Cloudflare Worker proxy (direct fetch returns 403)

### YouTube Channels
| Channel | ID |
|---|---|
| UCI MTB World Series | UCWS4nfoou79mwo9nHew49fA |
| Pinkbike | UCuGFMHThJdIwJRWHFN9lNvA |
| Red Bull Bike | UCblfuW_4rakIf2h6aqoNnkQ |
| GoPro Bike | UCqhnX4ZMpkCyozvguSEMtxg |
| Sleeper Collective | UCuuLS5B9JraqXiKfYPIBNEw |
| Jack Moir | UCd77cWCYmO6alSLXXRHMoqw |
| Bernard Kerr | UCOYc6SI_fVrNvoutot7D9IA |
| Santa Cruz Syndicate | UCCb8I3PHEUFPV0Jds0-_eig |
| Commencal | (in fetcher) |
| Vital MTB | (in fetcher) |
| Downtime Podcast | (in fetcher) |

### Scripts (in scripts/)
- `youtube-fetcher.js` — uploads playlist approach, 1 unit/channel
- `rss-fetcher.js` — Pinkbike RSS via Worker proxy + xml2js for RSS 0.91 parsing
- `content-filter.js` — keyword scoring (MIN_SCORE=4), category assignment
- `build-cache.js` — orchestrates fetch→filter→write public/cache.json
- `results-fetcher.mjs` — ESM, fetches PDF URLs from Worker, parses ChronoRace PDFs
- `debug-pdf.js` — debugging utility

### GitHub Actions
- **refresh.yml** — hourly cron, runs build-cache.js, commits cache.json
- Uses secrets: YOUTUBE_API_KEY, PINKBIKE_PROXY
- Quota: ~264 units/day of 10,000 limit

## Results Pipeline

### Architecture
1. `helltrack-results` Cloudflare Worker (Browser Rendering + Puppeteer) scrapes ucimtbworldseries.com/results/2026/[venue-slug] → returns all PDF URLs as JSON
2. `results-fetcher.mjs` calls Worker, downloads each PDF, uses pdfjs-dist to extract text, detects session type from header, parses ChronoRace results using UCI ID (10-11 digits) as row anchor
3. Writes to public/results.json

### Key parsing insights
- UCI IDs are 10-11 digits (variable — some riders have 11)
- Finish time = LARGEST M:SS.mmm value in each row (splits are smaller cumulative values)
- pdfjs-dist renders each glyph multiple times — use consecutive dedup on tokens
- Use `.mjs` extension for results-fetcher to get ESM imports working with pdfjs-dist
- pdfjs-dist requires Uint8Array not Buffer

### ChronoRace PDF format
```
1.   27 VERMETTE Asa [repeated 4x] FRAMEWORKS RACING / TRP 10130091229   USA   2007   47.383 (3)   0:35.618 (9)   1:07.007 (2)   1:46.930 (2)   2:25.301 (1)   2:43.301   +0.000   200
```
- Name repeated 4 times due to PDF rendering layers
- Splits come first (0:XX format), finish time is last and largest
- Points use a different scale than World Cup rounds vs finals

### 2026 Calendar Slugs
```
race-of-south-korea-2026, loudenvielle-2026, leogang-2026, lenzerheide-2026,
la-thuile-2026, pal-arinsal-2026, les-gets-2026, val-di-sole-2026,
whistler-2026, lake-placid-2026
```

## Data Files

### public/cache.json
Generated hourly by GitHub Actions. Structure:
```json
{
  "builtAt": "ISO timestamp",
  "categories": {
    "race-runs": { "id": "race-runs", "label": "Race runs", "items": [...] },
    "results": { ... },
    "films": { ... },
    "paddock": { ... },
    "news": { ... }
  }
}
```
Each item: title, url, thumbnail, publishedAt, source, channelId, channelName, description, score, category, type

### public/results.json (613 KB)
Multi-season structure:
```json
{
  "lastUpdated": "ISO timestamp",
  "seasons": {
    "2024": { "rounds": [...] },
    "2025": { "rounds": [...] },
    "2026": { "rounds": [...] }
  }
}
```
Each round: venue, slug, date, round, year, type, sessions{}
Sessions: finals-men, finals-women, qualifying-1-men, qualifying-1-women, qualifying-2-men, qualifying-2-women, finals-junior-men, finals-junior-women
Each result: rank, bib, name, nat, team, time, gap, points, splits{s1-s4}, dnf/dns/dsq flags

## Frontend: index.html (root folder)

### Design
- Dark #111 background, acid yellow #d4f500 accent
- Barlow Condensed typography
- Mobile-first, max-width implied by content

### Navigation
- Horizontal scrolling tab bar: All | Results | Race runs | Analysis | Films | Paddock | News
- "Results" tab (internally id='standings' to avoid collision with feed category id='results')
- Results nav: 4 sticky rows in header (Year | Venue | Elite Men/Women | Finals/Q1/Q2)
- Results nav hidden by default, shown only when Results tab active

### Feed features
- Hero card (first item per category) + compact row cards
- Bottom sheet preview on tap: thumbnail, title, description, venue/discipline detection, source-aware CTA
- Swipe down or tap outside to dismiss sheet
- Lazy image loading

### Results features
- Season selector (2024/2025/2026 pills)
- Round selector pills (scroll horizontally)
- Elite Men / Elite Women toggle
- Session toggle: Finals | Qual 1 | Qual 2 (Q2 hidden if no data)
- Top 5 with visual weight: gold/silver/bronze for 1-3, elevated for 4-5, table from 6
- Name formatting: "VERMETTE ASA" → "Vermette Asa"

## Other PWA Files (root folder)
- `manifest.json` — start_url: "/", scope: "/"
- `service-worker.js` — cache-first static, network-first for cache.json
- `icon-192.png`, `icon-512.png` — placeholder HT icons (needs real design)

## Environment
- `.env`: YOUTUBE_API_KEY, PINKBIKE_PROXY=https://helltrack-rss.scharenbergs.workers.dev
- GitHub Secrets: YOUTUBE_API_KEY, PINKBIKE_PROXY
- npm packages: node-fetch@2, rss-parser, dotenv, xml2js, pdfjs-dist, @cloudflare/puppeteer, wrangler

## Cost Tracking
| Item | Cost | Cadence |
|---|---|---|
| Claude Pro | $20.00 | /month |
| Claude API credits | $20.00 | one-time |
| helltrack.app domain | $10.81 | year 1 |
| helltrack.app renewal | ~$15 | /year |
| Cloudflare Workers Paid | $5.00 | /month |
| GitHub everything | $0 | — |
| Google Analytics | $0 | — |
| Google Forms/Sheets | $0 | — |

**Monthly burn: $25/month**
