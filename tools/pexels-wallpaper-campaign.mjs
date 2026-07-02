#!/usr/bin/env node
/**
 * Pexels 100-wallpaper campaign: discover → score → select → assets → catalog.
 * Requires PEXELS_API_KEY in .env. Never logs the key.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, loadEnv, ensurePexelsKey, removePexelsKey } from "./lib/load-env.mjs";
import { pexelsSearch, downloadUrl, photoPageUrl } from "./lib/pexels-client.mjs";
import {
  altRejected,
  hamming,
  analyzeImage,
  scoreCandidate,
  encodeWebpUnderBudget,
} from "./lib/wallpaper-image-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REVIEW_DIR = path.join(ROOT, "tools", ".wallpaper-review");
const CANDIDATE_CACHE = path.join(REVIEW_DIR, "candidates.json");

const SITE_DIR = path.join(ROOT, "assets", "wallpapers");
const SITE_TH = path.join(SITE_DIR, "thumbs");
const EXT_DIR = path.join(ROOT, "assets", "extbg");
const EXT_TH = path.join(EXT_DIR, "thumbs");

const LAND_W = 1920;
const LAND_H = 1080;
const PORT_W = 900;
const PORT_H = 1600;
const THUMB_W = 320;
const THUMB_H = 180;

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

const SEARCH_PLAN = [
  { category: "neon-city", queries: ["neon city night", "cyberpunk street rain", "neon urban lights dark"] },
  { category: "futuristic-architecture", queries: ["futuristic architecture dark", "modern glass building night", "cyberpunk architecture"] },
  { category: "night-skyline", queries: ["night skyline city", "moody skyline night", "city lights horizon"] },
  { category: "space", queries: ["deep space stars", "galaxy nebula dark", "milky way night sky"] },
  { category: "moon-planets", queries: ["moon horizon night", "planet space horizon", "lunar landscape dark"] },
  { category: "mountains", queries: ["misty mountains dark", "snow mountains night", "alpine peaks fog"] },
  { category: "forest", queries: ["dark forest fog", "foggy forest atmospheric", "pine forest mist"] },
  { category: "ocean-underwater", queries: ["ocean twilight dark", "underwater blue light", "sea horizon night"] },
  { category: "desert", queries: ["desert night dunes", "sand desert stars", "arid landscape dusk"] },
  { category: "northern-lights", queries: ["northern lights landscape", "aurora borealis mountains", "aurora night sky"] },
  { category: "abstract-glass", queries: ["abstract glass dark", "glass reflection architecture", "liquid metal abstract"] },
  { category: "geometric-dark", queries: ["geometric shadows dark", "dark architecture lines", "minimal geometry shadows"] },
  { category: "minimal-texture", queries: ["minimal black texture", "dark paper texture", "monochrome landscape minimal"] },
];

const WALLPAPER_CATEGORIES = [
  { id: "neon-city", labelKey: "wp_cat_neon_city" },
  { id: "futuristic-architecture", labelKey: "wp_cat_futuristic_architecture" },
  { id: "night-skyline", labelKey: "wp_cat_night_skyline" },
  { id: "space", labelKey: "wp_cat_space" },
  { id: "moon-planets", labelKey: "wp_cat_moon_planets" },
  { id: "mountains", labelKey: "wp_cat_mountains" },
  { id: "forest", labelKey: "wp_cat_forest" },
  { id: "ocean-underwater", labelKey: "wp_cat_ocean_underwater" },
  { id: "desert", labelKey: "wp_cat_desert" },
  { id: "northern-lights", labelKey: "wp_cat_northern_lights" },
  { id: "abstract-glass", labelKey: "wp_cat_abstract_glass" },
  { id: "geometric-dark", labelKey: "wp_cat_geometric_dark" },
  { id: "minimal-texture", labelKey: "wp_cat_minimal_texture" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function titleCase(s) {
  return String(s || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function nameFromPhoto(photo, category) {
  const alt = String(photo.alt || "").trim();
  if (alt && alt.length > 4 && alt.length < 48 && !altRejected(alt)) {
    return alt.split(/[.,|]/)[0].slice(0, 42).trim();
  }
  const prefix = titleCase(category.split("-")[0]);
  return `${prefix} Scene`;
}

async function discoverCandidates(sharp) {
  const byId = new Map();
  let apiFailures = 0;
  let queriesRun = 0;

  for (const plan of SEARCH_PLAN) {
    for (const query of plan.queries) {
      for (let page = 1; page <= 3; page++) {
        queriesRun++;
        process.stdout.write(`search [${plan.category}] "${query}" p${page}… `);
        try {
          const data = await pexelsSearch(query, page, 80);
          const photos = data.photos || [];
          console.log(`${photos.length} photos`);
          for (const p of photos) {
            if (byId.has(p.id)) continue;
            if (altRejected(p.alt)) continue;
            if ((p.width || 0) < 1920 || (p.height || 0) < 1080) continue;
            byId.set(p.id, {
              pexelsId: p.id,
              photographer: p.photographer,
              photographerUrl: p.photographer_url,
              pageUrl: p.url || photoPageUrl(p.id),
              originalUrl: p.src?.large2x || p.src?.large || p.src?.original,
              mediumUrl: p.src?.large || p.src?.medium,
              width: p.width,
              height: p.height,
              alt: p.alt || "",
              query,
              category: plan.category,
              status: "pending",
            });
          }
          if (photos.length < 80) break;
        } catch (e) {
          apiFailures++;
          console.log(`FAIL (${e.message})`);
        }
        await sleep(350);
      }
    }
  }

  console.log(`\nDiscovered ${byId.size} unique candidates (${queriesRun} queries, ${apiFailures} failures)`);
  return { candidates: [...byId.values()], apiFailures, queriesRun };
}

/** Keep discovery broad but cap scoring downloads per category. */
function prepCandidatesForScoring(candidates, maxPerCategory = 100) {
  const byCat = new Map();
  for (const c of candidates) {
    const arr = byCat.get(c.category) || [];
    arr.push(c);
    byCat.set(c.category, arr);
  }
  const out = [];
  for (const arr of byCat.values()) {
    arr.sort((a, b) => b.width * b.height - a.width * a.height || b.width - a.width);
    out.push(...arr.slice(0, maxPerCategory));
  }
  console.log(`Scoring pool: ${out.length} (cap ${maxPerCategory}/category from ${candidates.length} discovered)`);
  return out;
}

