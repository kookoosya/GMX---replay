import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gameOfTheDay, gotdArcadePlayUrl, todayKey } from "../tools/lib/gotd-core.mjs";
import { loadArcadeCatalogGames } from "../tools/lib/load-arcade-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extDir = path.join(root, "extension");

test("gotd-games.json mirrors arcade catalog with rich fields", () => {
  const gotdPath = path.join(extDir, "lib", "gotd-games.json");
  assert.ok(fs.existsSync(gotdPath), "extension/lib/gotd-games.json missing — run npm run arcade:build");
  const gotd = JSON.parse(fs.readFileSync(gotdPath, "utf8"));
  const catalog = loadArcadeCatalogGames();
  assert.equal(gotd.games.length, catalog.length);
  assert.equal(gotd.games[0].id, catalog[0].id);
  assert.equal(gotd.games[0].category, catalog[0].category);
  assert.ok("access" in gotd.games[0]);
  assert.ok("imageUrl" in gotd.games[0]);
});

test("gotd-core.js exports gameOfTheDay helper", () => {
  const src = fs.readFileSync(path.join(extDir, "lib", "gotd-core.js"), "utf8");
  assert.match(src, /GMXGotdCore/);
  assert.match(src, /gameOfTheDay/);
});

test("copy-only extension background does not schedule GOTD toasts", () => {
  const bg = fs.readFileSync(path.join(extDir, "background.js"), "utf8");
  assert.doesNotMatch(bg, /maybeShowGotdToast/);
  assert.doesNotMatch(bg, /ALARM_GOTD/);
  assert.match(bg, /sidePanel/);
});

test("shared gotd core picks stable game and play url", () => {
  const gotd = JSON.parse(fs.readFileSync(path.join(extDir, "lib", "gotd-games.json"), "utf8"));
  const d = new Date(2026, 5, 17);
  const a = gameOfTheDay(gotd.games, d);
  const b = gameOfTheDay(gotd.games, d);
  assert.equal(a.id, b.id);
  assert.ok(a.name);
  assert.match(gotdArcadePlayUrl("https://www.gmxreply.com", a), /arcade\.html\?game=/);
  assert.match(todayKey(d), /^2026-/);
});
