#!/usr/bin/env node
/**
 * Build client-manifest.json from public/app.html + known static shell files.
 * Run after adding scripts to app.html: node tools/generate-client-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "public", "app.html");
const outPath = path.join(root, "client-manifest.json");

const html = fs.readFileSync(htmlPath, "utf8");

/** @type {string[]} */
const scriptOrder = [];
for (const m of html.matchAll(/<script\s+defer\s+src="\/([^"?]+)(?:\?[^"]*)?"/g)) {
  scriptOrder.push(m[1]);
}

const staticShell = [
  "app.html",
  "app.css",
  "app.js",
  "mode.js",
  "entitlements.js",
  "themes.json",
  "arcade.html",
  "arcade.js",
  "extension-config.json",
];

const syncFiles = [...new Set([...staticShell, ...scriptOrder.map((s) => s.replace(/^i18n\//, "i18n/"))])];

// i18n bundle path in html is i18n/siteI18n.js — ensure listed once
if (!syncFiles.includes("i18n/siteI18n.js") && scriptOrder.includes("i18n/siteI18n.js")) {
  syncFiles.splice(syncFiles.indexOf("app.html") + 1, 0, "i18n/siteI18n.js");
}

const manifest = {
  version: 1,
  generatedFrom: "public/app.html",
  generatedAt: new Date().toISOString(),
  syncFiles: syncFiles.sort((a, b) => a.localeCompare(b)),
  scriptOrder,
  headScripts: [
    { src: "/mode.js", query: "v=SAFE12", async: false },
    { src: "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js", external: true, async: true },
  ],
};

// Keep stable order: static first, then scripts in html order (not sorted for sync - parity needs exact list)
const orderedSync = [
  "app.html",
  "app.js",
  "app.css",
  ...scriptOrder.filter((s) => s !== "i18n/siteI18n.js").map((s) => s),
  "arcade.html",
  "arcade.js",
  "entitlements.js",
  "mode.js",
  "themes.json",
];
// Add i18n if in scripts
if (scriptOrder.includes("i18n/siteI18n.js")) {
  const idx = orderedSync.indexOf("app.storage.js");
  if (idx > 0) orderedSync.splice(idx, 0, "i18n/siteI18n.js");
}
manifest.syncFiles = [...new Set(orderedSync)];

fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${outPath} (${manifest.syncFiles.length} sync files, ${scriptOrder.length} defer scripts)`);
