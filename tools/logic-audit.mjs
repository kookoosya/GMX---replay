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
  mustMatch(rel, /\{ mode, lang, style, antiN \} = readGenParams\(kind\)/, "generate uses readGenParams for style/mode");
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
  mustMatch(rel, /app\.format\.js/, "app.format.js script tag");
  mustMatch(rel, /app\.i18nui\.js/, "app.i18nui.js script tag");
  mustMatch(rel, /app\.sitei18nui\.js/, "app.sitei18nui.js script tag");
  mustMatch(rel, /app\.sitei18ndynamic\.js/, "app.sitei18ndynamic.js script tag");
  mustMatch(rel, /app\.chrome\.js/, "app.chrome.js script tag");
  mustMatch(rel, /app\.sitemode\.js/, "app.sitemode.js script tag");
  mustMatch(rel, /app\.modals\.js/, "app.modals.js script tag");
  mustMatch(rel, /app\.shellerrors\.js/, "app.shellerrors.js script tag");
  mustMatch(rel, /app\.recover\.js/, "app.recover.js script tag");
  mustMatch(rel, /app\.langui\.js/, "app.langui.js script tag");
  mustMatch(rel, /app\.sitelangmenu\.js/, "app.sitelangmenu.js script tag");
  mustMatch(rel, /app\.tabstate\.js/, "app.tabstate.js script tag");
  mustMatch(rel, /app\.unlock\.js/, "app.unlock.js script tag");
  mustMatch(rel, /app\.wallpapers\.js/, "app.wallpapers.js script tag");
  mustMatch(rel, /app\.wallpaperhelpers\.js/, "app.wallpaperhelpers.js script tag");
  mustMatch(rel, /app\.wallpaperstore\.js/, "app.wallpaperstore.js script tag");
  mustMatch(rel, /app\.customwallpapers\.js/, "app.customwallpapers.js script tag");
  mustMatch(rel, /app\.themes\.js/, "app.themes.js script tag");
  mustMatch(rel, /app\.themeapply\.js/, "app.themeapply.js script tag");
  mustMatch(rel, /app\.ui\.js/, "app.ui.js script tag");
  mustMatch(rel, /app\.generate\.js/, "app.generate.js script tag");
  mustMatch(rel, /app\.banks\.js/, "app.banks.js script tag");
  mustMatch(rel, /app\.antirepeat\.js/, "app.antirepeat.js script tag");
  mustMatch(rel, /app\.genparams\.js/, "app.genparams.js script tag");
  mustMatch(rel, /app\.cleanfill\.js/, "app.cleanfill.js script tag");
  mustMatch(rel, /app\.cleanfillrun\.js/, "app.cleanfillrun.js script tag");
  mustMatch(rel, /app\.styles\.js/, "app.styles.js script tag");
  mustMatch(rel, /app\.procontrols\.js/, "app.procontrols.js script tag");
  mustMatch(rel, /app\.toggles\.js/, "app.toggles.js script tag");
  mustMatch(rel, /app\.custombg\.js/, "app.custombg.js script tag");
  mustMatch(rel, /app\.tabtheme\.js/, "app.tabtheme.js script tag");
  mustMatch(rel, /app\.logs\.js/, "app.logs.js script tag");
  mustMatch(rel, /app\.paywall\.js/, "app.paywall.js script tag");
  mustMatch(rel, /app\.help\.js/, "app.help.js script tag");
  mustMatch(rel, /app\.usage\.js/, "app.usage.js script tag");
  mustMatch(rel, /app\.wallpaperapply\.js/, "app.wallpaperapply.js script tag");
  mustMatch(rel, /app\.wallpaperui\.js/, "app.wallpaperui.js script tag");
  mustMatch(rel, /app\.wallpaperupload\.js/, "app.wallpaperupload.js script tag");
  mustMatch(rel, /app\.themesui\.js/, "app.themesui.js script tag");
  mustMatch(rel, /app\.health\.js/, "app.health.js script tag");
  mustMatch(rel, /app\.setbg\.js/, "app.setbg.js script tag");
  mustMatch(rel, /app\.extview\.js/, "app.extview.js script tag");
  mustMatch(rel, /app\.extwallpaperstore\.js/, "app.extwallpaperstore.js script tag");
  mustMatch(rel, /app\.extapply\.js/, "app.extapply.js script tag");
  mustMatch(rel, /app\.extthemesui\.js/, "app.extthemesui.js script tag");
  mustMatch(rel, /app\.extcustombgui\.js/, "app.extcustombgui.js script tag");
  mustMatch(rel, /app\.nav\.js/, "app.nav.js script tag");
  mustMatch(rel, /app\.tabwire\.js/, "app.tabwire.js script tag");
  mustMatch(rel, /app\.gmgnwire\.js/, "app.gmgnwire.js script tag");
  mustMatch(rel, /app\.sitesync\.js/, "app.sitesync.js script tag");
  mustMatch(rel, /app\.extwallpaperui\.js/, "app.extwallpaperui.js script tag");
  mustMatch(rel, /app\.accountui\.js/, "app.accountui.js script tag");
  mustMatch(rel, /app\.authwire\.js/, "app.authwire.js script tag");
  mustMatch(rel, /app\.siteboot\.js/, "app.siteboot.js script tag");
  mustMatch(rel, /app\.siteinit\.js/, "app.siteinit.js script tag");
  mustMatch(rel, /app\.wallethelpers\.js/, "app.wallethelpers.js script tag");
  mustMatch(rel, /app\.walletui\.js/, "app.walletui.js script tag");
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
