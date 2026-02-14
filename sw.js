const CACHE_NAME = 'barcalive-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network-first strategy (or network-only for API to be safe)
    // For now, we perform a simple fetch to satisfy PWA requirements
    // but we don't aggressively cache to avoid the "old data" issue the user hated.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL) || new Response('Offline');
            })
        );
        return;
    }

    event.respondWith(fetch(event.request));
});
