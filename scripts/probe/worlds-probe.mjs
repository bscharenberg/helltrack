/**
 * Temporary probe: locate Val di Sole 2026 World Championships on ChronoRace.
 * Not part of the pipeline — deleted before merge.
 */
const BASE = 'https://results.chronorace.be'
const UA   = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'

async function get(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    const txt = await res.text()
    return { status: res.status, ct: res.headers.get('content-type') || '', txt }
  } catch (e) { return { status: 0, ct: '', txt: 'THREW ' + e.message } }
}

// ── 1. Every path in every public spec ────────────────────────────────────────
for (const doc of ['ChronoRace', 'Timing', 'WBD']) {
  const r = await get(`${BASE}/swagger/${doc}/swagger.json`)
  console.log(`\n══ /swagger/${doc}/swagger.json → ${r.status} (${r.txt.length}b)`)
  if (r.status !== 200) { console.log('   ', r.txt.slice(0, 200)); continue }
  let spec
  try { spec = JSON.parse(r.txt) } catch { console.log('   not json'); continue }
  for (const [p, ops] of Object.entries(spec.paths || {})) {
    for (const [m, op] of Object.entries(ops)) {
      const params = (op.parameters || []).map(x => `${x.name}:${x.in}${x.required ? '*' : ''}`).join(' ')
      console.log(`  ${m.toUpperCase().padEnd(4)} ${p}${params ? '   [' + params + ']' : ''}`)
    }
  }
}

// ── 2. WBD event-list raw — does 2026 carry the Worlds at all? ────────────────
for (const qs of ['', '?season=2026', '?season=2026&discipline=DHI']) {
  const r = await get(`${BASE}/api/v1/wbd/discovery/event-list${qs}`)
  console.log(`\n══ event-list${qs} → ${r.status}`)
  if (r.status === 200) {
    try {
      const j = JSON.parse(r.txt)
      const arr = Array.isArray(j) ? j : (j.Events || j.events || j.Data || [])
      console.log(`   ${arr.length} events`)
      for (const e of arr) {
        console.log(`   ${String(e.EventId ?? e.Id ?? '?').padEnd(16)} ${String(e.StartDate || '').slice(0,10)}  ${(e.VenueLocation||e.Name||'?')}  [${(e.Disciplines||[]).join(',')}]  ${e.Country||''}`)
      }
    } catch { console.log('   ', r.txt.slice(0, 400)) }
  } else console.log('   ', r.txt.slice(0, 200))
}
