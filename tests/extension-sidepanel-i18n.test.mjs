import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "shared", "i18n", "locales");
const LOCALES = [
  "en", "ru", "uk", "de", "fr", "es", "pt", "it", "nl", "tr", "pl", "id", "hi", "ja", "zh",
];

const REQUIRED_KEYS = [
  "ext_btn_connect",
  "ext_connect_connected",
  "ext_btn_reset",
  "ext_btn_gm",
  "ext_btn_gn",
  "ext_bank_refresh",
  "ext_bank_syncing",
  "ext_bank_last_synced",
  "ext_search_placeholder",
  "ext_sidepanel_copy",
  "ext_sidepanel_copied",
  "bank_empty_title_gm",
  "bank_empty_title_gn",
  "ext_sidepanel_open_site",
  "ext_bank_offline_cached",
  "ext_connect_session_expired",
  "ext_sidepanel_manual_copy",
  "ext_sidepanel_no_autopost",
  "ext_sidepanel_subtitle",
  "ext_sidepanel_empty_hint",
];

for (const loc of LOCALES) {
  test(`locale ${loc} defines side panel keys`, () => {
    const j = JSON.parse(fs.readFileSync(path.join(localesDir, `${loc}.json`), "utf8"));
    for (const key of REQUIRED_KEYS) {
      assert.ok(j[key], `${loc} missing ${key}`);
    }
    assert.ok(Array.isArray(j.ext_sync_list) && j.ext_sync_list.length >= 3, `${loc} ext_sync_list`);
    const panelBlob = JSON.stringify(
      Object.fromEntries(
        Object.entries(j).filter(([k]) => k.startsWith("ext_sidepanel_") || k.startsWith("ext_bank_"))
      )
    );
    assert.doesNotMatch(panelBlob, /Quick 1|Batch 10|auto-reply|insert into X/i);
  });
}

test("extension i18n bundle includes side panel keys", () => {
  const src = fs.readFileSync(path.join(root, "extension", "i18n-bundle.js"), "utf8");
  for (const key of ["ext_sidepanel_copy", "ext_sidepanel_subtitle", "ext_bank_refresh"]) {
    assert.match(src, new RegExp(key));
  }
});
