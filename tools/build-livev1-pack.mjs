#!/usr/bin/env node
/**
 * Build livev1 site wallpapers + liveext_v1 extension skins from internet-wallpaper-hunt.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HUNT = path.join(ROOT, "tools", ".wallpaper-review", "internet-wallpaper-hunt");
const HUNT_META = path.join(HUNT, "metadata");
const HUNT_IMG = path.join(HUNT, "images");
const CANDIDATES_JSON = path.join(ROOT, "tools", ".wallpaper-review", "candidates.json");
const CONTACT_DIR = path.join(ROOT, "tools", ".wallpaper-review", "live-wallpaper-pack");

const SITE_PACK = "livev1";
const EXT_PACK = "liveext_v1";
const SITE_COUNT = 100;
const EXT_COUNT = 60;
const SITE_W = 1920;
const SITE_H = 1080;
const EXT_W = 900;
const EXT_H = 1600;
const FULL_Q = 82;
const THUMB_Q = 78;
const MAX_SITE = 700_000;
const MAX_EXT = 430_000;

const JUNK = /\b(watermark|midjourney|stable diffusion|dall-?e|clipart|stick figure|coloring book|screenshot)\b/i;

const SITE_CAT_POOL = {
  "dark-premium": ["neon-city", "night-skyline", "futuristic-architecture", "geometric-dark"],
  "fantasy-space": ["fantasy", "space", "moon-planets", "northern-lights"],
  "mecha-scifi": ["mecha", "sci-fi", "futuristic-architecture"],
  "anime-manga": ["anime-inspired", "neon-city"],
  "crypto-web3": ["sci-fi", "abstract-glass", "geometric-dark"],
};

const EXT_CAT_POOL = {
  "dark-premium": "cyber-neon",
  "fantasy-space": "fantasy",
  "mecha-scifi": "space",
  "anime-manga": "cyber-neon",
  "crypto-web3": "abstract",
};

const BORING = /\b(mountain|forest|moon scene|minimal scene|lake|meadow|pasture|countryside)\b/i;

function pad3(n) {
  return String(n).padStart(3, "0");
}

function siteFile(n) {
  return `${SITE_PACK}_${pad3(n)}.webp`;
}
function extFile(n) {
  return `${EXT_PACK}_${pad3(n)}.webp`;
}

function loadHunt() {
  return fs
    .readdirSync(HUNT_META)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(HUNT_META, f), "utf8")));
}

function loadPexelsPortraitPool() {
  if (!fs.existsSync(CANDIDATES_JSON)) return [];
  const raw = JSON.parse(fs.readFileSync(CANDIDATES_JSON, "utf8"));
  const list = raw.candidates || raw;
  return list
    .filter((c) => {
      if (c.status !== "eligible" && c.status !== "pending") return false;
      if ((c.score?.total || 0) < 24 && c.status !== "eligible") return false;
      const ar = (c.width || 1) / (c.height || 1);
      return ar <= 0.85 || ar >= 1.2;
    })
    .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0))
    .slice(0, 250)
    .map((c) => ({
      id: `pxc-portrait-${c.pexelsId}`,
      title: c.alt || c.query || "Pexels portrait",
      category: c.category?.includes("crypto")
        ? "crypto-web3"
        : c.category?.includes("anime")
          ? "anime-manga"
          : "dark-premium",
      url: c.originalUrl || c.mediumUrl,
      thumbnail: c.mediumUrl || c.originalUrl,
      sourceUrl: c.pageUrl,
      creator: c.photographer,
      license: "pexels",
      sourceName: "pexels",
      width: c.width,
      height: c.height,
      surface: "extension",
      copyrightRisk: "low",
      qualityScore: Math.min(5, 3 + (c.score?.total || 0) / 20),
      pexelsId: c.pexelsId,
      localPreview: "",
    }));
}

function eligible(c) {
  if (c.copyrightRisk === "high" || c.copyrightRisk === "unknown") return false;
  if (c.category === "marvel-superhero") return false;
  if ((c.qualityScore || 0) < 3) return false;
  if (JUNK.test(c.title || "")) return false;
  return true;
}

function scoreSite(c) {
  let s = c.qualityScore || 3;
  if (c.localPreview) s += 0.4;
  if (c.copyrightRisk === "low") s += 0.3;
  const ar = (c.width || 1) / Math.max(c.height || 1, 1);
  if (ar >= 1.35 && ar <= 2.2) s += 0.5;
  if (c.surface === "site") s += 0.2;
  if (BORING.test(c.title || "")) s -= 1.5;
  if (["dark-premium", "mecha-scifi", "crypto-web3", "anime-manga", "fantasy-space"].includes(c.category)) s += 0.6;
  return s;
}

function scoreExt(c, portrait = false) {
  let s = c.qualityScore || 3;
  if (c.localPreview) s += 0.3;
  if (c.copyrightRisk === "low") s += 0.3;
  const ar = (c.width || 1) / Math.max(c.height || 1, 1);
  if (portrait && ar <= 0.7) s += 0.8;
  if (!portrait && ar >= 1.2) s += 0.4;
  if (["dark-premium", "mecha-scifi", "crypto-web3", "anime-manga"].includes(c.category)) s += 0.5;
  if (BORING.test(c.title || "")) s -= 1;
  return s;
}

function pickSiteCategory(c, catCounts) {
  const pool = SITE_CAT_POOL[c.category] || ["sci-fi", "abstract-glass"];
  for (const cat of pool) {
    if ((catCounts[cat] || 0) < 15) {
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      return cat;
    }
  }
  for (const cat of ["sci-fi", "neon-city", "fantasy", "abstract-glass", "geometric-dark"]) {
    if ((catCounts[cat] || 0) < 15) {
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      return cat;
    }
  }
  return "sci-fi";
}

function pickExtCategory(c) {
  return EXT_CAT_POOL[c.category] || "abstract";
}

function localImagePath(c) {
  if (c.localPreview) {
    const p = path.join(HUNT, c.localPreview);
    if (fs.existsSync(p)) return p;
  }
  return "";
}

async function downloadBuffer(url, referer = "") {
  const headers = { "User-Agent": "GMXReply-LiveV1/1.0 (+https://www.gmxreply.com)" };
  if (referer) headers.Referer = referer;
  const r = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 1000) throw new Error("too small");
  return buf;
}

async function getImageBuffer(c) {
  const local = localImagePath(c);
  if (local) return fs.readFileSync(local);
  const referer =
    c.sourceName === "wikimedia"
      ? "https://commons.wikimedia.org/"
      : c.sourceName === "pexels"
        ? "https://www.pexels.com/"
        : c.sourceUrl || "";
  for (const u of [...new Set([c.url, c.thumbnail].filter(Boolean))]) {
    try {
      return await downloadBuffer(u, referer);
    } catch {
      /* next */
    }
  }
  throw new Error(`download failed ${c.id}`);
}

