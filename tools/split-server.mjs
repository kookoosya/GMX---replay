#!/usr/bin/env node
/**
 * Split index.js into server-src/*.js parts (by // ---------- markers).
 * Run: node tools/split-server.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const srcPath = path.join(root, "index.js");
const outDir = path.join(root, "server-src");

const raw = fs.readFileSync(srcPath, "utf8");
const lines = raw.split("\n");
const markerRx = /^\/\/ -{3,}.+ -{3,}\s*$/;

const sections = [];
let current = { title: "00-bootstrap", lines: [] };

for (const line of lines) {
  const m = line.match(markerRx);
  if (m) {
    if (current.lines.length) sections.push(current);
    const slug = line
      .replace(/^\/\/\s*-+\s*/, "")
      .replace(/\s*-+\s*$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 52);
    const idx = String(sections.length + 1).padStart(2, "0");
    current = { title: `${idx}-${slug}`, lines: [line] };
  } else {
    current.lines.push(line);
  }
}
if (current.lines.length) sections.push(current);

if (sections.length < 3) throw new Error("split produced too few sections");

fs.mkdirSync(outDir, { recursive: true });
const manifest = [];
for (const sec of sections) {
  const name = `${sec.title}.js`;
  const body = sec.lines.join("\n");
  fs.writeFileSync(path.join(outDir, name), body.endsWith("\n") ? body : body + "\n");
  manifest.push(name);
}

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ parts: manifest, generatedAt: new Date().toISOString() }, null, 2) + "\n"
);

console.log(`split-server: wrote ${manifest.length} parts to server-src/`);
