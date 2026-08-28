/**
 * chronorace-fetcher.mjs
 * Helltrack — race results from ChronoRace, the UCI's on-site timing vendor.
 *
 * ChronoRace is upstream of every other source: the official UCI results PDFs are theirs
 * (`Producer: chronorace - electronic timing via ABCpdf`), and the Les Gets 2026 Elite Men
 * report was stamped ~40 min after the last rider. Background in docs/chronorace-api.md.
 *
 * results.chronorace.be is public and self-documented (Swagger at /swagger). The WBD
 * document is discovery-based, so unlike results-fetcher.mjs this needs no hardcoded
 * race calendar:
 *     discovery/event-list → discovery/competition-list/{eventId} → resource/results/{competitionId}
 *
 * Confirmed so far:
 *   • event ids are `wbd-<season>-<n>`; venue is in `VenueLocation` (NOT `Name`)
 *   • wbd-2026-11 = Les Gets (StartDate 2026-08-21), matching PDF code 2026-11-DHI-ME-F
 *
 * Usage: node scripts/chronorace-fetcher.mjs --probe [--raw]
 */

const BASE = 'https://results.chronorace.be'
const WBD  = `${BASE}/api/v1/wbd`
const UA   = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function get(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    const text = await res.text()
    let data = null
    try { data = JSON.parse(text) } catch {}
    return { status: res.status, text, data }
  } catch (err) { return { status: 0, text: `ERR ${err.message}`, data: null } }
}

// Flatten a schema to "prop: type" so we can read exact field names without dumping 69KB.
function describe(schema, spec, depth = 0, seen = new Set()) {
  if (!schema || depth > 5) return '…'
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop()
    if (seen.has(name)) return `<${name}>`
    const next = new Set(seen); next.add(name)
    const target = spec.components?.schemas?.[name] || spec.definitions?.[name]
    if (target?.enum) return `${name}=enum${JSON.stringify(target.enum)}`
    return `${name}{ ${describe(target, spec, depth + 1, next)} }`
  }
  if (schema.enum) return `enum${JSON.stringify(schema.enum)}`
  if (schema.type === 'array') return `[ ${describe(schema.items, spec, depth + 1, seen)} ]`
  if (schema.properties) {
    return Object.entries(schema.properties)
      .map(([k, v]) => `${k}: ${describe(v, spec, depth + 1, new Set(seen))}`)
      .join(', ')
  }
  return (schema.type || '?') + (schema.format ? `(${schema.format})` : '')
}

// ─── A. The generic ChronoRace results API (the non-WBD document) ─────────────
async function probeChronoRaceSpec() {
  console.log('########## A. ChronoRace generic Results API spec ##########')
  const r = await get(`${BASE}/swagger/ChronoRace/swagger.json`)
  if (!r.data) { console.log('load failed:', r.status); return }
  const s = r.data
  console.log(`title: ${s.info?.title} v${s.info?.version}`)
  console.log(`security: ${JSON.stringify(Object.keys(s.components?.securitySchemes || {}))}`)
  for (const [p, ops] of Object.entries(s.paths || {})) {
    if (!/results\/generic/.test(p)) continue
    const op = ops.get; if (!op) continue
    console.log(`\n=== GET ${p}`)
    for (const prm of op.parameters || []) {
      const t = prm.schema?.$ref ? describe(prm.schema, s) : (prm.schema?.type || prm.type || '?')
      console.log(`   ${prm.name} in=${prm.in} req=${!!prm.required} type=${t}`)
    }
  }
}

