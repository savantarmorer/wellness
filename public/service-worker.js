const CACHE_NAME = 'wellness-monitor-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon-196.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-167x167.png',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/splash-640x1136.png',
  '/icons/splash-750x1334.png',
  '/icons/splash-1125x2436.png',
  '/icons/splash-1242x2208.png',
  '/icons/splash-1536x2048.png',
  '/icons/splash-1668x2224.png',
  '/icons/splash-2048x2732.png',
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});

// Fetch resources: Network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and requests to other origins
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If it's a navigation request, return the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }

          return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
}); 