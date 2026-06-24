import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(__dirname, "..", "extension");

test("extension manifest is valid MV3 with required scripts", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.action?.default_popup);
  assert.ok(manifest.background?.service_worker);
  assert.ok(Array.isArray(manifest.permissions) && manifest.permissions.includes("storage"));

  const requiredFiles = [
    manifest.action.default_popup,
    manifest.background.service_worker,
    "lib/site-sync-core.js",
    "site_sync.js",
    "i18n-bundle.js",
    "lib/ext-config.js",
    "lib/ext-i18n.js",
    "lib/gotd-core.js",
    "lib/gotd-games.json",
    "popup.js",
  ];
  for (const rel of requiredFiles) {
    assert.ok(fs.existsSync(path.join(extDir, rel)), `missing extension file: ${rel}`);
  }
});

test("popup and quick panel load shared extension libs before popup.js", () => {
  for (const htmlName of ["popup.html", "quick.html"]) {
    const html = fs.readFileSync(path.join(extDir, htmlName), "utf8");
    const configIdx = html.indexOf('src="lib/ext-config.js"');
    const i18nIdx = html.indexOf('src="lib/ext-i18n.js"');
    const popupIdx = html.indexOf('src="popup.js"');
    assert.ok(configIdx >= 0, `${htmlName} must load ext-config.js`);
    assert.ok(i18nIdx >= 0, `${htmlName} must load ext-i18n.js`);
    assert.ok(popupIdx >= 0, `${htmlName} must load popup.js`);
    assert.ok(configIdx < popupIdx && i18nIdx < popupIdx, `${htmlName} lib order`);
  }
});
