const CACHE_NAME = 'helltrack-v16'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-round-192.png',
  '/public/cache.json',
  '/public/results/index.json',
  '/public/riders.json',
  '/public/directory.json',
  '/public/watch.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    // addAll is all-or-nothing; cache each asset separately so one bad fetch
    // (cache.json mid-refresh, say) can't abort the whole install.
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(STATIC_ASSETS.map(url => cache.add(url).catch(() => {})))
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // All app data: stale-while-revalidate. Paint instantly from cache, refresh in the
  // background — a returning user no longer waits on the network to see anything.
  // A cache-busted request (?t=, from Retry or the background revalidate) skips the
  // stale copy, but still stores under the clean path so it refreshes the same entry
  // rather than piling up one copy per app open.
  if (url.pathname.endsWith('cache.json') || url.pathname.endsWith('riders.json') ||
      url.pathname.endsWith('directory.json') || url.pathname.endsWith('watch.json') ||
      url.pathname.includes('/public/results/')) {
    const cacheKey = url.origin + url.pathname
    const wantsFresh = url.search !== ''
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(cacheKey)
        const network = fetch(event.request).then(res => {
          if (res.ok) cache.put(cacheKey, res.clone())
          return res
        })
        if (wantsFresh) return network.catch(err => cached || Promise.reject(err))
        network.catch(() => {})            // revalidation failure is not the caller's problem
        return cached || network
      })
    )
    return
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
