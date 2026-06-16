#!/usr/bin/env node
/** Check which arcade game imageUrls return 200 vs 404 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arcadePath = path.join(__dirname, "..", "public", "arcade.js");
const content = fs.readFileSync(arcadePath, "utf8");

const re = /"imageUrl":\s*"([^"]+)"/g;
const urls = [];
let m;
while ((m = re.exec(content))) urls.push(m[1]);

const unique = [...new Set(urls)];
console.log(`Checking ${unique.length} unique image URLs...\n`);

const failed = [];
for (const url of unique) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    if (!r.ok) {
      failed.push({ url, status: r.status });
      console.log(`FAIL ${r.status}: ${url.slice(0, 80)}...`);
    }
  } catch (e) {
    failed.push({ url, error: e.message });
    console.log(`ERR: ${url.slice(0, 80)}...`);
  }
}
console.log(`\n${failed.length} failed of ${unique.length}`);
