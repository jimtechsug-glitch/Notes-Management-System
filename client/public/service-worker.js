const CACHE_NAME = "nsoma-v14";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/assets/css/styles.css",
  "/assets/css/responsive.css",
  "/assets/js/main.js",
  "/assets/js/auth.js",
  "/assets/images/logo.png",
  "/assets/images/icon-192.png",
  "/assets/images/icon-512.png",
  "/assets/images/nsoma.png",
  "/manifest.json",
];

// Install Event - Cache Assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

// Activate Event - Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
  self.clients.claim(); // Take control of all pages immediately
});

// Fetch Event - Serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Method 1: Stale-While-Revalidate (good for static assets)
  // Method 2: Network First (good for API calls)
  // Implementation: Cache First for static, Network First for API

  if (event.request.url.includes("/api/")) {
    // Network First for API calls
    event.respondWith(
      fetch(event.request).catch(() => {
        // return a simple offline JSON so callers don't see an exception
        return new Response(
          JSON.stringify({ success: false, message: "You are offline" }),
          { headers: { "Content-Type": "application/json" } },
        );
      }),
    );
  } else if (event.request.mode === "navigate") {
    // For HTML page navigation requests: Network first, fallback to offline.html
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline.html");
      }),
    );
  } else {
    // Cache First for other assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request).catch((err) => {
          console.warn(
            "Service worker fetch failed for",
            event.request.url,
            err,
          );
          return null;
        });
      }),
    );
  }
});
