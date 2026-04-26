const CACHE_NAME = "kk-calorie-app-v7-2-final";

const FILES_TO_CACHE = [
  "./",
  "./index.html?v=7.2-final",
  "./style.css?v=7.2-final",
  "./app.js?v=7.2-final",
  "./manifest.json?v=7.2-final",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(cached => cached || caches.match("./index.html?v=7.2-final"))
    )
  );
});
