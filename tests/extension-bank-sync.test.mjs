import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseBankPayload,
  dedupeBankLines,
  filterBankLines,
  EXT_BANK_GM_KEY,
  EXT_BANK_GN_KEY,
} from "../tools/lib/bank-sync-core.mjs";

const extDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "extension");

test("bank-sync-core dedupes and preserves unicode", () => {
  const raw = "gm ☀️\ngm ☀️\ngn 🌙";
  const parsed = parseBankPayload(raw);
  assert.equal(parsed.lines.length, 2);
  assert.ok(parsed.lines[0].includes("☀️"));
});

test("GM and GN banks use separate storage keys", () => {
  assert.notEqual(EXT_BANK_GM_KEY, EXT_BANK_GN_KEY);
  const siteSync = fs.readFileSync(path.join(extDir, "site_sync.js"), "utf8");
  assert.match(siteSync, new RegExp(EXT_BANK_GM_KEY));
  assert.match(siteSync, new RegExp(EXT_BANK_GN_KEY));
  assert.match(siteSync, /gmx_gm_bank/);
  assert.match(siteSync, /gmx_gn_bank/);
});

test("sidepanel reads separate GM/GN banks", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /banks:\s*\{\s*gm:/);
  assert.match(src, /state\.tab === "gn"/);
});

test("filterBankLines supports search without mixing kinds", () => {
  const gm = ["good morning alice", "gm team"];
  const gn = ["good night bob"];
  assert.deepEqual(filterBankLines(gm, "alice"), ["good morning alice"]);
  assert.deepEqual(filterBankLines(gn, "alice"), []);
});

test("dedupe keeps stable order", () => {
  const lines = dedupeBankLines(["a", "b", "a", "c"]);
  assert.deepEqual(lines, ["a", "b", "c"]);
});

test("site_sync updates syncedAt when banks change", () => {
  const siteSync = fs.readFileSync(path.join(extDir, "site_sync.js"), "utf8");
  assert.match(siteSync, /EXT_BANK_SYNCED_AT/);
  assert.match(siteSync, /Date\.now\(\)/);
});

test("sidepanel refresh has inflight guard", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /refreshInflight/);
  assert.match(src, /if \(state\.refreshInflight\) return/);
});
