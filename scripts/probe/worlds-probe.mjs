/**
 * Temporary probe: find a source for Val di Sole 2026 World Championships.
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

// ── 1. Full operation objects for the generic results routes ──────────────────
const spec = JSON.parse((await get(`${BASE}/swagger/ChronoRace/swagger.json`)).txt)
console.log('══ generic results operations (verbatim)')
for (const [p, ops] of Object.entries(spec.paths || {})) {
  if (!p.includes('/api/results/generic')) continue
  console.log(`\n── ${p}\n${JSON.stringify(ops, null, 1)}`)
}
const wanted = new Set()
JSON.stringify(spec.paths).replace(/"#\/components\/schemas\/([^"]+)"/g, (_, n) => wanted.add(n))
for (const n of wanted) console.log(`\n── schema ${n}: ${JSON.stringify(spec.components?.schemas?.[n])?.slice(0, 900)}`)

// ── 2. Parameterless endpoints — may enumerate databases ──────────────────────
for (const p of ['/api/results/generic/timestamp', '/api/results/generic/unixtimestamp', '/api/permission/get']) {
  const r = await get(BASE + p)
  console.log(`\n══ ${p} → ${r.status}  ${r.txt.slice(0, 500)}`)
}

// ── 3. Matrix on a KNOWN-GOOD weekend (Les Gets = 20260821_mtb) ───────────────
// If nothing here returns 200, the db/discipline vocabulary is wrong, not the date.
const dbs = ['20260821_mtb', '20260821_MTB', '20260821mtb', '20260822_mtb', '2026_mtb', '20260821_uci_mtb']
const disciplines = ['dhi', 'DHI', 'mtb', 'MTB', 'dh', 'vtt', 'default', 'main', '1', '2']
console.log('\n══ generic/uci matrix (key=2)')
for (const db of dbs) {
  for (const d of disciplines) {
    const r = await get(`${BASE}/api/results/generic/uci/${db}/${d}/2`)
    if (r.status !== 204) console.log(`   ${db}/${d} → ${r.status} ${r.ct} ${r.txt.slice(0, 160)}`)
  }
}
console.log('   (only non-204 shown)')

console.log('\n══ generic/get + raw with customer variants (db=20260821_mtb, discipline=dhi, key=2)')
for (const c of ['uci', 'UCI', 'chronorace', 'wbd', 'mtb', 'default']) {
  for (const route of ['get', 'raw']) {
    const r = await get(`${BASE}/api/results/generic/${route}/${c}/20260821_mtb/dhi/2`)
    if (r.status !== 204) console.log(`   ${route}/${c} → ${r.status} ${r.txt.slice(0, 160)}`)
  }
}
console.log('   (only non-204 shown)')

// ── 4. Val di Sole Worlds candidate dbs on whatever shape works ───────────────
console.log('\n══ Worlds candidate dbs on generic/uci/{db}/dhi/2')
for (const db of ['20260824_mtb', '20260825_mtb', '20260826_mtb', '20260827_mtb', '20260828_mtb', '20260829_mtb']) {
  const r = await get(`${BASE}/api/results/generic/uci/${db}/dhi/2`)
  console.log(`   ${db} → ${r.status} ${r.txt.slice(0, 120)}`)
}
