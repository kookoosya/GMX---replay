#!/usr/bin/env node
/**
 * Fast invariant checks for GMXReply site + extension.
 * Run: node tools/logic-audit.mjs [--strict]
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const issues = [];

function read(rel) {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function fail(msg) {
  issues.push(msg);
}

function mustNotMatch(rel, pattern, label) {
  const text = read(rel);
  if (pattern.test(text)) fail(`${label} (${rel})`);
}

function mustMatch(rel, pattern, label) {
  const text = read(rel);
  if (!pattern.test(text)) fail(`${label} (${rel})`);
}

const appFiles = ["public/app.js", "public/bridge/app.js", "frontend/public/app.js"];
const htmlFiles = ["public/app.html", "public/bridge/app.html", "frontend/public/app.html"];
const wallpaperModule = "public/app.wallpapers.js";

if (fs.existsSync(path.join(root, wallpaperModule))) {
  mustMatch(wallpaperModule, /const SITE_PACK_COUNT = 58;/, "wallpaper pack count must be 58");
  mustNotMatch(wallpaperModule, /source\.unsplash\.com/, "unsplash URLs forbidden");
  mustNotMatch(wallpaperModule, /sitePackWallpaperDataUri/, "chart SVG data-uri wallpapers forbidden");
  mustNotMatch(wallpaperModule, /SITE_WALLPAPER_LUX/, "lux SVG wallpaper catalog removed");
  mustMatch(wallpaperModule, /\/assets\/wallpapers\/thumbs\/\$\{norm\}\.webp/, "wallpaper thumbs must use webp files");
  mustMatch(wallpaperModule, /\/assets\/extbg\/\$\{norm\}\.webp/, "extension wallpapers use webp CDN paths");
}

for (const rel of appFiles) {
  if (!fs.existsSync(path.join(root, rel))) continue;
  mustMatch(rel, /SITE_WALLPAPER_PACK_COUNT = __gmxWp\.SITE_PACK_COUNT/, "wallpaper pack count wired from module");
  mustMatch(rel, /__GMXWallpapersFactory/, "wallpapers module factory wired");
  mustNotMatch(rel, /source\.unsplash\.com/, "unsplash URLs forbidden");
  mustNotMatch(rel, /sitePackWallpaperDataUri/, "chart SVG data-uri wallpapers forbidden");
  mustNotMatch(rel, /SITE_WALLPAPER_LUX/, "lux SVG wallpaper catalog removed");
  mustNotMatch(rel, /GM Candle|Degen Order|Bitcoin Terminal/, "crypto chart wallpaper names forbidden");

  mustNotMatch(rel, /function supportBundle\(/, "supportBundle removed");
  mustNotMatch(rel, /initWpLazyLoad/, "initWpLazyLoad removed");
  mustMatch(rel, /function applyRefCountEligible/, "REF_COUNT helper present");
  mustMatch(rel, /attempts < 4/, "bulk generate retry cap");
  mustMatch(rel, /const antiN = antiWindow\(strength\)/, "single generate uses antiWindow");
  mustNotMatch(rel, /const antiN = 0;/, "antiN must not be hardcoded 0");
  mustMatch(rel, /function packsForKind\(/, "packsForKind helper");
  mustMatch(rel, /__GMXThemesFactory/, "themes module factory wired");
  mustMatch(rel, /function readGenParams\(/, "readGenParams helper");
  mustMatch(rel, /function setWallpaperLayerImage\(/, "wallpaper img layer");
  mustMatch(rel, /unlockedPacksCountFor\(/, "per-kind pack unlock count");
  mustNotMatch(rel, /if \(!packLocked && pack && pack\.style\) style = pack\.style/, "generate must not override style from pack");
}

for (const rel of htmlFiles) {
  mustMatch(rel, /app\.storage\.js/, "app.storage.js script tag");
  mustMatch(rel, /app\.unlock\.js/, "app.unlock.js script tag");
  mustMatch(rel, /app\.wallpapers\.js/, "app.wallpapers.js script tag");
  mustMatch(rel, /app\.themes\.js/, "app.themes.js script tag");
  mustMatch(rel, /app\.generate\.js/, "app.generate.js script tag");
  mustMatch(rel, /app\.auth\.js/, "app.auth.js script tag");
  mustNotMatch(rel, /id="supportOut"/, "supportOut textarea removed");
  mustNotMatch(rel, /id="toolSupport"/, "toolSupport button removed from HTML");
}

const siteSync = read("extension/site_sync.js");
if (!siteSync.includes("gmx_ext_wp_v2_popup")) fail("site_sync must sync popup wallpaper key");
if (!siteSync.includes("runSyncOnce")) fail("site_sync must debounce with runSyncOnce mutex");

const popup = read("extension/popup.js");
if (!popup.includes("gmx_ext_wp_v2_popup") && strict) {
  fail("extension/popup.js should read per-view wallpaper keys");
}

if (/`\/api\/generate-bulk\?/.test(popup)) {
  fail("extension/popup.js must use /api/random-bulk when authed (quota)");
}
if (!read("server/routes/billing.mjs").includes("/api/billing/tx-context")) {
  fail("billing route must expose /api/billing/tx-context");
}

console.log(`Logic audit: ${issues.length} issue(s)`);
for (const msg of issues) console.log(`  - ${msg}`);

if (strict && issues.length) process.exit(1);
if (!issues.length) console.log("LOGIC_AUDIT_OK");
