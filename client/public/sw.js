const CACHE_NAME = 'airbeam-v2';
const ASSETS_TO_CACHE = [
    '/airbeam/',
    '/airbeam/icon.svg',
    '/airbeam/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response if found, else fetch from network
            return response || fetch(event.request).catch(() => {
                // Fallback for offline if fetching fails and not in cache
                if (event.request.mode === 'navigate') {
                    return caches.match('/airbeam/index.html');
                }
            });
        })
    );
});
