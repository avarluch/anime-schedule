const CACHE = 'nico-anime-v1';
const SHELL = ['./index.html', './manifest.json', './sw.js', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Network-only for proxy requests (always need fresh data)
  if (url.includes('workers.dev') || url.includes('nicovideo.jp')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }
  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
