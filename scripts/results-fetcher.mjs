/**
 * results-fetcher.mjs
 * Helltrack — fetches UCI DHI race results from the UCI MTB World Series JSON API
 *
 * POST /api/race-results returns clean JSON — no PDFs, no Worker, no auth needed.
 * Works server-to-server from GitHub Actions without cookies.
 *
 * Run: node scripts/results-fetcher.mjs <venue-slug>
 * Example: node scripts/results-fetcher.mjs loudenvielle-2026
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'results.json')
const UCI_API     = 'https://www.ucimtbworldseries.com/api/race-results'

// ─── Calendar ─────────────────────────────────────────────────────────────────
// uciVenue: the venue identifier used in the UCI API slug.
// Differs from our venue slug in two cases (South Korea).

const CALENDAR_2026 = [
  { slug: 'race-of-south-korea-2026', uciVenue: 'mona-yongpyong', name: 'Mona YongPyong', date: '2026-05-01', round: 1 },
  { slug: 'loudenvielle-2026',        uciVenue: 'loudenvielle',    name: 'Loudenvielle',   date: '2026-05-28', round: 2 },
  { slug: 'leogang-2026',             uciVenue: 'leogang',         name: 'Leogang',        date: '2026-06-11', round: 3 },
  { slug: 'lenzerheide-2026',         uciVenue: 'lenzerheide',     name: 'Lenzerheide',    date: '2026-06-19', round: 4 },
  { slug: 'la-thuile-2026',           uciVenue: 'la-thuile',       name: 'La Thuile',      date: '2026-07-03', round: 5 },
  { slug: 'pal-arinsal-2026',         uciVenue: 'pal-arinsal',     name: 'Pal Arinsal',    date: '2026-07-09', round: 6 },
  { slug: 'les-gets-2026',            uciVenue: 'les-gets',        name: 'Les Gets',       date: '2026-08-20', round: 7 },
  { slug: 'val-di-sole-2026',         uciVenue: 'val-di-sole',     name: 'Val di Sole',    date: '2026-08-26', round: 8 },
  { slug: 'whistler-2026',            uciVenue: 'whistler',        name: 'Whistler',       date: '2026-09-25', round: 9 },
  { slug: 'lake-placid-2026',         uciVenue: 'lake-placid',     name: 'Lake Placid',    date: '2026-10-02', round: 10 },
]

// ─── Sessions ─────────────────────────────────────────────────────────────────
// Maps our internal session key → UCI API slug suffix.
// Elite only — juniors are out of scope for Helltrack.
// Qualifiers are fetched opportunistically; they may not exist for all rounds.

const SESSIONS = [
  { key: 'finals-men',         suffix: 'men-elite-dhi-finals' },
  { key: 'finals-women',       suffix: 'women-elite-dhi-finals' },
  { key: 'qualifying-1-men',   suffix: 'men-elite-dhi-qualifiers-1' },
  { key: 'qualifying-1-women', suffix: 'women-elite-dhi-qualifiers-1' },
  { key: 'qualifying-2-men',   suffix: 'men-elite-dhi-qualifiers-2' },
  { key: 'qualifying-2-women', suffix: 'women-elite-dhi-qualifiers-2' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Some names arrive with ALL-CAPS words (e.g. "Thibaut DAPRELA").
// Normalise to title case.
function normalizeName(name) {
  return (name || '').split(' ').map(word =>
    word.length > 1 && word === word.toUpperCase()
      ? word[0] + word.slice(1).toLowerCase()
      : word
  ).join(' ')
}

async function fetchSession(uciSlug) {
  try {
    const res = await fetch(UCI_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ slug: uciSlug }),
    })
    if (!res.ok) return null

    const data = await res.json()
    if (data.error || !Array.isArray(data.results) || data.results.length === 0) return null

    // Filter out non-finishers (DNF / DSQ / DNS have a string resultPosition)
    const riders = data.results.filter(r => typeof r.resultPosition === 'number')
    if (!riders.length) return null

    return riders.map(r => ({
      rank:   r.resultPosition,
      name:   normalizeName(r.riderName),
      nat:    r.riderNationality   || null,
      team:   r.riderTeamName      || null,
      time:   r.resultTime         || null,
      gap:    r.resultGap          || null,
      points: typeof r.totalRacePoints === 'number' ? r.totalRacePoints : null,
    }))
  } catch (err) {
    return null
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function fetchResults(venueSlug) {
  const round = CALENDAR_2026.find(r => r.slug === venueSlug)
  if (!round) throw new Error(`Unknown venue slug: ${venueSlug}\n\nValid slugs:\n${CALENDAR_2026.map(r => '  ' + r.slug).join('\n')}`)

  console.log(`\n🏁 Fetching results for: ${round.name} (${venueSlug})\n`)

  const year     = round.date.slice(0, 4)
  const sessions = {}

  for (const session of SESSIONS) {
    const uciSlug = `${year}-${round.uciVenue}-${session.suffix}`
    process.stdout.write(`  ${session.key.padEnd(20)} `)
    const results = await fetchSession(uciSlug)
    if (!results) {
      console.log('—')
    } else {
      console.log(`${results.length} riders`)
      sessions[session.key] = results
    }
    await new Promise(r => setTimeout(r, 300))
  }

  const sessionCount = Object.keys(sessions).length
  console.log(`\n  ${sessionCount} sessions fetched`)

  return {
    venue:     round.name,
    slug:      venueSlug,
    date:      round.date,
    round:     round.round,
    fetchedAt: new Date().toISOString(),
    sessions,
  }
}

async function main() {
  const venueSlug = process.argv[2]

  if (!venueSlug) {
    console.log('Usage: node scripts/results-fetcher.mjs <venue-slug>\n')
    console.log('2026 venues:')
    CALENDAR_2026.forEach(v => console.log(`  ${v.slug.padEnd(30)} ${v.name}  (${v.date})`))
    process.exit(0)
  }

  try {
    const result = await fetchResults(venueSlug)

    // Load existing results.json
    let existing = { lastUpdated: '', seasons: {} }
    if (fs.existsSync(OUTPUT_PATH)) {
      const raw = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
      existing  = raw.seasons ? raw : { lastUpdated: '', seasons: { '2026': { rounds: raw.rounds || [] } } }
    }

    if (!existing.seasons['2026']) existing.seasons['2026'] = { rounds: [] }
    const rounds = existing.seasons['2026'].rounds
    const idx    = rounds.findIndex(r => r.slug === venueSlug)
    const existingRound = idx >= 0 ? rounds[idx] : null

    // Guard: round is complete only once BOTH elite finals are present.
    // Keying on finals-men alone would lock out a later finals-women fetch when the
    // women's results are posted a few minutes after the men's. Once both exist we
    // can safely stop re-writing on the 30-min polling runs.
    const haveBothFinals = obj =>
      obj?.sessions?.['finals-men']?.length > 0 && obj?.sessions?.['finals-women']?.length > 0
    if (haveBothFinals(existingRound) && haveBothFinals(result)) {
      console.log(`\n✅ Both elite finals already present for ${venueSlug} — no changes to write.`)
      process.exit(0)
    }

    // Guard: don't overwrite existing data with empty result
    if (Object.keys(result.sessions).length === 0 && idx >= 0 && Object.keys(rounds[idx].sessions || {}).length > 0) {
      console.log('\n⚠️  0 sessions fetched — keeping existing data to avoid data loss.')
      process.exit(0)
    }

    if (idx >= 0) rounds[idx] = result
    else {
      rounds.push(result)
      rounds.sort((a, b) => a.round - b.round)
    }
    existing.lastUpdated = new Date().toISOString()

    const publicDir = path.join(__dirname, '..', 'public')
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2))

    console.log(`\n✅ Wrote ${OUTPUT_PATH}`)
    console.log(`   Sessions: ${Object.keys(result.sessions).join(', ')}`)

    const finM = result.sessions['finals-men']
    if (finM?.length) {
      console.log('\nTop 5 Elite Men:')
      finM.slice(0, 5).forEach(r => console.log(`  ${r.rank}. ${r.name} (${r.nat}) — ${r.time} — ${r.points ?? '—'} pts`))
    }
    const finW = result.sessions['finals-women']
    if (finW?.length) {
      console.log('\nTop 5 Elite Women:')
      finW.slice(0, 5).forEach(r => console.log(`  ${r.rank}. ${r.name} (${r.nat}) — ${r.time} — ${r.points ?? '—'} pts`))
    }

  } catch (err) {
    console.error('\n💥 Failed:', err.message)
    process.exit(1)
  }
}

main()
