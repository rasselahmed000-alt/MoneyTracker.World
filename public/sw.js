const CACHE_NAME = 'moneytracker-v2';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;
  // Skip API calls
  if (e.request.url.includes('api.base44.com') || e.request.url.includes('base44.com/api')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful navigations
        if (res.ok && e.request.mode === 'navigate') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/')))
  );
});
