#!/usr/bin/env node
/** List arcade games that share the same imageUrl (likely copy-paste errors). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arcadePath = path.join(root, "public", "arcade.js");
const raw = fs.readFileSync(arcadePath, "utf8");
const block = raw.match(/const RAW_GAMES = \[([\s\S]*?)\];/)?.[1] || "";

const games = [];
for (const chunk of block.matchAll(/\{[^{}]+\}/g)) {
  const id = chunk[0].match(/"id"\s*:\s*"([^"]+)"/)?.[1];
  const imageUrl = chunk[0].match(/"imageUrl"\s*:\s*"([^"]*)"/)?.[1];
  const embedUrl = chunk[0].match(/"embedUrl"\s*:\s*"([^"]*)"/)?.[1];
  if (id && !id.startsWith("_")) games.push({ id, imageUrl: imageUrl || "", embedUrl: embedUrl || "" });
}

const byUrl = new Map();
for (const g of games) {
  const key = g.imageUrl || "(empty)";
  if (!byUrl.has(key)) byUrl.set(key, []);
  byUrl.get(key).push(g);
}

let collisions = 0;
for (const [url, list] of byUrl) {
  if (list.length <= 1 || url === "(empty)") continue;
  collisions += 1;
  console.log(`\nSHARED (${list.length} games): ${url.slice(0, 100)}`);
  for (const g of list) {
    const slug = g.embedUrl.match(/\/embed\/([^/?#]+)/)?.[1] || "?";
    console.log(`  - ${g.id} (embed: ${slug})`);
  }
}

if (!collisions) {
  console.log("No shared imageUrl collisions.");
} else {
  console.log(`\nTotal collision groups: ${collisions}`);
  process.exit(1);
}
