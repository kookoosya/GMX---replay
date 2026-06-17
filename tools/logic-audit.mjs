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
  mustMatch(rel, /app\.i18nbridge\.js/, "app.i18nbridge.js script tag");
  mustMatch(rel, /app\.tabstate\.js/, "app.tabstate.js script tag");
  mustMatch(rel, /app\.unlock\.js/, "app.unlock.js script tag");
  mustMatch(rel, /app\.wallpapers\.js/, "app.wallpapers.js script tag");
  mustMatch(rel, /app\.wallpaperhelpers\.js/, "app.wallpaperhelpers.js script tag");
  mustMatch(rel, /app\.wallpaperstore\.js/, "app.wallpaperstore.js script tag");
  mustMatch(rel, /app\.customwallpapers\.js/, "app.customwallpapers.js script tag");
  mustMatch(rel, /app\.themes\.js/, "app.themes.js script tag");
  mustMatch(rel, /app\.themeapply\.js/, "app.themeapply.js script tag");
  mustMatch(rel, /app\.ui\.js/, "app.ui.js script tag");
  mustMatch(rel, /app\.uiwire\.js/, "app.uiwire.js script tag");
  mustMatch(rel, /app\.generate\.js/, "app.generate.js script tag");
  mustMatch(rel, /app\.bestpick\.js/, "app.bestpick.js script tag");
  mustMatch(rel, /app\.refstats\.js/, "app.refstats.js script tag");
  mustMatch(rel, /app\.generateflow\.js/, "app.generateflow.js script tag");
  mustMatch(rel, /app\.generatewire\.js/, "app.generatewire.js script tag");
  mustMatch(rel, /app\.generaterunwire\.js/, "app.generaterunwire.js script tag");
  mustMatch(rel, /app\.banks\.js/, "app.banks.js script tag");
  mustMatch(rel, /app\.bankswire\.js/, "app.bankswire.js script tag");
  mustMatch(rel, /app\.bankui\.js/, "app.bankui.js script tag");
  mustMatch(rel, /app\.bankuiwire\.js/, "app.bankuiwire.js script tag");
  mustMatch(rel, /app\.bankuirunwire\.js/, "app.bankuirunwire.js script tag");
  mustMatch(rel, /app\.antirepeat\.js/, "app.antirepeat.js script tag");
  mustMatch(rel, /app\.genparams\.js/, "app.genparams.js script tag");
  mustMatch(rel, /app\.cleanfill\.js/, "app.cleanfill.js script tag");
  mustMatch(rel, /app\.cleanfillrun\.js/, "app.cleanfillrun.js script tag");
  mustMatch(rel, /app\.cleanfillrunwire\.js/, "app.cleanfillrunwire.js script tag");
  mustMatch(rel, /app\.styles\.js/, "app.styles.js script tag");
  mustMatch(rel, /app\.themescatalogwire\.js/, "app.themescatalogwire.js script tag");
  mustMatch(rel, /app\.procontrols\.js/, "app.procontrols.js script tag");
  mustMatch(rel, /app\.toggles\.js/, "app.toggles.js script tag");
  mustMatch(rel, /app\.custombg\.js/, "app.custombg.js script tag");
  mustMatch(rel, /app\.tabtheme\.js/, "app.tabtheme.js script tag");
  mustMatch(rel, /app\.logs\.js/, "app.logs.js script tag");
  mustMatch(rel, /app\.shelldeps\.js/, "app.shelldeps.js script tag");
  mustMatch(rel, /app\.shelldepswire\.js/, "app.shelldepswire.js script tag");
  mustMatch(rel, /app\.shelldepsrunwire\.js/, "app.shelldepsrunwire.js script tag");
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
  mustMatch(rel, /app\.bootstrapcorewire\.js/, "app.bootstrapcorewire.js script tag");
  mustMatch(rel, /app\.bootstrapunlockwire\.js/, "app.bootstrapunlockwire.js script tag");
  mustMatch(rel, /app\.bootstrapgenwire\.js/, "app.bootstrapgenwire.js script tag");
  mustMatch(rel, /app\.bootstrapusagewire\.js/, "app.bootstrapusagewire.js script tag");
  mustMatch(rel, /app\.bootstrapuiwire\.js/, "app.bootstrapuiwire.js script tag");
  mustMatch(rel, /app\.extapply\.js/, "app.extapply.js script tag");
  mustMatch(rel, /app\.extthemesui\.js/, "app.extthemesui.js script tag");
  mustMatch(rel, /app\.extcustombgui\.js/, "app.extcustombgui.js script tag");
  mustMatch(rel, /app\.nav\.js/, "app.nav.js script tag");
  mustMatch(rel, /app\.tabwire\.js/, "app.tabwire.js script tag");
  mustMatch(rel, /app\.gmgnwire\.js/, "app.gmgnwire.js script tag");
  mustMatch(rel, /app\.sitesync\.js/, "app.sitesync.js script tag");
  mustMatch(rel, /app\.extwallpaperui\.js/, "app.extwallpaperui.js script tag");
  mustMatch(rel, /app\.wallpaperswire\.js/, "app.wallpaperswire.js script tag");
  mustMatch(rel, /app\.wallpapersrunwire\.js/, "app.wallpapersrunwire.js script tag");
  mustMatch(rel, /app\.themeswire\.js/, "app.themeswire.js script tag");
  mustMatch(rel, /app\.themesrunwire\.js/, "app.themesrunwire.js script tag");
  mustMatch(rel, /app\.accountui\.js/, "app.accountui.js script tag");
  mustMatch(rel, /app\.admin\.js/, "app.admin.js script tag");
  mustMatch(rel, /app\.adminwire\.js/, "app.adminwire.js script tag");
  mustMatch(rel, /app\.leaderboard\.js/, "app.leaderboard.js script tag");
  mustMatch(rel, /app\.leaderboardwire\.js/, "app.leaderboardwire.js script tag");
  mustMatch(rel, /app\.referrals\.js/, "app.referrals.js script tag");
  mustMatch(rel, /app\.referralswire\.js/, "app.referralswire.js script tag");
  mustMatch(rel, /app\.redeem\.js/, "app.redeem.js script tag");
  mustMatch(rel, /app\.redeemwire\.js/, "app.redeemwire.js script tag");
  mustMatch(rel, /app\.prediction\.js/, "app.prediction.js script tag");
  mustMatch(rel, /app\.predictionwire\.js/, "app.predictionwire.js script tag");
  mustMatch(rel, /app\.authwire\.js/, "app.authwire.js script tag");
  mustMatch(rel, /app\.shellwire\.js/, "app.shellwire.js script tag");
  mustMatch(rel, /app\.chromewire\.js/, "app.chromewire.js script tag");
  mustMatch(rel, /app\.chromerunwire\.js/, "app.chromerunwire.js script tag");
  mustMatch(rel, /app\.connect\.js/, "app.connect.js script tag");
  mustMatch(rel, /app\.connectwire\.js/, "app.connectwire.js script tag");
  mustMatch(rel, /app\.siteboot\.js/, "app.siteboot.js script tag");
  mustMatch(rel, /app\.siteinit\.js/, "app.siteinit.js script tag");
  mustMatch(rel, /app\.siteinitwire\.js/, "app.siteinitwire.js script tag");
  mustMatch(rel, /app\.siteinitrunwire\.js/, "app.siteinitrunwire.js script tag");
  mustMatch(rel, /app\.wallethelpers\.js/, "app.wallethelpers.js script tag");
  mustMatch(rel, /app\.walletpay\.js/, "app.walletpay.js script tag");
  mustMatch(rel, /app\.walletui\.js/, "app.walletui.js script tag");
  mustMatch(rel, /app\.walletwire\.js/, "app.walletwire.js script tag");
  mustMatch(rel, /app\.bestpick\.js/, "app.bestpick.js script tag");
  mustMatch(rel, /app\.refstats\.js/, "app.refstats.js script tag");
  mustMatch(rel, /app\.generateflow\.js/, "app.generateflow.js script tag");
  mustMatch(rel, /app\.generatewire\.js/, "app.generatewire.js script tag");
  mustMatch(rel, /app\.generaterunwire\.js/, "app.generaterunwire.js script tag");
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
