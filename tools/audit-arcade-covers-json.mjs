#!/usr/bin/env node
/**
 * arcade-covers.json must not duplicate URLs across game ids and must match
 * public/arcade.js imageUrl when both define a cover for the same id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arcadePath = path.join(root, "public", "arcade.js");
const coversPath = path.join(root, "arcade-covers.json");

const covers = JSON.parse(fs.readFileSync(coversPath, "utf8"));
const raw = fs.readFileSync(arcadePath, "utf8");
const block = raw.match(/const RAW_GAMES = \[([\s\S]*?)\];/)?.[1] || "";

const arcadeById = new Map();
for (const chunk of block.matchAll(/\{[^{}]+\}/g)) {
  const id = chunk[0].match(/"id"\s*:\s*"([^"]+)"/)?.[1];
  const imageUrl = chunk[0].match(/"imageUrl"\s*:\s*"([^"]*)"/)?.[1] || "";
  if (id && !id.startsWith("_")) arcadeById.set(id, imageUrl);
}

let issues = 0;

const byUrl = new Map();
for (const [id, url] of Object.entries(covers)) {
  if (!url || typeof url !== "string") continue;
  if (!byUrl.has(url)) byUrl.set(url, []);
  byUrl.get(url).push(id);
}

for (const [url, ids] of byUrl) {
  if (ids.length <= 1) continue;
  issues += 1;
  console.error(`DUPLICATE covers.json URL (${ids.length} ids): ${url.slice(0, 90)}...`);
  console.error(`  ids: ${ids.join(", ")}`);
}

for (const [id, url] of Object.entries(covers)) {
  if (!url || typeof url !== "string") continue;
  const arcadeUrl = arcadeById.get(id);
  if (!arcadeUrl) continue;
  if (arcadeUrl !== url) {
    issues += 1;
    console.error(`MISMATCH ${id}:`);
    console.error(`  arcade.js:  ${arcadeUrl.slice(0, 90)}...`);
    console.error(`  covers.json: ${url.slice(0, 90)}...`);
  }
}

if (issues) {
  console.error(`\naudit-arcade-covers-json: ${issues} issue(s)`);
  process.exit(1);
}

console.log("arcade-covers.json OK");
