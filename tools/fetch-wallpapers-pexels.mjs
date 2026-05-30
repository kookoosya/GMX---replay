#!/usr/bin/env node
/**
 * Download high-quality abstract/neon wallpapers from Pexels (free license).
 * No charts/candles/trading desks — curated IDs only.
 *
 * Run: node tools/fetch-wallpapers-pexels.mjs
 * Requires: sharp (devDependency)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_FULL = path.join(ROOT, 'assets', 'wallpapers');
const SITE_THUMB = path.join(ROOT, 'assets', 'wallpapers', 'thumbs');
const EXT_FULL = path.join(ROOT, 'assets', 'extbg');
const EXT_THUMB = path.join(ROOT, 'assets', 'extbg', 'thumbs');
const CREDITS = path.join(ROOT, 'docs', 'WALLPAPER_CREDITS.md');

/** Curated Pexels photo IDs — neon, abstract, cyber, purple, 3d (verified HTTP 200). */
const PEXELS_IDS = [
  1103970, 1257860, 1323712, 1435752, 1612282, 3044476, 3618548, 3861969, 4056723,
  4153800, 4218885, 4368386, 4526396, 4662438, 4792285, 5063436, 5207781, 5327585,
  5473956, 5474292, 5490715, 5669602, 5740737, 5740777, 6985061, 1181210, 1181263,
  1320684, 1435077, 1563356, 17483868, 207891, 963486, 1152708, 1784575, 1939485,
  2387793, 247933, 2561622, 2685339, 2832382, 2911521, 3037640, 3222041, 1252890,
  1617976, 207219, 247599, 325044, 1933902, 1766604, 1181345, 1438761, 1552617,
  1762851, 209207, 2101820, 2343464, 2564552, 2774557, 3165335, 3847188, 3957971,
  4116201, 4482900, 461077, 462030, 5194269, 577585,
];

const SITE_COUNT = 58;
const EXT_COUNT = 58;

function pexelsUrl(id, w, h) {
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
  const q = new URLSearchParams({
    auto: 'compress',
    cs: 'tinysrgb',
    w: String(w),
    h: String(h),
    fit: 'crop',
    dpr: '1',
  });
  return `${base}?${q}`;
}

async function downloadBuffer(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'GMXReply-Wallpaper-Fetch/1.0 (+https://www.gmxreply.com)' },
        redirect: 'follow',
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
  const sharp = (await import('sharp')).default;
  for (const dir of [SITE_FULL, SITE_THUMB, EXT_FULL, EXT_THUMB]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const credits = ['# Wallpaper credits', '', 'Source: [Pexels](https://www.pexels.com/license/) — free to use.', ''];

  for (let i = 0; i < SITE_COUNT; i++) {
    const id = PEXELS_IDS[i % PEXELS_IDS.length];
    const siteId = `v2_${String(i + 1).padStart(3, '0')}`;
    const extId = `extv3_${String(i + 1).padStart(2, '0')}`;

    process.stdout.write(`site ${siteId} (pexels ${id})… `);
    const buf = await downloadBuffer(pexelsUrl(id, 1920, 1080));
    await sharp(buf).webp({ quality: 84 }).toFile(path.join(SITE_FULL, `${siteId}.webp`));
    await sharp(buf).resize(480, 270, { fit: 'cover' }).webp({ quality: 78 })
      .toFile(path.join(SITE_THUMB, `${siteId}.webp`));
    console.log('ok');

    process.stdout.write(`ext ${extId}… `);
    const bufV = await downloadBuffer(pexelsUrl(id, 1080, 1920));
    await sharp(bufV).webp({ quality: 84 }).toFile(path.join(EXT_FULL, `${extId}.webp`));
    await sharp(bufV).resize(360, 640, { fit: 'cover' }).webp({ quality: 78 })
      .toFile(path.join(EXT_THUMB, `${extId}.webp`));
    console.log('ok');

    credits.push(`- ${siteId} / ${extId}: https://www.pexels.com/photo/${id}/`);
    await new Promise((r) => setTimeout(r, 120));
  }

  fs.writeFileSync(CREDITS, credits.join('\n') + '\n', 'utf8');
  console.log(`\nDone. ${SITE_COUNT} site + ${EXT_COUNT} extension wallpapers. Credits: docs/WALLPAPER_CREDITS.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
