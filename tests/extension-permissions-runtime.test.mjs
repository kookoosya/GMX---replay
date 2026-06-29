import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseBankPayload,
  MAX_BANK_LINES,
  MAX_LINE_CHARS,
} from "../tools/lib/bank-sync-core.mjs";

const extDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "extension");

test("manifest does not request tabs permission", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  assert.ok(!(manifest.permissions || []).includes("tabs"));
  const hosts = (manifest.host_permissions || []).join(" ");
  assert.match(hosts, /gmxreply\.com/);
});

test("sidepanel uses tabs API only with gmxreply url filter and tab.id", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /chrome\.tabs\.query\(\{[\s\S]*url:\s*\[[\s\S]*gmxreply\.com/);
  assert.doesNotMatch(src, /\btab\.(url|title|favIconUrl|pendingUrl)\b/);
  assert.match(src, /tab\.id/);
});

test("site_sync accepts only GMX_FORCE_SITE_SYNC from extension sender", () => {
  const src = fs.readFileSync(path.join(extDir, "site_sync.js"), "utf8");
  assert.match(src, /GMX_FORCE_SITE_SYNC/);
  assert.match(src, /forbidden_sender/);
  assert.match(src, /senderUrl/);
  assert.match(src, /event\.origin/);
});

test("oversized bank payload is bounded", () => {
  const huge = Array.from({ length: MAX_BANK_LINES + 50 }, (_, i) => `line ${i}`).join("\n");
  const parsed = parseBankPayload(huge);
  assert.equal(parsed.lines.length, MAX_BANK_LINES);
  assert.equal(parsed.truncated, true);
});

test("bank lines cap character length", () => {
  const long = "x".repeat(MAX_LINE_CHARS + 40);
  const parsed = parseBankPayload(long);
  assert.equal(parsed.lines[0].length, MAX_LINE_CHARS);
});

test("HTML in saved reply stays plain text via textContent render", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  const render = src.slice(src.indexOf("function renderCards"), src.indexOf("async function copyLine"));
  assert.match(render, /textContent = text/);
  const payload = parseBankPayload("<script>alert(1)</script>");
  assert.equal(payload.lines[0], "<script>alert(1)</script>");
});

test("logout clears private bank cache keys", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /BANK_KEYS\.gm/);
  assert.match(src, /BANK_KEYS\.gn/);
  assert.match(src, /STORAGE_KEYS\.token/);
  assert.match(src, /clearPrivateData/);
});

test("account switch path clears previous banks on reset", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /resetSession/);
  assert.match(src, /state\.banks = \{ gm: \[\], gn: \[\] \}/);
});
