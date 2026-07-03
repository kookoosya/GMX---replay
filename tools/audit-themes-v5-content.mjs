#!/usr/bin/env node
/** Pixel audit contact sheets for Themes V5 — not committed. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tools", ".wallpaper-review");

function pad3(n) {
  return String(n).padStart(3, "0");
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetHtml(title, cards) {
  const cells = cards
    .map(
      (c) => `<div class="card">
      <img src="${esc(c.src)}" alt="${esc(c.id)}" loading="lazy"/>
      <div class="meta"><b>${esc(c.id)}</b><br/>${esc(c.category)}<br/>${esc(c.name)}<br/>
      ${esc(c.actualContentType || "")}<br/>char:${c.hasCharacter ? "yes" : "no"}<br/>
      ${esc(c.sourceType || "")} · ${esc(c.license || "")}</div>
    </div>`
    )
    .join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(title)}</title>
<style>
body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:0;padding:16px}
h1{font-size:18px} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.card{background:#222;border-radius:8px;overflow:hidden;border:1px solid #333}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#000}
.card .meta{padding:8px;font-size:11px;line-height:1.35;color:#ccc}
</style></head><body><h1>${esc(title)} (${cards.length})</h1><div class="grid">${cells}</div></body></html>`;
}

function portraitSheetHtml(title, cards) {
  const cells = cards
    .map(
      (c) => `<div class="card">
      <img src="${esc(c.src)}" alt="${esc(c.id)}" loading="lazy"/>
      <div class="meta"><b>${esc(c.id)}</b><br/>${esc(c.category)}<br/>${esc(c.name)}<br/>
      char:${c.hasCharacter ? "yes" : "no"} · ${esc(c.sourceType || "")}</div>
    </div>`
    )
    .join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(title)}</title>
<style>
body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:0;padding:16px}
h1{font-size:18px} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.card{background:#222;border-radius:8px;overflow:hidden;border:1px solid #333}
.card img{width:100%;aspect-ratio:9/16;object-fit:cover;display:block;background:#000}
.card .meta{padding:8px;font-size:11px;line-height:1.35;color:#ccc}
</style></head><body><h1>${esc(title)} (${cards.length})</h1><div class="grid">${cells}</div></body></html>`;
}

function rel(p) {
  return path.relative(OUT, path.join(ROOT, p)).replace(/\\/g, "/");
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const site = JSON.parse(fs.readFileSync(path.join(ROOT, "site-wallpaper-sources.json"), "utf8"));
  const ext = JSON.parse(fs.readFileSync(path.join(ROOT, "extension-skin-sources.json"), "utf8"));

  const siteCards = site.items.map((it) => ({
    ...it,
    src: rel(it.thumbnailPath),
  }));
  const extCards = ext.items.map((it) => ({
    ...it,
    src: rel(it.thumbnailPath),
  }));

  fs.writeFileSync(path.join(OUT, "site-all-100.html"), sheetHtml("Site V5 — all 100", siteCards));
  fs.writeFileSync(path.join(OUT, "ext-all-60.html"), portraitSheetHtml("Extension V5 — all 60", extCards));

  const groups = {
    "superhero-comic": "Superhero / Comic",
    "anime-style": "Anime",
    "crypto-web3": "Crypto / Web3",
    "mecha-cyber": "Mecha / Cyber",
    "fantasy-env": "Fantasy env",
    "fantasy-character": "Fantasy character",
    "city-neon": "City / Neon",
    nature: "Nature",
    space: "Space",
    "abstract-minimal": "Abstract",
    "abstract-dark": "Abstract dark",
  };

  for (const [cat, label] of Object.entries(groups)) {
    const sc = siteCards.filter((c) => c.category === cat);
    if (sc.length) fs.writeFileSync(path.join(OUT, `site-${cat}.html`), sheetHtml(`Site — ${label}`, sc));
    const ec = extCards.filter((c) => c.category === cat);
    if (ec.length) fs.writeFileSync(path.join(OUT, `ext-${cat}.html`), portraitSheetHtml(`Ext — ${label}`, ec));
  }

  const photoRemainder = siteCards.filter((c) =>
    ["city-neon", "nature", "space", "abstract-minimal"].includes(c.category)
  );
  fs.writeFileSync(
    path.join(OUT, "site-photo-remainder.html"),
    sheetHtml("Site — photography remainder", photoRemainder)
  );

  console.log(`audit contact sheets → ${OUT}`);
}

main();
