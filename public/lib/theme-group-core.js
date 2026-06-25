(function (global) {
  if (global.GMXThemeGroupCore) return;

  const THEME_GROUP_ORDER = ["dark", "light", "colorful"];

  function parseRgbChannel(raw) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  function parseThemeColor(s) {
    const m = String(s || "").match(/rgba?\(\s*([^)]+)\)/i);
    if (!m) return [124, 92, 255];
    const parts = m[1].split(",").map(function (x) {
      return x.trim();
    });
    return [parseRgbChannel(parts[0]), parseRgbChannel(parts[1]), parseRgbChannel(parts[2])];
  }

  function colorLuminance(rgb) {
    const r = rgb[0];
    const g = rgb[1];
    const b = rgb[2];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function themeGroup(th) {
    const explicit = String((th && th.group) || "").toLowerCase();
    if (THEME_GROUP_ORDER.indexOf(explicit) >= 0) return explicit;
    const la = colorLuminance(parseThemeColor(th && th.a));
    const lb = colorLuminance(parseThemeColor(th && th.b));
    const avg = (la + lb) / 2;
    if (avg < 85 && la < 120 && lb < 120) return "dark";
    if (avg > 170 && la > 140 && lb > 140) return "light";
    return "colorful";
  }

  function groupThemeItems(items) {
    const buckets = { dark: [], light: [], colorful: [] };
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const g = themeGroup(item.th);
      buckets[g].push(item);
    }
    return THEME_GROUP_ORDER.filter(function (id) {
      return buckets[id].length;
    }).map(function (id) {
      return { id: id, items: buckets[id] };
    });
  }

  global.GMXThemeGroupCore = {
    THEME_GROUP_ORDER: THEME_GROUP_ORDER,
    themeGroup: themeGroup,
    groupThemeItems: groupThemeItems,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
