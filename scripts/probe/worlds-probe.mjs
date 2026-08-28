/**
 * Temporary probe: tissottiming.com serves event assets from an Azure static-website
 * storage account (tissottiming.z6.web.core.windows.net/events/{code}/...). If the
 * container lists, every event folder — including Val di Sole Worlds — is enumerable,
 * and static JSON on blob storage is a far better source than an SPA. Deleted before merge.
 */
const UA = 'Mozilla/5.0 (Helltrack results fetcher; helltrack.app)'

async function get(url, accept = 'text/html,application/json,application/xml,*/*') {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept } })
    const txt = await res.text()
    return { status: res.status, ct: res.headers.get('content-type') || '', txt }
  } catch (e) { return { status: 0, ct: '', txt: 'THREW ' + e.message } }
}

// ── 1. Try to list the blob container behind the static site ─────────────────
for (const u of [
  'https://tissottiming.blob.core.windows.net/$web?restype=container&comp=list&maxresults=2000',
  'https://tissottiming.blob.core.windows.net/$web?restype=container&comp=list&prefix=events/&delimiter=/&maxresults=2000',
  'https://tissottiming.z6.web.core.windows.net/events/',
]) {
  const r = await get(u)
  console.log(`\n══ ${u}\n   → ${r.status} ${r.ct} len=${r.txt.length}`)
  if (r.status === 200 && r.txt.length) {
    const names = [...new Set([...r.txt.matchAll(/<(?:Name|BlobPrefix>\s*<Name)>([^<]+)</g)].map(m => m[1]))]
    if (names.length) { console.log(`   ${names.length} entries:`); names.slice(0, 200).forEach(n => console.log('     ' + n)) }
    else console.log('   ' + r.txt.slice(0, 600))
  } else console.log('   ' + r.txt.slice(0, 300))
}

// ── 2. Does the site's own JS name an API host / event-code scheme? ──────────
const page = await get('https://www.tissottiming.com/')
const mods = [...new Set([...page.txt.matchAll(/(?:src|href)="([^"]*\.js[^"]*)"/g)].map(m => m[1]))]
console.log(`\n══ tissottiming.com scripts (${mods.length}):`, mods.join(' ') || '(none — check inline)')
const inline = [...page.txt.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
console.log('   inline script bytes:', inline.length)
const hosts = [...new Set([...page.txt.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map(m => m[1]))]
console.log('   hosts referenced:', hosts.join(' '))

for (const m of mods.slice(0, 8)) {
  const url = m.startsWith('http') ? m : 'https://www.tissottiming.com' + (m.startsWith('/') ? m : '/' + m)
  const js = await get(url)
  const api = [...new Set([...js.txt.matchAll(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}[A-Za-z0-9_\-/.$]*|\/(?:api|data|events|results)\/[A-Za-z0-9_\-{}/.$+]*/gi)].map(m2 => m2[0]))]
  console.log(`\n── ${url} → ${js.status} (${js.txt.length}b)`)
  api.slice(0, 80).forEach(a => console.log('     ' + a))
}
