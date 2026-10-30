const CACHE_NAME = "mushaf-green-gold-v5";
const APP_FILES = [
  "./",
  "./index.html",
  "./quran-text.json",
  "./manifest.webmanifest",
  "./icons/mushaf-new.jpeg",
  "./images/fathi-albanna.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isQuranApi = url.hostname === "api.alquran.cloud";

  if (isQuranApi) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const saved = await cache.match(request);
        if (saved) return saved;
        throw error;
      }
    })());
    return;
  }

  if (url.origin === self.location.origin && url.pathname.includes("/audio/")) return;

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(request);
      if (saved) return saved;

      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (error) {
        return cache.match("./index.html");
      }
    })());
  }
});
