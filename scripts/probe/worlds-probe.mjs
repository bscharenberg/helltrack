/**
 * Temporary probe: tissottiming.com's bundle names a REST API at
 * prod.server.tissottiming.com (/events/{id}/phases/{phase}/results, plus a SignalR
 * /livehub). Find the event-listing route and the Val di Sole 2026 Worlds event id.
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

// ── 1. Every path-shaped template literal in the bundle ──────────────────────
const bundle = await get('https://www.tissottiming.com/assets/index-bc679bf1.js')
console.log(`══ bundle → ${bundle.status} (${bundle.txt.length}b)`)
const paths = [...new Set([...bundle.txt.matchAll(/`(\/[A-Za-z0-9_\-${}/.]+)`/g)].map(m => m[1]))]
console.log(`   ${paths.length} path templates:`)
paths.slice(0, 150).forEach(p => console.log('     ' + p))

// ── 2. Candidate listing routes ──────────────────────────────────────────────
console.log('\n══ listing-route candidates')
for (const p of ['/events', '/events/list', '/events/current', '/events/live', '/events/active',
                 '/calendar', '/sports', '/seasons', '/events/2026', '/events/upcoming']) {
  const r = await get(API + p)
  console.log(`   ${p.padEnd(20)} → ${r.status} ${r.ct} len=${r.txt.length}  ${r.txt.slice(0, 200)}`)
}
