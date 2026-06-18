// Cache version - bump this number any time you push a new index.html
const CACHE_VERSION = 'dod-v3';
const CACHE_NAME = CACHE_VERSION;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache core assets
self.addEventListener('install', event => {
  // Skip waiting forces this SW to activate immediately, replacing any old one
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Some assets may not exist (icons etc), that's OK
        return cache.add('./index.html');
      });
    })
  );
});

// Activate: delete ALL old caches with different version names
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all open pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch: network-first for HTML (always get latest), cache-first for other assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always fetch HTML fresh from network (never serve stale index.html)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(response => {
        // Update cache with latest
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback: serve cached version
        return caches.match('./index.html');
      })
    );
    return;
  }

  // For other assets (icons, manifest): cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => {
      return new Response('', { status: 404 });
    })
  );
});
