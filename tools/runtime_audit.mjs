import fs from "fs";
import path from "path";
import crypto from "crypto";
import process from "process";

const root = process.cwd();
const strict = process.argv.includes("--strict");

function seq(prefix, count, ext, width = 2) {
  const out = [];
  for (let i = 1; i <= count; i += 1) out.push(`${prefix}${String(i).padStart(width, "0")}${ext}`);
  return out;
}

function listFiles(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isFile()).sort();
}

function sha(rel) {
  const file = path.join(root, rel);
  return crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex");
}

function diffSet(actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return {
    missing: expected.filter((name) => !actualSet.has(name)),
    extra: actual.filter((name) => !expectedSet.has(name)),
  };
}

function printSection(title) {
  console.log(`
[${title}]`);
}

function printList(label, items) {
  if (!items.length) return;
  console.log(`${label}: ${items.join(", ")}`);
}

let issues = 0;

const expectedSiteWalls = [
  ...seq("v2_", 100, ".webp", 3),
];
const expectedSiteThumbs = seq("v2_", 100, ".webp", 3);
const expectedExtWalls = [
  "ext_free_01.svg",
  "ext_free_02.svg",
  ...seq("extv3_", 100, ".webp", 3),
  "lux_ext_anime_neon_alley.svg",
  "lux_ext_cinematic_heroes.svg",
  "lux_ext_ct_warroom.svg",
  "lux_ext_degen_terminal.svg",
  "lux_ext_nft_gallery.svg",
  "lux_ext_noir_detective.svg",
  "lux_ext_onchain_spaceport.svg",
  "lux_ext_solana_temple.svg",
];
const expectedExtThumbs = seq("extv3_", 100, ".webp", 3);

for (const [label, rel, expected] of [
  ["site wallpapers", "assets/wallpapers", expectedSiteWalls],
  ["site wallpaper thumbs", "assets/wallpapers/thumbs", expectedSiteThumbs],
  ["extension wallpapers", "assets/extbg", expectedExtWalls],
  ["extension wallpaper thumbs", "assets/extbg/thumbs", expectedExtThumbs],
]) {
  const actual = listFiles(rel);
  const { missing, extra } = diffSet(actual, expected);
  printSection(label);
  console.log(`expected=${expected.length} actual=${actual.length}`);
  printList("missing", missing);
  printList("extra", extra);
  if (missing.length) issues += missing.length;
  if (extra.length && strict) { /* legacy wallpaper svg may remain on disk */ }
}

const deadFiles = [
  "extension/cosmetics.json",
  "docs/DEV_ONE_COMMAND_RU.md",
  "docs/DEV_README_RU.txt",
  "docs/HANDOFF_R78_CODE_CLEANUP_RU.txt",
  "docs/reference/ARCADE_REFERENCE_RU.txt",
  "docs/reference/USER_GMGN_REFERENCE_RU.txt",
  "tools/env-status.ps1",
  "tools/env-sync.ps1",
  "tools/migrate-sqlite-to-supabase.mjs",
  "tools/test-supabase-usage.mjs",
  "tools/wallpaper_batch_helper.py",
  "assets/wallets/phantom.png",
  "assets/wallets/solflare.png",
  "assets/wallpapers/inbox/README.txt",
  "SAFE_PASS9_HANDOFF.txt",
  "SAFE_PASS9_HANDOFF_02.txt",
  "SAFE_PASS9_HANDOFF_03.txt",
  "SAFE_PASS9_HANDOFF_04.txt",
  ...seq("assets/extbg/v2_", 40, ".webp", 3),
];

printSection("dead files present");
const deadPresent = deadFiles.filter((rel) => fs.existsSync(path.join(root, rel)));
console.log(`count=${deadPresent.length}`);
printList("present", deadPresent);
if (deadPresent.length) issues += deadPresent.length;


function findFirst(relPrefix, pattern) {
  const dir = path.join(root, relPrefix);
  if (!fs.existsSync(dir)) return null;
  const names = fs.readdirSync(dir).filter((name) => pattern.test(name)).sort();
  return names.length ? path.join(relPrefix, names[0]) : null;
}

const staleChecks = [
  ["bridge legacy bundle labels", findFirst("public/bridge/assets", /^legacy-shell-.*\.js$/), ['promo_k_legacy">Legacy<', 'r_col_inserts">Inserts<']],
];

for (const [label, rel, patterns] of staleChecks) {
  printSection(label);
  if (!rel || !fs.existsSync(path.join(root, rel))) {
    console.log("status=missing");
    continue;
  }
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  const hits = patterns.filter((pattern) => text.includes(pattern)).map((pattern) => String(pattern));
  console.log(`file=${rel}`);
  console.log(`stale_hits=${hits.length}`);
  printList("patterns", hits);
  if (hits.length) issues += hits.length;
}

for (const group of [
  ["app source", ["public/app.js"]],
  ["app mirror", ["frontend/public/app.js"]],
  ["mode parity", ["public/mode.js", "public/bridge/mode.js", "frontend/public/mode.js"]],
  ["arcade parity", ["public/arcade.js", "public/bridge/arcade.js", "frontend/public/arcade.js"]],
  ["site i18n parity", ["public/i18n/siteI18n.js", "public/bridge/i18n/siteI18n.js", "frontend/public/i18n/siteI18n.js"]],
  ["extension config parity", ["public/extension-config.json", "public/bridge/extension-config.json"]],
  ["themes catalog parity", ["public/themes.json", "public/bridge/themes.json", "extension/themes.json"]],
]) {
  const [label, files] = group;
  printSection(label);
  const hashes = files.map((rel) => ({ rel, hash: sha(rel) }));
  for (const row of hashes) console.log(`${row.rel} ${row.hash}`);
  const uniq = new Set(hashes.map((row) => row.hash));
  if (uniq.size === 1) console.log("status=ok");
  else {
    console.log("status=drift");
    issues += 1;
  }
}

console.log(`
Runtime audit done. issues=${issues}`);
if (strict && issues) process.exit(1);
