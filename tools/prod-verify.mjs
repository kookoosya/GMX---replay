#!/usr/bin/env node
/**
 * Post-deploy verification against production (or PROD_BASE URL).
 * Run: npm run verify:prod
 */
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fail, ok, freshSmokeHandle } from "./tests/_helpers.mjs";

const BASE = String(process.env.PROD_BASE || "https://www.gmxreply.com").replace(/\/$/, "");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localAppJs = fs.readFileSync(path.join(ROOT, "public", "app.js"), "utf8");
const localAssetRev = localAppJs.match(/const ASSET_REV = "([^"]+)"/)?.[1] || "";

async function get(path, opts = {}) {
  const url = `${BASE}${path}`;
  const retries = Math.max(1, Number(process.env.PROD_VERIFY_RETRIES || 6));
  const timeoutMs = Math.max(5000, Number(process.env.PROD_VERIFY_TIMEOUT_MS || 30000));
  let lastErr = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
      const text = await r.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}
      return { status: r.status, text, json, headers: r.headers };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const waitMs = Math.min(20000, 4000 * attempt);
        console.log(`  retry ${attempt}/${retries - 1} in ${waitMs}ms (${path})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  throw lastErr || new Error(`fetch failed: ${path}`);
}

console.log(`Prod verify: ${BASE}\n`);

const health = await get("/api/health");
if (!health.json?.ok) fail(`health: ${health.text.slice(0, 200)}`);
const prodBuild = String(health.json.build || "");
ok(`health build=${prodBuild.slice(0, 8)}`);

try {
  const localHead = execSync("git rev-parse HEAD", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  const localShort = localHead.slice(0, 8);
  const prodShort = prodBuild.slice(0, 8);
  if (localShort && prodShort && localShort !== prodShort) {
    fail(
      `Render prod build ${prodShort} != local HEAD ${localShort} — wait for Render deploy or push main`
    );
  }
  if (localShort) ok(`prod commit matches local ${localShort}`);
} catch {
  ok("prod commit check skipped (not a git checkout)");
}

const appJs = await get("/app.js");
if (appJs.status !== 200) fail(`app.js status ${appJs.status}`);
const js = appJs.text;
for (const needle of [
  "__GMXBootstrapCoreWireFactory",
  "__GMXBootstrapUnlockWireFactory",
  "__GMXBootstrapGenWireFactory",
  "__GMXBootstrapUsageWireFactory",
  "__GMXBootstrapUiWireFactory",
  "setWallpaperLayerImage",
  "readGenParams",
]) {
  if (!js.includes(needle)) fail(`app.js missing ${needle}`);
}
ok("app.js client invariants");

const shellDeps = await get("/chunks/app.shell.deps.js");
if (shellDeps.status !== 200) fail(`chunks/app.shell.deps.js status ${shellDeps.status}`);
if (!shellDeps.text.includes("__GMXStorageFactory")) {
  fail("app.shell.deps chunk missing __GMXStorageFactory");
}
ok("shell deps chunk");

const genParamsJs = await get("/app.genparams.js");
if (genParamsJs.status !== 200) fail(`app.genparams.js status ${genParamsJs.status}`);
if (!genParamsJs.text.includes("antiWindow(strength)")) {
  fail("app.genparams.js missing antiWindow(strength)");
}
ok("app.genparams anti-window invariant");

const css = await get("/app.css");
if (!css.text.includes("gmxWallLayer") || !css.text.includes("object-fit:cover")) {
  fail("app.css missing wallpaper cover layer");
}
ok("app.css wallpapers");

const arcadeCategoryCover = await get("/assets/arcade/covers/categories/action.webp");
if (arcadeCategoryCover.status !== 200) {
  fail(`arcade category cover status ${arcadeCategoryCover.status}`);
}
ok("arcade category covers");

const slugRes = await get("/arcade/agario");
if (slugRes.status !== 200) {
  fail(`arcade slug page: status=${slugRes.status}`);
}
if (!slugRes.text.includes('name="description"') || !slugRes.text.includes("og:title")) {
  fail("/arcade/agario missing seo meta tags");
}
if (!slugRes.text.includes("arcade.html?game=agario")) {
  fail("/arcade/agario missing play deep-link");
}
ok("arcade slug seo page /arcade/agario");

const siteI18n = await get("/i18n/siteI18n.js");
if (siteI18n.status !== 200) fail(`siteI18n.js status ${siteI18n.status}`);
if (!siteI18n.text.includes("all Arcade games")) {
  fail("siteI18n.js wallet copy missing Arcade Pro mention");
}
ok("wallet i18n Arcade Pro copy");

const handle = freshSmokeHandle("p");
const init = await get("/api/user/init", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ handle }),
});
if (!init.json?.ok || !init.json?.token) fail(`init: ${init.text.slice(0, 200)}`);
const auth = { Authorization: `Bearer ${init.json.token}` };
ok(`api init ${handle}`);

const styles = ["classic", "minimal", "degen", "calm", "builder", "focus"];
for (const style of styles) {
  const gen = await get(`/api/generate?kind=gm&mode=mid&lang=en&style=${style}`, { headers: auth });
  if (!gen.json?.ok || !String(gen.json.reply || "").trim()) {
    fail(`generate style=${style}: ${gen.text.slice(0, 120)}`);
  }
}
ok(`generate ${styles.length} styles`);

const tx = await get("/api/billing/tx-context", { headers: auth });
if (tx.status === 404 || !tx.json?.blockhash) fail(`tx-context: ${tx.text.slice(0, 120)}`);
ok("billing tx-context");

const nf = await get("/api/not-a-real-route");
if (nf.status !== 404) fail(`expected 404, got ${nf.status}`);
ok("api 404");

const appPage = await get("/app");
if (appPage.status !== 200 || !appPage.text.includes("gmRand1")) {
  fail("/app shell missing gmRand1");
}
ok("/app HTML shell");

const homeDemo = await get("/api/public/random-bulk?kind=gm&mode=mid&count=3");
if (homeDemo.status !== 200 || !homeDemo.json?.ok || !Array.isArray(homeDemo.json.list) || !homeDemo.json.list.length) {
  fail(`home demo public bulk: ${homeDemo.text.slice(0, 160)}`);
}
ok("home guest demo API");

const heroLoop = await get("/assets/hero/gmx-hero-loop.svg");
if (heroLoop.status !== 200 || !/Reply on X|GMXReply/.test(heroLoop.text)) {
  fail(`home hero loop asset: ${heroLoop.status}`);
}
ok("home hero loop asset");

if (!appPage.text.includes('id="homeHero"')) {
  fail("/app shell missing homeHero");
}
ok("home hero UI");

const billingPlans = await get("/api/billing/plans");
const y1 = (billingPlans.json?.plans || []).find((p) => p.key === "y1");
if (!y1 || Number(y1.usd) !== 80 || Number(y1.days) !== 365) {
  fail(`billing yearly plan y1: ${billingPlans.text.slice(0, 160)}`);
}
ok("billing yearly plan y1");

if (!appPage.text.includes('id="w_yearly_save"')) {
  fail("/app shell missing w_yearly_save yearly note");
}
ok("wallet yearly savings UI");

const achCore = await get("/lib/arcade-achievements-core.js");
if (achCore.status !== 200 || !achCore.text.includes("GMXArcadeAchievementsCore")) {
  fail(`arcade achievements core: ${achCore.status}`);
}
ok("arcade achievements core");

const arcadeHtml = await get("/arcade.html");
if (arcadeHtml.status !== 200 || !arcadeHtml.text.includes("arcade-achievements-core")) {
  fail("arcade.html missing achievements core script");
}
ok("arcade.html achievements script");

const arcadeJs = await get("/arcade.js");
if (arcadeJs.status !== 200 || !arcadeJs.text.includes("achievementsPanel")) {
  fail("arcade.js missing achievements panel");
}
ok("arcade achievements UI");

if (!appPage.text.includes('id="gm_preset_professional"')) {
  fail("/app shell missing gm_preset_professional quick preset");
}
ok("gm/gn quick presets UI");

const refCore = await get("/lib/referral-progress-core.js");
if (refCore.status !== 200 || !refCore.text.includes("GMXReferralProgressCore")) {
  fail(`referral progress core: ${refCore.status}`);
}
ok("referral progress core");

if (!appPage.text.includes('id="refProgressNeed"')) {
  fail("/app shell missing refProgressNeed referral bar");
}
ok("referral progress bar UI");

const refBadgeCore = await get("/lib/referral-badge-core.js");
if (refBadgeCore.status !== 200 || !refBadgeCore.text.includes("GMXReferralBadgeCore")) {
  fail(`referral badge core: ${refBadgeCore.status}`);
}
ok("referral badge core lib");

if (!appPage.text.includes('id="refBadgeShelf"') || !appPage.text.includes('id="headerRefBadge"')) {
  fail("/app shell missing referral badge UI");
}
ok("referral badge UI");

const manifest = await get("/manifest.webmanifest");
if (manifest.status !== 200 || !manifest.text.includes('"short_name"')) {
  fail(`PWA manifest: ${manifest.status}`);
}
ok("PWA manifest");

const sw = await get("/sw.js");
if (sw.status !== 200) {
  fail(`service worker: ${sw.status}`);
}
if (!sw.text.includes("gmx-shell-v5") || !sw.text.includes("gmx-shell-docs-v1")) {
  fail("sw.js missing v5 shell/doc caches");
}
if (!sw.text.includes('req.mode === "navigate"') || !sw.text.includes("/app.css")) {
  fail("sw.js missing offline shell navigation or precache");
}
ok("PWA service worker");

if (!appPage.text.includes('id="pwa_install"')) {
  fail("/app shell missing pwa_install button");
}
ok("PWA install UI");

if (!appPage.text.includes('id="ref_viral_hook_html"')) {
  fail("/app shell missing referral viral hook");
}
ok("referral viral hook UI");

if (!appPage.text.includes('class="lbYourRank')) {
  fail("/app shell missing leaderboard your-rank strip");
}
ok("leaderboard your-rank UI");

const lbCore = await get("/lib/leaderboard-core.js");
if (!lbCore.text.includes("GMXLeaderboardCore")) {
  fail("/lib/leaderboard-core.js missing GMXLeaderboardCore export");
}
ok("leaderboard core lib");

const themeGroupCore = await get("/lib/theme-group-core.js");
if (!themeGroupCore.text.includes("GMXThemeGroupCore")) {
  fail("/lib/theme-group-core.js missing GMXThemeGroupCore export");
}
ok("theme group core lib");

const wallpaperCore = await get("/lib/wallpaper-core.js");
if (!wallpaperCore.text.includes("GMXWallpaperCore") || !wallpaperCore.text.includes("pairedExtId")) {
  fail("/lib/wallpaper-core.js missing GMXWallpaperCore export");
}
if (!appPage.text.includes('id="wpFilter"') || !appPage.text.includes('id="wpSyncExt"')) {
  fail("/app shell missing grouped wallpaper controls");
}
ok("wallpaper core lib");

const themesUi = await get("/app.themesui.js");
if (!themesUi.text.includes("themeGroupSection") || !themesUi.text.includes("themeGridRoot")) {
  fail("/app.themesui.js missing grouped theme sections");
}
if (!css.text.includes(".themeProHint")) {
  fail("app.css missing themeProHint styles");
}
ok("themes grouped UI");

const genHistCore = await get("/lib/gmgn-gen-history-core.js");
if (!genHistCore.text.includes("GMXGmGnGenHistoryCore")) {
  fail("/lib/gmgn-gen-history-core.js missing export");
}
if (!appPage.text.includes('id="gmGenHistory"')) {
  fail("/app shell missing gmGenHistory panel");
}
const genHistUi = await get("/app.genhistoryui.js");
if (!genHistUi.text.includes("recordBatchHistory")) {
  fail("/app.genhistoryui.js missing recordBatchHistory");
}
ok("gm/gn batch history UI");

const mobileNavCore = await get("/lib/mobile-nav-core.js");
if (!mobileNavCore.text.includes("GMXMobileNavCore")) {
  fail("/lib/mobile-nav-core.js missing export");
}
if (!appPage.text.includes('id="mobileBottomNav"')) {
  fail("/app shell missing mobileBottomNav");
}
const mobileNavUi = await get("/app.mobilenav.js");
if (!mobileNavUi.text.includes("bindSwipePane")) {
  fail("/app.mobilenav.js missing swipe binding");
}
if (!css.text.includes(".mobileBottomNav")) {
  fail("app.css missing mobile bottom nav styles");
}
ok("mobile bottom nav UI");

if (!appPage.text.includes('id="pm_newbie_title"')) {
  fail("/app shell missing prediction newbie intro");
}
if (!appPage.text.includes('pm_learn_polymarket')) {
  fail("/app shell missing prediction learn-more links");
}
if (!css.text.includes(".pmNewbieIntro")) {
  fail("app.css missing prediction onboarding styles");
}
ok("prediction onboarding UI");

if (!appPage.text.includes('id="ext_sync_hub"')) {
  fail("/app shell missing extension sync hub");
}
if (!appPage.text.includes('ext_chrome_store_btn')) {
  fail("/app shell missing chrome store CTA");
}
const popupPreview = await get("/assets/ext/popup-preview.svg");
if (popupPreview.status !== 200) {
  fail("/assets/ext/popup-preview.svg missing");
}
if (!css.text.includes(".extSyncHub")) {
  fail("app.css missing extension sync hub styles");
}
ok("extension tab sync hub UI");

if (!appPage.text.includes('id="wallet_plan_compare"')) {
  fail("/app shell missing wallet plan compare table");
}
if (!appPage.text.includes('class="planCmpCell yes"')) {
  fail("/app shell missing plan compare checkmark cells");
}
if (!css.text.includes(".walletPlanCompare")) {
  fail("app.css missing wallet plan compare styles");
}
ok("wallet plan compare UI");

const homeStats = await get("/api/public/stats");
if (homeStats.status !== 200 || !homeStats.json?.ok || typeof homeStats.json.connectedToday !== "number") {
  fail(`/api/public/stats missing connectedToday: ${homeStats.text.slice(0, 160)}`);
}
if (!appPage.text.includes('id="home_connected_wrap"')) {
  fail("/app shell missing home connected counter");
}
if (!css.text.includes(".homeConnectedToday")) {
  fail("app.css missing home connected counter styles");
}
ok("home connected today UI");

if (!appPage.text.includes('property="og:image"')) {
  fail("/app shell missing og:image meta");
}
if (!appPage.text.includes("assets/og/gmx-share.svg")) {
  fail("/app shell missing og share image path");
}
const ogAsset = await get("/assets/og/gmx-share.svg");
if (ogAsset.status !== 200) {
  fail("/assets/og/gmx-share.svg missing");
}
const arcadePage = await get("/arcade.html");
if (!arcadePage.text.includes('name="description"') || !arcadePage.text.includes('property="og:image"')) {
  fail("/arcade.html missing seo meta tags");
}
ok("seo meta and og:image");

if (!appPage.text.includes('id="app_breadcrumbs"')) {
  fail("/app shell missing breadcrumb nav");
}
if (!css.text.includes(".appBreadcrumbs")) {
  fail("app.css missing breadcrumb styles");
}
ok("app breadcrumbs UI");

const bootChunk = await get("/chunks/app.shell.boot.js");
if (!bootChunk.text.includes("__GMXArcadePreloadFactory")) {
  fail("boot chunk missing arcade preload factory");
}
ok("arcade preload on hover");

if (!appPage.text.includes("lib/skeleton-core.js")) {
  fail("/app shell missing skeleton-core.js");
}
if (!arcadePage.text.includes("lib/skeleton-core.js") || !arcadePage.text.includes("tileSkeleton")) {
  fail("/arcade.html missing skeleton loader styles");
}
const skCore = await get("/lib/skeleton-core.js");
if (!skCore.text.includes("arcadeTileSkeletonHtml")) {
  fail("/lib/skeleton-core.js missing arcade tile skeleton");
}
ok("skeleton loaders GM GN Arcade");

const blogLegacy = await get("/blog.html", { redirect: "manual" });
if (blogLegacy.status !== 301 || !String(blogLegacy.headers.get("location") || "").includes("/app")) {
  fail("/blog.html should 301 redirect to /app");
}
const blogSlugLegacy = await get("/blog/how-to-play-agario", { redirect: "manual" });
if (blogSlugLegacy.status !== 301) {
  fail("/blog/:slug should 301 redirect to /app");
}
if (appPage.text.includes('id="blog_home_teaser"')) {
  fail("/app shell should not include blog home teaser");
}
ok("blog guides removed");

const wpChunk = await get("/app.wallpapers.js");
if (!wpChunk.text.includes("livev1_")) {
  fail("production app.wallpapers.js missing livev1 versioned paths");
}
if (!wpChunk.text.includes("liveext_v1_")) {
  fail("production app.wallpapers.js missing liveext_v1 paths");
}
if (!wpChunk.text.includes("sitePackAssetFile")) {
  fail("production app.wallpapers.js missing versioned asset resolver");
}
const appJsRev = await get("/app.js");
if (!localAssetRev || !appJsRev.text.includes(`ASSET_REV = "${localAssetRev}"`)) {
  fail("production ASSET_REV not bumped for Live V1 rollout");
}
ok("wallpaper Live V1 paths on production");

try {
  const gradThumb = execSync("git show c6c9fa6:assets/wallpapers/thumbs/v2_001.webp", { encoding: "buffer" });
  const gradHash = crypto.createHash("sha256").update(gradThumb).digest("hex");
  const legacyFetch = await fetch(`${BASE}/assets/wallpapers/thumbs/v2_001.webp`, { cache: "no-store" });
  if (legacyFetch.status === 200) {
    const legacyHash = crypto.createHash("sha256").update(Buffer.from(await legacyFetch.arrayBuffer())).digest("hex");
    if (legacyHash === gradHash) {
      fail("production still serves gradient bytes at legacy /thumbs/v2_001.webp");
    }
  }
  const newFetch = await fetch(`${BASE}/assets/wallpapers/thumbs/livev1_001.webp`, { cache: "no-store" });
  if (newFetch.status !== 200) {
    fail(`production missing livev1_001 thumb: ${newFetch.status}`);
  }
  ok("production livev1 thumb asset live");
} catch (err) {
  if (String(err?.message || err).includes("production")) throw err;
  console.log("  skip gradient byte check (no local git baseline)");
}

console.log("\nPROD_VERIFY_OK");
