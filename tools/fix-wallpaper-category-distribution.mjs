#!/usr/bin/env node
/** Fix category distribution using existing 100 assets (re-label + slot remap). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeCatalog, writeSourcesManifest, bumpAssetRev } from "./pexels-wallpaper-catalog-write.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(root, "..");

const TARGETS = {
  "neon-city": 8,
  "futuristic-architecture": 8,
  "night-skyline": 7,
  space: 8,
  "moon-planets": 7,
  mountains: 9,
  forest: 9,
  "ocean-underwater": 9,
  desert: 6,
  "northern-lights": 7,
  "abstract-glass": 8,
  "geometric-dark": 7,
  "minimal-texture": 7,
};

const cached = JSON.parse(fs.readFileSync(path.join(root, ".wallpaper-review", "candidates.json"), "utf8"));
const oldManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "wallpaper-sources.json"), "utf8"));
const meta = new Map(
  cached.candidates
    .filter((c) => c.score)
    .map((c) => [c.pexelsId, c])
);

const items = oldManifest.items.map((item) => {
  const c = meta.get(item.pexelsId) || {};
  return { ...item, searchCategory: c.category || item.category, score: c.score?.total || item.visualScore || 0, alt: c.alt || "" };
});

// Re-label pools: futuristic/night -> neon; space -> moon; trim overfull
const neonLike = items
  .filter((i) => ["futuristic-architecture", "night-skyline"].includes(i.searchCategory))
  .sort((a, b) => b.score - a.score);
const futLike = items.filter((i) => i.searchCategory === "futuristic-architecture").sort((a, b) => b.score - a.score);
const moonLike = items
  .filter((i) => ["moon-planets", "space"].includes(i.searchCategory))
  .sort((a, b) => b.score - a.score);

const assigned = new Map();
const take = (pool, cat, n) => {
  let k = 0;
  for (const item of pool) {
    if (k >= n) break;
    if (assigned.has(item.pexelsId)) continue;
    assigned.set(item.pexelsId, cat);
    k++;
  }
};

for (const [cat, n] of Object.entries(TARGETS)) {
  if (cat === "neon-city") take(neonLike, cat, n);
  else if (cat === "moon-planets") take(moonLike, cat, n);
  else {
    const pool = items.filter((i) => i.searchCategory === cat).sort((a, b) => b.score - a.score);
    take(pool, cat, n);
  }
}

for (const item of items.sort((a, b) => b.score - a.score)) {
  if (assigned.has(item.pexelsId)) continue;
  for (const [cat, n] of Object.entries(TARGETS)) {
    const have = [...assigned.values()].filter((v) => v === cat).length;
    if (have >= n) continue;
    assigned.set(item.pexelsId, cat);
    break;
  }
}

if (assigned.size !== 100) throw new Error(`Assigned ${assigned.size}/100`);

const final100 = items
  .map((item) => {
    const category = assigned.get(item.pexelsId);
    const c = meta.get(item.pexelsId) || {};
    return {
      ...c,
      pexelsId: item.pexelsId,
      photographer: item.photographer,
      photographerUrl: item.photographerUrl,
      pageUrl: item.pageUrl,
      width: item.originalDimensions.width,
      height: item.originalDimensions.height,
      category,
      score: c.score || { total: item.visualScore },
      alt: c.alt || item.name,
    };
  })
  .sort((a, b) => b.score.total - a.score.total);

// Remap files to new slot order
const tmp = path.join(root, ".wallpaper-review", "_fix-tmp");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

for (let i = 0; i < 100; i++) {
  const slot = String(i + 1).padStart(3, "0");
  const siteId = `v2_${slot}`;
  const extId = `extv3_${slot}`;
  const item = final100[i];
  const old = oldManifest.items.find((x) => x.pexelsId === item.pexelsId);
  item.siteId = siteId;
  item.extId = extId;
  item.landscapePath = `assets/wallpapers/${siteId}.webp`;
  item.portraitPath = `assets/extbg/${extId}.webp`;
  item.thumbnailPath = `assets/wallpapers/thumbs/${siteId}.webp`;

  const copy = (src, dst) => fs.copyFileSync(src, dst);
  copy(path.join(ROOT, old.landscapePath), path.join(tmp, `${siteId}.webp`));
  copy(path.join(ROOT, old.portraitPath), path.join(tmp, `${extId}.webp`));
  copy(path.join(ROOT, "assets/wallpapers/thumbs", `${old.id}.webp`), path.join(tmp, `th_${siteId}.webp`));
  copy(path.join(ROOT, "assets/extbg/thumbs", `${old.extId}.webp`), path.join(tmp, `th_${extId}.webp`));
}

for (const d of [
  path.join(ROOT, "assets/wallpapers"),
  path.join(ROOT, "assets/wallpapers/thumbs"),
  path.join(ROOT, "assets/extbg"),
  path.join(ROOT, "assets/extbg/thumbs"),
]) {
  for (const f of fs.readdirSync(d)) {
    if (f.endsWith(".webp")) fs.unlinkSync(path.join(d, f));
  }
}

for (let i = 0; i < 100; i++) {
  const slot = String(i + 1).padStart(3, "0");
  const siteId = `v2_${slot}`;
  const extId = `extv3_${slot}`;
  fs.copyFileSync(path.join(tmp, `${siteId}.webp`), path.join(ROOT, "assets/wallpapers", `${siteId}.webp`));
  fs.copyFileSync(path.join(tmp, `${extId}.webp`), path.join(ROOT, "assets/extbg", `${extId}.webp`));
  fs.copyFileSync(path.join(tmp, `th_${siteId}.webp`), path.join(ROOT, "assets/wallpapers/thumbs", `${siteId}.webp`));
  fs.copyFileSync(path.join(tmp, `th_${extId}.webp`), path.join(ROOT, "assets/extbg/thumbs", `${extId}.webp`));
}

const sharp = (await import("sharp")).default;
const { encodeWebpUnderBudget } = await import("./lib/wallpaper-image-utils.mjs");
for (let i = 1; i <= 100; i++) {
  const n = String(i).padStart(3, "0");
  for (const [file, max] of [
    [path.join(ROOT, "assets/wallpapers", `v2_${n}.webp`), 440_000],
    [path.join(ROOT, "assets/extbg", `extv3_${n}.webp`), 310_000],
  ]) {
    if (fs.statSync(file).size > max) {
      fs.writeFileSync(file, await encodeWebpUnderBudget(sharp, sharp(fs.readFileSync(file)), max));
    }
  }
}

writeCatalog(final100);
writeSourcesManifest(final100);
bumpAssetRev();

const cats = {};
for (const c of final100) cats[c.category] = (cats[c.category] || 0) + 1;
console.log("Distribution fixed:", cats);
fs.rmSync(tmp, { recursive: true, force: true });
