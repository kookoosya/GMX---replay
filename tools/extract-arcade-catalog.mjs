#!/usr/bin/env node
/**
 * One-time / refresh: extract RAW_GAMES from public/arcade.js → data/arcade-catalog.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArcadeGames } from "./lib/parse-arcade-games.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "data", "arcade-catalog.json");
const games = parseArcadeGames(path.join(root, "public", "arcade.js"));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), games }, null, 2) + "\n",
  "utf8"
);
console.log(`extract-arcade-catalog OK (${games.length} games → data/arcade-catalog.json)`);
