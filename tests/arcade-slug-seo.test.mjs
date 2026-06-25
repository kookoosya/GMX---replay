import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  arcadeSlugDescription,
  arcadeSlugPlayUrl,
  findCatalogGameBySlug,
  renderArcadeSlugPage,
} from "../tools/lib/arcade-slug-seo.mjs";
import { loadArcadeCatalogGames } from "../tools/lib/load-arcade-catalog.mjs";
import { renderArcadeSlugHtml } from "../server/lib/arcade-slug-page.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("arcade slug seo finds catalog game by id", () => {
  const games = loadArcadeCatalogGames();
  const game = findCatalogGameBySlug("agario", games);
  assert.ok(game);
  assert.equal(game.id, "agario");
});

test("rendered slug page includes unique meta and play CTA", () => {
  const games = loadArcadeCatalogGames();
  const game = findCatalogGameBySlug("agario", games);
  const html = renderArcadeSlugPage(game, { origin: "https://www.gmxreply.com" });
  assert.match(html, /name="description"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /arcade\.html\?game=agario/);
  assert.match(html, /Agar\.io/);
  assert.match(html, /\/arcade\/slug\.css/);
});

test("server slug renderer returns html for known game", () => {
  const html = renderArcadeSlugHtml("slither-io", { origin: "https://www.gmxreply.com" });
  assert.ok(html);
  assert.match(html, /Slither\.io/);
  assert.equal(renderArcadeSlugHtml("not-a-real-game-id-xyz"), null);
});

test("static route serves seo html instead of redirect", () => {
  const src = fs.readFileSync(path.join(root, "server", "routes", "static.mjs"), "utf8");
  assert.match(src, /renderArcadeSlugHtml/);
  assert.match(src, /res\.type\("html"\)/);
  assert.doesNotMatch(src, /arcade\.html\?game=\$\{encodeURIComponent\(slug\)\}/);
});

test("slug description mentions access tier", () => {
  const games = loadArcadeCatalogGames();
  const free = findCatalogGameBySlug("agario", games);
  const pro = findCatalogGameBySlug("kour-io", games);
  assert.match(arcadeSlugDescription(free), /Free/i);
  assert.match(arcadeSlugDescription(pro), /Pro/i);
  assert.match(arcadeSlugPlayUrl(free), /agario/);
});

test("slug css asset exists", () => {
  assert.ok(fs.existsSync(path.join(root, "public", "arcade", "slug.css")));
});
