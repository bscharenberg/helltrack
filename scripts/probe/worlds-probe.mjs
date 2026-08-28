/**
 * Temporary probe: /competitions/mtbwch/events?year=2026 404s, so the competition
 * identifier isn't a bare code. Print the full mtbwch object and try id forms.
 * Deleted before merge.
 */
const UA  = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const API = 'https://prod.server.tissottiming.com'

async function j(path) {
  try {
    const res = await fetch(API + path, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    const txt = await res.text()
    try { return { status: res.status, data: JSON.parse(txt), txt } }
    catch { return { status: res.status, data: null, txt } }
  } catch (e) { return { status: 0, data: null, txt: 'THREW ' + e.message } }
}

const all = await j('/competitions?year=2026')
const mtb = (Array.isArray(all.data) ? all.data : []).find(c => c.code === 'mtbwch')
console.log('══ full mtbwch competition object:\n' + JSON.stringify(mtb, null, 1))

console.log('\n══ id-form attempts')
for (const p of [
  '/competitions/mtbwch?year=2026',
  '/competitions/2026/mtbwch',
  '/competitions/2026/mtbwch/events',
  '/competitions/2026mtbwch/events',
  '/competitions/mtbwch/events',
  '/competitions/mtbwch/schedule?year=2026',
  '/competitions/mtbwch/haslive?year=2026',
  '/competitions/mtbwch/summaries?year=2026',
  '/competitions/mtbwch/live?year=2026',
]) {
  const r = await j(p)
  console.log(`\n   ${p} → ${r.status} len=${r.txt.length}\n     ${r.txt.slice(0, 700)}`)
}
