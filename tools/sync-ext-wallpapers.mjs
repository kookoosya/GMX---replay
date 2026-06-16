#!/usr/bin/env node
/**
 * Copy site preset wallpapers to extbg for extension (same images, ext_ prefix).
 * Also copies assets/extbg to extension/extbg so the extension package has thumbs + wallpapers.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WP = path.join(ROOT, "assets", "wallpapers");
const EXT = path.join(ROOT, "assets", "extbg");
const EXT_EXTENSION = path.join(ROOT, "extension", "extbg");

function ensureCleanDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

const manifestPath = path.join(WP, "preset-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.log("No preset-manifest.json, run wallpapers:import first");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
ensureCleanDir(EXT);
let n = 0;
const keepExtFiles = new Set([
  "lux_ext_anime_neon_alley.svg",
  "lux_ext_cinematic_heroes.svg",
  "lux_ext_ct_warroom.svg",
  "lux_ext_degen_terminal.svg",
  "lux_ext_nft_gallery.svg",
  "lux_ext_noir_detective.svg",
  "lux_ext_onchain_spaceport.svg",
  "lux_ext_solana_temple.svg",
]);
const keepExtThumbs = new Set();

for (const [id, file] of Object.entries(manifest)) {
  const src = path.join(WP, file);
  if (!fs.existsSync(src)) continue;
  let extName;
  if (id === "free01") extName = "ext_free_01" + path.extname(file);
  else if (id === "free02") extName = "ext_free_02" + path.extname(file);
  else extName = "ext_" + id + path.extname(file);
  const dest = path.join(EXT, extName);
  fs.copyFileSync(src, dest);
  keepExtFiles.add(extName);
  keepExtThumbs.add(extName.replace(path.extname(extName), ".jpg"));
  n++;
}
console.log("Synced", n, "wallpapers to assets/extbg/");

const extThumbDir = path.join(EXT, "thumbs");
if (fs.existsSync(extThumbDir)) {
  for (const name of fs.readdirSync(extThumbDir)) {
    if (!keepExtThumbs.has(name)) {
      try { fs.unlinkSync(path.join(extThumbDir, name)); } catch {}
    }
  }
}

for (const name of fs.readdirSync(EXT)) {
  const full = path.join(EXT, name);
  if (name === "custom" || name === "thumbs") continue;
  if (fs.statSync(full).isDirectory()) continue;
  if (!keepExtFiles.has(name)) {
    try { fs.unlinkSync(full); } catch {}
  }
}

if (fs.existsSync(path.join(ROOT, "extension"))) {
  if (fs.existsSync(EXT_EXTENSION)) {
    for (const name of fs.readdirSync(EXT_EXTENSION)) {
      const full = path.join(EXT_EXTENSION, name);
      if (name === "custom" || name === "thumbs") continue;
      if (fs.statSync(full).isDirectory()) continue;
      try { fs.unlinkSync(full); } catch {}
    }
  } else {
    fs.mkdirSync(EXT_EXTENSION, { recursive: true });
  }
  copyDirRecursive(EXT, EXT_EXTENSION);
  const extMap = {};
  for (const [id, file] of Object.entries(manifest)) {
    const ext = path.extname(file).slice(1);
    const extId = id === "free01" ? "ext_free_01" : id === "free02" ? "ext_free_02" : "ext_" + id;
    extMap[extId] = ext;
  }
  fs.writeFileSync(path.join(EXT_EXTENSION, "ext-map.json"), JSON.stringify(extMap), "utf8");
  console.log("Copied assets/extbg -> extension/extbg");
}
