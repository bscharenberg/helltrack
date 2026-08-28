/**
 * Temporary probe: walk Tissot mtbwch 2026 → events → phases → results and find the
 * elite DH sessions for Val di Sole. Deleted before merge.
 */
const UA  = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const API = 'https://prod.server.tissottiming.com'

async function j(path) {
  try {
    const res = await fetch(API + path, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    const txt = await res.text()
    try { return { status: res.status, data: JSON.parse(txt) } }
    catch { return { status: res.status, data: null, txt } }
  } catch (e) { return { status: 0, data: null, txt: 'THREW ' + e.message } }
}
const arr = d => Array.isArray(d) ? d : (d?.events || d?.phases || d?.items || d?.results || [])

const ev = await j('/competitions/mtbwch/events?year=2026')
console.log('══ /competitions/mtbwch/events?year=2026 →', ev.status)
const events = arr(ev.data)
if (!events.length) console.log('   raw:', JSON.stringify(ev.data ?? ev.txt).slice(0, 1500))
for (const e of events) console.log('   ' + JSON.stringify(e).slice(0, 300))

// Walk phases for anything downhill-ish
for (const e of events) {
  const id = e.code ?? e.id ?? e.key
  if (!id) continue
  if (!/dh|down/i.test(JSON.stringify(e))) continue
  const ph = await j(`/competitions/mtbwch/events/${id}/phases?year=2026`)
  console.log(`\n── phases for event ${id} → ${ph.status}`)
  const phases = arr(ph.data)
  if (!phases.length) { console.log('   raw:', JSON.stringify(ph.data ?? ph.txt).slice(0, 800)); continue }
  for (const p of phases) console.log('   ' + JSON.stringify(p).slice(0, 300))
}
