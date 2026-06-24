#!/usr/bin/env node
/**
 * Verify LOCAL_GAME_COVERS ids have matching .webp on disk and arcade.js uses .webp path.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specPath = path.join(root, "tools", "arcade-game-covers.json");
const gamesDir = path.join(root, "assets", "arcade", "covers", "games");
const arcadePath = path.join(root, "public", "arcade.js");

const { games } = JSON.parse(fs.readFileSync(specPath, "utf8"));
const arcade = fs.readFileSync(arcadePath, "utf8");

if (!/covers\/games\/\$\{slug\}\.webp/.test(arcade)) {
  console.error("arcade.js: localGameCover must serve .webp assets");
  process.exit(1);
}

let issues = 0;
for (const id of games) {
  const webp = path.join(gamesDir, `${id}.webp`);
  const svg = path.join(gamesDir, `${id}.svg`);
  if (!fs.existsSync(svg)) {
    issues++;
    console.error(`missing SVG: ${id}.svg`);
  }
  if (!fs.existsSync(webp)) {
    issues++;
    console.error(`missing WEBP: ${id}.webp (run generate-arcade-game-covers.mjs)`);
  }
}

const setMatch = arcade.match(/const LOCAL_GAME_COVERS = new Set\(\[([\s\S]*?)\]\)/);
if (!setMatch) {
  issues++;
  console.error("arcade.js: LOCAL_GAME_COVERS Set not found");
} else {
  for (const id of games) {
    if (!setMatch[1].includes(`"${id}"`)) {
      issues++;
      console.error(`LOCAL_GAME_COVERS missing id: ${id}`);
    }
  }
}

if (issues) {
  console.error(`\naudit-arcade-game-covers: ${issues} issue(s)`);
  process.exit(1);
}

console.log(`arcade game covers OK (${games.length} webp files)`);
