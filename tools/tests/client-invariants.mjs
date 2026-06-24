#!/usr/bin/env node
/** Static client invariants (site bundle, extension, HTML). */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fail, ok } from "./_helpers.mjs";

const appPaths = ["public/app.js", "frontend/public/app.js"];

for (const rel of appPaths) {
  if (!fs.existsSync(rel)) continue;
  const text = fs.readFileSync(rel, "utf8");
  const packFn = (text.match(/function packsForKind\(/g) || []).length;
  if (packFn !== 1) fail(`${rel}: expected 1 packsForKind(), found ${packFn}`);
  if (!text.includes("function readGenParams(")) fail(`${rel}: missing readGenParams`);
  if (!text.includes("function setWallpaperLayerImage(")) fail(`${rel}: missing setWallpaperLayerImage`);
  const genFlowPath = rel.replace(/app\.js$/, "app.generateflow.js");
  const genFlowText = fs.existsSync(genFlowPath) ? fs.readFileSync(genFlowPath, "utf8") : "";
  const readGenParamsPat = /\{ mode, lang, style, antiN \} = readGenParams\(kind\)/;
  if (!readGenParamsPat.test(text) && !readGenParamsPat.test(genFlowText)) {
    fail(`${rel}: generate() must read mode/lang/style/antiN via readGenParams`);
  }
  if (/if \(!packLocked && pack && pack\.style\) style = pack\.style/.test(text)) {
    fail(`${rel}: must not override style from pack on every generate`);
  }
  if (/anti_last_n=0&count=\$\{reqCount\}/.test(text)) {
    fail(`${rel}: bulk/refill must not hardcode anti_last_n=0`);
  }
  if (!/SITE_WALLPAPER_PACK_COUNT = (?:58|__gmxWp\.SITE_PACK_COUNT)/.test(text)) {
    fail(`${rel}: wallpaper count must be 58`);
  }
  if (text.includes("cryptoWallpaperMotif")) {
    fail(`${rel}: must not export removed cryptoWallpaperMotif`);
  }
  if (!text.includes('if (name === "themes" || name === "extthemes")')) {
    fail(`${rel}: onTabActivated must lazy-render wallpapers only on themes tabs`);
  }
  ok(rel);
}

for (const rel of ["public/app.health.js", "frontend/public/app.health.js"]) {
  if (!fs.existsSync(rel)) continue;
  const text = fs.readFileSync(rel, "utf8");
  const loadBuildCatch = text.match(/async function loadBuild\(\)[\s\S]*?\n    \}/);
  if (loadBuildCatch && /setAuthOk\(false\)/.test(loadBuildCatch[0])) {
    fail(`${rel}: loadBuild must not clear auth on version fetch failure`);
  }
}

const billingRoute = fs.readFileSync("server/routes/billing.mjs", "utf8");
if (!billingRoute.includes("/api/billing/tx-context")) {
  fail("server/routes/billing.mjs: missing /api/billing/tx-context alias");
}

const popup = fs.readFileSync("extension/popup.js", "utf8");
if (/\/api\/generate-bulk\?/.test(popup)) {
  fail("extension/popup.js: authenticated batch must not use /api/generate-bulk");
}
if (!popup.includes("/api/random-bulk")) {
  fail("extension/popup.js: should call /api/random-bulk when authed");
}
ok("extension/popup.js");

const siteSync = fs.readFileSync("extension/site_sync.js", "utf8");
if (!siteSync.includes("hasSiteSession")) {
  fail("extension/site_sync.js must return hasSiteSession for popup session sync");
}
if (!siteSync.includes("resolveSyncedSession")) {
  fail("extension/site_sync.js must use GMXSiteSyncCore.resolveSyncedSession");
}
if (!fs.existsSync("extension/lib/site-sync-core.js")) {
  fail("extension/lib/site-sync-core.js missing");
}
ok("extension/site_sync.js");

