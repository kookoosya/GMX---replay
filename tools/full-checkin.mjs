#!/usr/bin/env node
/**
 * Full check-in: core app invariants + asset/runtime audits.
 * Exit 1 on any failure.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appPath = path.join(root, "public/app.js");
const app = fs.readFileSync(appPath, "utf8");

const must = [
  ['SITE_WALLPAPER_PACK_COUNT = 58', "site wallpaper catalog"],
  ['EXT_WALLPAPER_PACK_COUNT = 58', "extension wallpaper catalog"],
  ['/assets/wallpapers/${norm}.webp', "site pack uses webp files"],
  ['/assets/extbg/${norm}.webp', "ext pack uses webp files"],
  ['const antiN = antiWindow(strength);', "anti-repeat window in generate"],
  ['attempts < 4', "bulk generate retry budget"],
  ['anti_last_n=${encodeURIComponent(antiN)}', "bulk passes anti_last_n"],
  ['window.__i18nPause = true', "i18n pause during generate"],
  ['function syncModePanelCopy', "mode panel i18n sync"],
  ['CRYPTO_SITE_WALL_SOURCES = []', "no external trading wallpaper URLs"],
  ['CRYPTO_EXT_WALL_SOURCES = []', "no external ext wallpaper URLs"],
];

const mustNot = [
  ["supportBundle", "support bundle helper"],
  ['$("toolSupport")', "support button handler"],
  ['setPh("supportOut"', "support textarea placeholder"],
  ["sitePackWallpaperDataUri(norm, false)", "procedural site wallpapers"],
  ["extPackWallpaperDataUri(norm, false)", "procedural ext wallpapers"],
  ["const antiN = 0;", "disabled anti-repeat"],
];

let issues = 0;
console.log("[app.js invariants]");
for (const [needle, label] of must) {
  if (!app.includes(needle)) {
    console.log(`FAIL missing: ${label}`);
    issues++;
  }
}
for (const [needle, label] of mustNot) {
  if (app.includes(needle)) {
    console.log(`FAIL present: ${label}`);
    issues++;
  }
}
if (!issues) console.log("ok");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) issues++;
  return r.status === 0;
}

console.log("\n[runtime_audit]");
run("node", ["tools/runtime_audit.mjs", "--strict"]);

console.log("\n[smoke test]");
run("node", ["smoke.js"]);

console.log(`\nfull-checkin done. issues=${issues}`);
process.exit(issues ? 1 : 0);
