#!/usr/bin/env node
/**
 * Copy existing v2_* and v3/site/* wallpapers to preset slots (free01, free02, w01-w58).
 * Uses the good wallpapers already in the project instead of gradient SVGs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WP_DIR = path.join(ROOT, "assets", "wallpapers");
const V2_DIR = WP_DIR;
const V3_DIR = path.join(WP_DIR, "v3", "site");

const PRESET_IDS = ["free01", "free02", ...Array.from({ length: 58 }, (_, i) => `w${String(i + 1).padStart(2, "0")}`)];

function pad3(n) {
  return String(n).padStart(3, "0");
}

function main() {
  const manifest = {};
  let n = 0;

  for (let i = 0; i < PRESET_IDS.length; i++) {
    const id = PRESET_IDS[i];
    let src;
    if (i < 2) {
      src = path.join(V2_DIR, `v2_${pad3(i + 1)}.webp`);
    } else if (i < 60) {
      const v2Idx = i - 2 + 3;
      if (v2Idx <= 58) {
        src = path.join(V2_DIR, `v2_${pad3(v2Idx)}.webp`);
      } else {
        const v3Num = v2Idx - 58;
        src = path.join(V3_DIR, `v3_${String(v3Num).padStart(2, "0")}.webp`);
      }
    }
    if (!src || !fs.existsSync(src)) continue;
    const destName = id + ".webp";
    const dest = path.join(WP_DIR, destName);
    try {
      fs.copyFileSync(src, dest);
      manifest[id] = destName;
      n++;
      console.log(n, path.basename(src), "->", destName);
    } catch (err) {
      console.error("Failed:", id, err.message);
    }
  }

  const manifestPath = path.join(WP_DIR, "preset-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0), "utf8");
  console.log("Done. Copied", n, "wallpapers. Manifest:", manifestPath);
}

main();
