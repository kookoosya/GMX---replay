import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const extDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "extension");

const PROD_FILES = ["background.js", "sidepanel.js", "site_sync.js", "manifest.json"];

test("production extension does not read X pages", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  assert.ok(!(manifest.permissions || []).includes("cookies"));
  const hosts = (manifest.host_permissions || []).join(" ");
  assert.doesNotMatch(hosts, /x\.com|twitter/i);
});

test("sidepanel copies on user click only via Clipboard API", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  assert.match(src, /addEventListener\("click", \(\) => void copyLine/);
  assert.match(src, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(src, /document\.execCommand\("copy"/);
});

test("sidepanel does not modify open tabs or send page messages for copy", () => {
  const src = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  const copyFn = src.slice(src.indexOf("async function copyLine"), src.indexOf("async function apiRequest"));
  assert.doesNotMatch(copyFn, /chrome\.tabs\.(sendMessage|executeScript|insertCSS)/);
  assert.doesNotMatch(copyFn, /postMessage/);
});

test("no generation or auto-post controls in side panel", () => {
  const html = fs.readFileSync(path.join(extDir, "sidepanel.html"), "utf8");
  const js = fs.readFileSync(path.join(extDir, "sidepanel.js"), "utf8");
  for (const needle of ["Generate", "/api/generate", "/api/random-bulk", "Quick 1", "Batch 10", "auto-post", "insert"]) {
    if (needle === "insert" && html.includes("data-i18n")) continue;
    assert.doesNotMatch(js, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("no X selectors in production package scripts", () => {
  const combined = PROD_FILES.map((f) => fs.readFileSync(path.join(extDir, f), "utf8")).join("\n");
  assert.doesNotMatch(combined, /data-testid|tweetTextarea|composer|timeline/i);
});

test("site_sync only runs on gmxreply.com", () => {
  const src = fs.readFileSync(path.join(extDir, "site_sync.js"), "utf8");
  assert.match(src, /gmxreply\.com/);
  assert.match(src, /isAllowedOrigin/);
  assert.doesNotMatch(src, /x\.com|twitter\.com/);
});
