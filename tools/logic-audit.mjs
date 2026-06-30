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

const appFiles = ["public/app.js", "frontend/public/app.js"];
const htmlFiles = ["public/app.html", "frontend/public/app.html"];
const wallpaperModule = "public/app.wallpapers.js";

if (fs.existsSync(path.join(root, wallpaperModule))) {
  const wallpaperText = read(wallpaperModule);
  const packCountMatch = wallpaperText.match(/const SITE_PACK_COUNT = (\d+);/);
  if (!packCountMatch || Number(packCountMatch[1]) < 1) {
    fail(`wallpaper pack count must be a positive integer (${wallpaperModule})`);
  }
  mustNotMatch(wallpaperModule, /source\.unsplash\.com/, "unsplash URLs forbidden");
  mustNotMatch(wallpaperModule, /sitePackWallpaperDataUri/, "chart SVG data-uri wallpapers forbidden");
  mustNotMatch(wallpaperModule, /SITE_WALLPAPER_LUX/, "lux SVG wallpaper catalog removed");
  mustMatch(wallpaperModule, /\/assets\/wallpapers\/thumbs\/\$\{norm\}\.webp/, "wallpaper thumbs must use webp files");
  mustMatch(wallpaperModule, /\/assets\/extbg\/\$\{norm\}\.webp/, "extension wallpapers use webp CDN paths");
}

