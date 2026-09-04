#!/usr/bin/env node
/**
 * split-results.js — derive per-season result files from public/results.json.
 *
 * results.json stays the canonical artifact the fetchers read and merge into; it is
 * pretty-printed and 8+ MB, which the app used to download and JSON.parse in full just
 * to show one round. This writes the app-facing shards:
 *
 *   public/results/index.json   season list + round counts (a few hundred bytes)
 *   public/results/<year>.json  one season's rounds, minified
 *
 * The app loads the index plus the current season on open, pulls other seasons on demand,
 * and only fetches every season when the user opens the cross-season search/venue views.
 *
 * Run after any fetcher merges into results.json:  node scripts/split-results.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT        = path.join(__dirname, '..')
const SOURCE      = path.join(ROOT, 'public', 'results.json')
const OUT_DIR     = path.join(ROOT, 'public', 'results')

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('✗ public/results.json not found')
    process.exit(1)
  }

  const src = JSON.parse(fs.readFileSync(SOURCE, 'utf8'))
  const seasons = src.seasons || {}

  // Only seasons that actually have rounds — matches the filter the year bar used to apply
  // client-side, so an empty placeholder season never shows up as a tappable year.
  const years = Object.keys(seasons)
    .filter(yr => Array.isArray(seasons[yr].rounds) && seasons[yr].rounds.length > 0)
    .sort()

  if (!years.length) {
    console.error('✗ no seasons with rounds — refusing to write an empty index')
    process.exit(1)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const index = {
    lastUpdated: src.lastUpdated || new Date().toISOString(),
    current: years[years.length - 1],
    seasons: [],
  }

  let total = 0
  for (const year of years) {
    const rounds = seasons[year].rounds
    const body = JSON.stringify({ year, rounds })
    fs.writeFileSync(path.join(OUT_DIR, `${year}.json`), body)
    total += body.length
    index.seasons.push({ year, rounds: rounds.length, bytes: body.length })
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index))

  // Drop shards for seasons that disappeared from results.json, so a stale file can't be
  // served for a year the index no longer lists.
  for (const f of fs.readdirSync(OUT_DIR)) {
    const m = f.match(/^(\d{4})\.json$/)
    if (m && !years.includes(m[1])) {
      fs.unlinkSync(path.join(OUT_DIR, f))
      console.log(`  removed stale ${f}`)
    }
  }

  const srcKB = Math.round(fs.statSync(SOURCE).size / 1024)
  const curKB = Math.round(index.seasons[index.seasons.length - 1].bytes / 1024)
  console.log(`✅ wrote ${years.length} season files + index to public/results/`)
  console.log(`   source ${srcKB} KB → ${Math.round(total / 1024)} KB across shards`)
  console.log(`   app opens with index + ${index.current} only (~${curKB} KB, was ${srcKB} KB)`)
}

main()
