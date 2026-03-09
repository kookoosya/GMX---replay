import fs from "fs";
import path from "path";
import process from "process";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");

const DEAD_FILES = [
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
  ...Array.from({ length: 40 }, (_, i) => `assets/extbg/v2_${String(i + 1).padStart(3, "0")}.webp`),
];

const DEAD_DIRS_IF_EMPTY = [
  "docs/reference",
  "docs",
  "assets/wallpapers/inbox",
];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function removeFile(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return false;
  if (dryRun) return true;
  fs.rmSync(full, { force: true });
  return true;
}

function removeDirIfEmpty(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return false;
  const stat = fs.statSync(full);
  if (!stat.isDirectory()) return false;
  const entries = fs.readdirSync(full);
  if (entries.length) return false;
  if (dryRun) return true;
  fs.rmdirSync(full);
  return true;
}

const removedFiles = [];
const presentFiles = [];
for (const rel of DEAD_FILES) {
  if (!exists(rel)) continue;
  presentFiles.push(rel);
  if (removeFile(rel)) removedFiles.push(rel);
}

const removedDirs = [];
for (const rel of DEAD_DIRS_IF_EMPTY) {
  if (removeDirIfEmpty(rel)) removedDirs.push(rel);
}

console.log(`[safe_cleanup] dryRun=${dryRun ? "yes" : "no"}`);
console.log(`[safe_cleanup] dead files present=${presentFiles.length}`);
for (const rel of presentFiles) console.log(`- ${dryRun ? "would remove" : "removed"}: ${rel}`);
if (removedDirs.length) {
  console.log(`[safe_cleanup] empty dirs ${dryRun ? "would be removed" : "removed"}=${removedDirs.length}`);
  for (const rel of removedDirs) console.log(`- ${dryRun ? "would remove dir" : "removed dir"}: ${rel}`);
}
const remaining = DEAD_FILES.filter((rel) => exists(rel));
console.log(`[safe_cleanup] remaining dead files=${remaining.length}`);
if (remaining.length) {
  for (const rel of remaining) console.log(`- still present: ${rel}`);
}
