// Minimal Service Worker to satisfy PWA installation requirements
// This allows the app to be installed but does not block network requests,
// ensuring your Firebase connection always works.

self.addEventListener('install', (event) => {
    // The skipWaiting() method allows this service worker to become active
    // immediately, even if there's a previous version running.
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // We just pass the request to the network.
    // We do NOT cache anything here because your app relies on
    // real-time data from Firebase.
    event.respondWith(fetch(event.request));
});
