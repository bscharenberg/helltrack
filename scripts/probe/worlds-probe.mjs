/**
 * Temporary probe: learn the real ChronoRace results URL shape from their own
 * front-end bundle, and locate Val di Sole 2026 Worlds. Deleted before merge.
 */
const UA = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'

async function get(url, accept = 'text/html,application/json,*/*') {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept } })
    const txt = await res.text()
    return { status: res.status, ct: res.headers.get('content-type') || '', txt }
  } catch (e) { return { status: 0, ct: '', txt: 'THREW ' + e.message } }
}

// ── 1. The results.chronorace.be SPA — what does its own JS call? ─────────────
const root = await get('https://results.chronorace.be/')
console.log(`══ results.chronorace.be/ → ${root.status} ${root.ct} (${root.txt.length}b)`)
const assets = [...root.txt.matchAll(/(?:src|href)="([^"]+\.(?:js|mjs))"/g)].map(m => m[1])
console.log('   assets:', assets.join(' ') || '(none)')

const PATTERNS = /(?:\/api\/[A-Za-z0-9_\-{}/.$+]+|generic\/[A-Za-z0-9_\-{}/.$+]+|[0-9]{8}_[a-z]+)/g
for (const a of assets.slice(0, 12)) {
  const url = a.startsWith('http') ? a : 'https://results.chronorace.be' + (a.startsWith('/') ? a : '/' + a)
  const js = await get(url)
  const hits = [...new Set([...js.txt.matchAll(PATTERNS)].map(m => m[0]))]
  console.log(`\n── ${url} → ${js.status} (${js.txt.length}b)  ${hits.length} api-ish strings`)
  hits.slice(0, 120).forEach(h => console.log('     ' + h))
}

// ── 2. Does the raw route actually carry a body for a known-good weekend? ─────
console.log('\n══ raw route body check (Les Gets weekend, keys 1-12 + 85-99)')
for (const key of [...Array(12).keys()].map(n => n + 1).concat([85, 86, 87, 88, 90, 95, 99])) {
  const r = await get(`https://results.chronorace.be/api/results/generic/raw/uci/20260821_mtb/dhi/${key}`, 'application/json')
  console.log(`   key=${key} → ${r.status} ${r.ct} len=${r.txt.length}  ${r.txt.slice(0, 120)}`)
}

// ── 3. Official Worlds front-ends — is there a live-timing host to read? ──────
for (const u of [
  'https://www.tissottiming.com/',
  'https://www.uci.org/',
  'https://results.chronorace.be/uci',
  'https://results.chronorace.be/api/results/generic/raw/uci/20260826_mtb/dhi/1',
  'https://results.chronorace.be/api/results/generic/raw/uci/20260827_mtb/dhi/1',
  'https://results.chronorace.be/api/results/generic/raw/uci/20260828_mtb/dhi/1',
]) {
  const r = await get(u)
  const title = (r.txt.match(/<title[^>]*>([^<]*)<\/title>/i) || [, ''])[1]
  console.log(`\n══ ${u} → ${r.status} ${r.ct} len=${r.txt.length}  ${title ? 'title=' + title : r.txt.slice(0, 160)}`)
}
