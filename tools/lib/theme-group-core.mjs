/** Theme bucket helpers — shared between site UI and tests. */

export const THEME_GROUP_ORDER = Object.freeze(["dark", "light", "colorful"]);

function parseRgbChannel(raw) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function parseThemeColor(s) {
  const m = String(s || "").match(/rgba?\(\s*([^)]+)\)/i);
  if (!m) return [124, 92, 255];
  const parts = m[1].split(",").map((x) => x.trim());
  return [parseRgbChannel(parts[0]), parseRgbChannel(parts[1]), parseRgbChannel(parts[2])];
}

export function colorLuminance(rgb) {
  const [r, g, b] = rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function themeGroup(th) {
  const explicit = String(th?.group || "").toLowerCase();
  if (THEME_GROUP_ORDER.includes(explicit)) return explicit;
  const la = colorLuminance(parseThemeColor(th?.a));
  const lb = colorLuminance(parseThemeColor(th?.b));
  const avg = (la + lb) / 2;
  if (avg < 85 && la < 120 && lb < 120) return "dark";
  if (avg > 170 && la > 140 && lb > 140) return "light";
  return "colorful";
}

export function groupThemeItems(items) {
  const buckets = { dark: [], light: [], colorful: [] };
  for (const item of items) {
    const g = themeGroup(item.th);
    buckets[g].push(item);
  }
  return THEME_GROUP_ORDER.filter((id) => buckets[id].length).map((id) => ({
    id,
    items: buckets[id],
  }));
}
