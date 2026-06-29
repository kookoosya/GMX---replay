import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const extDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "extension");

test("connect requires server token not handle alone", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /\/api\/user\/init/);
  assert.match(src, /result\.data\?\.token/);
  assert.match(src, /normalizeHandle/);
});

test("invalid credential path is controlled", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /ext_connect_failed/);
  assert.match(src, /existing_session_required/);
});

test("logout clears credential and cached banks", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /async function clearPrivateData/);
  assert.match(src, /BANK_KEYS\.gm/);
  assert.match(src, /STORAGE_KEYS\.token/);
  assert.match(src, /resetSession/);
});

test("session stored in chrome.storage.local only", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /chrome\.storage\.local\.get/);
  assert.match(src, /chrome\.storage\.local\.set/);
  assert.doesNotMatch(src, /chrome\.storage\.sync/);
});

test("credential sent as Bearer header not displayed", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /Authorization.*Bearer/);
  assert.doesNotMatch(src, /textContent\s*=\s*state\.token/);
});

test("site sync restores session from open gmxreply tab", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /GMX_FORCE_SITE_SYNC/);
  assert.match(src, /hasSiteSession/);
  assert.match(src, /chrome\.storage\.onChanged/);
});
