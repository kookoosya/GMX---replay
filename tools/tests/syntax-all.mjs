#!/usr/bin/env node
/**
 * Syntax-check deployable JS/MJS (excludes site-src fragments and one-off patch scripts).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fail, ok } from "./_helpers.mjs";

const root = process.cwd();

const globs = [
  "index.js",
  "smoke.js",
  "public/**/*.js",
  "server/**/*.mjs",
  "extension/**/*.js",
  "tools/build-*.mjs",
  "tools/sync-*.mjs",
  "tools/verify-*.mjs",
  "tools/check-*.mjs",
  "tools/logic-audit.mjs",
  "tools/runtime_audit.mjs",
  "tools/run-tests.mjs",
  "tools/smoke-api.mjs",
  "tools/tests/**/*.mjs",
  "frontend/public/**/*.js",
];

const skip = new Set([
  "node_modules",
  ".git",
  "dist",
  "frontend/dist",
  "logs",
]);

function expand(pattern) {
  const files = [];
  const parts = pattern.split("/");
  function walk(base, idx) {
    if (idx >= parts.length) {
      if (fs.existsSync(base) && fs.statSync(base).isFile()) files.push(base);
      return;
    }
    const seg = parts[idx];
    if (seg === "**") {
      if (!fs.existsSync(base)) return;
      for (const name of fs.readdirSync(base)) {
        if (skip.has(name)) continue;
        const full = path.join(base, name);
        if (fs.statSync(full).isDirectory()) walk(full, idx);
        else if (name.endsWith(".js") || name.endsWith(".mjs")) files.push(full);
      }
      return;
    }
    if (seg.includes("*")) {
      if (!fs.existsSync(base)) return;
      const rx = new RegExp("^" + seg.replace(/\*/g, ".*") + "$");
      for (const name of fs.readdirSync(base)) {
        if (!rx.test(name)) continue;
        walk(path.join(base, name), idx + 1);
      }
      return;
    }
    walk(path.join(base, seg), idx + 1);
  }
  walk(root, 0);
  return files;
}

const files = [...new Set(globs.flatMap(expand))].sort();
let bad = 0;
for (const file of files) {
  const rel = path.relative(root, file);
  const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (check.status !== 0) {
    bad++;
    console.error(`  syntax ${rel}: ${(check.stderr || check.stdout || "").trim().split("\n")[0]}`);
  }
}

if (bad) fail(`${bad} file(s) failed syntax check (${files.length} checked)`);
ok(`syntax-all (${files.length} files)`);
