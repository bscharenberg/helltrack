/**
 * Temporary probe: Tissot API is /competitions/{c}/events/{e}/phases/{p}/results on
 * prod.server.tissottiming.com. Find the competition id for MTB / Val di Sole 2026 Worlds.
 * Deleted before merge.
 */
const UA  = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'
const API = 'https://prod.server.tissottiming.com'

async function get(url, accept = 'application/json,text/html,*/*') {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept } })
    const txt = await res.text()
    return { status: res.status, ct: res.headers.get('content-type') || '', txt }
  } catch (e) { return { status: 0, ct: '', txt: 'THREW ' + e.message } }
}

// ── 1. The Vue router table names the URL scheme the site itself uses ────────
const b = (await get('https://www.tissottiming.com/assets/index-bc679bf1.js')).txt
const routes = [...new Set([...b.matchAll(/path\s*:\s*["'`]([^"'`]{2,80})["'`]/g)].map(m => m[1]))]
console.log(`══ router paths (${routes.length})`)
routes.slice(0, 80).forEach(r => console.log('   ' + r))

// Any hardcoded competition-ish identifiers
const ids = [...new Set([...b.matchAll(/["'`]([a-z0-9]+(?:-[a-z0-9]+){1,5})["'`]/g)].map(m => m[1]))]
  .filter(x => /mtb|bike|cycl|uci|world|champ|dh|downhill/i.test(x))
console.log(`\n══ competition-ish literals (${ids.length})`)
ids.slice(0, 60).forEach(x => console.log('   ' + x))

// ── 2. Listing routes at the competition level ──────────────────────────────
console.log('\n══ listing candidates')
for (const p of ['/competitions', '/competitions/list', '/sports/competitions',
                 '/competitions/mtb', '/competitions/mtb/years', '/competitions/mtb/events',
                 '/competitions/MTB/years', '/competitions/uci-mtb/years',
                 '/competitions/mountainbike/years', '/competitions/cycling/years']) {
  const r = await get(API + p)
  console.log(`   ${p.padEnd(34)} → ${r.status} len=${r.txt.length}  ${r.txt.slice(0, 220)}`)
}
