# Claude Project Instructions — Helltrack

## What This Project Is
Helltrack (helltrack.app) is a UCI downhill and enduro race content aggregator and historical results database built by Bryon Scharenberg. It's a PWA (Progressive Web App) that pulls from YouTube channels and Pinkbike RSS, filters to DH/enduro content, and displays a clean card-based feed. It also has a Results tab with historical UCI DH race data going back to 2024 (expanding to 2015+).

**This is a hobby project** — Bryon builds and maintains it himself. Keep suggestions practical, avoid over-engineering, and prioritize simplicity and maintainability over cleverness.

## Key Files to Load Into This Project
Load these files from the Helltrack knowledge base:
1. `helltrack-architecture.md` — full system architecture reference
2. `helltrack-decisions.md` — what worked, what didn't, lessons learned
3. `helltrack-punchlist.md` — current state and todo list
4. `helltrack-dev-workflow.md` — commands and processes

When Bryon uploads a file to the chat (index.html, content-filter.js, etc.) treat it as the current live version.

## Bryon's Working Style
- Builds in sessions, often late at night
- Pastes terminal output directly — read it carefully for errors
- Takes screenshots of the app — look at them before suggesting fixes
- Prefers to understand what's happening, not just run commands blindly
- Values clean, simple UI over feature-rich complexity
- Makes quick decisions when given clear options
- Uses Claude to write all code — doesn't manually edit files much

## How to Work Together Effectively

### Before writing any code
- Ask for the current file if you don't have it — don't assume you know what's in it
- When Bryon uploads a file, it IS the current version on disk
- Always verify changes with grep/checks before presenting files

### When presenting files
- Always use `present_files` so Bryon can download them
- Always tell him exactly where to put the file and what command to run
- Keep git commands simple: stage → commit → pull --rebase → push

### When debugging
- Use the Claude in Chrome browser tool to inspect helltrack.app directly
- Check JavaScript state with `javascript_tool` before guessing at fixes
- Read terminal output carefully — errors are usually obvious once you look

### Design decisions
- The aesthetic is set: dark #111, acid yellow #d4f500, Barlow Condensed
- Don't suggest redesigns unless asked
- Mobile-first but must work on desktop too (full width, no artificial constraints)
- "Newspaper not an inbox" — clean, simple, no unread state

### Content filter changes
- Always test scoring before committing: `node -e "const {scoreItem}=require('./scripts/content-filter.js'); ..."`
- Rebuild cache after every filter change
- XCO must always be dropped — weight 15 on exclude terms
- Trusted sources (UCI channel, Sleeper, etc.) get BOOST_SCORE=4

## Current Tech Stack
- **Frontend**: Vanilla JS, HTML, CSS in single index.html at repo root
- **Build**: Node.js scripts in /scripts/
- **CI/CD**: GitHub Actions (hourly cache refresh)
- **Hosting**: GitHub Pages (helltrack.app via Cloudflare DNS)
- **Workers**: Cloudflare Workers (RSS proxy + results scraper)
- **Data**: cache.json (content feed) + results.json (race results)

## Things That Are Intentionally Simple
- No framework (React, Vue, etc.) — vanilla JS only
- No database — JSON files committed to repo
- No auth, no user accounts, no notifications
- No build step for frontend — index.html is served directly
- No history/backlog in feed — only MAX_AGE_DAYS=30

## Known Gotchas
- Git commit messages must use SINGLE QUOTES on Mac (smart quotes break shell)
- Always `git pull --rebase origin main && git push` — never plain push
- Results tab id is 'standings' internally (not 'results') to avoid collision with feed category key
- pdfjs-dist needs `.mjs` extension and Uint8Array not Buffer
- UCI IDs in PDFs are 10-11 digits (not always 10)
- Service worker caches aggressively — unregister in DevTools for fresh testing
- Category 'results' in cache.json displays as 'Analysis' in the UI

## Bryon's Preferences
- Prefers mockups/previews before building complex UI changes
- Likes to see options (2-3) before committing to a direction
- Appreciates knowing WHY something failed, not just the fix
- Wants to understand the architecture well enough to maintain it himself
- Cares deeply about the DH/MTB culture — the app should feel authentic to that world
