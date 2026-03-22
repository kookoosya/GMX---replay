#!/usr/bin/env node
/**
 * Fetch cover image URLs from CrazyGames game pages (og:image).
 * Run: node tools/arcade-fetch-covers.mjs
 * Outputs JSON: { "game-id": "https://..." }
 * Use to update arcade.js with real imageUrl from the site.
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARCADE_JS = join(__dirname, "..", "public", "arcade.js");

const raw = readFileSync(ARCADE_JS, "utf8");
const match = raw.match(/const RAW_GAMES = \[([\s\S]*?)\];/);
if (!match) {
  console.error("Could not find RAW_GAMES in arcade.js");
  process.exit(1);
}

const gameIds = [];
const idRe = /"id"\s*:\s*"([^"]+)"/g;
let m;
while ((m = idRe.exec(match[1])) !== null) {
  if (!m[1].startsWith("_")) gameIds.push(m[1]);
}

const results = {};
for (const id of gameIds) {
  const url = `https://www.crazygames.com/game/${id}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "GMXReply/arcade-cover-fetcher" },
    });
    const html = await res.text();
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      results[id] = ogMatch[1].replace(/&amp;/g, "&");
      console.log(`✓ ${id}: ${results[id].slice(0, 60)}...`);
    } else {
      console.log(`✗ ${id}: no og:image`);
    }
  } catch (e) {
    console.log(`✗ ${id}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

const outPath = join(__dirname, "..", "arcade-covers.json");
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nWrote ${outPath}`);