async function scoreCandidates(sharp, candidates) {
  const scored = [];
  let rejected = 0;
  const dHashes = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (i % 25 === 0) process.stdout.write(`score ${i}/${candidates.length}…\n`);
    try {
      const buf = await downloadUrl(c.mediumUrl || c.originalUrl);
      if (buf.length < 40000) {
        c.status = "rejected";
        c.rejectionReason = "too_small";
        rejected++;
        continue;
      }
      const analysis = await analyzeImage(sharp, buf, { width: c.width, height: c.height });
      if (!analysis) {
        c.status = "rejected";
        c.rejectionReason = "low_resolution";
        rejected++;
        continue;
      }
      if (analysis.centerMean > 220) {
        c.status = "rejected";
        c.rejectionReason = "bright_center";
        rejected++;
        continue;
      }
      if (analysis.brightness < 8) {
        c.status = "rejected";
        c.rejectionReason = "too_dark";
        rejected++;
        continue;
      }
      let dup = false;
      for (const h of dHashes) {
        if (hamming(analysis.dHash, h) <= 10) {
          dup = true;
          break;
        }
      }
      if (dup) {
        c.status = "rejected";
        c.rejectionReason = "perceptual_duplicate";
        rejected++;
        continue;
      }
      const sc = scoreCandidate(analysis, c.category);
      if (!sc) {
        c.status = "rejected";
        c.rejectionReason = "low_score";
        rejected++;
        continue;
      }
      c.analysis = analysis;
      c.score = sc;
      c.status = "eligible";
      dHashes.push(analysis.dHash);
      scored.push(c);
    } catch {
      c.status = "rejected";
      c.rejectionReason = "download_failed";
      rejected++;
    }
    await sleep(80);
  }

  scored.sort((a, b) => b.score.total - a.score.total);
  console.log(`Scored: ${scored.length} eligible, ${rejected} rejected`);
  return { scored, rejected };
}

