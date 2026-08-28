/**
 * Temporary probe: /competitions?year=2026 is the Tissot listing route. Find the MTB
 * World Championships competition, then walk events → phases → results for Val di Sole.
 * Deleted before merge.
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

const sports = await j('/competitions/sports')
console.log('══ /competitions/sports →', sports.status, JSON.stringify(sports.data ?? sports.txt).slice(0, 900))

for (const qs of ['?year=2026', '?year=2026&sport=MTB']) {
  const r = await j('/competitions' + qs)
  console.log(`\n══ /competitions${qs} → ${r.status}`)
  const list = Array.isArray(r.data) ? r.data : (r.data?.competitions || r.data?.items || [])
  if (!list.length) { console.log('   ', JSON.stringify(r.data ?? r.txt).slice(0, 900)); continue }
  console.log(`   ${list.length} competitions`)
  for (const c of list) console.log('   ' + JSON.stringify(c).slice(0, 260))
}
