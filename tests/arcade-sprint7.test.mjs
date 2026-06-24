import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseQuickInsertInput, normalizeQuickGames } from "../tools/lib/arcade-quick-insert.mjs";
import { loadArcadeCatalogGames } from "../tools/lib/load-arcade-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

test("quick insert: crazygames game URL", () => {
  const out = parseQuickInsertInput("https://www.crazygames.com/game/agario");
  assert.ok(out.game);
  assert.equal(out.game.embedUrl, "https://www.crazygames.com/embed/agario");
  assert.match(out.game.id, /^quick-/);
});

test("quick insert: crazygames embed URL", () => {
  const out = parseQuickInsertInput("https://www.crazygames.com/embed/drift-hunters");
  assert.ok(out.game);
  assert.equal(out.game.embedUrl, "https://www.crazygames.com/embed/drift-hunters");
});

test("quick insert: iframe embed", () => {
  const out = parseQuickInsertInput('<iframe src="https://html5.gamedistribution.com/abcdef0123456789abcdef0123456789/"></iframe>');
  assert.ok(out.game);
  assert.match(out.game.embedUrl, /gamedistribution\.com/);
});

test("quick insert: bare GameDistribution hash", () => {
  const hash = "abcdef0123456789abcdef0123456789";
  const out = parseQuickInsertInput(hash);
  assert.ok(out.game);
  assert.equal(out.game.embedUrl, `https://html5.gamedistribution.com/${hash}/`);
});

test("quick insert: rejects empty", () => {
  assert.equal(parseQuickInsertInput("").error, "empty");
});

test("quick insert: normalize caps list", () => {
  const games = normalizeQuickGames([
    { id: "quick-a", embedUrl: "https://www.crazygames.com/embed/a" },
    { id: "quick-a", embedUrl: "https://www.crazygames.com/embed/a" },
    { id: "quick-b", embedUrl: "https://example.com/game" },
  ]);
  assert.equal(games.length, 2);
});

test("arcade catalog json loads 58 games", () => {
  const jsonPath = path.join(root, "data", "arcade-catalog.json");
  assert.ok(fs.existsSync(jsonPath));
  const games = loadArcadeCatalogGames();
  assert.ok(games.length >= 58);
  assert.equal(games[0].provider, "crazygames");
});

test("arcade.js exposes quick insert UI", () => {
  const arcade = fs.readFileSync(path.join(root, "public", "arcade.js"), "utf8");
  assert.match(arcade, /quickInsertPanel/);
  assert.match(arcade, /parseQuickInsertInput/);
  assert.match(arcade, /tryOpenDeepLinkGame/);
});

test("static route redirects arcade slug to game query", () => {
  const staticRoute = fs.readFileSync(path.join(root, "server", "routes", "static.mjs"), "utf8");
  assert.match(staticRoute, /\/arcade\/:slug/);
  assert.match(staticRoute, /arcade\.html\?game=/);
});
