#!/usr/bin/env node
/**
 * Download scenic wallpapers from Pexels (free license).
 * Nature / landscape / calm abstract — no charts, no crypto overlays.
 *
 * Run: npm run wallpapers:fetch
 * Requires: sharp (devDependency)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_FULL = path.join(ROOT, "assets", "wallpapers");
const SITE_THUMB = path.join(ROOT, "assets", "wallpapers", "thumbs");
const EXT_FULL = path.join(ROOT, "assets", "extbg");
const EXT_THUMB = path.join(ROOT, "assets", "extbg", "thumbs");
const CREDITS = path.join(ROOT, "docs", "WALLPAPER_CREDITS.md");

/** 58 curated Pexels photo IDs — landscapes, coast, forest, mountains, soft sky. */
const PEXELS_IDS = [
  1366919, 1417647, 1520342, 1179229, 1261728, 1624496, 1732189, 1784575, 189349, 247599,
  325044, 414612, 450597, 618833, 691668, 870941, 1143411, 1029604, 1287145, 1578750,
  1671279, 1761279, 2387845, 1257860, 3225519, 1323712, 3463772, 3558895, 3662634, 417411,
  417173, 1693441, 1848771, 1437629, 2387428, 3131638, 207219, 209207, 2101820, 2343464,
  2564552, 2774557, 3165335, 3847188, 3957971, 4482900, 5194269, 577585, 29128084, 29177407,
  29609552, 29986107, 30751954, 1770803, 1563356, 17483868, 2685339, 2832382,
];

const SITE_COUNT = 58;
const EXT_COUNT = 58;
const FULL_Q = 88;
const THUMB_Q = 82;

function pexelsUrl(id, w, h) {
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
  const q = new URLSearchParams({
    auto: "compress",
    cs: "tinysrgb",
    w: String(w),
    h: String(h),
    fit: "crop",
    dpr: "1",
  });
  return `${base}?${q}`;
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

async function main() {
  const sharp = (await import("sharp")).default;
  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const credits = [
    "# Wallpaper credits",
    "",
    "Source: [Pexels](https://www.pexels.com/license/) — free to use.",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
  ];

  let failed = 0;
  for (let i = 0; i < SITE_COUNT; i++) {
    const id = PEXELS_IDS[i] ?? PEXELS_IDS[i % PEXELS_IDS.length];
    const siteId = `v2_${String(i + 1).padStart(3, "0")}`;
    const extId = `extv3_${String(i + 1).padStart(2, "0")}`;

    try {
      process.stdout.write(`site ${siteId} (pexels ${id})… `);
      const buf = await downloadBuffer(pexelsUrl(id, 1920, 1080));
      await sharp(buf).webp({ quality: FULL_Q }).toFile(path.join(SITE_FULL, `${siteId}.webp`));
      await sharp(buf)
        .resize(480, 270, { fit: "cover" })
        .webp({ quality: THUMB_Q })
        .toFile(path.join(SITE_THUMB, `${siteId}.webp`));
      console.log("ok");

      process.stdout.write(`ext ${extId}… `);
      const bufV = await downloadBuffer(pexelsUrl(id, 1080, 1920));
      await sharp(bufV).webp({ quality: FULL_Q }).toFile(path.join(EXT_FULL, `${extId}.webp`));
      await sharp(bufV)
        .resize(360, 640, { fit: "cover" })
        .webp({ quality: THUMB_Q })
        .toFile(path.join(EXT_THUMB, `${extId}.webp`));
      console.log("ok");

      credits.push(`- ${siteId} / ${extId}: https://www.pexels.com/photo/${id}/`);
    } catch (e) {
      failed++;
      console.log(`FAIL (${e.message || e})`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  fs.writeFileSync(CREDITS, `${credits.join("\n")}\n`, "utf8");
  if (failed) {
    console.error(`\n${failed} pack(s) failed. Re-run or swap IDs in PEXELS_IDS.`);
    process.exit(1);
  }
  console.log(`\nDone. ${SITE_COUNT} site + ${EXT_COUNT} extension wallpapers. Credits: docs/WALLPAPER_CREDITS.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
