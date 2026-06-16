#!/usr/bin/env node
/**
 * Generate thumbnails for all preset wallpapers.
 * Creates 400x225 previews in assets/wallpapers/thumbs/ and assets/extbg/thumbs/
 * using "contain" so preview shows the full image (no crop).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WP = path.join(ROOT, "assets", "wallpapers");
const EXT = path.join(ROOT, "assets", "extbg");
const THUMB_W = 400;
const THUMB_H = 225;

function resetDir(dir) {
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) fs.rmSync(full, { recursive: true, force: true });
      else fs.unlinkSync(full);
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  const manifestPath = path.join(WP, "preset-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("No preset-manifest.json. Run wallpapers:import first.");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const siteThumbsDir = path.join(WP, "thumbs");
  const extThumbsDir = path.join(EXT, "thumbs");
  resetDir(siteThumbsDir);
  resetDir(extThumbsDir);

  let n = 0;
  for (const [id, file] of Object.entries(manifest)) {
    const src = path.join(WP, file);
    if (!fs.existsSync(src)) {
      console.warn("Skip (missing):", file);
      continue;
    }
    const thumbName = id + ".jpg";
    const siteDest = path.join(siteThumbsDir, thumbName);
    try {
      await sharp(src)
        .resize(THUMB_W, THUMB_H, {
          fit: "contain",
          position: "center",
          background: { r: 10, g: 14, b: 24, alpha: 1 },
        })
        .jpeg({ quality: 88, mozjpeg: true })
        .toFile(siteDest);
      n++;
      console.log(n, id, "->", thumbName);
    } catch (err) {
      console.warn("Skip (error):", file, err.message);
    }
  }

  for (const [id, file] of Object.entries(manifest)) {
    const extId = id === "free01" ? "ext_free_01" : id === "free02" ? "ext_free_02" : "ext_" + id;
    const extThumbName = extId + ".jpg";
    const siteThumb = path.join(siteThumbsDir, id + ".jpg");
    const extDest = path.join(extThumbsDir, extThumbName);
    if (fs.existsSync(siteThumb)) {
      fs.copyFileSync(siteThumb, extDest);
    }
  }

  console.log("Done. Generated", n, "thumbnails. Syncing to extbg/thumbs/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
