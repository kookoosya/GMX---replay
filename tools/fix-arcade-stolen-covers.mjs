#!/usr/bin/env node
/**
 * Fix arcade games that borrowed another game's imageUrl.
 * Verified URLs come from arcade-covers.json; otherwise imageUrl is cleared
 * so runtime uses category SVG (never a wrong game's photo).
 *
 * Run: node tools/fix-arcade-stolen-covers.mjs
 * Verify: node tools/audit-arcade-cover-collisions.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arcadePath = path.join(root, "public", "arcade.js");
const coversPath = path.join(root, "arcade-covers.json");

const covers = JSON.parse(fs.readFileSync(coversPath, "utf8"));
let arcade = fs.readFileSync(arcadePath, "utf8");

/** Non-canonical side of each collision group (see audit-arcade-cover-collisions.mjs). */
const STOLEN_IDS = [
  "hazmob-fps",
  "zombie-derby-pixel",
  "super-bowling",
  "solitaire-home",
  "hole-io",
  "minecraft-classic",
  "subway-surfers",
  "marble-shooter",
  "bullet-force",
];

function patchImageUrl(source, id, nextUrl) {
  const re = new RegExp(
    `("id"\\s*:\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?"imageUrl"\\s*:\\s*")[^"]*(")`,
    "m"
  );
  const next = source.replace(re, `$1${nextUrl}$2`);
  if (next === source) {
    throw new Error(`fix-arcade-stolen-covers: could not patch imageUrl for id=${id}`);
  }
  return next;
}

let fixed = 0;
for (const id of STOLEN_IDS) {
  const nextUrl = typeof covers[id] === "string" ? covers[id] : "";
  arcade = patchImageUrl(arcade, id, nextUrl);
  fixed += 1;
  console.log(`${id} -> ${nextUrl ? nextUrl.slice(0, 72) + "..." : "(empty, category fallback)"}`);
}

fs.writeFileSync(arcadePath, arcade);
console.log(`\nPatched ${fixed} games in public/arcade.js`);
