#!/usr/bin/env node
/** Verify all v2/extv3 wallpaper webp files exist with sane sizes. */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const MIN_FULL = 12_000;
const MIN_THUMB = 2_000;

function checkDir(fullDir, thumbDir, prefix, count, pad) {
  let issues = 0;
  for (let i = 1; i <= count; i++) {
    const id = `${prefix}${String(i).padStart(pad, "0")}`;
    const full = path.join(fullDir, `${id}.webp`);
    const thumb = path.join(thumbDir, `${id}.webp`);
    for (const [label, file, min] of [
      ["full", full, MIN_FULL],
      ["thumb", thumb, MIN_THUMB],
    ]) {
      if (!fs.existsSync(file)) {
        console.error(`missing ${label}: ${file}`);
        issues++;
        continue;
      }
      const n = fs.statSync(file).size;
      if (n < min) {
        console.error(`small ${label}: ${file} (${n} < ${min})`);
        issues++;
      }
    }
  }
  return issues;
}

let issues = 0;
issues += checkDir(
  path.join(root, "assets", "wallpapers"),
  path.join(root, "assets", "wallpapers", "thumbs"),
  "v2_",
  58,
  3
);
issues += checkDir(
  path.join(root, "assets", "extbg"),
  path.join(root, "assets", "extbg", "thumbs"),
  "extv3_",
  58,
  2
);

if (issues) {
  console.error(`check-wallpaper-assets: ${issues} issue(s). Run: npm run wallpapers:fetch`);
  process.exit(1);
}
console.log("check-wallpaper-assets OK (58 site + 58 ext)");
