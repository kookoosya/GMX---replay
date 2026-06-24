import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadArcadeCatalogGames } from "../tools/lib/load-arcade-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extDir = path.join(root, "extension");

function dayOfYear(d = new Date()) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

function gameOfTheDay(games, d = new Date()) {
  if (!Array.isArray(games) || !games.length) return null;
  return games[dayOfYear(d) % games.length] || null;
}

test("gotd-games.json mirrors arcade catalog order", () => {
  const gotdPath = path.join(extDir, "lib", "gotd-games.json");
  assert.ok(fs.existsSync(gotdPath), "extension/lib/gotd-games.json missing — run npm run arcade:build");
  const gotd = JSON.parse(fs.readFileSync(gotdPath, "utf8"));
  const catalog = loadArcadeCatalogGames();
  assert.equal(gotd.games.length, catalog.length);
  assert.equal(gotd.games[0].id, catalog[0].id);
  assert.equal(gotd.games.at(-1).id, catalog.at(-1).id);
});

test("gotd-core.js exports gameOfTheDay helper", () => {
  const src = fs.readFileSync(path.join(extDir, "lib", "gotd-core.js"), "utf8");
  assert.match(src, /GMXGotdCore/);
  assert.match(src, /gameOfTheDay/);
});

test("background schedules daily gotd toast", () => {
  const bg = fs.readFileSync(path.join(extDir, "background.js"), "utf8");
  assert.match(bg, /maybeShowGotdToast/);
  assert.match(bg, /ALARM_GOTD/);
  assert.match(bg, /gotd:/);
});

test("popup loads gotd core and deep-links slug", () => {
  const popupHtml = fs.readFileSync(path.join(extDir, "popup.html"), "utf8");
  assert.match(popupHtml, /gotd-core\.js/);
  const popup = fs.readFileSync(path.join(extDir, "popup.js"), "utf8");
  assert.match(popup, /gotdArcadeUrl/);
  assert.match(popup, /\/arcade\//);
});

test("gameOfTheDay picks stable index for fixed date", () => {
  const gotd = JSON.parse(fs.readFileSync(path.join(extDir, "lib", "gotd-games.json"), "utf8"));
  const d = new Date(2026, 5, 17);
  const a = gameOfTheDay(gotd.games, d);
  const b = gameOfTheDay(gotd.games, d);
  assert.equal(a.id, b.id);
  assert.ok(a.name);
});
