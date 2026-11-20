// DormDine Offline Service Worker
// Enables offline reservation QR code display and shell caching for low-connectivity dining halls.

const CACHE_NAME = "dormdine-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/my-reservations",
  "/reserve",
  "/manifest.json",
  "/file.svg",
  "/globe.svg",
  "/window.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Continue even if some individual static asset fails to cache
        console.warn("[SW] Cache install warning:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Avoid intercepting chrome extensions or non-http protocols
  if (!request.url.startsWith("http")) return;

  // For API calls, try network first, fallback to cached data if available
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For navigation and static assets: Network-first with Cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Fallback for HTML navigations to offline shell
        if (request.mode === "navigate") {
          const fallback = await caches.match("/my-reservations");
          if (fallback) return fallback;
        }

        return new Response("Offline - DormDine content unavailable", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});
