import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const extDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "extension");

test("manifest uses Side Panel API", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.side_panel?.default_path, "sidepanel.html");
  assert.equal(manifest.minimum_chrome_version, "114");
  assert.ok(!manifest.action?.default_popup, "action must not use popup");
});

test("action opens Side Panel via service worker", () => {
  const bg = fs.readFileSync(path.join(extDir, "background.js"), "utf8");
  assert.match(bg, /openPanelOnActionClick:\s*true/);
  assert.match(bg, /sidepanel\.html/);
});

test("no X content scripts or host permissions", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  const hosts = (manifest.host_permissions || []).join(" ");
  assert.doesNotMatch(hosts, /x\.com|twitter\.com|all_urls/i);
  for (const cs of manifest.content_scripts || []) {
    const matches = (cs.matches || []).join(" ");
    assert.doesNotMatch(matches, /x\.com|twitter\.com/i);
  }
});

test("no DOM insertion or Post/Reply automation modules in production path", () => {
  for (const rel of ["background.js", "sidepanel.js", "site_sync.js"]) {
    const src = fs.readFileSync(path.join(extDir, rel), "utf8");
    assert.doesNotMatch(src, /insertText|execCommand\(|clickPost|clickReply|submitComposer/i);
  }
});

test("side panel loads required scripts in order", () => {
  const html = fs.readFileSync(path.join(extDir, "sidepanel.html"), "utf8");
  const configIdx = html.indexOf('src="lib/ext-config.js"');
  const i18nIdx = html.indexOf('src="lib/ext-i18n.js"');
  const bankIdx = html.indexOf('src="lib/bank-sync-core.js"');
  const panelIdx = html.indexOf('src="sidepanel.js"');
  assert.ok(configIdx >= 0 && i18nIdx >= 0 && bankIdx >= 0 && panelIdx >= 0);
  assert.ok(configIdx < panelIdx && bankIdx < panelIdx);
});

test("manifest loads bank-sync-core before site_sync", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
  const scripts = manifest.content_scripts?.[0]?.js || [];
  const bankIdx = scripts.indexOf("lib/bank-sync-core.js");
  const syncIdx = scripts.indexOf("site_sync.js");
  assert.ok(bankIdx >= 0 && syncIdx >= 0 && bankIdx < syncIdx);
});
