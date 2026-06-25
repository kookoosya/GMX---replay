/** PWA shell constants shared by tests and deploy checks. */

export const PWA_CACHE_NAME = "gmx-shell-v2";

export const PWA_DOC_CACHE_NAME = "gmx-shell-docs-v1";

export const PWA_PRECACHE_URLS = Object.freeze([
  "/manifest.webmanifest",
  "/icons/gmx-icon.svg",
  "/mode.js",
  "/app.css",
  "/assets/og/gmx-share.svg",
]);

export const PWA_SHELL_DOC_PATHS = Object.freeze(["/app", "/arcade.html", "/blog.html"]);

export const PWA_BLOG_POST_PATHS = Object.freeze([
  "/blog/top-10-io-games-2025.html",
  "/blog/how-to-write-gm-replies.html",
]);

export const PWA_MANIFEST_PATH = "/manifest.webmanifest";

export const PWA_SW_PATH = "/sw.js";

export function shellDocCacheKey(pathname) {
  const path = String(pathname || "");
  if (path === "/app" || path.startsWith("/app/")) return "/app";
  if (path === "/arcade.html") return "/arcade.html";
  if (path === "/blog.html") return "/blog.html";
  if (path.startsWith("/blog/") && path.endsWith(".html")) return path;
  return null;
}

export function isSwCacheableAssetPath(pathname) {
  const path = String(pathname || "");
  return (
    path === "/sw.js" ||
    path === PWA_MANIFEST_PATH ||
    path.startsWith("/icons/") ||
    path === "/mode.js" ||
    path === "/app.css" ||
    path.startsWith("/lib/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/chunks/") ||
    path.endsWith(".css") ||
    path.endsWith(".js")
  );
}
