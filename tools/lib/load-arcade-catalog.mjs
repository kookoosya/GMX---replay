import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArcadeGames } from "./parse-arcade-games.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadArcadeCatalogGames() {
  const jsonPath = path.join(root, "data", "arcade-catalog.json");
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const games = Array.isArray(data.games) ? data.games : data;
    if (Array.isArray(games) && games.length) return games;
  }
  return parseArcadeGames(path.join(root, "public", "arcade.js"));
}
