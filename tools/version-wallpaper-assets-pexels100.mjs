#!/usr/bin/env node
/** One-shot: rename v2_/extv3_ wallpaper bytes to pexels100_* versioned paths. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WALLPAPER_PACK_COUNT } from "./lib/wallpaper-curated-catalog.mjs";
import {
  siteLandscapeFilename,
  siteThumbFilename,
  extPortraitFilename,
  extThumbFilename,
  siteLandscapePathFromIndex,
  siteThumbPathFromIndex,
  extPortraitPathFromIndex,
  extThumbPathFromIndex,
} from "./lib/wallpaper-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function renameIfExists(from, to) {
  if (!fs.existsSync(from)) throw new Error(`missing asset: ${from}`);
  if (fs.existsSync(to)) throw new Error(`target exists: ${to}`);
  fs.renameSync(from, to);
}

for (let i = 1; i <= WALLPAPER_PACK_COUNT; i++) {
  const n = String(i).padStart(3, "0");
  const oldSite = `v2_${n}.webp`;
  const oldExt = `extv3_${n}.webp`;
  renameIfExists(
    path.join(ROOT, "assets", "wallpapers", oldSite),
    path.join(ROOT, "assets", "wallpapers", siteLandscapeFilename(i))
  );
  renameIfExists(
    path.join(ROOT, "assets", "wallpapers", "thumbs", oldSite),
    path.join(ROOT, "assets", "wallpapers", "thumbs", siteThumbFilename(i))
  );
  renameIfExists(
    path.join(ROOT, "assets", "extbg", oldExt),
    path.join(ROOT, "assets", "extbg", extPortraitFilename(i))
  );
  renameIfExists(
    path.join(ROOT, "assets", "extbg", "thumbs", oldExt),
    path.join(ROOT, "assets", "extbg", "thumbs", extThumbFilename(i))
  );
}

const manifestPath = path.join(ROOT, "wallpaper-sources.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
for (const item of manifest.items) {
  const m = String(item.id || "").match(/^v2_(\d+)$/);
  if (!m) continue;
  const idx = Number(m[1]);
  item.landscapePath = siteLandscapePathFromIndex(idx);
  item.portraitPath = extPortraitPathFromIndex(idx);
  item.thumbnailPath = siteThumbPathFromIndex(idx);
}
manifest.assetPack = "pexels100";
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`version-wallpaper-assets OK (${WALLPAPER_PACK_COUNT} × 4 files → pexels100_*)`);
