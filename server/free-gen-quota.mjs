/**
 * Lifetime shared free generation credits (GM + GN share one pool).
 * Base credits from CONFIG.FREE_DAILY_BASE; referral bonus adds separately.
 */

export const FREE_GEN_SCHEMA_VERSION = 1;

export function freeGenLimitsFromPromo(CONFIG, promoSummary) {
  const base = Math.max(0, Number(CONFIG?.FREE_DAILY_BASE ?? 50) || 50);
  const bonus = Math.max(0, Number(promoSummary?.dailyBonus ?? 0) || 0);
  const total = base + bonus;
  return { base, bonus, total };
}

export function ensureFreeGenSchema(safeDb, db) {
  if (!safeDb || !db) return;
  const cols = [
    ["free_gen_used", "INTEGER NOT NULL DEFAULT 0"],
    ["free_gen_gm_used", "INTEGER NOT NULL DEFAULT 0"],
    ["free_gen_gn_used", "INTEGER NOT NULL DEFAULT 0"],
    ["free_gen_migrated", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [name, def] of cols) {
    try {
      safeDb(() => db.prepare(`ALTER TABLE users ADD COLUMN ${name} ${def}`).run());
    } catch (_e) {}
  }
}

export function migrateFreeGenFromLegacy(safeDb, db, handle, totalLimit, legacyExtra = 0) {
  ensureFreeGenSchema(safeDb, db);
  const h = String(handle || "").trim();
  if (!h) return 0;
  const row = safeDb(() =>
    db.prepare("SELECT free_gen_migrated, free_gen_used FROM users WHERE handle=?").get(h)
  );
  if (row?.free_gen_migrated) return Math.max(0, Number(row.free_gen_used || 0) || 0);

  const legacy = safeDb(() =>
    db
      .prepare(
        "SELECT COALESCE(SUM(used),0) AS s FROM usage_daily WHERE handle=? AND kind IN ('gm','gn')"
      )
      .get(h)
  );
  const legacySum = Math.max(
    Math.max(0, Number(legacy?.s || 0) || 0),
    Math.max(0, Number(legacyExtra || 0) || 0)
  );
  const used = Math.min(Math.max(0, Number(totalLimit || 0) || 0), legacySum);

  safeDb(() =>
    db
      .prepare(
        "UPDATE users SET free_gen_used=?, free_gen_migrated=1 WHERE handle=?"
      )
      .run(used, h)
  );
  return used;
}

export async function ensureFreeGenMigratedAsync(safeDb, db, handle, totalLimit, { sbSumLegacyGenUsed } = {}) {
  ensureFreeGenSchema(safeDb, db);
  const h = String(handle || "").trim();
  if (!h) return 0;
  const row = safeDb(() =>
    db.prepare("SELECT free_gen_migrated, free_gen_used FROM users WHERE handle=?").get(h)
  );
  if (row?.free_gen_migrated) return Math.max(0, Number(row.free_gen_used || 0) || 0);

  let legacyExtra = 0;
  if (typeof sbSumLegacyGenUsed === "function") {
    try {
      legacyExtra = Math.max(0, Number(await sbSumLegacyGenUsed(h)) || 0);
    } catch (_e) {}
  }
  return migrateFreeGenFromLegacy(safeDb, db, h, totalLimit, legacyExtra);
}

export function getFreeGenState(safeDb, db, handle, totalLimit) {
  ensureFreeGenSchema(safeDb, db);
  const h = String(handle || "").trim();
  const cap = Math.max(0, Number(totalLimit || 0) || 0);
  migrateFreeGenFromLegacy(safeDb, db, h, cap);
  const row =
    safeDb(() =>
      db
        .prepare(
          "SELECT free_gen_used, free_gen_gm_used, free_gen_gn_used FROM users WHERE handle=?"
        )
        .get(h)
    ) || {};
  const used = Math.max(0, Number(row.free_gen_used || 0) || 0);
  const gmUsed = Math.max(0, Number(row.free_gen_gm_used || 0) || 0);
  const gnUsed = Math.max(0, Number(row.free_gen_gn_used || 0) || 0);
  const remaining = cap >= 999999 ? Infinity : Math.max(0, cap - used);
  return { used, gmUsed, gnUsed, totalLimit: cap, remaining };
}

export function consumeFreeGenAtomic(safeDb, db, handle, count, totalLimit, kind) {
  ensureFreeGenSchema(safeDb, db);
  const h = String(handle || "").trim();
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const cap = Number(totalLimit);
  const k = String(kind || "").toLowerCase() === "gn" ? "gn" : "gm";

  if (!h) return { ok: false, used: 0, limit: cap, error: "missing_handle" };

  migrateFreeGenFromLegacy(safeDb, db, h, cap);

  if (!Number.isFinite(cap) || cap >= 999999) {
    const kindCol = k === "gn" ? "free_gen_gn_used" : "free_gen_gm_used";
    safeDb(() =>
      db
        .prepare(`UPDATE users SET free_gen_used=free_gen_used+?, ${kindCol}=${kindCol}+? WHERE handle=?`)
        .run(n, n, h)
    );
    const st = getFreeGenState(safeDb, db, h, cap);
    return { ok: true, used: st.used, limit: cap, remaining: null };
  }

  const kindCol = k === "gn" ? "free_gen_gn_used" : "free_gen_gm_used";
  const res = safeDb(() =>
    db
      .prepare(
        `UPDATE users SET free_gen_used = free_gen_used + ?, ${kindCol} = ${kindCol} + ? WHERE handle = ? AND free_gen_used + ? <= ?`
      )
      .run(n, n, h, n, cap)
  );

  const st = getFreeGenState(safeDb, db, h, cap);
  if (!res || res.changes === 0) {
    return { ok: false, used: st.used, limit: cap, remaining: Math.max(0, cap - st.used) };
  }
  return {
    ok: true,
    used: st.used,
    limit: cap,
    remaining: Math.max(0, cap - st.used),
  };
}

export function buildUsageGenerationPayload(state, limits, isPro) {
  const base = limits.base;
  const bonus = limits.bonus;
  const total = limits.total;
  if (isPro) {
    return {
      used: state.used,
      baseLimit: base,
      bonusLimit: bonus,
      totalLimit: null,
      remaining: null,
      resetAt: null,
      shared: true,
    };
  }
  return {
    used: state.used,
    baseLimit: base,
    bonusLimit: bonus,
    totalLimit: total,
    remaining: Math.max(0, total - state.used),
    resetAt: null,
    shared: true,
  };
}
