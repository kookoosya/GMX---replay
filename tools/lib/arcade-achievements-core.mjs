/**
 * Arcade achievements — local progress (browser storage only).
 */

export const ACHIEVEMENT_DEFS = [
  {
    id: "first_launch",
    icon: "🎮",
    titleKey: "arcade_ach_first_title",
    descKey: "arcade_ach_first_desc",
  },
  {
    id: "explorer",
    icon: "🧭",
    titleKey: "arcade_ach_explorer_title",
    descKey: "arcade_ach_explorer_desc",
  },
  {
    id: "arcade_fan",
    icon: "🔥",
    titleKey: "arcade_ach_fan_title",
    descKey: "arcade_ach_fan_desc",
  },
  {
    id: "gotd_player",
    icon: "⭐",
    titleKey: "arcade_ach_gotd_title",
    descKey: "arcade_ach_gotd_desc",
  },
  {
    id: "category_hopper",
    icon: "🎯",
    titleKey: "arcade_ach_category_title",
    descKey: "arcade_ach_category_desc",
  },
  {
    id: "pro_title",
    icon: "👑",
    titleKey: "arcade_ach_pro_title",
    descKey: "arcade_ach_pro_desc",
  },
];

export function todayKey(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyProgress() {
  return { v: 1, played: [], gotdDays: [] };
}

export function normalizeProgress(raw) {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const played = Array.isArray(raw.played) ? raw.played : [];
  const gotdDays = Array.isArray(raw.gotdDays) ? raw.gotdDays : [];
  const cleanPlayed = [];
  const seen = new Set();
  for (const item of played) {
    if (!item || typeof item !== "object") continue;
    const id = String(item.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    cleanPlayed.push({
      id,
      category: String(item.category || "").trim(),
      access: String(item.access || "free").trim() || "free",
      at: Number(item.at || 0) || 0,
    });
  }
  const cleanGotd = Array.from(
    new Set(gotdDays.map((x) => String(x || "").trim()).filter(Boolean))
  );
  return { v: 1, played: cleanPlayed, gotdDays: cleanGotd };
}

export function summarizeProgress(progress) {
  const p = normalizeProgress(progress);
  const categories = new Set();
  let proPlays = 0;
  for (const item of p.played) {
    if (item.category) categories.add(item.category);
    if (item.access === "pro") proPlays += 1;
  }
  return {
    playedCount: p.played.length,
    categoryCount: categories.size,
    gotdPlays: p.gotdDays.length,
    proPlays,
  };
}

function isUnlocked(id, stats) {
  switch (id) {
    case "first_launch":
      return stats.playedCount >= 1;
    case "explorer":
      return stats.playedCount >= 3;
    case "arcade_fan":
      return stats.playedCount >= 10;
    case "gotd_player":
      return stats.gotdPlays >= 1;
    case "category_hopper":
      return stats.categoryCount >= 3;
    case "pro_title":
      return stats.proPlays >= 1;
    default:
      return false;
  }
}

export function evaluateAchievements(progress) {
  const stats = summarizeProgress(progress);
  return ACHIEVEMENT_DEFS.map((def) => ({
    ...def,
    unlocked: isUnlocked(def.id, stats),
  }));
}

export function recordPlay(progress, game, meta = {}) {
  const p = normalizeProgress(progress);
  const id = String(game?.id || "").trim();
  if (!id) return p;

  const now = Date.now();
  const existing = p.played.find((item) => item.id === id);
  if (!existing) {
    p.played.push({
      id,
      category: String(game?.category || game?.categoryKey || "").trim(),
      access: String(game?.access || "free").trim() || "free",
      at: now,
    });
  }

  const gotdId = String(meta.gotdId || "").trim();
  const today = String(meta.todayKey || todayKey()).trim();
  if (gotdId && id === gotdId && today && !p.gotdDays.includes(today)) {
    p.gotdDays.push(today);
  }

  return normalizeProgress(p);
}
