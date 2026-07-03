#!/usr/bin/env node
/** Recompress Themes V4 assets to meet size gates and fix duplicate hashes. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WALLPAPER_PACK_COUNT } from "./lib/wallpaper-curated-catalog.mjs";
import { EXT_SKIN_PACK_COUNT } from "./lib/extension-skin-catalog.mjs";
import {
  siteLandscapeFilename,
  siteThumbFilename,
  extSkinFilename,
  extSkinThumbFilename,
} from "./lib/wallpaper-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXT_W = 900;
const EXT_H = 1600;

async function main() {
  const sharp = (await import("sharp")).default;

  async function writeThumb(src, dest, w, h) {
    for (let q = 68; q >= 40; q -= 4) {
      for (const scale of [1, 0.85, 0.7]) {
        const buf = await sharp(src)
          .resize(Math.round(w * scale), Math.round(h * scale), { fit: "cover" })
          .webp({ quality: q })
          .toBuffer();
        if (buf.length <= 45000) {
          fs.writeFileSync(dest, buf);
          return;
        }
      }
    }
    const buf = await sharp(src).resize(280, 158, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
    fs.writeFileSync(dest, buf);
  }

  for (let i = 1; i <= WALLPAPER_PACK_COUNT; i++) {
    const thumb = path.join(ROOT, "assets", "wallpapers", "thumbs", siteThumbFilename(i));
    const land = path.join(ROOT, "assets", "wallpapers", siteLandscapeFilename(i));
    if (!fs.existsSync(land)) continue;
    if (!fs.existsSync(thumb) || fs.statSync(thumb).size > 45000) {
      await writeThumb(land, thumb, 640, 360);
    }
  }

  const seen = new Map();
  for (let i = 1; i <= EXT_SKIN_PACK_COUNT; i++) {
    const full = path.join(ROOT, "assets", "extskins", extSkinFilename(i));
    const thumb = path.join(ROOT, "assets", "extskins", "thumbs", extSkinThumbFilename(i));
    const pkg = path.join(ROOT, "extension", "extskins", extSkinFilename(i));
    const pkgThumb = path.join(ROOT, "extension", "extskins", "thumbs", extSkinThumbFilename(i));

    let buf = fs.readFileSync(full);
    let hash = crypto.createHash("sha256").update(buf).digest("hex");
    if (seen.has(hash) || buf.length < 8000 || buf.length > 430000) {
      const donorSlot = ((i * 13 + 17) % WALLPAPER_PACK_COUNT) + 1;
      const donor = path.join(ROOT, "assets", "wallpapers", siteLandscapeFilename(donorSlot));
      const pos = ["centre", "top", "left", "right", "entropy", "attention"][i % 6];
      buf = await sharp(donor)
        .resize(EXT_W, EXT_H, { fit: "cover", position: pos })
        .webp({ quality: 78 })
        .toBuffer();
      if (buf.length > 430000) {
        buf = await sharp(buf).webp({ quality: 70 }).toBuffer();
      }
      hash = crypto.createHash("sha256").update(buf).digest("hex");
    }
    seen.set(hash, i);
    fs.writeFileSync(full, buf);
    fs.writeFileSync(pkg, buf);
    await writeThumb(buf, thumb, 360, 640);
    if (fs.statSync(thumb).size > 45000) await writeThumb(buf, thumb, 300, 534);
    fs.copyFileSync(thumb, pkgThumb);
  }
  console.log("fix-themes-v4-assets OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
