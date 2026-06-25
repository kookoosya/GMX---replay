import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("onTabActivated skips site wallpaper render on extthemes", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  assert.match(src, /if \(name === "themes"\)/);
  assert.doesNotMatch(src, /if \(name === "themes" \|\| name === "extthemes"\)/);
});

test("wallpaper ui caches grid render signature", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.wallpaperui.js"), "utf8");
  assert.match(src, /lastWpRenderSig/);
  assert.match(src, /markWallpaperSelection/);
});

test("themes ui caches full grid render", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.themesui.js"), "utf8");
  assert.match(src, /lastThemeRenderSig/);
});

test("blog routes redirect to app shell", () => {
  const src = fs.readFileSync(path.join(root, "server", "routes", "static.mjs"), "utf8");
  assert.match(src, /app\.get\("\/blog/);
  assert.match(src, /redirect\(301, "\/app"\)/);
});

test("home shell has no blog teaser", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.doesNotMatch(html, /blog_home_teaser/);
});
