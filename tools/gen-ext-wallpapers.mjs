#!/usr/bin/env node
/**
 * Generate portrait (396x720) SVGs for extension from landscape w01-w58.
 * Crops center 1080x1080 from 1920x1080 source.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const srcDir = path.join(repoRoot, "public", "assets", "wallpapers");
const extDir = path.join(repoRoot, "extension", "extbg");
const assetsExtDir = path.join(repoRoot, "assets", "extbg");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toPortrait(svgContent) {
  return svgContent
    .replace(/viewBox="[^"]*"/, 'viewBox="420 0 1080 1080"')
    .replace(/width="[^"]*"\s*height="[^"]*"/, 'width="396" height="720"')
    .replace(/width="1920"\s*height="1080"/, 'width="396" height="720"');
}

ensureDir(extDir);
ensureDir(assetsExtDir);

let count = 0;
for (let i = 1; i <= 58; i++) {
  const n = String(i).padStart(2, "0");
  const src = path.join(srcDir, `w${n}.svg`);
  const extName = `ext_w${n}.svg`;
  const extOut = path.join(extDir, extName);
  const assetsOut = path.join(assetsExtDir, extName);

  if (!fs.existsSync(src)) {
    console.warn(`Skip w${n}.svg (not found)`);
    continue;
  }

  const content = fs.readFileSync(src, "utf8");
  const portrait = toPortrait(content);

  fs.writeFileSync(extOut, portrait);
  fs.writeFileSync(assetsOut, portrait);
  count++;
}

console.log(`Generated ${count} portrait wallpapers for extension (ext_w01..ext_w58)`);
