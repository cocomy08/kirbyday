const CACHE_NAME = 'kirbyday-v1';
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/src/css/base.css',
  '/src/css/layout.css',
  '/src/css/calendar.css',
  '/src/css/tasks.css',
  '/src/css/kirby.css',
  '/src/css/settings.css',
  '/src/css/themes.css',
  '/src/script/app.js',
  '/src/script/router.js',
  '/src/script/storage.js',
  '/src/script/holidays.js',
  '/src/script/calendar.js',
  '/src/script/tasks.js',
  '/src/script/kirby.js',
  '/src/script/settings.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
