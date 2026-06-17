import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "frontend", "dist");
const targetDir = path.join(repoRoot, "public", "bridge");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function listBridgeBundles(dir) {
  const assetsDir = path.join(dir, "assets");
  if (!fs.existsSync(assetsDir)) return [];
  return fs.readdirSync(assetsDir).filter((name) => /^.+\.(js|css)$/.test(name));
}

function pruneStaleBridgeBundles(keepNames) {
  const assetsDir = path.join(targetDir, "assets");
  if (!fs.existsSync(assetsDir)) return;
  const keep = new Set(keepNames);
  for (const name of fs.readdirSync(assetsDir)) {
    if (!/\.(js|css)$/.test(name)) continue;
    if (keep.has(name)) continue;
    fs.unlinkSync(path.join(assetsDir, name));
  }
}

if (!fs.existsSync(sourceDir)) {
  console.error(`[build] frontend dist not found: ${sourceDir}`);
  process.exit(1);
}

ensureDir(targetDir);

const indexSrc = path.join(sourceDir, "index.html");
const indexDest = path.join(targetDir, "index.html");
if (!fs.existsSync(indexSrc)) {
  console.error(`[build] missing ${indexSrc}`);
  process.exit(1);
}
copyFile(indexSrc, indexDest);

const bundleNames = listBridgeBundles(sourceDir);
const assetsSrc = path.join(sourceDir, "assets");
const assetsDest = path.join(targetDir, "assets");
ensureDir(assetsDest);
for (const name of bundleNames) {
  copyFile(path.join(assetsSrc, name), path.join(assetsDest, name));
}
pruneStaleBridgeBundles(bundleNames);

const strayAppJs = path.join(targetDir, "app.js");
if (fs.existsSync(strayAppJs)) {
  fs.unlinkSync(strayAppJs);
}

console.log(
  `[build] React bridge synced: ${path.relative(repoRoot, sourceDir)} -> ${path.relative(repoRoot, targetDir)} (${bundleNames.length} bundles)`
);
