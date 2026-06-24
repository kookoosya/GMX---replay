import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUICK_PRESETS, getQuickPreset, legacyPresetId } from "../tools/lib/gmgn-quick-presets-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("quick preset map defines casual professional fun", () => {
  assert.ok(getQuickPreset("casual"));
  assert.ok(getQuickPreset("professional"));
  assert.ok(getQuickPreset("fun"));
  assert.equal(legacyPresetId("pro"), "professional");
});

test("professional preset uses alpha style and king pack", () => {
  const p = QUICK_PRESETS.professional;
  assert.equal(p.style, "alpha");
  assert.equal(p.pack, "king");
  assert.equal(p.mode, "mid");
});

test("gm/gn tabs expose quick preset controls", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const id of [
    "gm_quick_presets_label",
    "gn_quick_presets_label",
    "gm_preset_casual",
    "gm_preset_professional",
    "gm_preset_fun",
    "gn_preset_casual",
    "gn_preset_professional",
    "gn_preset_fun",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html, /data-preset="pro"/);
});

test("gmgnwire wires quick presets with apply helper", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.gmgnwire.js"), "utf8");
  assert.match(src, /wireQuickPresets/);
  assert.match(src, /applyQuickPreset/);
  assert.match(src, /professional/);
});

test("en locale defines quick preset copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["gm_preset_professional", "gmControlsHelp", "gm_quick_presets_label"]) {
    assert.ok(en[key], `missing ${key}`);
  }
});
