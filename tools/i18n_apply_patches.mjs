#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localesDir = path.join(root, "shared", "i18n", "locales");
const patchesDir = path.join(root, "shared", "i18n", "patches");

function deepAssign(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (Array.isArray(v)) target[k] = v.slice();
    else if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object" || Array.isArray(target[k])) target[k] = {};
      deepAssign(target[k], v);
    } else target[k] = v;
  }
}

for (const file of fs.readdirSync(patchesDir)) {
  if (!file.endsWith(".json")) continue;
  const code = file.replace(/-missing\.json$/, "").replace(/\.json$/, "");
  const locPath = path.join(localesDir, `${code}.json`);
  if (!fs.existsSync(locPath)) {
    console.warn("skip patch, no locale:", code);
    continue;
  }
  const loc = JSON.parse(fs.readFileSync(locPath, "utf8"));
  const patch = JSON.parse(fs.readFileSync(path.join(patchesDir, file), "utf8"));
  deepAssign(loc, patch);
  fs.writeFileSync(locPath, JSON.stringify(loc, null, 2) + "\n");
  console.log("patched", code, "from", file);
}
