/* GMXReply shell service worker — static cache + offline shell docs; API stays network-only. */
const CACHE = "gmx-shell-v3";
const DOC_CACHE = "gmx-shell-docs-v1";
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/gmx-icon.svg",
  "/mode.js",
  "/app.css",
  "/assets/og/gmx-share.svg",
];

function shellDocKey(pathname) {
  if (pathname === "/app" || pathname.startsWith("/app/")) return "/app";
  if (pathname === "/arcade.html") return "/arcade.html";
  return null;
}

function isWallpaperFullAsset(pathname) {
  return (
    (pathname.startsWith("/assets/wallpapers/") && !pathname.includes("/thumbs/")) ||
    (pathname.startsWith("/assets/extbg/") && !pathname.includes("/thumbs/"))
  );
}

function isCacheableAsset(pathname) {
  if (isWallpaperFullAsset(pathname)) return false;
  return (
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons/") ||
    pathname === "/mode.js" ||
    pathname === "/app.css" ||
    pathname.startsWith("/lib/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/chunks/") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  );
}

function putDoc(cacheKey, response) {
  return caches.open(DOC_CACHE).then((cache) => cache.put(cacheKey, response.clone()));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  const LEGACY_CACHES = ["gmx-shell-v1", "gmx-shell-v2"];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => (k !== CACHE && k !== DOC_CACHE) || LEGACY_CACHES.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    const docKey = shellDocKey(url.pathname);
    if (!docKey) return;
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            putDoc(docKey, res).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(docKey).then((cached) => {
            if (cached) return cached;
            if (docKey !== "/app") {
              return caches.match("/app");
            }
            return Response.error();
          })
        )
    );
    return;
  }

  if (!isCacheableAsset(url.pathname)) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
