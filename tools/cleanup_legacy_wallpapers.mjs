import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function removeMatching(relDir, matcher) {
  const dir = path.join(root, relDir);
  if (!fs.existsSync(dir)) return [];
  const removed = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    let stat = null;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;
    if (!matcher.test(name)) continue;
    fs.rmSync(full, { force: true });
    removed.push(path.join(relDir, name));
  }
  return removed;
}

const removedSiteLegacy = removeMatching("assets/wallpapers", /^w\d{2}\.svg$/i);
const removedExtLegacy = removeMatching("assets/extbg", /^ext_\d+\.svg$/i);
const removedGuides = [
  "assets/wallpapers/IMPORT_GUIDE.txt",
  "assets/extbg/IMPORT_GUIDE.txt",
].filter((rel) => {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return false;
  fs.rmSync(full, { force: true });
  return true;
});

const removed = [...removedSiteLegacy, ...removedExtLegacy, ...removedGuides];
console.log(`[cleanup_legacy_wallpapers] removed=${removed.length}`);
for (const rel of removed) console.log(`- ${rel}`);
