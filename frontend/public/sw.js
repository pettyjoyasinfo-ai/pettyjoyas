/*
 * Service Worker — Petty Joyas (PWA)
 * Estrategia mínima de app-shell:
 *  - Precache de la home y assets clave.
 *  - Network-first para navegación (con fallback a cache offline).
 *  - Cache-first para imágenes y estáticos.
 *
 * La sincronización offline de eventos de negocio (ventas, stock) se maneja en
 * IndexedDB desde la app (ver src/lib/offline/), no en este Service Worker.
 */
const CACHE = "petty-joyas-v1";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navegación: network-first con fallback offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/offline"))),
    );
    return;
  }

  // Imágenes y estáticos: cache-first.
  if (/\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/.test(new URL(request.url).pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