// ─── B. Deep schemas for the two result-row types ─────────────────────────────
async function probeRowSchemas() {
  console.log('\n\n########## B. WBD result-row schemas ##########')
  const r = await get(`${BASE}/swagger/WBD/swagger.json`)
  if (!r.data) { console.log('load failed:', r.status); return }
  const s = r.data
  for (const name of ['WbdResultEntry', 'WbdDhiResultEntry', 'WbdRider', 'WbdNextRider']) {
    const key = Object.keys(s.components?.schemas || {}).find(k => k.endsWith('.' + name) || k === name)
    if (!key) { console.log(`\n${name}: (not found)`); continue }
    console.log(`\n${name}:\n   ${describe({ $ref: `#/components/schemas/${key}` }, s).slice(0, 1600)}`)
  }
}

// ─── C. Full event list, and where Worlds lives ───────────────────────────────
async function probeEvents(showRaw) {
  console.log('\n\n########## C. Event discovery ##########')
  const r = await get(`${WBD}/discovery/event-list?season=2026`)
  const events = Array.isArray(r.data) ? r.data : []
  console.log(`status=${r.status} events=${events.length}\n`)
  for (const e of events) {
    console.log(`  ${e.EventId.padEnd(13)} ${String(e.StartDate).slice(0,10)}→${String(e.EndDate).slice(0,10)}  ${String(e.Country).padEnd(4)} ${String(e.VenueLocation).padEnd(34)} ${JSON.stringify(e.Disciplines)}  status=${e.WbdEventStatus}`)
  }

  // Worlds (Val di Sole, ITA, finals 2026-08-29) — is it in this feed at all?
  const ita = events.filter(e => e.Country === 'ITA' || /sole/i.test(e.VenueLocation || ''))
  console.log(`\nITA / "sole" events: ${JSON.stringify(ita.map(e => [e.EventId, e.VenueLocation, String(e.StartDate).slice(0,10)]))}`)
  const thisWeek = events.filter(e => String(e.StartDate).slice(0,10) >= '2026-08-24' && String(e.StartDate).slice(0,10) <= '2026-08-31')
  console.log(`events starting this week: ${JSON.stringify(thisWeek.map(e => [e.EventId, e.VenueLocation]))}`)

  // Other seasons / a Worlds-specific season bucket?
  for (const q of ['season=2026&discipline=DHI', 'season=2027', 'season=2025']) {
    const rr = await get(`${WBD}/discovery/event-list?${q}`)
    const n = Array.isArray(rr.data) ? rr.data.length : '-'
    console.log(`  event-list?${q} → ${rr.status}, ${n} events`)
    await sleep(120)
  }
  return events
}

// ─── D. Walk Les Gets end-to-end (known answers → validates the whole chain) ──
async function walkLesGets(events, showRaw) {
  console.log('\n\n########## D. Walk Les Gets (wbd-2026-11) ##########')
  const ev = events.find(e => e.EventId === 'wbd-2026-11')
        || events.find(e => String(e.StartDate).slice(0,10) === '2026-08-21')
  if (!ev) { console.log('not found'); return }
  console.log(`event: ${ev.EventId} ${ev.VenueLocation} ${ev.Country}`)

  const cr = await get(`${WBD}/discovery/competition-list/${ev.EventId}`)
  const comps = Array.isArray(cr.data) ? cr.data : []
  console.log(`\ncompetition-list: status=${cr.status} items=${comps.length}`)
  if (showRaw && !comps.length) console.log('raw:', cr.text.slice(0, 500))
  for (const c of comps) {
    console.log(`  ${String(c.CompetitionId).padEnd(26)} ${String(c.Discipline).padEnd(5)} ${String(c.CategoryCode).padEnd(5)} ${String(c.Phase).padEnd(10)} ${String(c.Date).slice(0,10)} ${c.PhaseName || ''}`)
  }

  // Elite men's DHI final — we know the answer: Max Alran 3:27.924, 30 riders.
  const dhi = comps.filter(c => c.Discipline === 'DHI')
  const target = dhi.find(c => c.CategoryCode === 'ME' && /final/i.test(c.Phase + c.PhaseName)) || dhi[0]
  if (!target) { console.log('\nno DHI competition'); return }
  console.log(`\n>>> results for ${target.CompetitionId} (${target.CategoryCode} ${target.Phase})`)
  const rr = await get(`${WBD}/resource/results/${target.CompetitionId}`)
  console.log(`status=${rr.status} len=${rr.text.length}`)
  if (!rr.data) { console.log('raw:', rr.text.slice(0, 500)); return }
  console.log(`top-level: ${Object.keys(rr.data).join(', ')}`)
  console.log(`MetaData: ${JSON.stringify(rr.data.MetaData).slice(0, 400)}`)
  const rows = rr.data.Data || []
  console.log(`Data rows: ${rows.length}`)
  if (rows[0]) console.log(`row[0] keys: ${Object.keys(rows[0]).join(', ')}`)
  if (rows[0]) console.log(`row[0]: ${JSON.stringify(rows[0]).slice(0, 800)}`)
  console.log('\ntop 5:')
  for (const row of rows.slice(0, 5)) console.log('  ', JSON.stringify(row).slice(0, 300))
}

const showRaw = process.argv.includes('--raw')
await probeChronoRaceSpec()
await probeRowSchemas()
const events = await probeEvents(showRaw)
if (events?.length) await walkLesGets(events, showRaw)
console.log('\n########## done ##########')
