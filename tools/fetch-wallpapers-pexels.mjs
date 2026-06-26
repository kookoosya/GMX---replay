#!/usr/bin/env node
/**
 * Download 100 premium wallpapers from Unsplash / Pexels (free license).
 * Crypto · anime cyber · comic/hero · neon urban · cinematic.
 *
 * Run: npm run wallpapers:fetch
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  WALLPAPER_PACK_COUNT,
  WALLPAPER_CATALOG,
  PEXELS_IDS,
} from "./lib/wallpaper-pexels-catalog.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_FULL = path.join(ROOT, "assets", "wallpapers");
const SITE_THUMB = path.join(ROOT, "assets", "wallpapers", "thumbs");
const EXT_FULL = path.join(ROOT, "assets", "extbg");
const EXT_THUMB = path.join(ROOT, "assets", "extbg", "thumbs");
const CREDITS = path.join(ROOT, "docs", "WALLPAPER_CREDITS.md");

const SITE_COUNT = WALLPAPER_PACK_COUNT;
const EXT_COUNT = WALLPAPER_PACK_COUNT;
const FULL_Q = 90;
const THUMB_Q = 84;
const SITE_MAX_W = 3840;
const SITE_MAX_H = 2160;
const EXT_W = 1440;
const EXT_H = 2560;

function extPackId(slot) {
  return `extv3_${String(slot).padStart(3, "0")}`;
}

function sourceUrl(entry, w, h) {
  const source = entry?.source || (entry?.photoId ? "unsplash" : "pexels");
  if (source === "unsplash") {
    const id = entry.photoId || entry.pexelsId;
    const q = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: "90" });
    if (h) q.set("h", String(h));
    return `https://images.unsplash.com/photo-${id}?${q}`;
  }
  const id = entry?.pexelsId ?? entry?.photoId;
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
  const q = new URLSearchParams({ auto: "compress", cs: "tinysrgb", w: String(w), dpr: "1" });
  if (h) q.set("h", String(h));
  return `${base}?${q}`;
}

function creditUrl(entry) {
  if (entry?.source === "unsplash" || entry?.photoId) {
    return `https://unsplash.com/photos/${entry.photoId}`;
  }
  return `https://www.pexels.com/photo/${entry?.pexelsId}/`;
}

async function downloadBuffer(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GMXReply-Wallpaper-Fetch/1.0 (+https://www.gmxreply.com)" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
}

function pruneStale(dir, prefix, keepIds) {
  if (!fs.existsSync(dir)) return;
  const keep = new Set(keepIds.map((id) => `${id}.webp`));
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith(prefix) || !name.endsWith(".webp")) continue;
    if (!keep.has(name)) {
      fs.unlinkSync(path.join(dir, name));
      console.log(`  pruned stale ${name}`);
    }
  }
}

async function main() {
  const sharp = (await import("sharp")).default;
  const onlyArg = process.argv.find((a) => a.startsWith("--slots="));
  const onlySlots = onlyArg
    ? onlyArg
        .slice("--slots=".length)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => n >= 1 && n <= SITE_COUNT)
    : null;

  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const siteIds = [];
  const extIds = [];
  for (let i = 0; i < SITE_COUNT; i++) {
    siteIds.push(`v2_${String(i + 1).padStart(3, "0")}`);
    extIds.push(extPackId(i + 1));
  }
  if (!onlySlots) {
    pruneStale(SITE_FULL, "v2_", siteIds);
    pruneStale(SITE_THUMB, "v2_", siteIds);
    pruneStale(EXT_FULL, "extv3_", extIds);
    pruneStale(EXT_THUMB, "extv3_", extIds);
  }

  const credits = [
    "# Wallpaper credits",
    "",
    "Sources: [Unsplash](https://unsplash.com/license) · [Pexels](https://www.pexels.com/license/) — free to use.",
    `Packs: ${SITE_COUNT} site + ${EXT_COUNT} extension (premium curated).`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
  ];

  let failed = 0;
  for (let i = 0; i < SITE_COUNT; i++) {
    const slot = i + 1;
    if (onlySlots && !onlySlots.includes(slot)) continue;
    const entry = WALLPAPER_CATALOG[i];
    const srcLabel = entry?.photoId || entry?.pexelsId || PEXELS_IDS[i] || PEXELS_IDS[i % PEXELS_IDS.length];
    const siteId = siteIds[i];
    const extId = extIds[i];

    try {
      process.stdout.write(`site ${siteId} (${entry?.name || "pack"} / ${entry?.source || "src"} ${srcLabel})… `);
      const buf = await downloadBuffer(sourceUrl(entry, SITE_MAX_W));
      await sharp(buf)
        .rotate()
        .resize(SITE_MAX_W, SITE_MAX_H, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: FULL_Q })
        .toFile(path.join(SITE_FULL, `${siteId}.webp`));
      await sharp(buf)
        .rotate()
        .resize(480, 270, { fit: "cover", position: "centre" })
        .webp({ quality: THUMB_Q })
        .toFile(path.join(SITE_THUMB, `${siteId}.webp`));
      console.log("ok");

      process.stdout.write(`ext ${extId}… `);
      const bufV = await downloadBuffer(sourceUrl(entry, EXT_W, EXT_H));
      await sharp(bufV)
        .rotate()
        .resize(EXT_W, EXT_H, { fit: "cover", position: "centre" })
        .webp({ quality: FULL_Q })
        .toFile(path.join(EXT_FULL, `${extId}.webp`));
      await sharp(bufV)
        .resize(360, 640, { fit: "cover" })
        .webp({ quality: THUMB_Q })
        .toFile(path.join(EXT_THUMB, `${extId}.webp`));
      console.log("ok");

      credits.push(
        `- ${siteId} / ${extId} (${entry?.tag || "pack"} · ${entry?.name || slot}): ${creditUrl(entry)}`
      );
    } catch (e) {
      failed++;
      console.log(`FAIL (${e.message || e})`);
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  fs.writeFileSync(CREDITS, `${credits.join("\n")}\n`, "utf8");
  if (failed) {
    console.error(`\n${failed} pack(s) failed. Re-run or swap IDs in wallpaper-pexels-catalog.mjs`);
    process.exit(1);
  }
  console.log(`\nDone. ${SITE_COUNT} site + ${EXT_COUNT} extension wallpapers. Credits: docs/WALLPAPER_CREDITS.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
