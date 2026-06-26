#!/usr/bin/env node
/** Re-encode wallpaper webp packs to web-friendly size (faster tab switches). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_W = 2560;
const SITE_H = 1440;
const EXT_W = 1080;
const EXT_H = 1920;
const THUMB_SITE = [640, 360];
const THUMB_EXT = [360, 640];
const FULL_Q = 82;
const THUMB_Q = 78;
const MAX_BYTES = 900_000;

const JOBS = [
  { dir: "assets/wallpapers", thumb: "assets/wallpapers/thumbs", prefix: "v2_", count: 100, pad: 3, w: SITE_W, h: SITE_H, tw: THUMB_SITE },
  { dir: "assets/extbg", thumb: "assets/extbg/thumbs", prefix: "extv3_", count: 100, pad: 3, w: EXT_W, h: EXT_H, tw: THUMB_EXT },
];

async function encode(sharp, file, w, h, q) {
  let quality = q;
  for (let pass = 0; pass < 4; pass++) {
    const buf = await sharp(file)
      .rotate()
      .resize(w, h, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    if (buf.length <= MAX_BYTES || quality <= 68) return buf;
    quality -= 6;
  }
  return sharp(file).rotate().resize(w, h, { fit: "inside", withoutEnlargement: true }).webp({ quality: 68 }).toBuffer();
}

async function main() {
  const sharp = (await import("sharp")).default;
  let saved = 0;
  for (const job of JOBS) {
    const fullDir = path.join(ROOT, job.dir);
    const thumbDir = path.join(ROOT, job.thumb);
    for (let i = 1; i <= job.count; i++) {
      const id = `${job.prefix}${String(i).padStart(job.pad, "0")}`;
      const fullPath = path.join(fullDir, `${id}.webp`);
      const thumbPath = path.join(thumbDir, `${id}.webp`);
      if (!fs.existsSync(fullPath)) {
        console.warn(`skip missing ${id}`);
        continue;
      }
      const before = fs.statSync(fullPath).size;
      process.stdout.write(`${id}… `);
      const buf = await encode(sharp, fullPath, job.w, job.h, FULL_Q);
      fs.writeFileSync(fullPath, buf);
      const tbuf = await sharp(buf)
        .resize(job.tw[0], job.tw[1], { fit: "cover", position: "centre" })
        .webp({ quality: THUMB_Q })
        .toBuffer();
      fs.writeFileSync(thumbPath, tbuf);
      saved += Math.max(0, before - buf.length);
      console.log(`${Math.round(before / 1024)}→${Math.round(buf.length / 1024)} KB`);
    }
  }
  console.log(`\nDone. Saved ~${Math.round(saved / 1024 / 1024)} MB total.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
