/**
 * Temporary probe: competitionsDetail takes a single opaque id and no query, so the id
 * must be globally unique (i.e. carry the year). Try id forms + the search/livelink
 * routes, which should hand back whatever identifier the site actually uses.
 * Deleted before merge.
 */
const UA  = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const API = 'https://prod.server.tissottiming.com'

async function j(p) {
  try {
    const res = await fetch(API + p, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    return { status: res.status, txt: await res.text() }
  } catch (e) { return { status: 0, txt: 'THREW ' + e.message } }
}

console.log('══ search / livelink — these should reveal the real identifier')
for (const p of ['/competitions/search?query=mtbwch', '/competitions/search?query=mountain%20bike',
                 '/competitions/search?query=mountain%20bike&year=2026', '/competitions/livelink',
                 '/competitions/livelink?year=2026']) {
  const r = await j(p)
  console.log(`\n   ${p} → ${r.status} len=${r.txt.length}\n     ${r.txt.slice(0, 1200)}`)
}

console.log('\n══ id forms for competitionsDetail (only non-404 shown)')
const forms = ['mtbwch2026','mtbwch-2026','mtbwch_2026','2026-mtbwch','2026_mtbwch','MTBWCH2026',
               'MTBWCH','mtbwch.2026','26mtbwch','mtbwch26','mtb2026wch','2026mtbwch']
for (const f of forms) {
  const r = await j('/competitions/' + f)
  if (r.status !== 404) console.log(`   ${f} → ${r.status} ${r.txt.slice(0, 400)}`)
}
console.log('   (done)')
