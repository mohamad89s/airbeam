const CACHE_NAME = 'airbeam-v3';
const ASSETS_TO_CACHE = [
    '/airbeam/', // This maps to index.html
    '/airbeam/icon.svg',
    '/airbeam/manifest.json'
];

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Claim clients immediately so the new SW controls the page without a reload
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 1. Navigation Requests (HTML): Network First, fall back to Cache
    // This ensures we always get the latest index.html with new asset hashes.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // Offline fallback
                    return caches.match('/airbeam/index.html') || caches.match('/airbeam/');
                })
        );
        return;
    }

    // 2. Asset Requests (JS, CSS, Images): Cache First (Stale-While-Revalidate)
    // Assets with hashes (e.g., index-h52s.js) are immutable, so cache-first is safe.
    // We also match other static assets.
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // 3. Default Strategy for everything else: Network First
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