function selectFinal(scored) {
  const selected = [];
  const usedIds = new Set();
  const usedHash = new Set();
  const photographerCount = new Map();
  const byCat = new Map();
  for (const c of scored) byCat.set(c.category, [...(byCat.get(c.category) || []), c]);

  function tryPick(c) {
    if (usedIds.has(c.pexelsId)) return false;
    if (usedHash.has(c.analysis.exact)) return false;
    const pc = photographerCount.get(c.photographer) || 0;
    if (pc >= 3) return false;
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
    c.status = "selected";
  }

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

  const maxPerCategory = 15;
  const countByCat = () => {
    const m = {};
    for (const s of selected) m[s.category] = (m[s.category] || 0) + 1;
    return m;
  };

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
      return (ca - ta) - (cb - tb) || b.score.total - a.score.total;
    });
    for (const c of ranked) {
      if (selected.length >= 100) break;
      const n = countByCat()[c.category] || 0;
      if (n >= maxPerCategory) continue;
      if (!tryPick(c)) continue;
      add(c);
    }
  }

  if (selected.length < 100) {
    throw new Error(`Only selected ${selected.length}/100 — need more searches`);
  }

  return selected.slice(0, 100);
}

async function buildAssets(sharp, final100) {
  for (const dir of [SITE_DIR, SITE_TH, EXT_DIR, EXT_TH]) fs.mkdirSync(dir, { recursive: true });

  const keepSite = new Set();
  const keepExt = new Set();

  for (let i = 0; i < final100.length; i++) {
    const slot = i + 1;
    const siteId = `v2_${String(slot).padStart(3, "0")}`;
    const extId = `extv3_${String(slot).padStart(3, "0")}`;
    const c = final100[i];
    keepSite.add(`${siteId}.webp`);
    keepExt.add(`${extId}.webp`);

    process.stdout.write(`${siteId} pexels:${c.pexelsId}… `);
    let buf;
    try {
      buf = await downloadUrl(c.originalUrl);
    } catch {
      buf = await downloadUrl(c.mediumUrl || c.originalUrl);
    }
    const base = sharp(buf).rotate();

    const landPipe = base
      .clone()
      .resize(LAND_W, LAND_H, { fit: "cover", position: "attention" });
    const landBuf = await encodeWebpUnderBudget(sharp, landPipe, 440_000);
    fs.writeFileSync(path.join(SITE_DIR, `${siteId}.webp`), landBuf);

    const thumbBuf = await sharp(landBuf)
      .resize(THUMB_W, THUMB_H, { fit: "cover", position: "centre" })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    fs.writeFileSync(path.join(SITE_TH, `${siteId}.webp`), thumbBuf);

    const portPipe = base
      .clone()
      .resize(PORT_W, PORT_H, { fit: "cover", position: "attention" });
    const portBuf = await encodeWebpUnderBudget(sharp, portPipe, 310_000);
    fs.writeFileSync(path.join(EXT_DIR, `${extId}.webp`), portBuf);

    const extThumb = await sharp(portBuf)
      .resize(180, 320, { fit: "cover", position: "centre" })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    fs.writeFileSync(path.join(EXT_TH, `${extId}.webp`), extThumb);

    c.siteId = siteId;
    c.extId = extId;
    c.landscapePath = `assets/wallpapers/${siteId}.webp`;
    c.portraitPath = `assets/extbg/${extId}.webp`;
    c.thumbnailPath = `assets/wallpapers/thumbs/${siteId}.webp`;
    console.log("ok");
    await sleep(100);
  }

  pruneStale(SITE_DIR, "v2_", keepSite);
  pruneStale(SITE_TH, "v2_", keepSite);
  pruneStale(EXT_DIR, "extv3_", keepExt);
  pruneStale(EXT_TH, "extv3_", keepExt);
}

function pruneStale(dir, prefix, keep) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith(prefix) || !name.endsWith(".webp")) continue;
    if (!keep.has(name)) fs.unlinkSync(path.join(dir, name));
  }
}

