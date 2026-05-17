/**
 * results-fetcher.mjs
 * Helltrack — fetches UCI DHI race results
 * Uses pdfjs-dist (ESM) to parse ChronoRace PDFs
 *
 * Run: node scripts/results-fetcher.mjs race-of-south-korea-2026
 */

import * as pdfjsLib from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

config()

const __dirname      = path.dirname(fileURLToPath(import.meta.url))
const RESULTS_WORKER = 'https://helltrack-results.scharenbergs.workers.dev'
const OUTPUT_PATH    = path.join(__dirname, '..', 'public', 'results.json')

const CALENDAR_2026 = [
  { slug: 'race-of-south-korea-2026', name: 'Mona YongPyong', date: '2026-05-01', round: 1 },
  { slug: 'loudenvielle-2026',         name: 'Loudenvielle',   date: '2026-05-28', round: 2 },
  { slug: 'leogang-2026',              name: 'Leogang',        date: '2026-06-11', round: 3 },
  { slug: 'lenzerheide-2026',          name: 'Lenzerheide',    date: '2026-06-19', round: 4 },
  { slug: 'la-thuile-2026',            name: 'La Thuile',      date: '2026-07-03', round: 5 },
  { slug: 'pal-arinsal-2026',          name: 'Pal Arinsal',    date: '2026-07-09', round: 6 },
  { slug: 'les-gets-2026',             name: 'Les Gets',       date: '2026-08-20', round: 7 },
  { slug: 'val-di-sole-2026',          name: 'Val di Sole',    date: '2026-08-26', round: 8 },
  { slug: 'whistler-2026',             name: 'Whistler',       date: '2026-09-25', round: 9 },
  { slug: 'lake-placid-2026',          name: 'Lake Placid',    date: '2026-10-02', round: 10 },
]

// ─── PDF text extraction ──────────────────────────────────────────────────────

async function extractPDFText(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer)
  const doc  = await pdfjsLib.getDocument({ data }).promise
  const pages = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page    = await doc.getPage(p)
    const content = await page.getTextContent()
    pages.push(content.items.map(i => i.str).join(' '))
  }
  return pages.join('\n')
}

// ─── Session detection ────────────────────────────────────────────────────────

function detectSession(text) {
  const t = text.toUpperCase()
  const isDHI   = t.includes('DOWNHILL')
  const isXCO   = t.includes('CROSS COUNTRY') || t.includes('CROSS-COUNTRY') ||
                  t.includes('XCO') || t.includes('XCC') || t.includes('SHORT TRACK')
  const isEDR   = t.includes('ENDURO') || t.includes('EDR')
  const isMixed = t.includes('MIXED')

  if (!isDHI || isXCO || isEDR || isMixed) return null

  const isElite  = t.includes('ELITE')
  const isJunior = t.includes('JUNIOR')
  const isMen    = t.includes('MEN') && !t.includes('WOMEN')
  const isWomen  = t.includes('WOMEN')
  const isFinals = t.includes('FINAL')
  const isQ1     = t.includes('QUALIFYING ROUND 1') || t.includes('QUALIFYING 1')
  const isQ2     = t.includes('QUALIFYING ROUND 2') || t.includes('QUALIFYING 2')
  const isQual   = t.includes('QUALIFYING')
  const isTimed  = t.includes('TIMED TRAINING')
  const isTeam   = t.includes('TEAM RESULTS')

  if (isTeam)                           return 'team'
  if (isElite && isWomen && isFinals)   return 'finals-women'
  if (isElite && isMen   && isFinals)   return 'finals-men'
  if (isElite && isWomen && isQ1)       return 'qualifying-1-women'
  if (isElite && isMen   && isQ1)       return 'qualifying-1-men'
  if (isElite && isWomen && isQ2)       return 'qualifying-2-women'
  if (isElite && isMen   && isQ2)       return 'qualifying-2-men'
  if (isElite && isWomen && isQual)     return 'qualifying-women'
  if (isElite && isMen   && isQual)     return 'qualifying-men'
  if (isElite && isWomen && isTimed)    return 'timed-training-women'
  if (isElite && isMen   && isTimed)    return 'timed-training-men'
  if (isJunior && isWomen && isFinals)  return 'finals-junior-women'
  if (isJunior && isMen   && isFinals)  return 'finals-junior-men'
  if (isJunior && isWomen)              return 'qualifying-junior-women'
  if (isJunior && isMen)                return 'qualifying-junior-men'
  return 'unknown-dhi'
}

// ─── Results parsing ──────────────────────────────────────────────────────────

function timeToSeconds(t) {
  const parts = t.split(':')
  return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
}

/**
 * Extract first non-repeated name from a string like:
 * "VERMETTE Asa VERMETTE Asa VERMETTE Asa VERMETTE Asa FRAMEWORKS RACING / TRP"
 */
function extractName(rawName) {
  const s = rawName.trim()
  // Try to find a repeating pattern by looking for the name repeating
  const words = s.split(/\s+/)
  // Find where the name starts repeating — try lengths 2-6 words
  for (let len = 2; len <= Math.min(6, Math.floor(words.length / 2)); len++) {
    const candidate = words.slice(0, len).join(' ')
    const next      = words.slice(len, len * 2).join(' ')
    if (candidate === next) return candidate
  }
  // Fallback: take first half of words if even count, else first 3 words
  return words.slice(0, Math.min(3, Math.ceil(words.length / 4))).join(' ')
}

