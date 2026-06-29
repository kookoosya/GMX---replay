import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(__dirname, "..", "extension", "i18n-bundle.js");

test("extension i18n bundle exposes SITE_I18N with en and side panel keys", () => {
  const src = fs.readFileSync(bundlePath, "utf8");
  assert.match(src, /SITE_I18N/);
  assert.match(src, /"en"\s*:/);
  assert.match(src, /ext_btn_gm/);
  assert.match(src, /ext_sidepanel_subtitle/);
  assert.match(src, /ext_sidepanel_copy/);
});
