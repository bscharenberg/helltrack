/**
 * dataride-fetcher.mjs
 * Helltrack — historical DH results from the UCI DataRide JSON API (2009→2024).
 *
 * DataRide is the UCI's own official results platform. It is NOT a PDF archive — the public
 * results iframe is backed by a hierarchical JSON API. Full contract in docs/historical-data.md §2a.
 *
 * Walk: seasons → Competitions → Races → Events → Results.
 * Filters to Elite DHI, World Cup (ClassCode CDM) + World Championships (ClassCode CM).
 *
 * Usage:
 *   node scripts/dataride-fetcher.mjs <year>            # fetch + normalize → staging file (NO merge)
 *   node scripts/dataride-fetcher.mjs <year> --merge    # also merge into public/results.json
 *   node scripts/dataride-fetcher.mjs 2025 --validate    # fetch + diff against existing results.json
 *
 * Raw API responses are cached under data/raw/dataride/ so re-runs never re-hit the UCI API.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { canonName, canonVenue, slugify } from './lib/canon.mjs'

const __dirname    = path.dirname(fileURLToPath(import.meta.url))
const ROOT         = path.join(__dirname, '..')
const RAW_DIR      = path.join(ROOT, 'data', 'raw', 'dataride')
const STAGING_DIR  = path.join(ROOT, 'data', 'staging')
const RESULTS_PATH = path.join(ROOT, 'public', 'results.json')

const BASE = 'https://dataride.uci.ch'
const DISCIPLINE_MTB = 7
const RACETYPE_DHI   = 19
const CLASS_WORLD_CUP    = 'CDM'   // Coupe du Monde
const CLASS_WORLD_CHAMPS = 'CM'    // Championnat du Monde
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Helltrack historical backfill; helltrack.app)',
  'X-Requested-With': 'XMLHttpRequest',
  'Referer': `${BASE}/iframe/Results/${DISCIPLINE_MTB}/`,
}
const PAGING = 'take=500&skip=0&page=1&pageSize=500'

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── Low-level API ────────────────────────────────────────────────────────────
async function drGet(pathname, params) {
  const url = `${BASE}${pathname}?` + new URLSearchParams(params).toString()
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`GET ${pathname} → ${res.status}`)
  return res.json()
}
async function drPost(pathname, body) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  })
  if (!res.ok) throw new Error(`POST ${pathname} → ${res.status}`)
  const text = await res.text()
  if (text.trimStart().startsWith('<')) throw new Error(`POST ${pathname} → HTML error (bad params)`)
  return JSON.parse(text)
}
const asRows = j => (Array.isArray(j) ? j : (j.data || []))

// /Date(1727992800000)/ → 'YYYY-MM-DD' (UTC)
function jsonDate(s) {
  const m = /(-?\d+)/.exec(s || '')
  if (!m) return null
  const d = new Date(Number(m[1]))
  return isNaN(d) ? null : d.toISOString().slice(0, 10)
}

// ─── Raw cache (so re-runs never re-hit the API) ──────────────────────────────
function cacheGet(key) {
  const f = path.join(RAW_DIR, key + '.json')
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  return null
}
function cacheSet(key, value) {
  fs.mkdirSync(RAW_DIR, { recursive: true })
  fs.writeFileSync(path.join(RAW_DIR, key + '.json'), JSON.stringify(value))
  return value
}
async function cached(key, fn) {
  const hit = cacheGet(key)
  if (hit) return hit
  const val = await fn()
  cacheSet(key, val)
  await sleep(150)          // polite delay only on real network calls
  return val
}

// ─── Hierarchy fetchers ───────────────────────────────────────────────────────
async function getSeasons() {
  return cached('seasons', () => drGet('/iframe/GetRestrictedResultsDisciplineSeasons/', { disciplineId: DISCIPLINE_MTB }))
}
async function seasonId(year) {
  const seasons = asRows(await getSeasons())
  const hit = seasons.find(s => String(s.Name) === String(year))
  if (!hit) throw new Error(`No DataRide season for ${year}. Available: ${seasons.map(s => s.Name).join(', ')}`)
  return hit.Id
}
async function getCompetitions(sId) {
  // GOTCHA (see docs §2a): plain disciplineId + filters with field/value ONLY.
  // Sending filter[logic]/[operator] makes the Telerik binder throw a 200-HTML exception.
  const body = `disciplineId=${DISCIPLINE_MTB}&${PAGING}&sort[0][field]=StartDate&sort[0][dir]=asc`
    + `&filter[filters][0][field]=RaceTypeId&filter[filters][0][value]=${RACETYPE_DHI}`
    + `&filter[filters][1][field]=CategoryId&filter[filters][1][value]=0`
    + `&filter[filters][2][field]=SeasonId&filter[filters][2][value]=${sId}`
  return cached(`competitions-${sId}`, () => drPost('/iframe/Competitions/', body))
}
async function getRaces(competitionId) {
  return cached(`races-${competitionId}`, () =>
    drPost('/iframe/Races/', `disciplineId=${DISCIPLINE_MTB}&competitionId=${competitionId}&${PAGING}`))
}
async function getEvents(raceId) {
  return cached(`events-${raceId}`, () =>
    drPost('/iframe/Events/', `disciplineId=${DISCIPLINE_MTB}&raceId=${raceId}&${PAGING}`))
}
async function getResults(eventId) {
  return cached(`results-${eventId}`, () =>
    drPost('/iframe/Results/', `disciplineId=${DISCIPLINE_MTB}&eventId=${eventId}&${PAGING}`))
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────
function genderOf(categoryCode) {
  const c = (categoryCode || '').toLowerCase()
  if (c.includes('women')) return 'women'
  if (c.includes('men'))   return 'men'
  return null
}
function isEliteCategory(categoryCode) {
  const c = (categoryCode || '').toLowerCase()
  return c.includes('elite') && !c.includes('under') && !c.includes('junior') && !c.includes('master')
}
// RaceName → session key suffix. "Downhill"→finals, "Downhill Qualifying Round 2"→qualifying-2, etc.
function sessionKey(raceName, gender) {
  const n = (raceName || '').toLowerCase()
  const q = /qualifying(?:\s+round)?\s*(\d+)?/.exec(n)
  if (q) return q[1] ? `qualifying-${q[1]}-${gender}` : `qualifying-${gender}`
  if (/semi/.test(n)) return `semi-${gender}`
  return `finals-${gender}`
}

// Parse "00:02:57.229" (HH:MM:SS), "2:57.229" (MM:SS), or "58.21" (SS) → seconds.
function timeToSeconds(t) {
  if (!t) return null
  const str = String(t).trim()
  if (!/^[\d:.]+$/.test(str)) return null
  const parts = str.split(':').map(Number)
  if (parts.some(isNaN)) return null
  let sec = 0
  for (const p of parts) sec = sec * 60 + p     // works for [s], [m,s], [h,m,s]
  return sec
}
// Compact display time matching existing data: "2:57.229" (drop 0 hours / leading-zero minutes).
function fmtTime(sec) {
  if (sec == null) return null
  const m = Math.floor(sec / 60), s = sec - m * 60
  return m ? `${m}:${s.toFixed(3).padStart(6, '0')}` : s.toFixed(3)
}
function fmtGap(sec) {
  if (sec == null || sec <= 0) return null
  const m = Math.floor(sec / 60), s = (sec - m * 60)
  return '+' + (m ? `${m}:${s.toFixed(3).padStart(6, '0')}` : s.toFixed(3))
}

function normalizeResultRow(row) {
  const rankNum = Number(row.RankNumber ?? row.Rank)
  const irm = (row.Irm || '').trim() || null       // DNF / DNS / DSQ / etc.
  const { name, wasAmbiguous } = canonName(row.DisplayName || row.IndividualDisplayName || '')
  const secs = timeToSeconds(row.ResultValue)
  return {
    rank:   Number.isFinite(rankNum) && rankNum > 0 ? rankNum : null,
    name,
    nat:    (row.NationName || '').trim() || null,
    team:   (row.TeamName || '').trim() || null,
    time:   fmtTime(secs) || (row.ResultValue || '').trim() || null,
    points: Number.isFinite(Number(row.PointPcR)) ? Number(row.PointPcR) : null,
    irm,
    bib:    (row.Bib || '').trim() || null,
    _secs:  secs,
    _ambiguousName: wasAmbiguous || undefined,
  }
}

// ─── Assemble one season → round objects in Helltrack schema ──────────────────
async function fetchSeason(year, { onLog = () => {} } = {}) {
  const sId = await seasonId(year)
  onLog(`season ${year} → disciplineSeasonId ${sId}`)
  const comps = asRows(await getCompetitions(sId))
    .filter(c => c.ClassCode === CLASS_WORLD_CUP || c.ClassCode === CLASS_WORLD_CHAMPS)
    .sort((a, b) => (jsonDate(a.StartDate) || '').localeCompare(jsonDate(b.StartDate) || ''))

  onLog(`  ${comps.length} World Cup/Worlds DH competitions`)

  // Round numbers come from date-position among ALL World Cup (CDM) competitions, NOT a counter
  // that only advances on successful assembly. Otherwise a season where DataRide is missing one
  // round's results (e.g. 2015 Mont-Sainte-Anne/Windham) would mis-number every later round.
  const roundOf = new Map(
    comps.filter(c => c.ClassCode === CLASS_WORLD_CUP)
         .map((c, i) => [c.CompetitionId, i + 1])
  )

  const rounds = []
  const review = []          // names flagged for canon review

  for (const comp of comps) {
    const isWorlds = comp.ClassCode === CLASS_WORLD_CHAMPS
    const races = asRows(await getRaces(comp.CompetitionId))
      .filter(r => r.RaceTypeCode === 'DHI' && isEliteCategory(r.CategoryCode))
    if (!races.length) continue

    const sessions = {}
    let venueRaw = null, finalsDate = null
    for (const race of races) {
      const gender = genderOf(race.CategoryCode)
      if (!gender) continue
      const key = sessionKey(race.RaceName, gender)
      venueRaw = venueRaw || race.Venue || race.StartLocation

      const events = asRows(await getEvents(race.Id))
      const ev = events[0]
      if (!ev || !ev.EventId) continue
      const rows = asRows(await getResults(ev.EventId))
        .map(normalizeResultRow)
        .filter(r => r.rank != null)            // drop DNF/DNS/DSQ from ranked list (irm captured separately if needed)
        .sort((a, b) => a.rank - b.rank)
      if (!rows.length) continue

      // compute gap vs winner (using parsed seconds captured during normalize)
      const winSec = rows[0]._secs
      for (const r of rows) {
        r.gap = (winSec != null && r._secs != null && r.rank !== 1) ? fmtGap(r._secs - winSec) : null
        if (r._ambiguousName) review.push(r.name)
        delete r._ambiguousName
        delete r._secs
      }
      sessions[key] = rows
      if (key.startsWith('finals')) finalsDate = jsonDate(race.MandatoryDate) || jsonDate(comp.EndDate) || finalsDate
    }
    if (!Object.keys(sessions).length) continue

    const venue = canonVenue(venueRaw) || { name: (venueRaw || 'Unknown').split(/[-,]/)[0].trim(), slug: slugify(venueRaw), country: comp.CountryIsoCode3 || null }
    rounds.push({
      round:     isWorlds ? null : (roundOf.get(comp.CompetitionId) ?? null),
      eventType: isWorlds ? 'world-championship' : 'world-cup',
      venue:     venue.name,
      slug:      `${venue.slug}-${year}`,
      country:   venue.country || comp.CountryIsoCode3 || null,
      date:      finalsDate || jsonDate(comp.StartDate),
      source:    'dataride',
      sourceRef: `dataride:competition/${comp.CompetitionId}`,
      fetchedAt: new Date().toISOString(),
      sessions,
    })
    onLog(`  ✓ ${(isWorlds ? 'WC' : 'R' + roundOf.get(comp.CompetitionId)).padEnd(4)} ${venue.name.padEnd(20)} ${Object.keys(sessions).join(', ')}`)
  }

  if (review.length) onLog(`  ⚠ ${review.length} ambiguous-cased names flagged for canon review: ${[...new Set(review)].slice(0,10).join('; ')}`)
  return { year: String(year), rounds, reviewNames: [...new Set(review)] }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  const year = process.argv[2]
  const merge    = process.argv.includes('--merge')
  const validate = process.argv.includes('--validate')
  if (!year) { console.log('Usage: node scripts/dataride-fetcher.mjs <year> [--merge|--validate]'); process.exit(0) }

  const { rounds, reviewNames } = await fetchSeason(year, { onLog: s => console.log(s) })
  console.log(`\n${year}: ${rounds.length} rounds assembled`)

  fs.mkdirSync(STAGING_DIR, { recursive: true })
  const stagePath = path.join(STAGING_DIR, `dataride-${year}.json`)
  fs.writeFileSync(stagePath, JSON.stringify({ year: String(year), rounds }, null, 2))
  console.log(`staging → ${path.relative(ROOT, stagePath)}`)
  if (reviewNames.length) console.log(`review names: ${reviewNames.join('; ')}`)

  if (validate) await validateAgainstExisting(year, rounds)
  if (merge)    mergeIntoResults(year, rounds)
}

// Diff DataRide finals winners/podiums vs what's already in results.json (correctness check).
async function validateAgainstExisting(year, rounds) {
  console.log(`\n── VALIDATION: DataRide ${year} vs existing results.json ──`)
  if (!fs.existsSync(RESULTS_PATH)) { console.log('no results.json'); return }
  const existing = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8')).seasons?.[year]?.rounds || []
  const exByVenue = new Map(existing.map(r => [canonVenue(r.venue)?.slug || slugify(r.venue), r]))
  for (const r of rounds) {
    const ex = exByVenue.get(canonVenue(r.venue)?.slug || slugify(r.venue))
    for (const g of ['men', 'women']) {
      const dr = r.sessions[`finals-${g}`]?.[0]
      const exFin = ex?.sessions?.[`finals-${g}`]?.[0]
      if (!dr) continue
      const exName = exFin ? canonName(exFin.name).name : null
      const mark = !exFin ? '🆕' : (exName === dr.name ? '✅' : '❌')
      console.log(`  ${mark} ${r.venue.padEnd(18)} finals-${g}: DataRide=${dr.name}${exFin ? `  existing=${exName}` : '  (not in existing)'}`)
    }
  }
}

function mergeIntoResults(year, rounds) {
  const data = fs.existsSync(RESULTS_PATH)
    ? JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'))
    : { lastUpdated: '', seasons: {} }
  if (!data.seasons) data.seasons = {}
  if (!data.seasons[year]) data.seasons[year] = { rounds: [] }
  const target = data.seasons[year].rounds
  for (const r of rounds) {
    const idx = target.findIndex(x => x.slug === r.slug)
    if (idx >= 0) target[idx] = r; else target.push(r)
  }
  target.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  data.lastUpdated = new Date().toISOString()
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(data, null, 2))
  console.log(`\n✅ merged ${rounds.length} ${year} rounds into public/results.json`)
}

export { fetchSeason }

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error('💥', e.message); process.exit(1) })
