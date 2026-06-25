import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findCatalogGameBySlug, renderArcadeSlugPage } from "../../tools/lib/arcade-slug-seo.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const catalogPath = path.join(root, "data", "arcade-catalog.json");

let cachedGames = null;

function loadGames() {
  if (cachedGames) return cachedGames;
  if (!fs.existsSync(catalogPath)) {
    cachedGames = [];
    return cachedGames;
  }
  const data = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  cachedGames = Array.isArray(data.games) ? data.games : [];
  return cachedGames;
}

export function renderArcadeSlugHtml(slug, opts = {}) {
  const game = findCatalogGameBySlug(slug, loadGames());
  if (!game) return null;
  return renderArcadeSlugPage(game, opts);
}

export function clearArcadeSlugCache() {
  cachedGames = null;
}
