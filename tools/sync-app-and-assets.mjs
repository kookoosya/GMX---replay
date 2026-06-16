#!/usr/bin/env node
/**
 * Sync app files and wallpapers so / and /app.html show the SAME content.
 *
 * SINGLE SOURCE OF TRUTH:
 * - Backend/public/     → app.html, app.js, app.css, arcade.html, arcade.js, etc.
 * - Backend/assets/     → wallpapers (served at /assets/wallpapers/)
 *
 * When Vite proxies fail (e.g. backend starting), it serves from frontend/public/.
 * This script copies public/ and assets/wallpapers to frontend/public/ so fallback is identical.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PUBLIC = path.join(ROOT, "public");
const ASSETS = path.join(ROOT, "assets");
const FRONTEND_PUBLIC = path.join(ROOT, "frontend", "public");

const APP_FILES = ["app.html", "app.js", "app.css", "app.auth.js", "app.storage.js", "app.format.js", "app.chrome.js", "app.unlock.js", "app.wallpapers.js", "app.themes.js", "app.ui.js", "app.generate.js", "app.banks.js", "app.antirepeat.js", "app.genparams.js", "app.cleanfill.js", "app.styles.js", "app.toggles.js", "app.custombg.js", "app.tabtheme.js", "app.logs.js", "app.paywall.js", "app.help.js", "app.usage.js", "app.wallpaperapply.js", "app.health.js", "arcade.html", "arcade.js", "entitlements.js", "mode.js", "themes.json"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(src, dest, filter = () => true) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (!stat.isDirectory()) {
    if (filter(src)) copyFile(src, dest);
    return;
  }
  ensureDir(dest);
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    copyDirRecursive(s, d, filter);
  }
}

let n = 0;

// 1. Sync app files: public/* -> frontend/public/
for (const f of APP_FILES) {
  const src = path.join(PUBLIC, f);
  const dest = path.join(FRONTEND_PUBLIC, f);
  if (fs.existsSync(src)) {
    copyFile(src, dest);
    n++;
    console.log(`  ${f}`);
    if (f === "app.html") {
      copyFile(src, path.join(PUBLIC, "bridge", "app.html"));
      console.log("  bridge/app.html");
    }
  }
}

// 2. Sync i18n if exists
const i18nSrc = path.join(PUBLIC, "i18n");
const i18nDest = path.join(FRONTEND_PUBLIC, "i18n");
if (fs.existsSync(i18nSrc)) {
  copyDirRecursive(i18nSrc, i18nDest);
  n++;
  console.log("  i18n/");
}

// 3. Sync assets/wallpapers -> frontend/public/assets/wallpapers (for Vite fallback)
const wpSrc = path.join(ASSETS, "wallpapers");
const wpDest = path.join(FRONTEND_PUBLIC, "assets", "wallpapers");
if (fs.existsSync(wpSrc)) {
  copyDirRecursive(wpSrc, wpDest);
  n++;
  console.log("  assets/wallpapers/");
}

// 4. Sync assets/extbg -> frontend/public/assets/extbg (extension wallpapers 396x720)
const extbgSrc = path.join(ASSETS, "extbg");
const extbgDest = path.join(FRONTEND_PUBLIC, "assets", "extbg");
if (fs.existsSync(extbgSrc)) {
  copyDirRecursive(extbgSrc, extbgDest);
  n++;
  console.log("  assets/extbg/");
}

console.log(`[sync] Copied ${n} items: public + assets -> frontend/public`);

// 5. Keep extension theme catalog aligned with site
const themesSrc = path.join(PUBLIC, "themes.json");
const themesExt = path.join(ROOT, "extension", "themes.json");
if (fs.existsSync(themesSrc)) {
  copyFile(themesSrc, themesExt);
  console.log("  extension/themes.json");
}
