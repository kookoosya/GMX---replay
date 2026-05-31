#!/usr/bin/env node
/**
 * Split one site-src part into two files and update manifest.json.
 * Usage: node tools/split-site-part.mjs <sourceFile> <lineNumber> <newFileName>
 * Line N becomes the first line of the new file (1-based).
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "site-src");
const manifestPath = path.join(srcDir, "manifest.json");

const [sourceName, lineStr, newName] = process.argv.slice(2);
if (!sourceName || !lineStr || !newName) {
  console.error("Usage: node tools/split-site-part.mjs <source.js> <firstLineOfNew> <new-file.js>");
  process.exit(1);
}

const lineNum = Math.max(2, parseInt(lineStr, 10));
const srcPath = path.join(srcDir, sourceName);
const newPath = path.join(srcDir, newName);

if (!fs.existsSync(srcPath)) {
  console.error(`missing: ${srcPath}`);
  process.exit(1);
}

const lines = fs.readFileSync(srcPath, "utf8").split("\n");
if (lineNum > lines.length) {
  console.error(`line ${lineNum} past EOF (${lines.length})`);
  process.exit(1);
}

const head = lines.slice(0, lineNum - 1).join("\n");
const tail = lines.slice(lineNum - 1).join("\n");

fs.writeFileSync(srcPath, head.endsWith("\n") ? head : head + "\n");
fs.writeFileSync(newPath, tail);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const idx = manifest.parts.indexOf(sourceName);
if (idx < 0) {
  console.error(`part not in manifest: ${sourceName}`);
  process.exit(1);
}
if (!manifest.parts.includes(newName)) {
  manifest.parts.splice(idx + 1, 0, newName);
}
manifest.generatedAt = new Date().toISOString();
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`split ${sourceName} @${lineNum} → ${newName}`);
console.log(`  ${sourceName}: ${head.split("\n").length} lines`);
console.log(`  ${newName}: ${tail.split("\n").length} lines`);
