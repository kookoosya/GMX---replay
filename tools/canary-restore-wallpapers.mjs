#!/usr/bin/env node
/** Apply a canary wallpaper stage (25/50/75/100) from git-extracted history pack. */
import {
  defaultSourceDir,
  restoreWallpaperStage,
  verifyHistoryPack,
} from "./lib/wallpaper-canary-restore.mjs";

const count = Number(process.argv[2] || process.env.WALLPAPER_CANARY_COUNT || 0);
if (!count) {
  console.error("usage: node tools/canary-restore-wallpapers.mjs <25|50|75|100>");
  process.exit(1);
}

const sourceDir = defaultSourceDir();
const inventory = await verifyHistoryPack(sourceDir);
console.log("history inventory:", inventory);

const expected = {
  catalog: 100,
  landscape: 100,
  portrait: 100,
  thumbnails: 100,
  sourceRecords: 100,
  categories: 13,
};
for (const [k, v] of Object.entries(expected)) {
  if (inventory[k] < v) {
    console.error("WALLPAPERS_100_RESTORE_BLOCKED_INCOMPLETE_HISTORY");
    console.error(`${k}: expected ${v}, found ${inventory[k]}`);
    process.exit(2);
  }
}

await restoreWallpaperStage(count, sourceDir);
console.log(`canary-restore-wallpapers OK (${count})`);
