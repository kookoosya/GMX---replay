#!/usr/bin/env node
/**
 * One-time / refresh: split public/app.js into site-src/*.js (ordered parts).
 * Run: node tools/split-site-app.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const srcPath = path.join(root, "public/app.js");
const outDir = path.join(root, "site-src");

const raw = fs.readFileSync(srcPath, "utf8");
if (!raw.startsWith("(async () =>")) {
  throw new Error("expected IIFE wrapper (async () => {");
}

const lines = raw.split("\n");
const markerRx = /^(\s*)\/\/ ----- (.+?) -----\s*$/;

const sections = [];
let current = { title: "00-bootstrap", lines: [] };
let seenMarker = false;

for (const line of lines) {
  const m = line.match(markerRx);
  if (m) {
    seenMarker = true;
    if (current.lines.length) sections.push(current);
    const slug = m[2]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    const idx = String(sections.length + 1).padStart(2, "0");
    current = { title: `${idx}-${slug}`, lines: [line] };
  } else {
    current.lines.push(line);
  }
}
if (current.lines.length) sections.push(current);

// bootstrap section should end before first marker content if markers were only inner
if (!seenMarker) throw new Error("no section markers found");

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

console.log(`split-site-app: wrote ${manifest.length} parts to site-src/`);
