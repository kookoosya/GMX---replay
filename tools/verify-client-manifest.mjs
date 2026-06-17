#!/usr/bin/env node
/** Verify client-manifest.json matches public/app.html script tags. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadClientManifest } from "./lib/client-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
const { scriptOrder, syncFiles } = loadClientManifest();

const htmlScripts = [];
for (const m of html.matchAll(/<script\s+defer\s+src="\/([^"?]+)(?:\?[^"]*)?"/g)) {
  htmlScripts.push(m[1]);
}

let failed = false;
if (JSON.stringify(htmlScripts) !== JSON.stringify(scriptOrder)) {
  console.error("verify-client-manifest FAIL: scriptOrder drift vs app.html");
  console.error("Run: node tools/generate-client-manifest.mjs");
  failed = true;
}

for (const s of htmlScripts) {
  if (!syncFiles.includes(s)) {
    console.error(`verify-client-manifest FAIL: ${s} missing from syncFiles`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`verify-client-manifest OK (${scriptOrder.length} scripts, ${syncFiles.length} sync files)`);
