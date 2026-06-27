#!/usr/bin/env node
/** Copy canonical public/app.js to frontend mirror (vite dev optional static). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

export function loadChunkManifest(manifestPath) {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const { chunks } = JSON.parse(raw);
  if (!Array.isArray(chunks) || !chunks.length) {
    throw new Error("app-chunk-manifest.json: chunks is empty");
  }
  for (const chunk of chunks) {
    if (!chunk || typeof chunk.out !== "string" || !chunk.out.trim()) {
      throw new Error(`invalid chunk entry: ${JSON.stringify(chunk)}`);
    }
  }
  return chunks;
}

function resolveSafeMirrorPath(root, rel, mirrorRootName) {
  const normalized = rel.replace(/\\/g, "/");
  if (path.isAbsolute(rel) || normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error(`path traversal forbidden: ${rel}`);
  }
  const mirrorRoot = path.resolve(root, mirrorRootName);
  const resolved = path.resolve(mirrorRoot, normalized);
  if (resolved !== mirrorRoot && !resolved.startsWith(mirrorRoot + path.sep)) {
    throw new Error(`${rel} escapes ${mirrorRootName}/`);
  }
  return resolved;
}

export function syncChunkOutput(root, outRel) {
  const src = resolveSafeMirrorPath(root, outRel, "public");
  const dest = resolveSafeMirrorPath(root, outRel, path.join("frontend", "public"));
  if (!fs.existsSync(src)) {
    throw new Error(`chunk source missing: ${outRel}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const body = fs.readFileSync(src);
  const prev = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
  if (!prev || !prev.equals(body)) {
    fs.writeFileSync(dest, body);
    console.log(`synced → ${path.relative(root, dest)}`);
  }
}

export function syncAllChunkOutputs(root, manifestPath = path.join(root, "tools", "app-chunk-manifest.json")) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`app-chunk-manifest.json missing: ${manifestPath}`);
  }
  const chunks = loadChunkManifest(manifestPath);
  for (const chunk of chunks) {
    syncChunkOutput(root, chunk.out);
  }
}

function runSync(root) {
  const src = path.join(root, "public/app.js");
  const targets = [path.join(root, "frontend/public/app.js")];

  const body = fs.readFileSync(src, "utf8");
  for (const dest of targets) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const prev = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";
    if (prev !== body) {
      fs.writeFileSync(dest, body);
      console.log(`synced → ${path.relative(root, dest)}`);
    }
  }

  const shellModules = [
    "app.auth.js",
    "app.storage.js",
    "app.format.js",
    "app.i18nui.js",
    "app.sitei18nui.js",
    "app.sitei18ndynamic.js",
    "app.chrome.js",
    "app.sitemode.js",
    "app.modals.js",
    "app.shellerrors.js",
    "app.recover.js",
    "app.langui.js",
    "app.sitelangmenu.js",
    "app.i18nbridge.js",
    "app.tabstate.js",
    "app.unlock.js",
    "app.wallpapers.js",
    "app.wallpaperhelpers.js",
    "app.wallpaperstore.js",
    "app.customwallpapers.js",
    "app.themes.js",
    "app.themeapply.js",
    "app.ui.js",
    "app.uiwire.js",
    "app.generate.js",
    "app.banks.js",
    "app.bankswire.js",
    "app.bankui.js",
    "app.bankuiwire.js",
    "app.antirepeat.js",
    "app.genparams.js",
    "app.cleanfill.js",
    "app.cleanfillrun.js",
    "app.styles.js",
    "app.themescatalogwire.js",
    "app.procontrols.js",
    "app.toggles.js",
    "app.custombg.js",
    "app.tabtheme.js",
    "app.logs.js",
    "app.shelldeps.js",
    "app.shelldepswire.js",
    "app.paywall.js",
    "app.help.js",
    "app.usage.js",
    "app.wallpaperapply.js",
    "app.wallpaperui.js",
    "app.wallpaperupload.js",
    "app.health.js",
    "app.setbg.js",
    "app.themesui.js",
    "app.extview.js",
    "app.extwallpaperstore.js",
    "app.bootstrapcorewire.js",
    "app.bootstrapunlockwire.js",
    "app.bootstrapgenwire.js",
    "app.bootstrapusagewire.js",
    "app.bootstrapuiwire.js",
    "app.extapply.js",
    "app.extthemesui.js",
    "app.extcustombgui.js",
    "app.nav.js",
    "app.tabwire.js",
    "app.gmgnwire.js",
    "app.sitesync.js",
    "app.extwallpaperui.js",
    "app.wallpaperswire.js",
    "app.themeswire.js",
    "app.accountui.js",
    "app.lazytabs.js",
    "app.admin.js",
    "app.adminwire.js",
    "app.leaderboard.js",
    "app.leaderboardwire.js",
    "app.referrals.js",
    "app.referralswire.js",
    "app.redeem.js",
    "app.redeemwire.js",
    "app.prediction.js",
    "app.predictionwire.js",
    "app.authwire.js",
    "app.shellwire.js",
    "app.chromewire.js",
    "app.connect.js",
    "app.connectwire.js",
    "app.siteboot.js",
    "app.siteinit.js",
    "app.siteinitwire.js",
    "app.wallethelpers.js",
    "app.walletpay.js",
    "app.walletui.js",
    "app.walletwire.js",
    "app.bestpick.js",
    "app.refstats.js",
    "app.generateflow.js",
    "app.genhistoryui.js",
    "app.generatewire.js",
  ];
  for (const name of shellModules) {
    const modSrc = path.join(root, "public", name);
    if (!fs.existsSync(modSrc)) continue;
    const modBody = fs.readFileSync(modSrc, "utf8");
    for (const destRoot of ["frontend/public"]) {
      const dest = path.join(root, destRoot, name);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const prev = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";
      if (prev !== modBody) {
        fs.writeFileSync(dest, modBody);
        console.log(`synced → ${path.relative(root, dest)}`);
      }
    }
  }

  syncAllChunkOutputs(root);

  // bridge loads /app.js from site root — no bridge/app.js copy needed
  function pruneObsoleteBridgeShellFiles(bridgeDir) {
    if (!fs.existsSync(bridgeDir)) return;
    let removed = 0;
    for (const name of fs.readdirSync(bridgeDir)) {
      if (name === "app.js" || name === "app.html" || name === "app.css" || name.startsWith("app.")) {
        fs.unlinkSync(path.join(bridgeDir, name));
        removed++;
      }
    }
    if (removed) console.log(`removed ${removed} obsolete file(s) from public/bridge`);
  }

  const bridgeDir = path.join(root, "public/bridge");
  pruneObsoleteBridgeShellFiles(bridgeDir);
  const bridgeCopy = path.join(bridgeDir, "app.js");
  if (fs.existsSync(bridgeCopy)) {
    fs.unlinkSync(bridgeCopy);
    console.log("removed obsolete public/bridge/app.js");
  }
}

if (isMain) {
  runSync(process.cwd());
}
