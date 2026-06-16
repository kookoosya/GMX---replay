#!/usr/bin/env node
/**
 * Apply arcade-covers.json URLs to public/arcade.js
 * Run: node tools/apply-arcade-covers.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARCADE_JS = path.join(ROOT, "public", "arcade.js");
const COVERS_JSON = path.join(ROOT, "arcade-covers.json");

const covers = JSON.parse(fs.readFileSync(COVERS_JSON, "utf8"));
let arcade = fs.readFileSync(ARCADE_JS, "utf8");

let applied = 0;
for (const [id, url] of Object.entries(covers)) {
  if (!url || typeof url !== "string") continue;
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `("id"\\s*:\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^}]*)"imageUrl"\\s*:\\s*"[^"]*"`,
    "g"
  );
  const repl = `$1"imageUrl":"${url}"`;
  const before = arcade;
  arcade = arcade.replace(pattern, repl);
  if (arcade !== before) applied++;
}
fs.writeFileSync(ARCADE_JS, arcade);
console.log(`Applied ${applied} cover URLs to arcade.js`);
