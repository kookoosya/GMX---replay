import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PWA_CACHE_NAME,
  PWA_DOC_CACHE_NAME,
  PWA_PRECACHE_URLS,
  PWA_SHELL_DOC_PATHS,
  isSwCacheableAssetPath,
  shellDocCacheKey,
} from "../tools/lib/pwa-shell-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("service worker caches shell docs and expanded static assets", () => {
  const sw = fs.readFileSync(path.join(root, "public", "sw.js"), "utf8");
  assert.match(sw, new RegExp(PWA_CACHE_NAME));
  assert.match(sw, new RegExp(PWA_DOC_CACHE_NAME));
  for (const url of PWA_PRECACHE_URLS) {
    assert.match(sw, new RegExp(url.replace(/\//g, "\\/")));
  }
  assert.match(sw, /req\.mode === "navigate"/);
  assert.match(sw, /shellDocKey/);
  assert.match(sw, /\/lib\//);
  assert.match(sw, /\/assets\//);
  assert.match(sw, /\/api\//);
});

test("pwa shell core maps offline navigation paths", () => {
  assert.equal(shellDocCacheKey("/app"), "/app");
  assert.equal(shellDocCacheKey("/app/wallet"), "/app");
  assert.equal(shellDocCacheKey("/arcade.html"), "/arcade.html");
  assert.equal(shellDocCacheKey("/"), null);
  assert.deepEqual([...PWA_SHELL_DOC_PATHS], ["/app", "/arcade.html"]);
});

test("pwa shell core marks chunk and lib assets cacheable", () => {
  assert.equal(isSwCacheableAssetPath("/chunks/app.shell.boot.js"), true);
  assert.equal(isSwCacheableAssetPath("/lib/skeleton-core.js"), true);
  assert.equal(isSwCacheableAssetPath("/assets/og/gmx-share.svg"), true);
  assert.equal(isSwCacheableAssetPath("/api/health"), false);
});

test("degraded bar exists for offline partial UI", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="degradedBar"/);
  const chrome = fs.readFileSync(path.join(root, "public", "app.chrome.js"), "utf8");
  assert.match(chrome, /addEventListener\("offline"/);
  const health = fs.readFileSync(path.join(root, "public", "app.health.js"), "utf8");
  assert.match(health, /addEventListener\("online"/);
});
