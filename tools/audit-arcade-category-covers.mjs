#!/usr/bin/env node
/**
 * Ensure every Arcade category has a generated .webp cover on disk.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specPath = path.join(root, "tools", "arcade-category-covers.json");
const outDir = path.join(root, "assets", "arcade", "covers", "categories");
const arcadePath = path.join(root, "public", "arcade.js");

const { categories } = JSON.parse(fs.readFileSync(specPath, "utf8"));
const arcade = fs.readFileSync(arcadePath, "utf8");

let issues = 0;
for (const key of Object.keys(categories)) {
  const file = path.join(outDir, `${key}.webp`);
  if (!fs.existsSync(file)) {
    console.error(`  missing ${key}.webp`);
    issues++;
  }
}

if (!arcade.includes("categoryCoverWebp")) {
  console.error("  public/arcade.js missing categoryCoverWebp()");
  issues++;
}
if (!arcade.includes("/assets/arcade/covers/categories/")) {
  console.error("  public/arcade.js missing category webp asset path");
  issues++;
}

if (issues) {
  console.error(`\naudit-arcade-category-covers: ${issues} issue(s)`);
  process.exit(1);
}

console.log(`arcade category covers OK (${Object.keys(categories).length} webp files)`);
