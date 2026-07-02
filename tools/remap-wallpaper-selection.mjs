#!/usr/bin/env node
/** Remap existing wallpaper files to fixed category selection without network. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hamming } from "./lib/wallpaper-image-utils.mjs";
import { writeCatalog, writeSourcesManifest, bumpAssetRev } from "./pexels-wallpaper-catalog-write.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(root, "..");
const REVIEW = path.join(root, ".wallpaper-review");

const CATEGORY_TARGETS = {
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

function selectFinal(scored, availableIds) {
  const selected = [];
  const usedIds = new Set();
  const usedHash = new Set();
  const photographerCount = new Map();
  const byCat = new Map();
  for (const c of scored) {
    if (!availableIds.has(c.pexelsId)) continue;
    byCat.set(c.category, [...(byCat.get(c.category) || []), c]);
  }

  function tryPick(c) {
    if (!availableIds.has(c.pexelsId)) return false;
    if (usedIds.has(c.pexelsId)) return false;
    if (usedHash.has(c.analysis.exact)) return false;
    if ((photographerCount.get(c.photographer) || 0) >= 3) return false;
    for (const s of selected) {
      if (hamming(s.analysis.dHash, c.analysis.dHash) <= 6) return false;
    }
    return true;
  }

  function add(c) {
    selected.push(c);
    usedIds.add(c.pexelsId);
    usedHash.add(c.analysis.exact);
    photographerCount.set(c.photographer, (photographerCount.get(c.photographer) || 0) + 1);
  }

  const countByCat = () => {
    const m = {};
    for (const s of selected) m[s.category] = (m[s.category] || 0) + 1;
    return m;
  };

  for (const [cat, target] of Object.entries(CATEGORY_TARGETS)) {
    const pool = byCat.get(cat) || [];
    let n = 0;
    for (const c of pool) {
      if (n >= target) break;
      if (!tryPick(c)) continue;
      add(c);
      n++;
    }
  }

  for (const [cat, target] of Object.entries(CATEGORY_TARGETS)) {
    const pool = byCat.get(cat) || [];
    while ((countByCat()[cat] || 0) < target && selected.length < 100) {
      let added = false;
      for (const c of pool) {
        if ((countByCat()[cat] || 0) >= target) break;
        if (!tryPick(c)) continue;
        add(c);
        added = true;
        break;
      }
      if (!added) break;
    }
  }

  if (selected.length < 100) {
    const ranked = [...scored].sort((a, b) => {
      const ca = countByCat()[a.category] || 0;
      const cb = countByCat()[b.category] || 0;
      const ta = CATEGORY_TARGETS[a.category] || 0;
      const tb = CATEGORY_TARGETS[b.category] || 0;
      return ca - ta - (cb - tb) || b.score.total - a.score.total;
    });
    for (const c of ranked) {
      if (selected.length >= 100) break;
      if ((countByCat()[c.category] || 0) >= 15) continue;
      if (!tryPick(c)) continue;
      add(c);
    }
  }

  if (selected.length < 100) throw new Error(`Only ${selected.length}/100`);
  return selected.slice(0, 100);
}

const cached = JSON.parse(fs.readFileSync(path.join(REVIEW, "candidates.json"), "utf8"));
const scored = cached.candidates
  .filter((c) => c.status === "eligible" && c.score && c.analysis)
  .sort((a, b) => b.score.total - a.score.total);
const final100 = selectFinal(scored, availableIds);

const oldManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "wallpaper-sources.json"), "utf8"));
const byPexels = new Map(oldManifest.items.map((i) => [i.pexelsId, i]));
const availableIds = new Set(oldManifest.items.map((i) => i.pexelsId));
const final100 = selectFinal(scored, availableIds);

const missing = final100.filter((c) => !byPexels.has(c.pexelsId)).map((c) => c.pexelsId);
if (missing.length) throw new Error(`Missing assets for pexels: ${missing.join(", ")}`);

const tmp = path.join(REVIEW, "_remap-tmp");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

for (let i = 0; i < 100; i++) {
  const slot = String(i + 1).padStart(3, "0");
  const siteId = `v2_${slot}`;
  const extId = `extv3_${slot}`;
  const c = final100[i];
  const old = byPexels.get(c.pexelsId);
  c.siteId = siteId;
  c.extId = extId;
  c.landscapePath = `assets/wallpapers/${siteId}.webp`;
  c.portraitPath = `assets/extbg/${extId}.webp`;
  c.thumbnailPath = `assets/wallpapers/thumbs/${siteId}.webp`;

  const copy = (src, dst) => {
    if (!fs.existsSync(src)) throw new Error(`Missing ${src}`);
    fs.copyFileSync(src, dst);
  };
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
console.log("Remapped OK:", cats);
fs.rmSync(tmp, { recursive: true, force: true });
