const CACHE_NAME = "kk-calorie-app-v7-2";

const FILES_TO_CACHE = [
  "./",
  "./index.html?v=7.2",
  "./style.css?v=7.2",
  "./app.js?v=7.2",
  "./manifest.json?v=7.2",
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
  const req = event.request;
  const url = new URL(req.url);

  // External API requests must go directly to network
  if (url.origin !== self.location.origin) {
    return;
  }

  if (req.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(req).catch(() =>
      caches.match(req).then(cached => {
        return cached || caches.match("./index.html?v=7.2");
      })
    )
  );
});