function parseResults(rawText, session) {
  const results = []

  // Anchor on rank + bib + name... UCI_ID (10-11 digits) + NAT + YOB
  const UCI_ID = /(\d{1,3})\.\s+(\d{1,3})\s+(.+?)\s+(\d{10,11})\s+([A-Z]{3})\s+(\d{4})/g

  let m
  const rows = []

  while ((m = UCI_ID.exec(rawText)) !== null) {
    rows.push({
      rank:   parseInt(m[1]),
      bib:    parseInt(m[2]),
      name:   extractName(m[3]),
      nat:    m[5],
      uciId:  m[4],
      index:  m.index,
      endIdx: m.index + m[0].length,
    })
  }

  for (let r = 0; r < rows.length; r++) {
    const row     = rows[r]
    const nextIdx = rows[r+1]?.index ?? rawText.length
    const segment = rawText.slice(row.endIdx, nextIdx)

    // Find all DHI-style times M:SS.mmm
    const times  = []
    const timeRe = /(\d+):(\d{2})\.(\d{3})/g
    let tm
    while ((tm = timeRe.exec(segment)) !== null) {
      times.push({ val: tm[0], secs: timeToSeconds(tm[0]), idx: tm.index })
    }

    if (times.length === 0) continue

    // Finish time = largest (cumulative final time, always > all splits)
    const finishTime = times.reduce((max, t) => t.secs > max.secs ? t : max)
    const time       = finishTime.val

    // Gap and points follow the finish time
    const after       = segment.slice(finishTime.idx + time.length, finishTime.idx + time.length + 80)
    const gapMatch    = after.match(/\+(\d+\.\d{3})/)
    const gap         = gapMatch ? '+' + gapMatch[1] : (row.rank === 1 ? '+0.000' : null)
    const pointsMatch = after.match(/\b(200|160|150|140|130|120|110|100|95|90|85|80|75|70|65|60|55|50|45|40|36|32|28|24|20|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1)\b/)
    const points      = pointsMatch ? parseInt(pointsMatch[1]) : null

    if (results.find(res => res.rank === row.rank)) continue

    results.push({ rank: row.rank, bib: row.bib, name: row.name, nat: row.nat, time, gap, points, session })
  }

  return results.sort((a, b) => a.rank - b.rank)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function fetchResults(venueSlug) {
  console.log(`\n🏁 Fetching results for: ${venueSlug}\n`)

  console.log('📡 Calling results Worker...')
  const workerRes = await fetch(`${RESULTS_WORKER}/?venue=${venueSlug}`)
  if (!workerRes.ok) throw new Error(`Worker returned ${workerRes.status}`)
  const { pdfUrls, venue: venueName, date } = await workerRes.json()
  console.log(`  → ${pdfUrls.length} PDF URLs`)

  const sessions     = {}
  const sessionsSeen = new Set()
  let dhiCount = 0
  let skipped  = 0

  for (const url of pdfUrls) {
    try {
      const res = await fetch(url)
      if (!res.ok) { console.log(`  ✗ ${res.status}`); continue }

      const arrayBuffer = await res.arrayBuffer()
      const text        = await extractPDFText(arrayBuffer)
      const session     = detectSession(text)

      if (!session) { skipped++; continue }

      let sessionKey = session
      if (sessionsSeen.has(sessionKey)) sessionKey = `${session}-b`
      sessionsSeen.add(sessionKey)

      const results = parseResults(text, sessionKey)
      console.log(`  ✅ ${sessionKey} → ${results.length} results`)

      if (results.length > 0) {
        sessions[sessionKey] = results
        dhiCount++
      }

    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
    }
  }

  console.log(`\n  ${dhiCount} DHI sessions, ${skipped} non-DHI skipped`)

  return {
    venue:     venueName || venueSlug,
    slug:      venueSlug,
    date,
    round:     CALENDAR_2026.find(r => r.slug === venueSlug)?.round || null,
    fetchedAt: new Date().toISOString(),
    sessions,
  }
}

async function main() {
  const venueSlug = process.argv[2]

  if (!venueSlug) {
    console.log('Usage: node scripts/results-fetcher.mjs <venue-slug>')
    console.log('\n2026 venues:')
    CALENDAR_2026.forEach(v => console.log(`  ${v.slug}  (${v.name}, ${v.date})`))
    process.exit(0)
  }

  try {
    const result = await fetchResults(venueSlug)

    let existing = { lastUpdated: '', seasons: {} }
    if (fs.existsSync(OUTPUT_PATH)) {
      const raw = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
      existing = raw.seasons ? raw : { lastUpdated: '', seasons: { '2026': { rounds: raw.rounds||[] } } }
    }

    if (!existing.seasons['2026']) existing.seasons['2026']={rounds:[]}
    const rounds=existing.seasons['2026'].rounds
    const idx=rounds.findIndex(r => r.slug === venueSlug)
    if (idx >= 0) rounds[idx] = result
    else {
      rounds.push(result)
      rounds.sort((a, b) => a.round - b.round)
    }
    existing.lastUpdated = new Date().toISOString()

    const publicDir = path.join(__dirname, '..', 'public')
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2))

    console.log(`\n🏁 Done — wrote ${OUTPUT_PATH}`)
    console.log(`   Sessions: ${Object.keys(result.sessions).join(', ')}`)

    const finals = result.sessions['finals-men']
    if (finals?.length) {
      console.log('\nTop 5 Elite Men:')
      finals.slice(0, 5).forEach(r => console.log(`  ${r.rank}. ${r.name} — ${r.time}`))
    }
    const finalsW = result.sessions['finals-women']
    if (finalsW?.length) {
      console.log('\nTop 5 Elite Women:')
      finalsW.slice(0, 5).forEach(r => console.log(`  ${r.rank}. ${r.name} — ${r.time}`))
    }

  } catch (err) {
    console.error('\n💥 Failed:', err.message)
    process.exit(1)
  }
}

main()
