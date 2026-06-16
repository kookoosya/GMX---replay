#!/usr/bin/env node
/**
 * Remove old wallpaper assets. Keep: preset (free01, free02, w01-w58), custom/, preset-manifest.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WP = path.join(__dirname, "..", "assets", "wallpapers");
const EXT = path.join(__dirname, "..", "assets", "extbg");

const KEEP = new Set(["custom", "preset-manifest.json"]);
const KEEP_PREFIX = ["free01", "free02"];
const KEEP_RE = /^w\d{2}\.(jpg|jpeg|png|webp)$/;

function rmFile(p) {
  try { fs.unlinkSync(p); return true; } catch { return false; }
}

function rmDirRecursive(p) {
  try {
    if (!fs.existsSync(p)) return;
    for (const name of fs.readdirSync(p)) {
      const full = path.join(p, name);
      if (fs.statSync(full).isDirectory()) rmDirRecursive(full);
      else fs.unlinkSync(full);
    }
    fs.rmdirSync(p);
  } catch {}
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  let removed = 0;
  for (const name of fs.readdirSync(dir)) {
    if (KEEP.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "custom") continue;
      rmDirRecursive(full);
      removed++;
    } else {
      const keep = KEEP_PREFIX.some(p => name.startsWith(p + ".")) || KEEP_RE.test(name);
      if (!keep) {
        rmFile(full) && removed++;
      }
    }
  }
  return removed;
}

let n = cleanDir(WP);
n += cleanDir(path.join(EXT, "thumbs"));
console.log("Removed", n, "old wallpaper files/dirs");
console.log("Kept: free01, free02, w01-w58 (from preset), custom/, preset-manifest.json");
