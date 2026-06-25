import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { themeGroup, groupThemeItems, THEME_GROUP_ORDER } from "../tools/lib/theme-group-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("themeGroup classifies dark light and colorful palettes", () => {
  assert.equal(themeGroup({ a: "rgba(5,7,14,1)", b: "rgba(15,23,42,1)" }), "dark");
  assert.equal(themeGroup({ a: "rgba(250,250,250,1)", b: "rgba(220,220,225,1)" }), "light");
  assert.equal(themeGroup({ a: "rgba(124,92,255,1)", b: "rgba(0,229,255,1)" }), "colorful");
});

test("groupThemeItems preserves order dark light colorful", () => {
  const items = [
    { th: { id: "c", a: "rgba(124,92,255,1)", b: "rgba(0,229,255,1)" }, idx: 0 },
    { th: { id: "d", a: "rgba(5,7,14,1)", b: "rgba(15,23,42,1)" }, idx: 1 },
    { th: { id: "l", a: "rgba(250,250,250,1)", b: "rgba(220,220,225,1)" }, idx: 2 },
  ];
  const groups = groupThemeItems(items);
  assert.deepEqual(
    groups.map((g) => g.id),
    THEME_GROUP_ORDER.filter((id) => groups.some((g) => g.id === id))
  );
});

test("themes ui supports hover preview and grouping", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.themesui.js"), "utf8");
  assert.match(src, /GMXThemeGroupCore/);
  assert.match(src, /previewRestoreId/);
  assert.match(src, /themeProHint/);
  assert.match(src, /themeGroupSection/);
});

test("themes css styles groups preview and pro hint", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.themeGroupSection/);
  assert.match(css, /\.themeCard\.previewing/);
  assert.match(css, /\.themeProHint/);
});

test("themes tab exposes grouped grid root", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="themeGrid"/);
  assert.match(html, /lib\/theme-group-core\.js/);
});

test("en locale defines theme group and pro unlock copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of [
    "themes_group_dark",
    "themes_group_light",
    "themes_group_colorful",
    "themes_pro_unlocks_all",
    "themes_hover_preview",
  ]) {
    assert.ok(en[key], `missing ${key}`);
  }
});
