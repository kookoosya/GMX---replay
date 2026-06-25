/** Game of the Day picker — shared by Arcade site and Chrome extension. */

export function dayOfYear(d = new Date()) {
  const date = d instanceof Date ? d : new Date();
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
}

export function gameOfTheDay(games, d = new Date()) {
  if (!Array.isArray(games) || !games.length) return null;
  const idx = dayOfYear(d) % games.length;
  return games[idx] || null;
}

export function todayKey(d = new Date()) {
  const date = d instanceof Date ? d : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function gotdArcadePlayUrl(base, game) {
  const root = String(base || "https://www.gmxreply.com").replace(/\/$/, "");
  const slug = game && game.id ? String(game.id) : "";
  return slug
    ? `${root}/arcade.html?game=${encodeURIComponent(slug)}`
    : `${root}/arcade.html`;
}
