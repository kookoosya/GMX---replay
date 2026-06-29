import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dedupeBankLines } from "../tools/lib/bank-sync-core.mjs";

const extDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "extension");

test("copyLine uses exact trimmed text", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /const value = String\(text \|\| ""\)\.trim\(\)/);
  assert.match(src, /writeText\(value\)/);
});

test("unicode and emoji preserved in bank dedupe", () => {
  const line = "gm おはよう 🌸";
  const out = dedupeBankLines([line, line]);
  assert.equal(out.length, 1);
  assert.equal(out[0], line);
});

test("copy failure shows clipboard blocked message", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /ext_copy_clipboard_blocked/);
});

test("card text uses textContent not innerHTML", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  const render = src.slice(src.indexOf("function renderCards"), src.indexOf("async function copyLine"));
  assert.match(render, /body\.textContent = text/);
  assert.doesNotMatch(render, /innerHTML\s*=\s*text/);
});

test("copy feedback does not append suffix to clipboard", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  const copyFn = src.slice(src.indexOf("async function copyLine"), src.indexOf("async function apiRequest"));
  assert.doesNotMatch(copyFn, /writeText\([^)]*\+/);
});
