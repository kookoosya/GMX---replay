/** SQLite + Supabase data access helpers. */

export function createDb(deps) {
  const {
    createClient,
    path,
    dirname,
    Database,
    nowIso,
    mirrorSupabaseUsageToSqlite,
    sbReferralsMarkFirstUse,
  } = deps;

  const DB_MODE = (String(process.env.DB_MODE || "sqlite").trim().toLowerCase() === "supabase") ? "supabase" : "sqlite";
  const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
  const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

  let SUPABASE_ADMIN = null;
  function getSupabaseAdmin() {
    if (DB_MODE !== "supabase") return null;
    if (SUPABASE_ADMIN) return SUPABASE_ADMIN;
    if (!SUPABASE_CONFIGURED) {
      console.warn("[supabase] DB_MODE=supabase but env missing; supabase disabled (sqlite fallback stays on)");
      return null;
    }
    SUPABASE_ADMIN = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return SUPABASE_ADMIN;
  }

  function supabaseActive() {
    return DB_MODE === "supabase" && SUPABASE_CONFIGURED && !!getSupabaseAdmin();
  }

  async function sbEnsureUser(handle) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    if (!h) return { ok: false, error: "missing_handle" };

    const r = await sb.from("users").upsert({ handle: h }, { onConflict: "handle" });
    if (r.error) throw r.error;
    return { ok: true };
  }

  async function sbCloudListsGet(handle) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    const r = await sb
      .from("cloud_lists")
      .select("kind, scope, lang, content, updated_at")
      .eq("handle", h)
      .order("updated_at", { ascending: false });
    if (r.error) throw r.error;
    return { ok: true, rows: r.data || [] };
  }

  async function sbCloudListsUpsert(handle, items) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    const now = nowIso();
    const rows = [];
    for (const it of Array.isArray(items) ? items : []) {
      const kind = String(it?.kind || "").toLowerCase();
      const scope = String(it?.scope || "").toLowerCase();
      const lang = String(it?.lang || "*").toLowerCase();
      const content = String(it?.content || "");
      if (kind !== "gm" && kind !== "gn") continue;
      if (scope !== "global" && scope !== "lang") continue;
      if (!lang) continue;
      if (content.length > 200000) continue;
      rows.push({ handle: h, kind, scope, lang, content, updated_at: now });
    }
    if (!rows.length) return { ok: true, saved: 0, updated_at: now };
    const r = await sb.from("cloud_lists").upsert(rows, { onConflict: "handle,kind,scope,lang" });
    if (r.error) throw r.error;
    return { ok: true, saved: rows.length, updated_at: now };
  }

  async function sbFavoritesGet(handle, kind, limit) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    let q = sb.from("favorites").select("kind, reply, created_at").eq("handle", h);
    if (kind === "gm" || kind === "gn") q = q.eq("kind", kind);
    const r = await q.order("created_at", { ascending: false }).limit(limit);
    if (r.error) throw r.error;
    return { ok: true, rows: r.data || [] };
  }

  async function sbFavoritesCount(handle) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    const r = await sb.from("favorites").select("reply_hash", { count: "exact", head: true }).eq("handle", h);
    if (r.error) throw r.error;
    return { ok: true, count: r.count || 0 };
  }

  async function sbFavoritesHas(handle, kind, reply_hash) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    const r = await sb
      .from("favorites")
      .select("reply_hash")
      .eq("handle", h)
      .eq("kind", String(kind || "").toLowerCase())
      .eq("reply_hash", String(reply_hash || ""))
      .maybeSingle();
    if (r.error) throw r.error;
    return { ok: true, exists: Boolean(r.data) };
  }

  async function sbFavoritesDelete(handle, kind, reply_hash) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    const r = await sb
      .from("favorites")
      .delete()
      .eq("handle", h)
      .eq("kind", String(kind || "").toLowerCase())
      .eq("reply_hash", String(reply_hash || ""));
    if (r.error) throw r.error;
    return { ok: true };
  }

  async function sbFavoritesUpsert(handle, kind, reply_hash, reply) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, error: "supabase_inactive" };
    const h = String(handle || "").trim();
    const row = {
      handle: h,
      kind: String(kind || "").toLowerCase(),
      reply_hash: String(reply_hash || ""),
      reply: String(reply || ""),
      created_at: nowIso(),
    };
    const r = await sb.from("favorites").upsert(row, { onConflict: "handle,kind,reply_hash" });
    if (r.error) throw r.error;
    return { ok: true };
  }

  async function sbGetDailyUsed(handle, day, kind) {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;

    const k = String(kind || "").toLowerCase();
    const col = k === "gn" ? "gn_used" : "gm_used";

    const r = await sb
      .from("usage_daily")
      .select(col)
      .eq("handle", String(handle))
      .eq("day", String(day))
      .maybeSingle();

    if (r.error) {
      console.warn("SB_GET_DAILY_USED_ERROR", r.error?.message || r.error);
      return 0;
    }
    return Number(r.data?.[col] ?? 0);
  }

  async function sbSumLegacyGenUsed(handle) {
    const sb = getSupabaseAdmin();
    if (!sb) return 0;
    const h = String(handle || "").trim();
    const r = await sb.from("usage_daily").select("gm_used, gn_used").eq("handle", h);
    if (r.error) {
      console.warn("SB_SUM_LEGACY_GEN_ERROR", r.error?.message || r.error);
      return 0;
    }
    let sum = 0;
    for (const row of r.data || []) {
      sum += Math.max(0, Number(row?.gm_used || 0) || 0);
      sum += Math.max(0, Number(row?.gn_used || 0) || 0);
    }
    return sum;
  }

  async function sbConsumeDailyAtomic(handle, day, kind, limit, by = 1, plan = "free") {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false, used: 0, limit, plan, error: "supabase_inactive", _sb_error: "supabase_inactive" };

    await sbEnsureUser(handle);

    const rpc = await sb.rpc("usage_daily_consume", {
      p_handle: String(handle),
      p_day: String(day),
      p_kind: String(kind).toLowerCase(),
      p_by: Number(by) || 1,
      p_limit: Number(limit) || 0,
      p_plan: String(plan || "free"),
    });

    if (rpc.error) {
      console.warn("SB_CONSUME_RPC_ERROR", rpc.error?.message || rpc.error);
      const used = await sbGetDailyUsed(handle, day, kind);
      return { ok: false, used, limit, plan, error: "supabase_error", _sb_error: rpc.error?.message || String(rpc.error) };
    }

    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    const out = {
      ok: !!row?.ok,
      used: Number(row?.used ?? 0),
      limit: Number(row?.limit ?? limit),
      plan: String(row?.plan ?? plan),
    };

    if (out.ok) {
      try { mirrorSupabaseUsageToSqlite(handle, day, kind, out.used); } catch (_e) {}
      try { await sbReferralsMarkFirstUse(handle); } catch (_e) {}
    }

    return out;
  }

  const DB_PATH = process.env.DB_PATH || path.join(dirname, "data.sqlite");
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");

  return {
    DB_MODE,
    SUPABASE_CONFIGURED,
    getSupabaseAdmin,
    supabaseActive,
    sbEnsureUser,
    sbCloudListsGet,
    sbCloudListsUpsert,
    sbFavoritesGet,
    sbFavoritesCount,
    sbFavoritesHas,
    sbFavoritesDelete,
    sbFavoritesUpsert,
    sbGetDailyUsed,
    sbSumLegacyGenUsed,
    sbConsumeDailyAtomic,
    DB_PATH,
    db,
  };
}
