#!/usr/bin/env node
/** Recompress Themes V5 assets to meet size budgets. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderIllustratedSvg, svgToWebp } from "./lib/themes-v5-art.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_THUMB = path.join(ROOT, "assets", "wallpapers", "thumbs");
const SITE_FULL = path.join(ROOT, "assets", "wallpapers");
const EXT_FULL = path.join(ROOT, "assets", "extskins");
const EXT_THUMB = path.join(ROOT, "assets", "extskins", "thumbs");
const EXT_PKG = path.join(ROOT, "extension", "extskins");

const MAX_LAND = 700_000;
const MAX_THUMB = 96_000;

function writeAtomic(file, buf) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, file);
}

async function main() {
  const sharp = (await import("sharp")).default;

  for (let i = 1; i <= 100; i++) {
    const pad = String(i).padStart(3, "0");
    const land = path.join(SITE_FULL, `sitev5_${pad}.webp`);
    const thumb = path.join(SITE_THUMB, `sitev5_${pad}.webp`);
    if (fs.existsSync(land) && fs.statSync(land).size > MAX_LAND) {
      writeAtomic(land, await sharp(land).webp({ quality: 72 }).toBuffer());
    }
    if (fs.existsSync(thumb) && fs.statSync(thumb).size > MAX_THUMB) {
      writeAtomic(thumb, await sharp(thumb).webp({ quality: 52 }).toBuffer());
    }
  }

  for (let i = 58; i <= 60; i++) {
    const pad = String(i).padStart(3, "0");
    const svg = renderIllustratedSvg("abstract-dark", i, 900, 1600, true);
    const buf = await svgToWebp(sharp, svg, 900, 1600, 92);
    for (const out of [
      path.join(EXT_FULL, `extskin_v5_${pad}.webp`),
      path.join(EXT_PKG, `extskin_v5_${pad}.webp`),
    ]) {
      writeAtomic(out, buf);
    }
    const thumbPath = path.join(EXT_THUMB, `extskin_v5_${pad}.webp`);
    await sharp(buf).resize(360, 640, { fit: "cover" }).webp({ quality: 72 }).toFile(`${thumbPath}.tmp`);
    fs.renameSync(`${thumbPath}.tmp`, thumbPath);
    fs.copyFileSync(thumbPath, path.join(EXT_PKG, "thumbs", `extskin_v5_${pad}.webp`));
  }

  console.log("fix-themes-v5-assets OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
