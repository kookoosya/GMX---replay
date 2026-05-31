/** GM/GN studio tools, favorites, consume quota */

export function registerToolsRoutes(deps) {
  const {
    app,
    requireAuth,
    sendError,
    ERROR_CODES,
    parseAntiLastN,
    rateLimit,
    normLang,
    generateUnique,
    saveRecent,
    composeReply,
    sanitizeSingle,
    getRecentSet,
    todayKeyUTC,
    userByHandle,
    subscriptionInfo,
    getDailyUsed,
    incDaily,
    safeOptionalHistoryDb,
    safeDb,
    db,
    getSupabaseAdmin,
    sbFavoritesGet,
    sbFavoritesHas,
    sbFavoritesDelete,
    sbFavoritesCount,
    sbFavoritesUpsert,
    sha256,
    nowIso,
    consumeLimiter,
    genBurstLimiter,
    bulkBurstLimiter,
    enforceGenGuard,
    GEN_SEMAPHORE,
    awardReferralBonus,
    maybeAwardStarterReward,
    insertLimitForUser,
    supabaseActive,
    sbConsumeDailyAtomic,
    consumeDailyAtomic,
    nextResetUTC,
    logActivity,
    referralFingerprint,
    originFromReq,
    sbBackfillInvitesFromSqlite,
    sbReferralsCount,
    sbRefClicksCount,
    sbUsageEverUsed,
    referralCountConfirmed,
    referralCountActive,
    getReferralPromoterSummary,
    referralRewardTotal,
    computeReferralUnlocks,
    CONFIG,
    classifyReferralEntry,
    REF_MIN_ACTIVE_DAYS,
    REF_MIN_ACTIVE_USES,
    getBearer,
    userByToken,
    validHandle,
    isAdminHandle,
    setFeatureFlag,
    sbRefClicksUpsert
  } = deps;

// ---------- PRO TOOLS (server-side gated; requires auth) ----------
function toolLimit(sub, freeLimit, proLimit){
  return sub?.active ? proLimit : freeLimit;
}
function toolError(res, feature, used, limit, proLimit){
  return res.status(402).json({ ok:false, error:"upgrade_required", feature, used, limit, proLimit });
}


// Studio preview: Free 2/day, Pro unlimited
app.get("/api/tools/preview", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const day = todayKeyUTC();
    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const limit = toolLimit(sub, 2, 999999);
    const used = getDailyUsed(handle, day, "tool_studio");
    if (used >= limit) return toolError(res, "studio", used, limit, 999999);

    const reply = generateUnique(handle, kind, mode, lang, style, antiN);
    incDaily(handle, day, "tool_studio", 1);

    res.json({ ok:true, handle, kind, mode, lang, reply, usage:{ used: used+1, limit } });
  }catch(e){
    console.error("TOOLS_PREVIEW_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Bulk: Free max 10/call and 3 calls/day, Pro max 50/call unlimited calls
app.get("/api/tools/bulk", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);
    let count = Number(req.query.count || 10);
    if (!Number.isFinite(count)) count = 10;
    count = Math.max(1, Math.min(200, Math.floor(count)));

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const day = todayKeyUTC();
    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const maxPerCall = toolLimit(sub, 10, 50);
    const callsLimit = toolLimit(sub, 3, 999999);

    const callsUsed = getDailyUsed(handle, day, "tool_bulk_calls");
    if (callsUsed >= callsLimit) return toolError(res, "bulk_calls", callsUsed, callsLimit, 999999);

    if (!sub.active && count > maxPerCall) {
      return toolError(res, "bulk_size", count, maxPerCall, 50);
    }
    count = Math.min(count, maxPerCall);

    const recent = getRecentSet(handle, kind, antiN);
    const seen = new Set();
    const list = [];
    let tries = 0;
    const maxTries = Math.max(3000, count * 300);

    while (list.length < count && tries < maxTries) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (recent.has(r)) continue;
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }
    while (list.length < count && tries < maxTries * 2) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }

    incDaily(handle, day, "tool_bulk_calls", 1);

    res.json({ ok:true, handle, kind, mode, lang, count:list.length, list, usage:{ callsUsed: callsUsed+1, callsLimit, maxPerCall } });
  }catch(e){
    console.error("TOOLS_BULK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// History: Free 20 items, Pro 500 + search
app.get("/api/tools/history", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "all").toLowerCase();
    const before = String(req.query.before || "").trim();
    const q = String(req.query.q || "").trim();

    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const limit = toolLimit(sub, 20, 500);

    if (q && !sub.active) return toolError(res, "history_search", 0, 0, 1);

    const rows = safeOptionalHistoryDb(() => {
      const params = [handle];
      let where = "handle=?";
      if (kind === "gm" || kind === "gn"){
        where += " AND kind=?";
        params.push(kind);
      }
      if (before){
        where += " AND created_at < ?";
        params.push(before);
      }
      if (q){
        where += " AND reply LIKE ?";
        params.push("%" + q + "%");
      }
      params.push(limit);

      return safeDb(() => db.prepare(
        `SELECT kind, reply, created_at FROM recent_replies WHERE ${where} ORDER BY created_at DESC LIMIT ?`
      ).all(...params));
    }, [], "tools_history_read");

    const nextBefore = rows.length ? rows[rows.length-1].created_at : "";
    res.json({ ok:true, handle, kind, q: q || "", limit, count: rows.length, nextBefore, rows });
  }catch(e){
    console.error("TOOLS_HISTORY_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Favorites: Free 10, Pro 200
app.get("/api/tools/favorites", requireAuth, async (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "all").toLowerCase();
    const sub = subscriptionInfo({ ...(req.user||{}), handle });

    const limit = toolLimit(sub, 10, 200);

    const sb = getSupabaseAdmin();
    if (sb){
      const r = await sbFavoritesGet(handle, kind, limit);
      return res.json({ ok:true, handle, kind, limit, count: r.rows.length, rows: r.rows });
    }

    // sqlite fallback
    let rows = [];
    safeDb(() => {
      const params = [handle];
      let where = "handle=?";
      if (kind === "gm" || kind === "gn"){
        where += " AND kind=?";
        params.push(kind);
      }
      params.push(limit);
      rows = db.prepare(
        `SELECT kind, reply, created_at FROM favorites WHERE ${where} ORDER BY created_at DESC LIMIT ?`
      ).all(...params);
    });

    res.json({ ok:true, handle, kind, limit, count: rows.length, rows });
  }catch(e){
    console.error("TOOLS_FAVORITES_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/tools/favorites/toggle", requireAuth, async (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.body?.kind || "").toLowerCase();
    const reply = String(req.body?.reply || "").trim();

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!reply) return res.status(400).json({ ok:false, error:"invalid_reply" });

    const sub = subscriptionInfo({ ...(req.user||{}), handle });
    const max = toolLimit(sub, 10, 200);

    const h = sha256(reply).slice(0, 24);

    const sb = getSupabaseAdmin();
    if (sb){
      const ex = await sbFavoritesHas(handle, kind, h);
      if (ex.exists){
        await sbFavoritesDelete(handle, kind, h);
        return res.json({ ok:true, action:"removed" });
      }

      const cnt = await sbFavoritesCount(handle);
      if ((cnt.count || 0) >= max) return toolError(res, "favorites_limit", cnt.count || 0, max, 200);

      await sbFavoritesUpsert(handle, kind, h, reply);
      return res.json({ ok:true, action:"added" });
    }

    // sqlite fallback
    const existing = safeDb(() => db.prepare(
      "SELECT 1 AS x FROM favorites WHERE handle=? AND kind=? AND reply_hash=?"
    ).get(handle, kind, h));

    if (existing?.x){
      safeDb(() => db.prepare(
        "DELETE FROM favorites WHERE handle=? AND kind=? AND reply_hash=?"
      ).run(handle, kind, h));
      return res.json({ ok:true, action:"removed" });
    }

    const cnt = safeDb(() => db.prepare(
      "SELECT COUNT(*) AS c FROM favorites WHERE handle=?"
    ).get(handle)?.c || 0);
    if (cnt >= max) return toolError(res, "favorites_limit", cnt, max, 200);

    safeDb(() => db.prepare(
      "INSERT OR REPLACE INTO favorites(handle, kind, reply_hash, reply, created_at) VALUES(?,?,?,?,?)"
    ).run(handle, kind, h, reply, nowIso()));

    res.json({ ok:true, action:"added" });
  }catch(e){
    console.error("TOOLS_FAVORITES_TOGGLE_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Consume quota without generating (for list inserts from extension)
app.post("/api/consume", requireAuth, consumeLimiter, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.body?.kind || req.query?.kind || "").toLowerCase();
    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");

    const day = todayKeyUTC();
    try { awardReferralBonus(handle); } catch (_e) {}
    try { maybeAwardStarterReward(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const limit = await insertLimitForUser({ ...u, handle }, { userRow: u });

    const sub = subscriptionInfo({ ...u, handle });
    const plan = sub.active ? "pro" : "free";

    const consume = supabaseActive()
      ? await sbConsumeDailyAtomic(handle, day, kind, limit, 1, plan)
      : consumeDailyAtomic(handle, day, kind, limit, 1);

    if (!consume.ok) {
      if (consume.error === "supabase_error" || consume.error === "supabase_inactive") {
        return res.status(503).json({
          ok: false,
          error: "supabase_error",
          detail: consume._sb_error || null,
          resetAt: nextResetUTC(),
        });
      }
      return res.status(429).json({
        ok: false,
        error: "limit_reached",
        used: consume.used,
        limit: consume.limit,
        resetAt: nextResetUTC(),
      });
    }

    try {
      logActivity(handle, "consume", { kind });
    } catch {}

    return res.json({
      ok: true,
      handle,
      kind,
      usage: {
        used: consume.used,
        limit: consume.limit,
        remaining:
          Number.isFinite(limit) && limit < 999999 ? Math.max(0, limit - consume.used) : null,
        resetAt: nextResetUTC(),
      },
    });
  } catch (e) {
    console.error("CONSUME_ERROR", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});



}
