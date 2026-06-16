#!/usr/bin/env node
/**
 * Scans assets/wallpapers/ for free01.*, free02.*, w01.* … w158.* and writes preset-manifest.json + preset-names.json.
 * Extensions: .png .jpg .jpeg .webp (first match wins in that order for each id).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WP = path.join(ROOT, "assets", "wallpapers");

const EXTS = [".png", ".jpg", ".jpeg", ".webp"];

const PALETTE_NAMES = ["Grid", "Mist", "Pulse", "Flow", "Bloom", "Drift", "Nebula", "Shift", "Haze", "Glow", "Prism", "Vapor", "Crystal", "Aura", "Frost", "Ember", "Storm", "Dawn", "Dusk", "Luna", "Cosmos", "Signal", "Node", "Chain", "Peak", "Valley", "Ridge", "Wave", "Spark", "Flux", "Beam", "Ray", "Core", "Edge", "Lens", "Phase", "Echo", "Trace", "Silk", "Mesh", "Weave", "Braid", "Knot", "Rift", "Void", "Scope", "Lane", "Path", "Route", "Arch", "Gate", "Port", "Hub", "Zone", "Field", "Realm", "Span"];
const EXTRA_THEME = ["Crypto", "Anime", "Space", "Warm", "Action"];

function findFileForId(id) {
  for (const ext of EXTS) {
    const f = id + ext;
    const p = path.join(WP, f);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return f;
  }
  return null;
}

function main() {
  fs.mkdirSync(WP, { recursive: true });
  const manifest = {};
  const names = {};

  for (const id of ["free01", "free02"]) {
    const file = findFileForId(id);
    if (file) {
      manifest[id] = file;
      names[id] = id === "free01" ? "Free 1" : "Free 2";
    }
  }

  for (let i = 1; i <= 158; i++) {
    const id = "w" + String(i).padStart(2, "0");
    const file = findFileForId(id);
    if (file) {
      manifest[id] = file;
      const base = PALETTE_NAMES[(i - 1) % PALETTE_NAMES.length] || "Wall";
      const tag = EXTRA_THEME[(i - 59 + EXTRA_THEME.length * 10) % EXTRA_THEME.length];
      names[id] = i >= 59 ? `${base} · ${tag}` : base;
    }
  }

  const mp = path.join(WP, "preset-manifest.json");
  const np = path.join(WP, "preset-names.json");
  fs.writeFileSync(mp, JSON.stringify(manifest, null, 0), "utf8");
  fs.writeFileSync(np, JSON.stringify(names, null, 0), "utf8");
  console.log("Wrote", mp, "entries:", Object.keys(manifest).length);
  console.log("Wrote", np, "labels:", Object.keys(names).length);
}

main();
