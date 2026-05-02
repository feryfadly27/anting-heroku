const CACHE_VERSION = "sibanting-v7";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;

const APP_SHELL_ASSETS = [
  "/",
  "/login",
  "/m/parent/dashboard",
  "/m/cadre/dashboard",
  "/m/cadre/anak",
  "/m/cadre/rekap",
  "/m/puskesmas/dashboard",
  "/m/puskesmas/anak",
  "/m/puskesmas/wilayah",
  "/m/puskesmas/kader",
  "/m/puskesmas/informasi",
  "/manifest.webmanifest",
  "/offline.html",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

function isApiRequest(request) {
  const url = new URL(request.url);
  return request.method === "GET" && url.pathname.startsWith("/api/");
}

function isAuthApiRequest(request) {
  const url = new URL(request.url);
  return request.method === "GET" && url.pathname.startsWith("/api/auth/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (isAuthApiRequest(request)) {
    // Auth state must always be fresh and must never be served from cache.
    event.respondWith(fetch(request));
    return;
  }

  if (isApiRequest(request)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })
    );
    return;
  }

  // For document navigations, prefer network to avoid stale shell/route 404.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(APP_SHELL_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match("/offline.html");
          if (offline) return offline;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).catch(async () => {
        if (request.mode === "navigate") {
          const offline = await caches.match("/offline.html");
          if (offline) return offline;
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});
