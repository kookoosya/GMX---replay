/**
 * Parse RAW_GAMES from public/arcade.js for offline audits.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function parseArcadeGames(arcadePath = path.join(root, "public", "arcade.js")) {
  const raw = fs.readFileSync(arcadePath, "utf8");
  const block = raw.match(/const RAW_GAMES = \[([\s\S]*?)\];/)?.[1] || "";
  const games = [];

  for (const chunk of block.matchAll(/\{[^{}]+\}/g)) {
    const text = chunk[0];
    const pick = (key) => text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`))?.[1];
    const id = pick("id");
    if (!id || id.startsWith("_")) continue;

    let badge = null;
    const badgeMatch = text.match(/"badge"\s*:\s*(null|"([^"]*)")/);
    if (badgeMatch) badge = badgeMatch[1] === "null" ? null : badgeMatch[2];

    games.push({
      id,
      name: pick("name") || "",
      access: pick("access") || "",
      imageUrl: pick("imageUrl") || "",
      embedUrl: pick("embedUrl") || "",
      launchUrl: pick("launchUrl") || "",
      category: pick("category") || "",
      provider: pick("provider") || "",
      sourceLabel: pick("sourceLabel") || "",
      badge,
    });
  }

  return games;
}

export function parseLocalGameCoverIds(arcadePath = path.join(root, "public", "arcade.js")) {
  const raw = fs.readFileSync(arcadePath, "utf8");
  const block = raw.match(/const LOCAL_GAME_COVERS = new Set\(\[([\s\S]*?)\]\)/)?.[1];
  if (!block) return [];
  const ids = [];
  for (const m of block.matchAll(/"([^"]+)"/g)) ids.push(m[1]);
  return ids;
}
