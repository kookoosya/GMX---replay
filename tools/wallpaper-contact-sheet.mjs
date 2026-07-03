#!/usr/bin/env node
/** Build a contact sheet from thumbnail directory (production download or local). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteThumbFilename } from "./lib/wallpaper-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2] || path.join(ROOT, "assets", "wallpapers", "thumbs");
const OUT = process.argv[3] || path.join(ROOT, "tools", ".wallpaper-review", "contact-sheet-thumbs.html");
const COUNT = Number(process.env.SHEET_COUNT || 100);
const COLS = 10;

const cells = [];
for (let i = 1; i <= COUNT; i++) {
  const file = siteThumbFilename(i);
  const full = path.join(SRC, file);
  if (!fs.existsSync(full)) {
    cells.push(`<div class="cell missing"><span>${file}</span><small>MISSING</small></div>`);
    continue;
  }
  const b64 = fs.readFileSync(full).toString("base64");
  cells.push(`<div class="cell"><img src="data:image/webp;base64,${b64}" alt="${file}"/><span>${file}</span></div>`);
}

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Wallpaper thumbs contact sheet</title>
<style>
body{font-family:system-ui;background:#111;color:#eee;margin:12px}
.grid{display:grid;grid-template-columns:repeat(${COLS},1fr);gap:8px}
.cell{background:#222;border-radius:8px;padding:6px;text-align:center}
.cell img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:4px;display:block}
.cell span{font-size:10px;opacity:.8;word-break:break-all}
.missing{outline:2px solid #c33}
</style></head><body><h1>Thumbnails 1–${COUNT}</h1><p>Source: ${SRC}</p><div class="grid">${cells.join("")}</div></body></html>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, "utf8");
console.log("contact sheet:", OUT);
