import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("extension tab exposes sync hub and store CTA", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of ["ext_sync_hub", "ext_sync_hub_title", "ext_sync_list", "ext_chrome_store_btn"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /href="\/get-extension"/);
  assert.match(html, /target="_blank"/);
});

test("extension tab shows popup and inline preview assets", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /\/assets\/ext\/popup-preview\.svg/);
  assert.match(html, /\/assets\/ext\/inline-preview\.svg/);
  for (const file of ["popup-preview.svg", "inline-preview.svg"]) {
    assert.ok(fs.existsSync(path.join(root, "public", "assets", "ext", file)), file);
  }
});

test("extension tab css styles sync hub and previews", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.extSyncHub/);
  assert.match(css, /\.extPreviewRow/);
});

test("en locale defines extension sync hub copy for side panel", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.ok(Array.isArray(en.ext_sync_list) && en.ext_sync_list.length >= 3);
  for (const key of [
    "ext_sync_hub_title",
    "ext_sync_hub_desc",
    "ext_chrome_store_btn",
    "ext_chrome_store_hint",
    "ext_preview_popup_caption",
    "ext_sidepanel_subtitle",
  ]) {
    assert.ok(en[key], key);
  }
  assert.match(en.ext_sync_hub_desc, /Side Panel/i);
  assert.doesNotMatch(en.ext_preview_inline_caption, /on X page|inside X/i);
});

test("get-extension route exists for chrome store redirect", () => {
  const src = fs.readFileSync(path.join(root, "server", "routes", "static.mjs"), "utf8");
  assert.match(src, /\/get-extension/);
  assert.match(src, /EXTENSION_STORE_URL/);
});