for (const rel of ["public/arcade.js", "frontend/public/arcade.js", "public/bridge/arcade.js"]) {
  if (!fs.existsSync(rel)) continue;
  const text = fs.readFileSync(rel, "utf8");
  if (!text.includes("iframeReady")) fail(`${rel}: arcade must lazy-load iframe via iframeReady`);
  if (!text.includes('id="loadGameIframe"')) fail(`${rel}: arcade must expose click-to-play control`);
  if (!/state\.iframeReady\s*=\s*true/.test(text)) {
    fail(`${rel}: arcade must set iframeReady only after explicit play click`);
  }
  const coverSrcCount = (text.match(/function coverSrc\s*\(/g) || []).length;
  if (coverSrcCount !== 1) {
    fail(`${rel}: arcade must define exactly one coverSrc (${coverSrcCount} found)`);
  }
  if (/function liveScreenshotCover\s*\(/.test(text)) {
    fail(`${rel}: arcade must not keep dead liveScreenshotCover helper`);
  }
  if (!/function categoryCoverWebp\s*\(/.test(text)) {
    fail(`${rel}: arcade must define categoryCoverWebp for category fallback covers`);
  }
  if (!/function goUpgradePro\s*\(/.test(text)) {
    fail(`${rel}: arcade must wire Pro gate to wallet checkout via goUpgradePro`);
  }
  if (!text.includes('id="arcadeUpgradePro"')) {
    fail(`${rel}: locked Pro panel must expose arcadeUpgradePro checkout button`);
  }
  if (!/q\.set\("tab",\s*"wallet"\)/.test(text)) {
    fail(`${rel}: arcade checkout must deep-link wallet tab via appWalletHref`);
  }
  ok(rel);
}

const siteboot = fs.readFileSync("public/app.siteboot.js", "utf8");
if (!siteboot.includes("URLSearchParams(location.search)")) {
  fail("public/app.siteboot.js: must honor ?tab= query on boot");
}
if (!siteboot.includes('params.get("tab")')) {
  fail("public/app.siteboot.js: must read tab query param before last-tab fallback");
}
ok("public/app.siteboot.js");

const collisionAudit = spawnSync(process.execPath, ["tools/audit-arcade-cover-collisions.mjs"], {
  encoding: "utf8",
});
if (collisionAudit.status !== 0) {
  fail(`arcade cover collisions:\n${collisionAudit.stdout || collisionAudit.stderr}`);
}
ok("arcade cover collisions");

const coversJsonAudit = spawnSync(process.execPath, ["tools/audit-arcade-covers-json.mjs"], {
  encoding: "utf8",
});
if (coversJsonAudit.status !== 0) {
  fail(`arcade-covers.json audit:\n${coversJsonAudit.stdout || coversJsonAudit.stderr}`);
}
ok("arcade-covers.json");

const categoryCoversAudit = spawnSync(process.execPath, ["tools/audit-arcade-category-covers.mjs"], {
  encoding: "utf8",
});
if (categoryCoversAudit.status !== 0) {
  fail(`arcade category covers:\n${categoryCoversAudit.stdout || categoryCoversAudit.stderr}`);
}
ok("arcade category covers");

if (fs.existsSync("public/bridge/app.html")) {
  fail("public/bridge/app.html must not exist (bridge uses index.html SPA)");
}
const syncAppAssets = fs.readFileSync("tools/sync-app-and-assets.mjs", "utf8");
if (/bridge["',\s]+app\.html/.test(syncAppAssets) && /copyFile\(src,\s*path\.join\(PUBLIC,\s*"bridge",\s*"app\.html"\)\)/.test(syncAppAssets)) {
  fail("sync-app-and-assets.mjs must not copy app.html into public/bridge/");
}
ok("bridge shell hygiene");

const deployStub = fs.readFileSync("tools/deploy-vps.mjs", "utf8");
if (/from\s+["']ssh2["']/.test(deployStub) || /DEPLOY_SSH_PASSWORD/.test(deployStub)) {
  fail("tools/deploy-vps.mjs must be Render-only stub (SSH deploy is in tools/legacy/)");
}
if (!fs.existsSync("tools/legacy/deploy-vps.mjs")) {
  fail("tools/legacy/deploy-vps.mjs missing");
}
ok("deploy render-only");

const bootAudit = spawnSync(process.execPath, ["tools/audit-app-boot.mjs"], {
  encoding: "utf8",
});
if (bootAudit.status !== 0) {
  fail(`app boot inventory:\n${bootAudit.stdout || bootAudit.stderr}`);
}
ok("app boot inventory");

console.log("CLIENT_INVARIANTS_OK");
