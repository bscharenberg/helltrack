/**
 * chronorace-fetcher.mjs
 * Helltrack — race results from ChronoRace, the UCI's on-site timing vendor.
 *
 * ChronoRace is upstream of every other source: the official UCI results PDFs are theirs
 * (`Producer: chronorace - electronic timing via ABCpdf`), and the Les Gets 2026 Elite Men
 * report was stamped ~40 min after the last rider — hours before anything downstream.
 * Discovery notes and the full API map: docs/chronorace-api.md
 *
 * results.chronorace.be is public and self-documented (Swagger at /swagger). The WBD
 * document is discovery-based, so unlike results-fetcher.mjs this needs NO hardcoded race
 * calendar — which is what caused two wrong finals dates (Les Gets, Val di Sole):
 *     discovery/event-list?season=YYYY
 *       → discovery/competition-list/{eventId}
 *         → resource/results/{competitionId}
 *
 * SCOPE: World Series rounds only. WBD does not carry the World Championships — the 2026
 * event list jumps straight from Les Gets (08-21) to 09-19, skipping Val di Sole Worlds.
 * Use dataride-fetcher.mjs for Worlds; it already emits eventType 'world-championship'.
 *
 * Usage:
 *   node scripts/chronorace-fetcher.mjs <year>                  # fetch + report (no write)
 *   node scripts/chronorace-fetcher.mjs <year> --validate       # diff against results.json
 *   node scripts/chronorace-fetcher.mjs <year> --merge          # upsert into results.json
 *   node scripts/chronorace-fetcher.mjs <year> --only=les-gets-2026
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { canonName, canonVenue, slugify } from './lib/canon.mjs'

const __dirname    = path.dirname(fileURLToPath(import.meta.url))
const ROOT         = path.join(__dirname, '..')
const RESULTS_PATH = path.join(ROOT, 'public', 'results.json')

const BASE = 'https://results.chronorace.be'
const WBD  = `${BASE}/api/v1/wbd`
const UA   = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function api(pathname) {
  const res = await fetch(`${WBD}${pathname}`, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`GET ${pathname} → ${res.status}`)
  const text = await res.text()
  if (!text.trim()) return null
  return JSON.parse(text)
}

// ─── Mapping ──────────────────────────────────────────────────────────────────
// Elite only — juniors are out of scope for Helltrack (same rule as the other fetchers).
const GENDER = { ME: 'men', WE: 'women' }

// Phase → Helltrack session prefix. Competition ids look like 2026-11-DHI-ME-F / -ME-Q2,
// and Phase is the bare code ('F', 'Q1', 'Q2'); PhaseName is the prose ('Qualification 2').
function sessionKey(phase, phaseName, gender) {
  const p = String(phase || '').toUpperCase()
  const n = String(phaseName || '').toLowerCase()
  const q = /^Q(\d+)$/.exec(p)
  if (q) return `qualifying-${q[1]}-${gender}`
  if (/qualif/.test(n)) {
    const m = /(\d+)/.exec(n)
    return `qualifying-${m ? m[1] : 1}-${gender}`
  }
  if (p === 'F' || /final/.test(n)) return `finals-${gender}`
  if (/semi/.test(n)) return `semi-${gender}`
  return null   // unknown phase → skip rather than guess
}

// "3:27.924" / "58.21" → seconds, for gap computation. ChronoRace already hands us the
// display string, so this is only used to derive gaps (which the API does not include).
function toSeconds(t) {
  const s = String(t || '').trim()
  if (!/^[\d:.]+$/.test(s)) return null
  const parts = s.split(':').map(Number)
  if (parts.some(isNaN)) return null
  return parts.reduce((acc, p) => acc * 60 + p, 0)
}
function fmtGap(sec) {
  if (sec == null || sec <= 0) return null
  const m = Math.floor(sec / 60), r = sec - m * 60
  return '+' + (m ? `${m}:${r.toFixed(3).padStart(6, '0')}` : r.toFixed(3))
}

// IRM ("individual result marker") carries DNF/DNS/DSQ; Rank is null for those.
function normalizeRow(row) {
  const irm = String(row.IRM || '').trim().toUpperCase() || null
  const rank = Number.isFinite(row.Rank) && row.Rank > 0 ? row.Rank : null
  // FirstName is mixed case, LastName is CAPS — canonName treats CAPS as the family name
  // and is order-independent, so this yields the same display form as the DataRide path.
  const { name } = canonName(`${row.FirstName || ''} ${row.LastName || ''}`)
  const out = {
    rank,
    name,
    nat:    (row.Nation || '').trim() || null,
    team:   (row.TeamName || '').trim() || null,
    time:   rank ? (row.Result || null) : null,
    gap:    null,
    points: Number.isFinite(row.Points) ? row.Points : null,
  }
  if (irm === 'DNF') out.dnf = true
  else if (irm === 'DNS') out.dns = true
  else if (irm === 'DSQ' || irm === 'DQ') out.dsq = true
  out._sort = Number(row.SortOrder ?? 0) || 0
  return out
}

// WBD sometimes gives a REGION rather than the venue — Les Gets is reported as
// "Haute Savoie". scripts/canon/venues.json already maps those, but under hyphenated keys
// ("haute-savoie") while canon's looseKey only collapses whitespace, so "Haute Savoie"
// misses. Try the hyphenated form too; without this Les Gets resolves to its own
// `haute-savoie-2026` slug and silently duplicates the round instead of matching it.
function resolveVenue(ev) {
  const raw = ev.VenueLocation || ''
  const hit = canonVenue(raw) || canonVenue(raw.trim().replace(/\s+/g, '-'))
  return hit || { name: raw, slug: slugify(raw), country: ev.Country || null }
}

// ─── Assemble a season ────────────────────────────────────────────────────────
async function fetchSeason(year, { onLog = () => {} } = {}) {
  const events = await api(`/discovery/event-list?season=${encodeURIComponent(year)}`)
  if (!Array.isArray(events)) throw new Error('event-list did not return an array')

  // Round numbers come from date-position among DHI-bearing events only. The WBD event
  // number is NOT the DH round: the calendar includes XCO/XCC-only stops, so Les Gets is
  // WBD event 11 but DH round 7.
  const dhEvents = events
    .filter(e => Array.isArray(e.Disciplines) && e.Disciplines.includes('DHI'))
    .sort((a, b) => String(a.StartDate).localeCompare(String(b.StartDate)))
  onLog(`${events.length} events in ${year}; ${dhEvents.length} include DHI`)

  const rounds = []
  for (const [i, ev] of dhEvents.entries()) {
    // One bad event must not abort the season — wbd-2026-13 currently 500s, and a future
    // round will always be the newest/least-baked record in the feed.
    let comps
    try { comps = (await api(`/discovery/competition-list/${ev.EventId}`)) || [] }
    catch (err) { onLog(`  ! ${ev.VenueLocation} (${ev.EventId}): ${err.message} — skipped`); continue }
    const dhi = comps.filter(c => c.Discipline === 'DHI' && GENDER[c.CategoryCode])
    if (!dhi.length) { onLog(`  – ${ev.VenueLocation}: no elite DHI competitions yet`); continue }

    const sessions = {}
    let finalsDate = null, status = null
    for (const c of dhi) {
      const gender = GENDER[c.CategoryCode]
      const key = sessionKey(c.Phase, c.PhaseName, gender)
      if (!key) continue

      let payload
      try { payload = await api(`/resource/results/${c.CompetitionId}`) }
      catch { continue }                                  // not published yet
      const rows = payload?.Data
      if (!Array.isArray(rows) || !rows.length) continue

      const all = rows.map(normalizeRow)
      const ranked = all.filter(r => r.rank != null).sort((a, b) => a.rank - b.rank)
      const rest   = all.filter(r => r.rank == null).sort((a, b) => a._sort - b._sort)
      if (!ranked.length) continue

      const win = toSeconds(ranked[0].time)
      for (const r of ranked) {
        const s = toSeconds(r.time)
        r.gap = (win != null && s != null && r.rank !== 1) ? fmtGap(s - win) : null
      }
      const out = [...ranked, ...rest]
      for (const r of out) delete r._sort
      sessions[key] = out

      if (key.startsWith('finals')) {
        finalsDate = String(c.Date || '').slice(0, 10) || finalsDate
        status = payload?.MetaData?.Status || status
      }
      await sleep(120)
    }
    if (!Object.keys(sessions).length) { onLog(`  – ${ev.VenueLocation}: no published results yet`); continue }

    const venue = resolveVenue(ev)
    rounds.push({
      round:     i + 1,
      eventType: 'world-cup',
      venue:     venue.name,
      slug:      `${venue.slug}-${year}`,
      country:   venue.country || ev.Country || null,
      date:      finalsDate || String(ev.EndDate || ev.StartDate).slice(0, 10),
      source:    'chronorace',
      sourceRef: `chronorace:${ev.EventId}`,
      status:    status || null,
      fetchedAt: new Date().toISOString(),
      sessions,
    })
    onLog(`  ✓ R${String(i + 1).padEnd(2)} ${venue.name.padEnd(20)} ${Object.keys(sessions).join(', ')}${status ? `  [${status}]` : ''}`)
  }
  return rounds
}

// ─── Validate / merge (mirrors dataride-fetcher so the two behave identically) ─
function loadResults() {
  return fs.existsSync(RESULTS_PATH)
    ? JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'))
    : { lastUpdated: '', seasons: {} }
}

function validate(year, rounds) {
  console.log(`\n── VALIDATION: ChronoRace ${year} vs results.json ──`)
  const existing = loadResults().seasons?.[year]?.rounds || []
  const byslug = new Map(existing.map(r => [r.slug, r]))
  for (const r of rounds) {
    const ex = byslug.get(r.slug)
    for (const g of ['men', 'women']) {
      const mine = r.sessions[`finals-${g}`]?.[0]
      const theirs = ex?.sessions?.[`finals-${g}`]?.[0]
      if (!mine) continue
      const mark = !theirs ? '🆕' : (theirs.name === mine.name && theirs.time === mine.time ? '✅' : '❌')
      console.log(`  ${mark} ${r.venue.padEnd(18)} finals-${g}: ChronoRace=${mine.name} ${mine.time}`
                + (theirs ? `  existing=${theirs.name} ${theirs.time}` : '  (not in existing)'))
    }
  }
}

function merge(year, rounds) {
  const data = loadResults()
  if (!data.seasons) data.seasons = {}
  if (!data.seasons[year]) data.seasons[year] = { rounds: [] }
  const target = data.seasons[year].rounds
  for (const r of rounds) {
    const i = target.findIndex(x => x.slug === r.slug)
    // Merge sessions per key rather than replacing the round: a session supplied earlier by
    // another source must survive a fetch that doesn't happen to include it.
    if (i >= 0) target[i] = { ...target[i], ...r, sessions: { ...target[i].sessions, ...r.sessions } }
    else target.push(r)
  }
  target.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  data.lastUpdated = new Date().toISOString()
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(data, null, 2))
  console.log(`\n✅ merged ${rounds.length} round(s) into public/results.json`)
}

async function main() {
  const year = process.argv[2]
  if (!year || year.startsWith('--')) {
    console.log('Usage: node scripts/chronorace-fetcher.mjs <year> [--validate|--merge] [--only=slug,slug]')
    process.exit(0)
  }
  const onlyArg = process.argv.find(a => a.startsWith('--only='))
  const only = onlyArg ? onlyArg.slice(7).split(',').map(s => s.trim()).filter(Boolean) : null

  let rounds = await fetchSeason(year, { onLog: s => console.log(s) })
  console.log(`\n${year}: ${rounds.length} round(s) assembled`)
  if (only) {
    const missing = only.filter(s => !rounds.some(r => r.slug === s))
    if (missing.length) {
      console.error(`💥 --only: ChronoRace has no published results for ${missing.join(', ')}`)
      console.error(`   available: ${rounds.map(r => r.slug).join(', ') || '(none)'}`)
      process.exit(1)
    }
    rounds = rounds.filter(r => only.includes(r.slug))
  }

  for (const r of rounds) {
    console.log(`\n── ${r.venue} (${r.slug}) — ${r.date}${r.status ? ` [${r.status}]` : ''} ──`)
    for (const [k, v] of Object.entries(r.sessions)) {
      const podium = v.filter(x => x.rank).slice(0, 3).map(x => `${x.rank}. ${x.name} ${x.time}`).join('   ')
      console.log(`  ${k.padEnd(20)} ${String(v.length).padStart(3)} riders   ${podium}`)
    }
  }

  if (process.argv.includes('--validate')) validate(year, rounds)
  if (process.argv.includes('--merge')) merge(year, rounds)
}

export { fetchSeason }
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => { console.error('💥', e.message); process.exit(1) })
}
