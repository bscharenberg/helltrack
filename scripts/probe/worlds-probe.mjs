/**
 * Temporary probe: the Pinkbike comment thread on the Val di Sole qualifying article
 * points at an "official Tissot timing page" as the live source for Worlds. Tissot is the
 * UCI's official timing partner, so find what host/API that page reads. Deleted before merge.
 */
const UA = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'

async function get(url, accept = 'text/html,application/json,*/*') {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept } })
    const txt = await res.text()
    return { status: res.status, ct: res.headers.get('content-type') || '', txt }
  } catch (e) { return { status: 0, ct: '', txt: 'THREW ' + e.message } }
}

const ROOT = 'https://www.tissottiming.com'
const page = await get(ROOT + '/')
console.log(`══ ${ROOT}/ → ${page.status} (${page.txt.length}b)`)

const assets = [...new Set([...page.txt.matchAll(/(?:src|href)="([^"]+\.(?:js|mjs))"/g)].map(m => m[1]))]
console.log('   scripts:', assets.join(' ') || '(none)')

// Any absolute host referenced by the page itself
const hosts = [...new Set([...page.txt.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map(m => m[1]))]
console.log('   hosts in HTML:', hosts.join(' '))

// Read the bundles: what API base and what event vocabulary do they use?
const API = /(?:https?:\/\/[a-z0-9.-]+\.[a-z]{2,})?\/(?:api|data|feed|results|live)\/[A-Za-z0-9_\-{}/.$+]*/gi
const MTB = /[A-Za-z0-9_-]*(?:mtb|MTB|DHI|dhi|downhill|worldchamp)[A-Za-z0-9_-]*/g
for (const a of assets.slice(0, 10)) {
  const url = a.startsWith('http') ? a : ROOT + (a.startsWith('/') ? a : '/' + a)
  const js = await get(url)
  const apis = [...new Set([...js.txt.matchAll(API)].map(m => m[0]))]
  const mtb  = [...new Set([...js.txt.matchAll(MTB)].map(m => m[0]))]
  console.log(`\n── ${url} → ${js.status} (${js.txt.length}b)`)
  console.log('   api paths:', apis.slice(0, 60).join(' ') || '(none)')
  console.log('   mtb-ish  :', mtb.slice(0, 40).join(' ') || '(none)')
}

// Sitemap / robots often reveal the event URL scheme without executing the SPA
for (const p of ['/robots.txt', '/sitemap.xml']) {
  const r = await get(ROOT + p)
  console.log(`\n══ ${p} → ${r.status} (${r.txt.length}b)\n${r.txt.slice(0, 800)}`)
}
