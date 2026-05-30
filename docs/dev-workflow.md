# Helltrack — Developer Workflow

## Common Commands

### Rebuild content cache
```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack
node scripts/build-cache.js
git add public/cache.json
git commit -m 'rebuild cache'
git stash && git pull --rebase origin main && git stash pop && git push
```

### Fetch results for a race round
```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack
node scripts/results-fetcher.mjs race-of-south-korea-2026
git add public/results.json
git commit -m 'add results - Round 1 South Korea'
git stash && git pull --rebase origin main && git stash pop && git push
```

### Deploy frontend changes
```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack
git add index.html
git commit -m 'describe change'
git stash && git pull --rebase origin main && git stash pop && git push
```

### Rebuild riders data
```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack
node scripts/build-riders.js
git add scripts/riders.csv public/riders.json
git commit -m 'update riders roster'
git stash && git pull --rebase origin main && git stash pop && git push
```

### Deploy Cloudflare Worker (results scraper)
```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack/helltrack-results
npm run deploy
```

### Test content filter scoring
```bash
cd ~/Documents/Bryon\ Knowledge\ Base/Helltrack
node -e "
const {scoreItem, categorise} = require('./scripts/content-filter.js');
const item = {title: 'YOUR TITLE HERE', description: '', channelId: 'UCWS4nfoou79mwo9nHew49fA'};
const score = scoreItem(item);
console.log('Score:', score, '| Category:', score >= 4 ? categorise(item) : 'DROPPED');
"
```

### Check what's in the live cache
Open browser console on helltrack.app and run:
```javascript
fetch('public/cache.json?t=' + Date.now()).then(r => r.json()).then(d => {
  Object.entries(d.categories).forEach(([k,v]) => 
    console.log(k + ':', v.items.map(i => i.title))
  )
})
```

### Force browser to reload fresh cache (bypass service worker)
1. DevTools → Application → Service Workers → Unregister both
2. Cmd+Shift+R (hard refresh)

## Git Workflow Rules
- **Always** use `git stash && git pull --rebase origin main && git stash pop && git push` — never plain `git push`
- **Always** use single quotes for commit messages: `git commit -m 'message'`
- GitHub Actions commits cache.json every hour — stash first or the rebase will fail on local changes
- cache.json conflicts during rebase: `git checkout --theirs public/cache.json && git add public/cache.json`

## File Locations
| File | Location | Purpose |
|---|---|---|
| PWA app | /index.html (root) | Main frontend |
| Feed data | /public/cache.json | Generated hourly |
| Results data | /public/results.json | Race results database |
| Content filter | /scripts/content-filter.js | Scoring + categorisation |
| Cache builder | /scripts/build-cache.js | Orchestrates fetch+filter |
| YouTube fetcher | /scripts/youtube-fetcher.js | YouTube API calls |
| RSS fetcher | /scripts/rss-fetcher.js | Pinkbike RSS |
| Results fetcher | /scripts/results-fetcher.mjs | PDF parser (ESM) |
| Worker source | /helltrack-results/src/index.js | Cloudflare Worker |
| Worker config | /helltrack-results/wrangler.jsonc | Worker deployment config |
| Rider roster CSV | /scripts/riders.csv | Source of truth for riders |
| Rider builder | /scripts/build-riders.js | Generates riders.json from CSV |
| Riders data | /public/riders.json | Generated rider data |
| Env vars | /.env | API keys (not committed) |

## Environment Variables
```
YOUTUBE_API_KEY=...
PINKBIKE_PROXY=https://helltrack-rss.scharenbergs.workers.dev
```
Also set as GitHub Secrets for Actions.

## 2026 Race Calendar (for results-fetcher)
| Round | Venue | Date | Slug |
|---|---|---|---|
| R1 | Mona YongPyong | 2026-05-01 | race-of-south-korea-2026 |
| R2 | Loudenvielle | 2026-05-28 | loudenvielle-2026 |
| R3 | Leogang | 2026-06-11 | leogang-2026 |
| R4 | Lenzerheide | 2026-06-19 | lenzerheide-2026 |
| R5 | La Thuile | 2026-07-03 | la-thuile-2026 |
| R6 | Pal Arinsal | 2026-07-09 | pal-arinsal-2026 |
| R7 | Les Gets | 2026-08-20 | les-gets-2026 |
| Worlds | Val di Sole | 2026-08-26 | val-di-sole-2026 |
| R8 | Whistler | 2026-09-25 | whistler-2026 |
| R9 | Lake Placid | 2026-10-02 | lake-placid-2026 |

## Debugging Tips

### cache.json conflict during rebase
```bash
git checkout --theirs public/cache.json && git add public/cache.json
```
Then continue: `git rebase --continue` or `git stash pop && git push`

### "nothing to commit" when you expect changes
- Run `git diff scripts/content-filter.js` — if empty, the file matches the repo
- Run `grep "BOOST_SCORE\|south korea" scripts/content-filter.js` to confirm which version is on disk

### XCO videos appearing in feed
- Check: `grep "weight.*15\|mtbws highlights" scripts/content-filter.js`
- If missing, the filter file wasn't saved/committed correctly
- Rebuild cache after fixing: `node scripts/build-cache.js`

### Results tab showing wrong data / nav missing
- Check: `document.getElementById('results-nav').style.display` in console
- Should be 'none' on feed tabs, 'block' on Results tab
- Check for `activeTab === 'standings'` in buildTabs (not 'results')

### PDF parsing returns 0 results
- Run debug: `node scripts/debug-pdf.js` with a known PDF URL
- Check: UCI IDs in text (should be 10-11 digit numbers)
- Check: time format matches M:SS.mmm (not H:MM:SS which is XCO)
