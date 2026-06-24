#!/usr/bin/env node
/**
 * Offline integrity checks for Arcade RAW_GAMES catalog in public/arcade.js.
 * Run: node tools/audit-arcade-catalog.mjs
 */
import { parseArcadeGames, parseLocalGameCoverIds } from "./lib/parse-arcade-games.mjs";

const MIN_GAMES = 58;
const CRAZY_EMBED = /^https:\/\/www\.crazygames\.com\/embed\/[^/?#]+$/i;
const CRAZY_IMG = /^https:\/\/imgs\.crazygames\.com\//i;
const ALLOWED_BADGES = new Set([null, "showcase", "top_pro"]);

const games = parseArcadeGames();
const localIds = parseLocalGameCoverIds();
const catalogIds = new Set(games.map((g) => g.id));
let issues = 0;

function fail(msg) {
  issues++;
  console.error(msg);
}

if (games.length < MIN_GAMES) {
  fail(`catalog too small: ${games.length} games (min ${MIN_GAMES})`);
}

const seen = new Set();
for (const g of games) {
  if (seen.has(g.id)) fail(`duplicate id: ${g.id}`);
  seen.add(g.id);

  if (!g.name.trim()) fail(`${g.id}: missing name`);
  if (g.access !== "free" && g.access !== "pro") fail(`${g.id}: bad access "${g.access}"`);
  if (!g.category.trim()) fail(`${g.id}: missing category`);
  if (g.provider !== "crazygames") fail(`${g.id}: provider must be crazygames`);
  if (!CRAZY_EMBED.test(g.embedUrl)) fail(`${g.id}: bad embedUrl`);
  if (!CRAZY_EMBED.test(g.launchUrl)) fail(`${g.id}: bad launchUrl`);
  if (g.embedUrl !== g.launchUrl) fail(`${g.id}: embedUrl !== launchUrl`);
  if (g.imageUrl && !CRAZY_IMG.test(g.imageUrl)) fail(`${g.id}: imageUrl must be CrazyGames CDN or empty`);
  if (!ALLOWED_BADGES.has(g.badge)) fail(`${g.id}: bad badge "${g.badge}"`);
  if (!g.sourceLabel.trim()) fail(`${g.id}: missing sourceLabel`);
}

for (const id of localIds) {
  if (!catalogIds.has(id)) {
    fail(`LOCAL_GAME_COVERS orphan (not in catalog): ${id}`);
  }
}

if (issues) {
  console.error(`\naudit-arcade-catalog: ${issues} issue(s)`);
  process.exit(1);
}

console.log(`arcade catalog OK (${games.length} games, ${localIds.length} local covers)`);
