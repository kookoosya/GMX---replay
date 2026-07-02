#!/usr/bin/env node
/** Copy assets/extbg → extension/extbg for extension package parity. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, "assets", "extbg");
const dest = path.join(ROOT, "extension", "extbg");

function copyDir(s, d) {
  fs.mkdirSync(d, { recursive: true });
  for (const name of fs.readdirSync(s)) {
    const sf = path.join(s, name);
    const df = path.join(d, name);
    if (fs.statSync(sf).isDirectory()) copyDir(sf, df);
    else fs.copyFileSync(sf, df);
  }
}

if (!fs.existsSync(src)) {
  console.error("missing assets/extbg");
  process.exit(1);
}
if (fs.existsSync(dest)) {
  for (const name of fs.readdirSync(dest)) {
    const full = path.join(dest, name);
    if (fs.statSync(full).isDirectory()) fs.rmSync(full, { recursive: true, force: true });
    else fs.unlinkSync(full);
  }
}
copyDir(src, dest);
console.log("sync-extension-wallpapers OK");
