/**
 * Temporary probe: competition id is code+year -> mtbwch2026. Walk events -> phases ->
 * results and find the elite DH sessions. Deleted before merge.
 */
const UA  = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const API = 'https://prod.server.tissottiming.com'
const C   = 'mtbwch2026'

async function j(p) {
  try {
    const res = await fetch(API + p, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    const txt = await res.text()
    try { return { status: res.status, data: JSON.parse(txt), txt } } catch { return { status: res.status, data: null, txt } }
  } catch (e) { return { status: 0, data: null, txt: 'THREW ' + e.message } }
}
const arr = d => Array.isArray(d) ? d : (d?.events || d?.phases || d?.items || d?.results || [])

const ev = await j(`/competitions/${C}/events`)
console.log(`══ /competitions/${C}/events → ${ev.status}`)
const events = arr(ev.data)
if (!events.length) console.log('   raw:', (ev.txt || '').slice(0, 1200))
for (const e of events) console.log('   ' + JSON.stringify(e).slice(0, 220))

const dh = events.filter(e => /dhi|downhill|\bdh\b/i.test(JSON.stringify(e)))
console.log(`\n══ ${dh.length} downhill event(s)`)
for (const e of dh) {
  const id = e.code ?? e.id ?? e.key ?? e.eventCode
  const ph = await j(`/competitions/${C}/events/${id}/phases`)
  console.log(`\n── ${id} phases → ${ph.status}`)
  const phases = arr(ph.data)
  if (!phases.length) { console.log('   raw:', (ph.txt || '').slice(0, 900)); continue }
  for (const p of phases) console.log('   ' + JSON.stringify(p).slice(0, 260))

  for (const p of phases) {
    const pid = p.code ?? p.id ?? p.key ?? p.phaseCode
    const r = await j(`/competitions/${C}/events/${id}/phases/${pid}/results`)
    const rows = arr(r.data)
    console.log(`\n   ▸ results ${id}/${pid} → ${r.status}, ${rows.length} rows`)
    if (!rows.length) { console.log('     raw:', (r.txt || '').slice(0, 400)); continue }
    rows.slice(0, 5).forEach(x => console.log('     ' + JSON.stringify(x).slice(0, 300)))
  }
}
