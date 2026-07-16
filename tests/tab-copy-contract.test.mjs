import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("top-level app panes expose a description target", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  for (const [pane, description] of [
    ["home", "home_desc"],
    ["gm", "gm_desc"],
    ["gn", "gn_desc"],
    ["prediction", "pm_desc"],
    ["wallet", "wallet_desc"],
    ["referrals", "r_note"],
    ["themes", "themes_desc"],
    ["extthemes", "extthemes_note"],
  ]) {
    assert.match(html, new RegExp(`id="tab-${pane}"`), `${pane} pane missing`);
    assert.match(html, new RegExp(`id="${description}"`), `${pane} description missing`);
  }
});

test("English tab copy matches current product behavior", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.match(en.home_desc, /guest samples/i);
  assert.match(en.h_note, /without a wallet or handle/i);
  assert.match(en.gm_desc, /50 lifetime generation credits shared by GM and GN/i);
  assert.match(en.gn_desc, /50 lifetime generation credits shared by GM and GN/i);
  assert.doesNotMatch(en.pm_desc, /after launch/i);
  assert.doesNotMatch(en.themes_right_desc, /^HTML:/i);
  assert.match(en.extthemes_right_desc, /60 skins and 60 wallpapers/i);
});

test("all shipped locales keep the tab-copy key set", () => {
  const localeDir = path.join(root, "shared", "i18n", "locales");
  const keys = [
    "home_desc", "h_note", "gm_desc", "gn_desc", "pm_desc", "wallet_desc",
    "r_note", "themes_desc", "extthemes_note", "extthemes_right_desc",
  ];
  for (const file of fs.readdirSync(localeDir).filter((name) => name.endsWith(".json"))) {
    const locale = JSON.parse(fs.readFileSync(path.join(localeDir, file), "utf8"));
    for (const key of keys) assert.ok(String(locale[key] || "").trim(), `${file} missing ${key}`);
  }
});
