const cacheName = "capture-clock-repair-v5";
const buildAssets = [];
const shell = ["/", "/demo/", "/privacy/", "/terms/", "/404.html", "/assets/timestamp-herbarium.webp", "/assets/timestamp-herbarium-600.webp", "/assets/social-card.webp", "/assets/favicon.svg", "/assets/apple-touch-icon.png", ...buildAssets];

self.addEventListener("install", (event) => event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(shell))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === location.origin) caches.open(cacheName).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => event.request.mode === "navigate" ? caches.match("/", { ignoreVary: true }) : Response.error())));
});
