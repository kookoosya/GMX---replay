import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PWA_CACHE_NAME,
  PWA_MANIFEST_PATH,
  PWA_PRECACHE_URLS,
  PWA_SW_PATH,
} from "../tools/lib/pwa-shell-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("manifest.webmanifest exposes standalone app metadata", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "public", "manifest.webmanifest"), "utf8")
  );
  assert.equal(manifest.short_name, "GMXReply");
  assert.equal(manifest.start_url, "/app");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 1);
});

test("app shell links manifest and theme color", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /name="theme-color"/);
  assert.match(html, /id="pwa_install"/);
});

test("service worker precaches shell assets", () => {
  const sw = fs.readFileSync(path.join(root, "public", "sw.js"), "utf8");
  assert.match(sw, new RegExp(PWA_CACHE_NAME));
  for (const url of PWA_PRECACHE_URLS) {
    assert.match(sw, new RegExp(url.replace(/\//g, "\\/")));
  }
  assert.match(sw, /\/api\//);
  assert.match(sw, /isWallpaperFullAsset/);
});

test("pwainstall module registers service worker", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.pwainstall.js"), "utf8");
  assert.match(src, /registerServiceWorker/);
  assert.match(src, new RegExp(PWA_SW_PATH.replace(/\//g, "\\/")));
  assert.match(src, /beforeinstallprompt/);
});

test("siteboot wires pwa install helper", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.siteboot.js"), "utf8");
  assert.match(src, /__GMXPwaInstallFactory/);
  assert.match(src, /bindPwaInstall/);
});

test("boot chunk manifest includes pwainstall module", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "tools", "app-chunk-manifest.json"), "utf8")
  );
  const boot = manifest.chunks.find((c) => c.out === "chunks/app.shell.boot.js");
  assert.ok(boot?.files?.includes("app.pwainstall.js"));
});

test("en locale defines pwa install copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["pwa_install", "pwa_install_hint", "pwa_install_ios"]) {
    assert.ok(en[key], `missing ${key}`);
  }
});

test("pwa icon asset exists", () => {
  const icon = fs.readFileSync(path.join(root, "public", "icons", "gmx-icon.svg"), "utf8");
  assert.match(icon, /GMXReply|GM/);
  assert.equal(PWA_MANIFEST_PATH, "/manifest.webmanifest");
});