function writeCatalog(final100) {
  const entries = final100.map((c, i) => {
    const tier = i < 10 ? "free" : "premium";
    return {
      name: nameFromPhoto(c, c.category) + (i > 0 ? "" : ""),
      category: c.category,
      pexelsId: c.pexelsId,
      photographer: c.photographer,
      tier,
      overlay: 0.28,
      score: Math.round(c.score.total),
    };
  });

  // Deduplicate names
  const seen = new Map();
  for (const e of entries) {
    const base = e.name;
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    if (n > 1) e.name = `${base} ${n}`;
  }

  const catalogSrc = `/** 100 licensed Pexels wallpapers — curated for GMXReply. */
export const WALLPAPER_PACK_COUNT = 100;

export const WALLPAPER_CATEGORIES = Object.freeze(${JSON.stringify(WALLPAPER_CATEGORIES, null, 2)});

/** @type {{ name: string, category: string, pexelsId: number, photographer: string, tier: string, overlay: number, score: number }[]} */
export const CURATED_WALLPAPERS = ${JSON.stringify(entries, null, 2)};

export const PACK_NAMES = CURATED_WALLPAPERS.map((w) => w.name);
export const PACK_CATEGORIES = CURATED_WALLPAPERS.map((w) => w.category);

if (CURATED_WALLPAPERS.length !== WALLPAPER_PACK_COUNT) {
  throw new Error("wallpaper catalog must have 100 entries");
}
`;
  fs.writeFileSync(path.join(ROOT, "tools", "lib", "wallpaper-curated-catalog.mjs"), catalogSrc, "utf8");

  const coreSrc = fs.readFileSync(path.join(ROOT, "tools", "lib", "wallpaper-core.mjs"), "utf8");
  fs.writeFileSync(
    path.join(ROOT, "tools", "lib", "wallpaper-core.mjs"),
    coreSrc.replace(/export const WALLPAPER_PACK_COUNT = \d+;/, "export const WALLPAPER_PACK_COUNT = 100;"),
    "utf8"
  );
}

function writeSourcesManifest(final100) {
  const today = new Date().toISOString().slice(0, 10);
  const items = final100.map((c, i) => ({
    id: c.siteId,
    extId: c.extId,
    category: c.category,
    name: nameFromPhoto(c, c.category),
    provider: "Pexels",
    pexelsId: c.pexelsId,
    photographer: c.photographer,
    photographerUrl: c.photographerUrl,
    pageUrl: c.pageUrl,
    originalDimensions: { width: c.width, height: c.height },
    downloadDate: today,
    license: "Pexels License (free to use)",
    licenseUrl: "https://www.pexels.com/license/",
    landscapePath: c.landscapePath,
    portraitPath: c.portraitPath,
    thumbnailPath: c.thumbnailPath,
    visualScore: c.score.total,
    accessTier: i < 10 ? "free" : "premium",
    attributionRequired: false,
  }));
  fs.writeFileSync(path.join(ROOT, "wallpaper-sources.json"), `${JSON.stringify({ version: 1, count: 100, items }, null, 2)}\n`, "utf8");
}

async function buildContactSheets(sharp, final100) {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  await sheet(sharp, final100, "landscape", SITE_DIR, 5, 20);
  await sheet(sharp, final100, "portrait", EXT_DIR, 4, 25);
}

async function sheet(sharp, items, kind, dir, cols, thumbW) {
  const thumbH = kind === "portrait" ? Math.round(thumbW * 16 / 9) : Math.round(thumbW * 9 / 16);
  const rows = Math.ceil(items.length / cols);
  const pad = 8;
  const labelH = 28;
  const W = cols * (thumbW + pad) + pad;
  const H = rows * (thumbH + labelH + pad) + pad;
  const composites = [];
  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    const id = kind === "landscape" ? c.siteId : c.extId;
    const file = path.join(dir, `${id}.webp`);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (thumbW + pad);
    const y = pad + row * (thumbH + labelH + pad);
    composites.push({ input: file, top: y, left: x });
  }
  const base = sharp({
    create: { width: W, height: H, channels: 3, background: { r: 12, g: 14, b: 20 } },
  });
  for (const c of composites) {
    const resized = await sharp(c.input).resize(thumbW, thumbH, { fit: "cover" }).toBuffer();
    c.input = resized;
  }
  const out = path.join(REVIEW_DIR, `contact-${kind}-all.jpg`);
  await base.composite(composites).jpeg({ quality: 88 }).toFile(out);
  console.log(`contact sheet: ${path.relative(ROOT, out)}`);
}

function bumpAssetRev() {
  const rev = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "w";
  for (const rel of ["public/app.js", "site-src/00-bootstrap.js", "extension/lib/ext-config.js", "public/app.html"]) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, "utf8");
    if (rel.endsWith("app.html")) {
      src = src.replace(/<meta name="gmx-asset-rev" content="[^"]*"\/>/g, `<meta name="gmx-asset-rev" content="${rev}"/>`);
    } else if (rel.includes("ext-config")) {
      src = src.replace(/ASSET_REV: "[^"]+"/, `ASSET_REV: "${rev}"`);
    } else {
      src = src.replace(/const ASSET_REV = "[^"]+";/, `const ASSET_REV = "${rev}";`);
    }
    fs.writeFileSync(file, src, "utf8");
  }
}

