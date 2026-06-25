import { dayStartUtcIso } from "../../tools/lib/home-stats-core.mjs";

let cached = { at: 0, day: "", count: 0 };

export async function countConnectedToday(deps) {
  const { safeDb, db, todayKeyUTC, supabaseActive, getSupabaseAdmin } = deps;
  const day = todayKeyUTC();
  const now = Date.now();
  if (cached.day === day && now - cached.at < 60_000) {
    return cached.count;
  }

  const since = dayStartUtcIso(day);
  let count = 0;

  if (typeof supabaseActive === "function" && supabaseActive()) {
    try {
      const sb = getSupabaseAdmin();
      const r = await sb
        .from("users")
        .select("handle", { count: "exact", head: true })
        .gte("last_seen", since);
      if (!r.error) count = Math.max(0, Number(r.count || 0));
    } catch (e) {
      console.warn("PUBLIC_STATS_SB_ERROR", e?.message || e);
    }
  }

  if (!count) {
    count =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE last_seen >= ?").get(since)?.c || 0) ||
      0;
  }

  cached = { at: now, day, count };
  return count;
}
