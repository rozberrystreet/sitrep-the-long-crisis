// Vite supplies the edition's revision and the index, JS and CSS filenames.
const scope = self.registration.scope
const prefix = 'sitrep-shell:' + scope + ':'
const cacheName = prefix + edition.revision
const urls = edition.assets.map((file) => new URL(file, scope).href)
const index = new URL('index.html', scope).href
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(urls)))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key)
      }
      await self.clients.claim()
    })()
  )
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const target = new URL(request.url)
  target.search = ''
  const shell = request.mode === 'navigate' && (target.href === scope || target.href === index)
  if (!shell && !urls.includes(request.url)) return
  event.respondWith(
    (async () => {
      const cached = await (await caches.open(cacheName)).match(shell ? index : request.url)
      return cached || fetch(request)
    })()
  )
})