async function main() {
  const keyArg = process.argv.find((a) => a.startsWith("--setup-key="));
  if (keyArg) {
    ensurePexelsKey(keyArg.slice("--setup-key=".length));
    console.log("PEXELS_API_KEY configured in .env");
    return;
  }
  if (process.argv.includes("--cleanup-key")) {
    removePexelsKey();
    console.log("PEXELS_API_KEY removed from .env");
    return;
  }

  loadEnv();
  if (!process.env.PEXELS_API_KEY) throw new Error("PEXELS_API_KEY missing — run with --setup-key=...");

  const sharp = (await import("sharp")).default;
  fs.mkdirSync(REVIEW_DIR, { recursive: true });

  let candidates;
  let apiFailures = 0;
  let queriesRun = 0;
  if (process.argv.includes("--from-cache") && fs.existsSync(CANDIDATE_CACHE)) {
    const cached = JSON.parse(fs.readFileSync(CANDIDATE_CACHE, "utf8"));
    candidates = cached.candidates || cached;
    queriesRun = cached.queriesRun || 0;
    apiFailures = cached.apiFailures || 0;
    console.log(`Loaded ${candidates.length} candidates from cache`);
  } else {
    const discovered = await discoverCandidates(sharp);
    candidates = discovered.candidates;
    apiFailures = discovered.apiFailures;
    queriesRun = discovered.queriesRun;
  }

  if (process.argv.includes("--reselect")) {
    const scored = candidates.filter((c) => c.status === "eligible" && c.score && c.analysis);
    if (scored.length < 100) throw new Error(`Reselect needs scored candidates (have ${scored.length})`);
    scored.sort((a, b) => b.score.total - a.score.total);
    console.log(`Reselecting from ${scored.length} eligible candidates`);
    let final100 = selectFinal(scored);
    if (final100.length < 100) throw new Error(`Only selected ${final100.length}/100`);
    console.log(`\nSelected ${final100.length} wallpapers`);
    await buildAssets(sharp, final100);
    writeCatalog(final100);
    writeSourcesManifest(final100);
    await buildContactSheets(sharp, final100);
    bumpAssetRev();
    const stats = {
      queriesRun,
      apiFailures,
      reviewed: candidates.length,
      rejected: candidates.filter((c) => c.status === "rejected").length,
      selected: final100.length,
      scoreMin: Math.min(...final100.map((c) => c.score.total)),
      scoreAvg: final100.reduce((a, c) => a + c.score.total, 0) / final100.length,
      scoreMax: Math.max(...final100.map((c) => c.score.total)),
    };
    fs.writeFileSync(path.join(REVIEW_DIR, "campaign-stats.json"), JSON.stringify(stats, null, 2));
    console.log("\nReselect complete:", JSON.stringify(stats));
    return;
  }

  if (candidates.length < 500) {
    console.warn(`Warning: only ${candidates.length} candidates (target 500+)`);
  }

  const scoringPool = prepCandidatesForScoring(candidates);
  const { scored, rejected } = await scoreCandidates(sharp, scoringPool);
  fs.writeFileSync(CANDIDATE_CACHE, JSON.stringify({ candidates, scoringPool: scoringPool.length, scored: scored.length, rejected, queriesRun, apiFailures }, null, 2));

  let final100 = selectFinal(scored);
  if (final100.length < 100) {
    throw new Error(`Only selected ${final100.length}/100 — need more searches`);
  }

  console.log(`\nSelected ${final100.length} wallpapers`);
  await buildAssets(sharp, final100);
  writeCatalog(final100);
  writeSourcesManifest(final100);
  await buildContactSheets(sharp, final100);
  bumpAssetRev();

  const stats = {
    queriesRun,
    apiFailures,
    reviewed: candidates.length,
    rejected,
    selected: final100.length,
    scoreMin: Math.min(...final100.map((c) => c.score.total)),
    scoreAvg: final100.reduce((a, c) => a + c.score.total, 0) / final100.length,
    scoreMax: Math.max(...final100.map((c) => c.score.total)),
  };
  fs.writeFileSync(path.join(REVIEW_DIR, "campaign-stats.json"), JSON.stringify(stats, null, 2));
  console.log("\nCampaign complete:", JSON.stringify(stats));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
