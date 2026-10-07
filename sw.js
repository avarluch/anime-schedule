const CACHE = 'nico-anime-v4';
const SHELL = ['./index.html', './manifest.json', './sw.js', './icon.svg'];

self.addEventListener('install', e => {
  // HTTPキャッシュ上の古いファイルを掴まないよう reload で取得
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));
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
  if (e.request.method !== 'GET') return;
  // ネット優先（常に最新を表示）、オフライン時のみキャッシュ
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