async function encodeWebp(sharp, input, w, h, q, maxBytes, fit = "cover", position = "centre") {
  let quality = q;
  for (let pass = 0; pass < 5; pass++) {
    const buf = await sharp(input)
      .rotate()
      .resize(w, h, { fit, position, withoutEnlargement: false })
      .webp({ quality })
      .toBuffer();
    if (buf.length <= maxBytes || quality <= 64) return buf;
    quality -= 5;
  }
  return sharp(input).rotate().resize(w, h, { fit, position }).webp({ quality: 64 }).toBuffer();
}

async function writeThumb(sharp, input, dest, w, h) {
  for (let q = 72; q >= 40; q -= 4) {
    for (const scale of [1, 0.85, 0.7]) {
      const buf = await sharp(input)
        .resize(Math.round(w * scale), Math.round(h * scale), { fit: "cover" })
        .webp({ quality: q })
        .toBuffer();
      if (buf.length <= 45000) {
        fs.writeFileSync(dest, buf);
        return;
      }
    }
  }
  fs.writeFileSync(dest, await sharp(input).resize(280, 158, { fit: "cover" }).webp({ quality: 40 }).toBuffer());
}

function licenseLabel(c) {
  if (c.license === "pexels") return "Pexels License (free to use)";
  if (c.license === "cc0") return "CC0 1.0 Public Domain";
  if (c.license === "by") return "CC BY — attribution required";
  if (c.license === "by-sa") return "CC BY-SA — attribution + share-alike";
  return String(c.license || "unknown");
}

function providerName(c) {
  if (c.sourceName === "pexels") return "Pexels";
  if (c.sourceName === "wikimedia") return "Wikimedia Commons";
  return "Openverse";
}

function manifestExtras(c) {
  return {
    sourceUrl: c.sourceUrl,
    sourceName: c.sourceName,
    author: c.creator || "Unknown",
    license: licenseLabel(c),
    licenseUrl:
      c.license === "pexels"
        ? "https://www.pexels.com/license/"
        : c.sourceName === "wikimedia"
          ? c.sourceUrl
          : "",
    copyrightRisk: c.copyrightRisk,
    huntCategory: c.categoryLabel || c.category,
    candidateId: c.id,
    ...(c.pexelsId ? { pexelsId: c.pexelsId } : {}),
    ...(c.license === "by" || c.license === "by-sa" ? { attributionRequired: true } : { attributionRequired: false }),
  };
}

