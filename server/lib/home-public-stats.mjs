let cached = { at: 0, day: "", count: 0 };

export function dayStartUtcIso(dayKey) {
  return `${String(dayKey || "").slice(0, 10)}T00:00:00.000Z`;
}

export function countConnectedTodaySync(deps) {
  const { safeDb, db, todayKeyUTC } = deps;
  if (typeof todayKeyUTC !== "function" || !safeDb || !db) return 0;

  const day = todayKeyUTC();
  const now = Date.now();
  if (cached.day === day && now - cached.at < 60_000) {
    return cached.count;
  }

  const since = dayStartUtcIso(day);
  const count =
    safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE last_seen >= ?").get(since)?.c || 0) || 0;

  cached = { at: now, day, count };
  return count;
}
