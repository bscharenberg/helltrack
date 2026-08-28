/**
 * Temporary probe: mtbwch2026 events key on `number`. Men Elite DH = 3, Women Elite DH = 12.
 * Pull their phases and results. Deleted before merge.
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
const arr = d => Array.isArray(d) ? d : (d?.phases || d?.results || d?.rows || d?.items || [])

for (const ev of [3, 12]) {
  const ph = await j(`/competitions/${C}/events/${ev}/phases`)
  console.log(`\n══ event ${ev} phases → ${ph.status}`)
  const phases = arr(ph.data)
  if (!phases.length) { console.log('   raw:', (ph.txt || '').slice(0, 900)); continue }
  phases.forEach(p => console.log('   ' + JSON.stringify(p).slice(0, 300)))

  for (const p of phases) {
    const pid = p.number ?? p.code ?? p.id
    const r = await j(`/competitions/${C}/events/${ev}/phases/${pid}/results`)
    const rows = arr(r.data)
    console.log(`\n   ▸ ${ev}/${pid} results → ${r.status}, ${rows.length} rows`)
    if (!rows.length) { console.log('     raw:', (r.txt || '').slice(0, 500)); continue }
    rows.slice(0, 4).forEach(x => console.log('     ' + JSON.stringify(x).slice(0, 400)))
  }
}