function ensureDiversityCategories(catCounts) {
  const required = ["anime-inspired", "comic-inspired", "superhero-inspired", "mecha", "fantasy", "sci-fi"];
  const missing = required.filter((id) => !catCounts[id]);
  return missing;
}

async function main() {
  const sharp = (await import("sharp")).default;
  const hunt = loadHunt().filter(eligible);
  const portraitPool = loadPexelsPortraitPool().filter(eligible);

  const siteDir = path.join(ROOT, "assets", "wallpapers");
  const siteThumbDir = path.join(siteDir, "thumbs");
  const extDir = path.join(ROOT, "assets", "extskins");
  const extThumbDir = path.join(extDir, "thumbs");
  const extPkgDir = path.join(ROOT, "extension", "extskins");
  const extPkgThumbDir = path.join(extPkgDir, "thumbs");
  for (const d of [siteDir, siteThumbDir, extDir, extThumbDir, extPkgDir, extPkgThumbDir, CONTACT_DIR]) {
    fs.mkdirSync(d, { recursive: true });
  }

  const siteSorted = [...hunt].sort((a, b) => scoreSite(b) - scoreSite(a));
  const usedKeys = new Set();
  const sitePicks = [];
  const catCounts = {};

  for (const c of siteSorted) {
    if (sitePicks.length >= SITE_COUNT) break;
    const key = c.sourceUrl || c.id;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    sitePicks.push({ ...c, packCategory: pickSiteCategory(c, catCounts) });
  }

  const missingCats = ensureDiversityCategories(catCounts);
  for (const catId of missingCats) {
    const donor = sitePicks.find((p) => (catCounts[p.packCategory] || 0) > 1);
    if (donor) {
      catCounts[donor.packCategory]--;
      donor.packCategory = catId;
      catCounts[catId] = (catCounts[catId] || 0) + 1;
    } else {
      catCounts[catId] = 1;
    }
  }

  const siteIds = new Set(sitePicks.map((p) => p.id));
  const extPool = [...hunt.filter((c) => !siteIds.has(c.id)), ...portraitPool];

  const extPortrait = extPool
    .filter((c) => c.surface === "extension" || c.surface === "both")
    .sort((a, b) => scoreExt(b, true) - scoreExt(a, true));

  const extCrop = extPool.sort((a, b) => scoreExt(b, false) - scoreExt(a, false));

  const extPicks = [];
  const sitePexels = new Set(sitePicks.map((p) => p.pexelsId).filter(Boolean));
  const extUsedIds = new Set();

  function takeExt(c, mode, extra = {}) {
    const key = c.id || c.sourceUrl;
    if (extUsedIds.has(key)) return false;
    if (c.pexelsId && sitePexels.has(c.pexelsId)) return false;
    extUsedIds.add(key);
    extPicks.push({ ...c, mode, extCategory: pickExtCategory(c), ...extra });
    return true;
  }

  for (const c of extPortrait) {
    if (extPicks.length >= EXT_COUNT) break;
    takeExt(c, "portrait");
  }

  let cropPos = 0;
  const positions = ["centre", "top", "entropy", "attention", "right", "left", "bottom"];
  for (const c of extCrop) {
    if (extPicks.length >= EXT_COUNT) break;
    takeExt(c, "crop", { cropPosition: positions[cropPos++ % positions.length] });
  }

  // Additional portrait crops from candidates pool (landscape → 9:16)
  const morePortrait = loadPexelsPortraitPool().filter((c) => !extUsedIds.has(c.id));
  for (const c of morePortrait) {
    if (extPicks.length >= EXT_COUNT) break;
    takeExt(c, c.width / c.height <= 0.85 ? "portrait" : "crop", {
      cropPosition: positions[cropPos++ % positions.length],
    });
  }

  if (sitePicks.length < SITE_COUNT || extPicks.length < EXT_COUNT) {
    throw new Error(`Not enough picks: site ${sitePicks.length}/100 ext ${extPicks.length}/60`);
  }

  console.log(`Building ${sitePicks.length} site + ${extPicks.length} ext…`);

  const siteManifestItems = [];
  const extManifestItems = [];
  const siteContact = [];
  const extContact = [];
  const landHashes = new Set();

  const seenFallback = new Set(sitePicks.map((p) => p.id));

  for (let i = 0; i < SITE_COUNT; i++) {
    const n = i + 1;
    let c = sitePicks[i];
    let buf;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        buf = await getImageBuffer(c);
        if (!buf?.length || buf.length < 2000) throw new Error("bad buffer");
        await sharp(buf).metadata();
        break;
      } catch (e) {
        const fallback = siteSorted.find((x) => !seenFallback.has(x.id) && scoreSite(x) >= 3);
        if (!fallback) throw e;
        console.warn(`  site ${n}: retry with ${fallback.id}`);
        seenFallback.add(fallback.id);
        c = { ...fallback, packCategory: c.packCategory };
        sitePicks[i] = c;
      }
    }
    let webp = await encodeWebp(sharp, buf, SITE_W, SITE_H, FULL_Q, MAX_SITE);
    let hash = crypto.createHash("sha256").update(webp).digest("hex");
    let tries = 0;
    while (landHashes.has(hash) && tries < 4) {
      const pos = ["centre", "entropy", "attention", "right"][tries];
      webp = await encodeWebp(sharp, buf, SITE_W, SITE_H, FULL_Q - tries * 3, MAX_SITE, "cover", pos);
      hash = crypto.createHash("sha256").update(webp).digest("hex");
      tries++;
    }
    landHashes.add(hash);
    const landPath = path.join(siteDir, siteFile(n));
    const thumbPath = path.join(siteThumbDir, siteFile(n));
    fs.writeFileSync(landPath, webp);
    await writeThumb(sharp, webp, thumbPath, 640, 360);

    const item = {
      id: `v2_${pad3(n)}`,
      category: c.packCategory,
      name: c.title.slice(0, 60) || `Live Wallpaper ${n}`,
      provider: providerName(c),
      photographer: c.creator || "Unknown",
      landscapePath: `assets/wallpapers/${siteFile(n)}`,
      thumbnailPath: `assets/wallpapers/thumbs/${siteFile(n)}`,
      accessTier: n <= 8 ? "free" : "premium",
      pageUrl: c.sourceUrl,
      ...manifestExtras(c),
    };
    siteManifestItems.push(item);
    siteContact.push({ slot: n, ...item, preview: `../../assets/wallpapers/thumbs/${siteFile(n)}` });
    if (n % 10 === 0) console.log(`  site ${n}/${SITE_COUNT}`);
  }

  const extHashes = new Set();
  const seenExtFallback = new Set(extPicks.map((p) => p.id));
  for (let i = 0; i < EXT_COUNT; i++) {
    const n = i + 1;
    let c = extPicks[i];
    let buf;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        buf = await getImageBuffer(c);
        if (!buf?.length || buf.length < 2000) throw new Error("bad buffer");
        await sharp(buf).metadata();
        break;
      } catch (e) {
        const fallback = extPool.find(
          (x) => !seenExtFallback.has(x.id) && !(x.pexelsId && sitePexels.has(x.pexelsId)) && scoreExt(x) >= 3,
        );
        if (!fallback) throw e;
        console.warn(`  ext ${n}: retry with ${fallback.id}`);
        seenExtFallback.add(fallback.id);
        c = { ...fallback, mode: "crop", extCategory: pickExtCategory(fallback), cropPosition: "entropy" };
        extPicks[i] = c;
      }
    }
    const pos = c.mode === "crop" ? c.cropPosition || "centre" : "centre";
    let webp = await encodeWebp(sharp, buf, EXT_W, EXT_H, FULL_Q, MAX_EXT, "cover", pos);
    let hash = crypto.createHash("sha256").update(webp).digest("hex");
    if (extHashes.has(hash)) {
      webp = await encodeWebp(sharp, buf, EXT_W, EXT_H, FULL_Q - 8, MAX_EXT, "cover", "entropy");
      hash = crypto.createHash("sha256").update(webp).digest("hex");
    }
    extHashes.add(hash);

    const fullPath = path.join(extDir, extFile(n));
    const thumbPath = path.join(extThumbDir, extFile(n));
    const pkgPath = path.join(extPkgDir, extFile(n));
    const pkgThumb = path.join(extPkgThumbDir, extFile(n));
    fs.writeFileSync(fullPath, webp);
    fs.copyFileSync(fullPath, pkgPath);
    await writeThumb(sharp, webp, thumbPath, 360, 640);
    fs.copyFileSync(thumbPath, pkgThumb);

    const item = {
      id: `extskin_${pad3(n)}`,
      category: c.extCategory,
      name: c.title.slice(0, 60) || `Extension Skin ${n}`,
      provider: providerName(c),
      photographer: c.creator || "Unknown",
      portraitPath: `assets/extskins/${extFile(n)}`,
      thumbnailPath: `assets/extskins/thumbs/${extFile(n)}`,
      accessTier: n <= 6 ? "free" : "premium",
      pageUrl: c.sourceUrl,
      ...manifestExtras(c),
    };
    extManifestItems.push(item);
    extContact.push({ slot: n, ...item, preview: `../../assets/extskins/thumbs/${extFile(n)}` });
    if (n % 10 === 0) console.log(`  ext ${n}/${EXT_COUNT}`);
  }

  fs.writeFileSync(
    path.join(ROOT, "site-wallpaper-sources.json"),
    JSON.stringify({ version: 5, assetPack: SITE_PACK, count: SITE_COUNT, items: siteManifestItems }, null, 2),
  );
  fs.writeFileSync(
    path.join(ROOT, "extension-skin-sources.json"),
    JSON.stringify({ version: 5, assetPack: EXT_PACK, count: EXT_COUNT, items: extManifestItems }, null, 2),
  );

  updateCatalog(siteManifestItems, extManifestItems);
  writeContactSheet("site-contact.html", "Live V1 Site Wallpapers", siteContact);
  writeContactSheet("ext-contact.html", "Live Ext V1 Extension Skins", extContact);

  const risk = { low: 0, medium: 0, high: 0 };
  for (const x of [...siteManifestItems, ...extManifestItems]) risk[x.copyrightRisk] = (risk[x.copyrightRisk] || 0) + 1;

  const report = {
    site: SITE_COUNT,
    ext: EXT_COUNT,
    risk,
    sitePack: SITE_PACK,
    extPack: EXT_PACK,
  };
  fs.writeFileSync(path.join(CONTACT_DIR, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

function updateCatalog(siteItems, extItems) {
  const catPath = path.join(ROOT, "tools", "lib", "wallpaper-curated-catalog.mjs");
  let src = fs.readFileSync(catPath, "utf8");
  const wallpapers = siteItems.map((item, i) => ({
    name: item.name,
    category: item.category,
    pexelsId: item.pexelsId || 0,
    photographer: item.photographer,
    tier: item.accessTier,
    overlay: 0.28,
    score: 40 - (i % 10),
  }));
  src = src.replace(
    /export const CURATED_WALLPAPERS = \[[\s\S]*?\n\];/,
    `export const CURATED_WALLPAPERS = ${JSON.stringify(wallpapers, null, 2)};`,
  );
  fs.writeFileSync(catPath, src);

  const extPath = path.join(ROOT, "tools", "lib", "extension-skin-catalog.mjs");
  let extSrc = fs.readFileSync(extPath, "utf8");
  const skins = extItems.map((item, i) => ({
    name: item.name,
    category: item.category,
    unsplashId: item.pexelsId ? String(item.pexelsId) : `liveext-${i + 1}`,
    photographer: item.photographer,
    tier: item.accessTier,
    overlay: 0.28,
    score: 38 - (i % 8),
  }));
  extSrc = extSrc.replace(
    /export const CURATED_EXT_SKINS = \[[\s\S]*?\n\];/,
    `export const CURATED_EXT_SKINS = ${JSON.stringify(skins, null, 2)};`,
  );
  fs.writeFileSync(extPath, extSrc);
}

function writeContactSheet(file, title, items) {
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const cards = items
    .map(
      (it) => `
    <article class="card">
      <img src="${esc(it.preview)}" alt="" loading="lazy">
      <div class="meta">
        <b>${esc(it.id)}</b> · ${esc(it.category)} · risk ${esc(it.copyrightRisk)}<br>
        ${esc(it.name)}<br>
        <a href="${esc(it.sourceUrl)}" target="_blank">${esc(it.sourceName)}</a>
      </div>
    </article>`,
    )
    .join("");
  fs.writeFileSync(
    path.join(CONTACT_DIR, file),
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:system-ui;background:#0a0d15;color:#e8ecf4;padding:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.card{background:#12182a;border:1px solid #2a3548;border-radius:8px;overflow:hidden}
.card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.meta{padding:8px;font-size:12px}a{color:#6ec1ff}</style></head>
<body><h1>${esc(title)}</h1><p>${items.length} items · ${SITE_PACK} / ${EXT_PACK}</p>
<div class="grid">${cards}</div></body></html>`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
