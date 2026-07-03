#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(ROOT, "tools", ".wallpaper-review", "prod-legacy-thumbs");
const out = path.join(ROOT, "tools", ".wallpaper-review", "contact-sheet-prod-legacy.html");
fs.mkdirSync(dir, { recursive: true });

for (let i = 1; i <= 20; i++) {
  const n = String(i).padStart(3, "0");
  const url = `https://www.gmxreply.com/assets/wallpapers/thumbs/v2_${n}.webp`;
  const res = await fetch(url, { cache: "no-store" });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(dir, `v2_${n}.webp`), buf);
}

const cells = [];
for (let i = 1; i <= 20; i++) {
  const n = String(i).padStart(3, "0");
  const f = `v2_${n}.webp`;
  const b64 = fs.readFileSync(path.join(dir, f)).toString("base64");
  cells.push(`<div class="cell"><img src="data:image/webp;base64,${b64}" alt="${f}"/><span>${f}</span></div>`);
}
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Prod legacy thumbs</title>
<style>body{font-family:system-ui;background:#111;color:#eee}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.cell img{width:100%;aspect-ratio:16/10;object-fit:cover}</style>
</head><body><h1>Production /thumbs/v2_* (no-store fetch)</h1><div class="grid">${cells.join("")}</div></body></html>`;
fs.writeFileSync(out, html, "utf8");
console.log("contact sheet:", out);
