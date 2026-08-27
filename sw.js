// sw.js - TR-Glass PWA Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Bypass cache untuk fetch data live dari GAS
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
  } else {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
});