for (const rel of appFiles) {
  if (!fs.existsSync(path.join(root, rel))) continue;
  const appText = fs.readFileSync(path.join(root, rel), "utf8");
  const unlockWireRel = rel.replace(/app\.js$/, "app.bootstrapunlockwire.js");
  const unlockWireText = read(unlockWireRel);
  mustMatch(rel, /SITE_WALLPAPER_PACK_COUNT = __gmxWp\.SITE_PACK_COUNT/, "wallpaper pack count wired from module");
  if (!/__GMXWallpapersFactory/.test(appText) && !/__GMXWallpapersFactory/.test(unlockWireText)) {
    fail(`wallpapers module factory wired (${rel})`);
  }
  mustMatch(rel, /__GMXBootstrapCoreWireFactory/, "bootstrap core wire wired");
  mustMatch(rel, /__GMXBootstrapUnlockWireFactory/, "bootstrap unlock wire wired");
  mustMatch(rel, /__GMXBootstrapGenWireFactory/, "bootstrap gen wire wired");
  mustMatch(rel, /__GMXBootstrapUsageWireFactory/, "bootstrap usage wire wired");
  mustMatch(rel, /__GMXBootstrapUiWireFactory/, "bootstrap ui wire wired");
  mustNotMatch(rel, /source\.unsplash\.com/, "unsplash URLs forbidden");
  mustNotMatch(rel, /sitePackWallpaperDataUri/, "chart SVG data-uri wallpapers forbidden");
  mustNotMatch(rel, /SITE_WALLPAPER_LUX/, "lux SVG wallpaper catalog removed");
  mustNotMatch(rel, /GM Candle|Degen Order|Bitcoin Terminal/, "crypto chart wallpaper names forbidden");

  mustNotMatch(rel, /function supportBundle\(/, "supportBundle removed");
  mustNotMatch(rel, /initWpLazyLoad/, "initWpLazyLoad removed");
  mustMatch(rel, /function applyRefCountEligible/, "REF_COUNT helper present");
  const genFlowRel = rel.replace(/app\.js$/, "app.generateflow.js");
  const genFlowText = fs.existsSync(path.join(root, genFlowRel))
    ? fs.readFileSync(path.join(root, genFlowRel), "utf8")
    : "";
  const bulkCap = /attempts < 4/;
  const readGenPat = /\{ mode, lang, style, antiN \} = readGenParams\(kind\)/;
  if (!bulkCap.test(appText) && !bulkCap.test(genFlowText)) {
    fail(`${rel}: bulk generate retry cap`);
  }
  if (!readGenPat.test(appText) && !readGenPat.test(genFlowText)) {
    fail(`${rel}: generate uses readGenParams for style/mode`);
  }
  mustNotMatch(rel, /const antiN = 0;/, "antiN must not be hardcoded 0");
  mustMatch(rel, /function packsForKind\(/, "packsForKind helper");
  if (!/__GMXThemesFactory/.test(appText) && !/__GMXThemesFactory/.test(unlockWireText)) {
    fail(`themes module factory wired (${rel})`);
  }
  mustMatch(rel, /function readGenParams\(/, "readGenParams helper");
  mustMatch(rel, /function setWallpaperLayerImage\(/, "wallpaper img layer");
  mustMatch(rel, /unlockedPacksCountFor\(/, "per-kind pack unlock count");
  mustNotMatch(rel, /if \(!packLocked && pack && pack\.style\) style = pack\.style/, "generate must not override style from pack");
}

for (const rel of htmlFiles) {
  mustMatch(rel, /chunks\/app\.shell\.deps\.js/, "app.shell.deps chunk script tag");
  mustMatch(rel, /chunks\/app\.shell\.features\.js/, "app.shell.features chunk script tag");
  mustMatch(rel, /chunks\/app\.shell\.bootstrap\.js/, "app.shell.bootstrap chunk script tag");
  mustMatch(rel, /chunks\/app\.shell\.boot\.js/, "app.shell.boot chunk script tag");
  mustNotMatch(rel, /<script\s+defer\s+src="\/app\.storage\.js/, "app.storage.js eager defer removed (esbuild chunk)");
  mustNotMatch(rel, /<script\s+defer\s+src="\/app\.auth\.js/, "app.auth.js eager defer removed (esbuild chunk)");
  mustNotMatch(rel, /<script\s+defer\s+src="\/app\.admin\.js/, "app.admin.js eager defer removed (lazy tab pack)");
  mustNotMatch(rel, /<script\s+defer\s+src="\/app\.walletwire\.js/, "app.walletwire.js eager defer removed (lazy tab pack)");
  mustNotMatch(rel, /<script\s+defer\s+src="\/app\.wallethelpers\.js/, "app.wallethelpers.js eager defer removed (lazy tab pack)");
  mustMatch(rel, /app\.js/, "app.js entry script tag");
  mustNotMatch(rel, /id="supportOut"/, "supportOut textarea removed");
  mustNotMatch(rel, /id="toolSupport"/, "toolSupport button removed from HTML");
}

const siteSync = read("extension/site_sync.js");
if (!siteSync.includes("gmx_ext_wp_v2_popup")) fail("site_sync must sync popup wallpaper key");
if (!siteSync.includes("runSyncOnce")) fail("site_sync must debounce with runSyncOnce mutex");
if (!siteSync.includes("hasSiteSession")) fail("site_sync must expose hasSiteSession for side panel sync");
if (!siteSync.includes("gmx_ext_bank_gm_v1")) fail("site_sync must sync GM bank to extension storage");
if (!read("extension/lib/bank-sync-core.js").includes("GMXBankSyncCore")) {
  fail("bank-sync-core must export GMXBankSyncCore");
}
if (!read("extension/lib/site-sync-core.js").includes("resolveSyncedSession")) {
  fail("site-sync-core must export resolveSyncedSession");
}
if (!read("extension/sidepanel.js").includes("hasSiteSession")) {
  fail("extension/sidepanel.js must prefer tabs with hasSiteSession");
}
if (/`\/api\/generate|\/api\/random-bulk/.test(read("extension/sidepanel.js"))) {
  fail("extension/sidepanel.js must not call generation APIs");
}
if (!read("server/routes/billing.mjs").includes("/api/billing/tx-context")) {
  fail("billing route must expose /api/billing/tx-context");
}

console.log(`Logic audit: ${issues.length} issue(s)`);
for (const msg of issues) console.log(`  - ${msg}`);

if (strict && issues.length) process.exit(1);
if (!issues.length) console.log("LOGIC_AUDIT_OK");
