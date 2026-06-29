import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(__dirname, "..", "extension");

test("extension manifest is valid MV3 copy-only side panel", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.side_panel?.default_path, "sidepanel.html");
  assert.ok(!manifest.action?.default_popup);
  assert.ok(manifest.background?.service_worker);
  assert.ok(Array.isArray(manifest.permissions) && manifest.permissions.includes("storage"));
  assert.ok(manifest.permissions.includes("sidePanel"));

  const requiredFiles = [
    manifest.side_panel.default_path,
    manifest.background.service_worker,
    "lib/site-sync-core.js",
    "lib/bank-sync-core.js",
    "site_sync.js",
    "i18n-bundle.js",
    "lib/ext-config.js",
    "lib/ext-i18n.js",
    "sidepanel.js",
  ];
  for (const rel of requiredFiles) {
    assert.ok(fs.existsSync(path.join(extDir, rel)), `missing extension file: ${rel}`);
  }
});

test("side panel loads shared extension libs before sidepanel.js", () => {
  const html = fs.readFileSync(path.join(extDir, "sidepanel.html"), "utf8");
  const configIdx = html.indexOf('src="lib/ext-config.js"');
  const i18nIdx = html.indexOf('src="lib/ext-i18n.js"');
  const panelIdx = html.indexOf('src="sidepanel.js"');
  assert.ok(configIdx >= 0, "sidepanel.html must load ext-config.js");
  assert.ok(i18nIdx >= 0, "sidepanel.html must load ext-i18n.js");
  assert.ok(panelIdx >= 0, "sidepanel.html must load sidepanel.js");
  assert.ok(configIdx < panelIdx && i18nIdx < panelIdx, "sidepanel.html lib order");
});
