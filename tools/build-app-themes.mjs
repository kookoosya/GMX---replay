#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.cwd();
const src = fs.readFileSync(path.join(root, "site-src/04-themes-catalog.js"), "utf8");
const start = src.indexOf("const THEMES = [");
const end = src.indexOf("const EXT_THEMES = THEMES.map");
const block = src.slice(start, end);

const helpers = `
  function rgbaToRgbTuple(s){
    const m = String(s||"").match(/rgba?\\(([^)]+)\\)/i);
    if (!m) return null;
    const parts = m[1].split(",").map(x=>x.trim());
    const r = Number(parts[0]); const g = Number(parts[1]); const b = Number(parts[2]);
    if (![r,g,b].every(Number.isFinite)) return null;
    return [Math.max(0,Math.min(255,r)), Math.max(0,Math.min(255,g)), Math.max(0,Math.min(255,b))];
  }
  function relLum(rgb){
    const f = (v)=>{ v/=255; return (v<=0.04045)? (v/12.92) : Math.pow((v+0.055)/1.055, 2.4); };
    const [r,g,b]=rgb;
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  }
  function pickAccentOn(a,b){
    const ra = rgbaToRgbTuple(a) || [124,92,255];
    const rb = rgbaToRgbTuple(b) || [0,229,255];
    const lum = (relLum(ra) + relLum(rb)) / 2;
    return (lum > 0.62) ? "#0A0D15" : "#FFFFFF";
  }
  function packsForKindImpl(kind, gmPacks, gnPacks){
    return kind === "gn" ? gnPacks : gmPacks;
  }
`;

const out = `(function (global) {
  if (global.__GMXThemesFactory) return;
  global.__GMXThemesFactory = function createGMXThemes() {
    ${block}
    const EXT_THEMES = THEMES.map(t=>({ id:t.id, name:t.name, note:t.note, a:t.a, b:t.b }));
    ${helpers}
    return {
      THEMES,
      STYLES,
      GM_PACKS,
      GN_PACKS,
      PACKS: GM_PACKS,
      EXT_THEMES,
      packsForKind(kind){ return packsForKindImpl(kind, GM_PACKS, GN_PACKS); },
      rgbaToRgbTuple,
      relLum,
      pickAccentOn,
    };
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
`;

const dest = path.join(root, "public/app.themes.js");
fs.writeFileSync(dest, out);
console.log(`built ${dest} (${out.length} bytes)`);
