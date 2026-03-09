import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(repoRoot, "frontend", "dist");
const targetDir = path.join(repoRoot, "public", "bridge");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmSafe(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`[build] frontend dist not found: ${sourceDir}`);
  process.exit(1);
}

rmSafe(targetDir);
copyRecursive(sourceDir, targetDir);
console.log(`[build] React bridge synced: ${path.relative(repoRoot, sourceDir)} -> ${path.relative(repoRoot, targetDir)}`);
