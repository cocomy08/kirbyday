const VERSION = '3.0.0';
const CACHE = 'kirbyday-' + VERSION;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './src/css/base.css',
        './src/css/layout.css',
        './src/css/calendar.css',
        './src/css/tasks.css',
        './src/css/kirby.css',
        './src/css/settings.css',
        './src/css/themes.css',
        './src/script/storage.js',
        './src/script/holidays.js',
        './src/script/period.js',
        './src/script/icons.js',
        './src/script/recurrence.js',
        './src/script/router.js',
        './src/script/tasks.js',
        './src/script/calendar.js',
        './src/script/kirby.js',
        './src/script/settings.js',
        './src/script/app.js'
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(c => c.postMessage({ type: 'UPDATED', version: VERSION }));
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CHECK_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: VERSION });
  }
});
