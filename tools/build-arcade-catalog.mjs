#!/usr/bin/env node
/**
 * Inject data/arcade-catalog.json into public/arcade.js (RAW_GAMES block).
 * Run: node tools/build-arcade-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "arcade-catalog.json");
const arcadePath = path.join(root, "public", "arcade.js");
const mirrors = [
  path.join(root, "frontend", "public", "arcade.js"),
  path.join(root, "public", "bridge", "arcade.js"),
];

if (!fs.existsSync(catalogPath)) {
  console.error("missing data/arcade-catalog.json — run: node tools/extract-arcade-catalog.mjs");
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const games = Array.isArray(catalog.games) ? catalog.games : catalog;
if (!Array.isArray(games) || !games.length) {
  console.error("arcade-catalog.json must contain a non-empty games array");
  process.exit(1);
}

const arcadeSrc = fs.readFileSync(arcadePath, "utf8");
const start = arcadeSrc.indexOf("const RAW_GAMES = [");
const end = arcadeSrc.indexOf("];", start);
if (start < 0 || end < 0) {
  console.error("public/arcade.js: RAW_GAMES block not found");
  process.exit(1);
}

const injected = `const RAW_GAMES = ${JSON.stringify(games, null, 2)};`;
const next = arcadeSrc.slice(0, start) + injected + arcadeSrc.slice(end + 2);

function writeAll(filePath) {
  fs.writeFileSync(filePath, next, "utf8");
}

writeAll(arcadePath);
for (const mirror of mirrors) {
  if (fs.existsSync(path.dirname(mirror))) writeAll(mirror);
}

const gotdPath = path.join(root, "extension", "lib", "gotd-games.json");
const gotdPayload = {
  updatedAt: catalog.updatedAt || new Date().toISOString().slice(0, 10),
  games: games.map((g) => ({
    id: String(g.id || ""),
    name: String(g.name || g.id || ""),
    category: String(g.category || ""),
    access: String(g.access || "free"),
    imageUrl: String(g.imageUrl || ""),
  })),
};
fs.mkdirSync(path.dirname(gotdPath), { recursive: true });
fs.writeFileSync(gotdPath, JSON.stringify(gotdPayload, null, 2) + "\n", "utf8");

console.log(`build-arcade-catalog OK (${games.length} games → public/arcade.js + extension/lib/gotd-games.json)`);
