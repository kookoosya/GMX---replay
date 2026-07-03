/** Restore licensed wallpaper pack slices from git-extracted 100-pack source. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_SOURCE = path.join(
  process.env.TEMP || "/tmp",
  "gmx-wallpaper-100-extract"
);
const HISTORY_SHA = "234d50c";

export function defaultSourceDir() {
  return process.env.WALLPAPER_CANARY_SOURCE || DEFAULT_SOURCE;
}

export async function loadHistoryCatalog(sourceDir = defaultSourceDir()) {
  const catalogPath = path.join(sourceDir, "tools", "lib", "wallpaper-curated-catalog.mjs");
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`missing history catalog: ${catalogPath}`);
  }
  return import(pathToFileURL(catalogPath).href);
}

export function readHistoryManifest(sourceDir = defaultSourceDir()) {
  const manifestPath = path.join(sourceDir, "wallpaper-sources.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`missing history manifest: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

export function verifyHistoryPack(sourceDir = defaultSourceDir()) {
  const counts = {
    catalog: 0,
    landscape: 0,
    portrait: 0,
    thumbnails: 0,
    sourceRecords: 0,
    categories: 0,
  };

  return loadHistoryCatalog(sourceDir).then((mod) => {
    counts.catalog = mod.WALLPAPER_PACK_COUNT;
    counts.categories = mod.WALLPAPER_CATEGORIES.length;
    counts.landscape = fs
      .readdirSync(path.join(sourceDir, "assets", "wallpapers"))
      .filter((f) => f.endsWith(".webp") && !f.includes("thumb")).length;
    counts.portrait = fs
      .readdirSync(path.join(sourceDir, "assets", "extbg"))
      .filter((f) => f.endsWith(".webp") && !f.includes("thumb")).length;
    counts.thumbnails =
      fs.readdirSync(path.join(sourceDir, "assets", "wallpapers", "thumbs")).filter((f) =>
        f.endsWith(".webp")
      ).length;
    const manifest = readHistoryManifest(sourceDir);
    counts.sourceRecords = manifest.count;
    return counts;
  });
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) throw new Error(`missing source asset: ${src}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

export function copyStageAssets(count, sourceDir = defaultSourceDir()) {
  for (let i = 1; i <= count; i++) {
    const n = String(i).padStart(3, "0");
    const siteId = `v2_${n}`;
    const extId = `extv3_${n}`;
    copyIfExists(
      path.join(sourceDir, "assets", "wallpapers", `${siteId}.webp`),
      path.join(ROOT, "assets", "wallpapers", `${siteId}.webp`)
    );
    copyIfExists(
      path.join(sourceDir, "assets", "wallpapers", "thumbs", `${siteId}.webp`),
      path.join(ROOT, "assets", "wallpapers", "thumbs", `${siteId}.webp`)
    );
    copyIfExists(
      path.join(sourceDir, "assets", "extbg", `${extId}.webp`),
      path.join(ROOT, "assets", "extbg", `${extId}.webp`)
    );
    copyIfExists(
      path.join(sourceDir, "assets", "extbg", "thumbs", `${extId}.webp`),
      path.join(ROOT, "assets", "extbg", "thumbs", `${extId}.webp`)
    );
  }
}

export async function writeStageCatalog(count, sourceDir = defaultSourceDir()) {
  const mod = await loadHistoryCatalog(sourceDir);
  const slice = mod.CURATED_WALLPAPERS.slice(0, count);
  const usedCats = new Set(slice.map((w) => w.category));
  const categories = mod.WALLPAPER_CATEGORIES.filter((c) => usedCats.has(c.id));
  const lines = [
    `/** ${count} licensed Pexels wallpapers — canary restore from ${HISTORY_SHA}. */`,
    `export const WALLPAPER_PACK_COUNT = ${count};`,
    "",
    `export const WALLPAPER_CATEGORIES = Object.freeze(${JSON.stringify(categories, null, 2)});`,
    "",
    `/** @type {{ name: string, category: string, pexelsId: number, photographer: string, tier: string, overlay: number, score: number }[]} */`,
    `export const CURATED_WALLPAPERS = ${JSON.stringify(slice, null, 2)};`,
    "",
    "export const PACK_NAMES = CURATED_WALLPAPERS.map((w) => w.name);",
    "export const PACK_CATEGORIES = CURATED_WALLPAPERS.map((w) => w.category);",
    "",
  ];
  const dest = path.join(ROOT, "tools", "lib", "wallpaper-curated-catalog.mjs");
  fs.writeFileSync(dest, lines.join("\n"), "utf8");
}

export function writeStageManifest(count, sourceDir = defaultSourceDir()) {
  const manifest = readHistoryManifest(sourceDir);
  const slice = manifest.items.slice(0, count);
  const out = {
    version: manifest.version,
    count,
    items: slice,
  };
  fs.writeFileSync(path.join(ROOT, "wallpaper-sources.json"), `${JSON.stringify(out, null, 2)}\n`, "utf8");
}

export function patchWallpaperCoreCount(count) {
  const file = path.join(ROOT, "tools", "lib", "wallpaper-core.mjs");
  let src = fs.readFileSync(file, "utf8");
  src = src.replace(/export const WALLPAPER_PACK_COUNT = \d+;/, `export const WALLPAPER_PACK_COUNT = ${count};`);
  fs.writeFileSync(file, src, "utf8");
}

export function writeStageCredits(count, sourceDir = defaultSourceDir()) {
  const creditsPath = path.join(ROOT, "docs", "WALLPAPER_CREDITS.md");
  const historyCredits = execSync(`git show ${HISTORY_SHA}:docs/WALLPAPER_CREDITS.md`, {
    encoding: "utf8",
    cwd: ROOT,
  });
  const lines = historyCredits.split("\n");
  const header = lines.slice(0, 4);
  const body = [];
  let inTable = false;
  for (const line of lines.slice(4)) {
    if (line.startsWith("| v2_")) {
      const m = line.match(/^\| (v2_\d+)/);
      if (m) {
        const idx = Number(m[1].replace("v2_", ""));
        if (idx <= count) body.push(line);
      }
      inTable = true;
    } else if (!inTable) {
      header.push(line);
    }
  }
  fs.mkdirSync(path.dirname(creditsPath), { recursive: true });
  fs.writeFileSync(
    creditsPath,
    `${header.join("\n").trim()}\n\nLicensed Pexels backgrounds (${count} active in canary stage).\n\n${body.join("\n")}\n`,
    "utf8"
  );
}

export async function restoreWallpaperStage(count, sourceDir = defaultSourceDir()) {
  if (![25, 50, 75, 100].includes(count)) {
    throw new Error(`unsupported canary count: ${count}`);
  }
  const inventory = await verifyHistoryPack(sourceDir);
  if (
    inventory.catalog < 100 ||
    inventory.landscape < 100 ||
    inventory.portrait < 100 ||
    inventory.thumbnails < 100 ||
    inventory.sourceRecords < 100 ||
    inventory.categories < 13
  ) {
    const err = new Error("WALLPAPERS_100_RESTORE_BLOCKED_INCOMPLETE_HISTORY");
    err.inventory = inventory;
    throw err;
  }

  copyStageAssets(count, sourceDir);
  await writeStageCatalog(count, sourceDir);
  writeStageManifest(count, sourceDir);
  patchWallpaperCoreCount(count);
  writeStageCredits(count, sourceDir);

  execSync("node tools/emit-wallpaper-pack-to-public.mjs", { cwd: ROOT, stdio: "inherit" });
  execSync(`node tools/patch-wallpaper-canary-i18n.mjs ${count}`, { cwd: ROOT, stdio: "inherit" });

  return inventory;
}
