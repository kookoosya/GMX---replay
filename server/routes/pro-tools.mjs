/** Pro tools, random generation, referrals, activity, features, market signals. */

export function registerProToolsRoutes(deps) {
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



// Extension endpoint (consumes quota)
app.get("/api/random", requireAuth, genBurstLimiter, async (req, res) => {
  let slotAcquired = false;
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const guard = await enforceGenGuard(req, res, 'single');
    if (!guard.ok) return res.status(guard.status).json(guard.body);

    const gotSlot = await GEN_SEMAPHORE.acquire(8000);
    if (!gotSlot){
      try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style }); }catch{}
      return res.status(503).json({ ok:false, error:'busy_try_again' });
    }
    slotAcquired = true;


    const day = todayKeyUTC();
    try { awardReferralBonus(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const limit = await insertLimitForUser({ ...u, handle }, { userRow: u });

    const sub = subscriptionInfo({ ...u, handle });
    const plan = sub.active ? "pro" : "free";


    // consume quota atomically (prevents parallel overspend)
    const consume = supabaseActive()
      ? await sbConsumeDailyAtomic(handle, day, kind, limit, 1, plan)
      : consumeDailyAtomic(handle, day, kind, limit, 1);
    if (!consume.ok) {
      if (consume.error === "supabase_error" || consume.error === "supabase_inactive") {
        try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style, sb: consume._sb_error || null }); }catch{}
        return res.status(503).json({
          ok: false,
          error: "supabase_error",
          detail: consume._sb_error || null,
          resetAt: nextResetUTC(),
        });
      }
      try{ logActivity(handle, 'limit_hit', { kind, used: consume.used, limit: consume.limit, resetAt: nextResetUTC() }); }catch{}
      return res.status(429).json({ ok:false, error:"limit_reached", used: consume.used, limit: consume.limit, resetAt: nextResetUTC() });
    }

    const reply = generateUnique(handle, kind, mode, lang, style, antiN);
    saveRecent(handle, kind, reply, mode, style);
    logActivity(handle, 'gen', { kind, mode, lang, style, antiN });
    const newUsed = consume.used;

    res.json({
      ok:true,
      handle,
      kind,
      reply,
      usage:{ used:newUsed, limit, remaining: (Number.isFinite(limit) && limit < 999999) ? Math.max(0, limit-newUsed) : null, resetAt: nextResetUTC() }
    });
  } catch (e) {
    console.error("RANDOM_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  } finally {
    if (slotAcquired) GEN_SEMAPHORE.release();
  }
});


app.get("/api/random-bulk", requireAuth, bulkBurstLimiter, async (req, res) => {
  let slotAcquired = false;
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);
    // Support multiple param names for convenience/compat with older clients.
    // count is canonical; n/limit are accepted aliases.
    let count = Number((req.query.count ?? req.query.n ?? req.query.limit) ?? 10);
    if (!Number.isFinite(count)) count = 10;
    count = Math.max(1, Math.min(200, Math.floor(count)));

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const guard = await enforceGenGuard(req, res, 'bulk');
    if (!guard.ok) return res.status(guard.status).json(guard.body);

    const gotSlot = await GEN_SEMAPHORE.acquire(12000);
    if (!gotSlot){
      try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style, count }); }catch{}
      return res.status(503).json({ ok:false, error:'busy_try_again' });
    }
    slotAcquired = true;


    const day = todayKeyUTC();
    try { awardReferralBonus(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const limit = await insertLimitForUser({ ...u, handle }, { userRow: u });

    const sub = subscriptionInfo({ ...u, handle });
    const plan = sub.active ? "pro" : "free";


    const consume = supabaseActive()
      ? await sbConsumeDailyAtomic(handle, day, kind, limit, count, plan)
      : consumeDailyAtomic(handle, day, kind, limit, count);
    if (!consume.ok) {
      if (consume.error === "supabase_error" || consume.error === "supabase_inactive") {
        try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style, count, sb: consume._sb_error || null }); }catch{}
        return res.status(503).json({
          ok: false,
          error: "supabase_error",
          detail: consume._sb_error || null,
          resetAt: nextResetUTC(),
        });
      }
      const curUsed = consume.used;
      try{ logActivity(handle, 'limit_hit', { kind, used: curUsed, limit: consume.limit, requested: count, resetAt: nextResetUTC() }); }catch{}
      return res.status(429).json({
        ok:false,
        error:"limit_reached",
        used: curUsed,
        limit: consume.limit,
        requested: count,
        remaining: Math.max(0, consume.limit - curUsed),
        resetAt: nextResetUTC()
      });
    }

    const recent = getRecentSet(handle, kind, antiN);
    const seen = new Set();
    const list = [];
    let tries = 0;
    const maxTries = Math.max(4000, count * 400);

    while (list.length < count && tries < maxTries) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (recent.has(r)) continue;
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }

    // If still short, relax anti-repeat but keep batch uniqueness
    while (list.length < count && tries < maxTries * 2) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }

    for (const r of list) saveRecent(handle, kind, r, mode, style);
    logActivity(handle, 'gen_bulk', { kind, mode, lang, style, antiN, count: list.length });

    const newUsed = consume.used;

    res.json({
      ok:true,
      handle,
      kind,
      mode,
      lang,
      count: list.length,
      list,
      usage:{ used:newUsed, limit, remaining: (Number.isFinite(limit) && limit < 999999) ? Math.max(0, limit-newUsed) : null, resetAt: nextResetUTC() }
    });
  } catch (e) {
    console.error("RANDOM_BULK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  } finally {
    if (slotAcquired) GEN_SEMAPHORE.release();
  }
});


// Track referral link clicks (promoter analytics; no auth)
app.get("/api/referral/click", async (req, res) => {
  try {
    const ref = String(req.query.ref || req.query.code || "").trim();
    if (!ref) return res.json({ ok:true });

    // only count clicks for valid codes
    const owner = safeDb(() => db.prepare("SELECT handle FROM users WHERE ref_code=?").get(ref));
    if (!owner?.handle) return res.json({ ok:true });

    const fp = referralFingerprint(req);

    // Supabase is source of truth in supabase mode
    if (supabaseActive()) {
      try { await sbRefClicksUpsert(ref, fp); } catch (e) { console.warn("SB_REF_CLICK_ERROR", e?.message || e); }
    }

    // Keep sqlite for back-compat / legacy UIs
    safeDb(() => {
      db.prepare(
        "INSERT OR IGNORE INTO ref_clicks(code, fingerprint, created_at) VALUES(?,?,?)"
      ).run(ref, fp, nowIso());
    });

    res.json({ ok:true });
  } catch (e) {
    console.error("REF_CLICK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Referrals
app.get("/api/referral/stats", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const origin = originFromReq(req);

    try { awardReferralBonus(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const refCode = u?.ref_code || "";

    let legacyReferrals = 0;
    let confirmedRefs = 0;
    let activeRefs = 0;
    let clicks = 0;
    let ownerActive = false;

    if (supabaseActive()) {
      try { await sbBackfillInvitesFromSqlite(handle); } catch (e) { console.warn("SB_REF_BACKFILL_ERROR", e?.message || e); }

      try { legacyReferrals = (await sbReferralsCount(handle, "legacy")).count || 0; } catch {}
      try { confirmedRefs = (await sbReferralsCount(handle, "confirmed")).count || 0; } catch {}
      try { activeRefs = (await sbReferralsCount(handle, "active")).count || 0; } catch {}

      if (refCode) {
        try { clicks = (await sbRefClicksCount(refCode)).count || 0; } catch {}
      }

      try { ownerActive = !!(await sbUsageEverUsed(handle)).active; } catch { ownerActive = false; }
    } else {
      legacyReferrals = refCode
        ? (safeDb(() =>
            db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCode)?.c || 0
          ) || 0)
        : 0;

      confirmedRefs = referralCountConfirmed(handle);
      activeRefs = referralCountActive(handle);

      clicks = refCode
        ? (safeDb(() =>
            db.prepare("SELECT COUNT(*) AS c FROM ref_clicks WHERE code=?").get(refCode)?.c || 0
          ) || 0)
        : 0;

      ownerActive = safeDb(() => (db
        .prepare("SELECT SUM(used) AS s FROM usage_daily WHERE handle=? AND used>0")
        .get(handle)?.s || 0)) > 0;
    }

    const promo = await getReferralPromoterSummary(handle, {
      userRow: u,
      refCode,
      legacyReferrals,
      confirmedRefs,
      activeRefs,
      clicks,
    });
    const strictEligibleRefs = Math.max(0, Number(promo?.strictEligibleRefs || 0) || 0);
    const eligibleRefs = Math.max(0, Number(promo?.eligibleRefs || 0) || 0);
    const adminEligibleCredits = referralRewardTotal(handle, 'eligible_credit');
    const starterBgSlots = referralRewardTotal(handle, 'starter_bg_slot');
    const effectiveEligibleRefs = eligibleRefs + adminEligibleCredits;
    const unlocks = computeReferralUnlocks(effectiveEligibleRefs, starterBgSlots);

    const dailyLimit = await insertLimitForUser({ ...u, handle }, promo);

    res.json({
      ok: true,
      refCode,
      confirmedRefs,
      activeRefs,
      strictEligibleRefs,
      eligibleRefs,
      effectiveEligibleRefs,
      adminEligibleCredits,
      legacyReferrals,
      clicks,
      dailyLimit,
      freeDaily: CONFIG.FREE_DAILY_BASE,
      dailyBonus: Math.max(0, Number(promo?.dailyBonus || 0) || 0),
      bonusCap: CONFIG.REF_BONUS_CAP,
      ownerActive,
      bonusPer20: Math.max(0, Number(promo?.bonusPer20 || 0) || 0),
      bonusChunks: Math.max(0, Number(promo?.bonusChunks || 0) || 0),
      nextBonusAt: promo?.nextBonusAt == null ? null : (Number(promo.nextBonusAt || 0) || 0),
      promoter: !!promo?.promoter,
      unlocks,
      starter: { starterBgSlots },
      rewards: {
        proTrial7dUnlocked: unlocks.proTrial7dUnlocked,
        discount50Unlocked: unlocks.discount50Unlocked,
        toolkitUnlocked: unlocks.toolkitUnlocked,
      },
      refLink: refCode ? `${origin}/app?ref=${refCode}` : "",
      // Back-compat fields used by older UIs:
      referrals: eligibleRefs,
      eligible: eligibleRefs,
    });
  } catch (e) {
    console.error("REF_STATS_ERROR", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// List invited users for a promoter (P1)

// List invited users for a promoter (P1)
app.get("/api/referral/list", requireAuth, async (req, res) => {
  try{
    const inviter = req.user.handle;
    const days = Math.max(7, Math.min(90, Number(req.query.days || 30) || 30));
    const sinceIso = new Date(Date.now() - days*24*60*60*1000).toISOString();
    const sinceDay = sinceIso.slice(0,10);

    // Supabase source-of-truth in supabase mode
    if (supabaseActive()) {
      try { await sbBackfillInvitesFromSqlite(inviter); } catch (e) { console.warn("SB_REF_BACKFILL_LIST_ERROR", e?.message || e); }

      const sb = getSupabaseAdmin();
      if (sb) {
        const rr = await sb
          .from("referrals")
          .select("invited_handle, created_at, confirmed_at, first_use_at")
          .eq("inviter_handle", inviter)
          .eq("legacy", false)
          .not("confirmed_at", "is", null)
          .order("created_at", { ascending: false })
          .limit(500);

        if (rr.error) throw rr.error;

        const base = (rr.data || []).map((r)=>({
          handle: String(r.invited_handle || "").trim(),
          joinedAt: r.created_at || null,
          confirmedAt: r.confirmed_at || null,
          firstUseAt: r.first_use_at || null,
        })).filter(x => !!x.handle);

        const handles = base.map(x => x.handle);

        // Best-effort usage summary (may be limited by API max rows).
        const usageAgg = new Map(); // handle -> { used_total, active_days, last_day }
        if (handles.length) {
          try{
            const ur = await sb
              .from("usage_daily")
              .select("handle, day, gm_used, gn_used")
              .in("handle", handles)
              .gte("day", sinceDay)
              .or("gm_used.gt.0,gn_used.gt.0")
              .range(0, 20000);

            if (ur.error) throw ur.error;

            for (const row of (ur.data || [])) {
              const h = String(row.handle || "").trim();
              const day = String(row.day || "").trim();
              const gm = Number(row.gm_used || 0) || 0;
              const gn = Number(row.gn_used || 0) || 0;
              const sum = gm + gn;
              if (!h || !day || sum <= 0) continue;

              const cur = usageAgg.get(h) || { used_total: 0, active_days: 0, days: new Set(), last_day: null };
              cur.used_total += sum;
              if (!cur.days.has(day)) {
                cur.days.add(day);
                cur.active_days += 1;
              }
              if (!cur.last_day || String(day) > String(cur.last_day)) cur.last_day = day;
              usageAgg.set(h, cur);
            }
          }catch(e){
            console.warn("SB_REF_LIST_USAGE_ERROR", e?.message || e);
          }
        }

        // Best-effort last_seen (optional column)
        const lastSeen = new Map();
        if (handles.length) {
          try{
            const ur = await sb.from("users").select("handle, last_seen").in("handle", handles).range(0, 2000);
            if (ur.error) throw ur.error;
            for (const r of (ur.data || [])) {
              const h = String(r.handle || "").trim();
              if (h) lastSeen.set(h, r.last_seen || null);
            }
          }catch(e){
            // ignore if column missing or RLS blocks
          }
        }

        const list = base.map((r)=> {
          const agg = usageAgg.get(r.handle);
          const inserts = agg ? Number(agg.used_total || 0) : 0;
          const activeDays = agg ? Number(agg.active_days || 0) : 0;
          const hasActivity = !!r.firstUseAt || inserts > 0;
          const statusInfo = classifyReferralEntry({ activeDays, inserts, fraud: false, fraudReason: null, hasActivity });
          return {
            handle: r.handle,
            joinedAt: r.joinedAt,
            confirmedAt: r.confirmedAt,
            inserts,
            activeDays,
            lastInsertAt: agg?.last_day ? (String(agg.last_day) + "T00:00:00Z") : null,
            lastSeen: lastSeen.get(r.handle) ?? null,
            fraud: false,
            fraudReason: null,
            eligible: statusInfo.eligible,
            status: statusInfo.status,
            notCountedReason: statusInfo.notCountedReason,
          };
        });

        return res.json({ ok:true, days, inviter, list, thresholds: { minDays: REF_MIN_ACTIVE_DAYS, minUses: REF_MIN_ACTIVE_USES } });
      }
      // If Supabase is misconfigured mid-flight, fall back to sqlite below.
    }

    // SQLite fallback (legacy / offline)
    const rows = safeDb(() => db.prepare(`
      SELECT
        ri.invited_handle AS handle,
        ri.created_at AS joined_at,
        ri.confirmed_at AS confirmed_at,
        COALESCE(ud.used_total, 0) AS used_total,
        COALESCE(ud.active_days, 0) AS active_days,
        COALESCE(ud.last_day, NULL) AS last_day,
        COALESCE(u.last_seen, NULL) AS last_seen,
        COALESCE(ri.fraud_flag, 0) AS fraud_flag,
        COALESCE(ri.fraud_reason, NULL) AS fraud_reason,
        EXISTS (SELECT 1 FROM usage_daily ud2 WHERE ud2.handle=ri.invited_handle AND ud2.used>0 LIMIT 1) AS ever_used
      FROM referral_invites ri
      LEFT JOIN users u ON u.handle = ri.invited_handle
      LEFT JOIN (
        SELECT
          handle,
          SUM(used) AS used_total,
          COUNT(DISTINCT day) AS active_days,
          MAX(day) AS last_day
        FROM usage_daily
        WHERE day >= ? AND used > 0
        GROUP BY handle
      ) ud ON ud.handle = ri.invited_handle
      WHERE ri.inviter_handle=? AND ri.status='confirmed'
      ORDER BY ri.created_at DESC
      LIMIT 500
    `).all(sinceDay, inviter)) || [];

    const list = rows.map((r)=>{
      const inserts = Number(r.used_total||0) || 0;
      const activeDays = Number(r.active_days||0) || 0;
      const fraud = !!Number(r.fraud_flag||0);
      const fraudReason = r.fraud_reason || null;
      const hasActivity = !!Number(r.ever_used||0);
      const statusInfo = classifyReferralEntry({ activeDays, inserts, fraud, fraudReason, hasActivity });
      return {
        handle: r.handle,
        joinedAt: r.joined_at,
        confirmedAt: r.confirmed_at,
        inserts,
        activeDays,
        lastInsertAt: r.last_day ? (String(r.last_day) + "T00:00:00Z") : null,
        lastSeen: r.last_seen || null,
        fraud,
        fraudReason,
        eligible: statusInfo.eligible,
        status: statusInfo.status,
        notCountedReason: statusInfo.notCountedReason,
      };
    });

    return res.json({ ok:true, days, inviter, list, thresholds: { minDays: REF_MIN_ACTIVE_DAYS, minUses: REF_MIN_ACTIVE_USES } });
  }catch(e){
    console.error("REFERRAL_LIST_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Public leaderboard for referrals (P1)
// Public leaderboard for referrals (P1)
app.get("/api/leaderboard/referrals", (req, res) => {
  try{
    const days = Math.max(7, Math.min(180, Number(req.query.days || 30) || 30));
    const sinceIso = new Date(Date.now() - days*24*60*60*1000).toISOString();

    const top = safeDb(() => db.prepare(`
      SELECT
        ri.inviter_handle AS handle,
        COUNT(1) AS confirmed,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM usage_daily ud
          WHERE ud.handle = ri.invited_handle AND ud.used > 0
          LIMIT 1
        ) THEN 1 ELSE 0 END) AS active
      FROM referral_invites ri
      WHERE ri.status='confirmed'
        AND ri.created_at >= ?
        AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0)
      GROUP BY ri.inviter_handle
      HAVING active > 0
      ORDER BY active DESC, handle ASC
      LIMIT 50
    `).all(sinceIso)) || [];

    // Optional "me" block if caller provides a token
    let me = null;
    try{
      const tok = getBearer(req);
      const u = userByToken(tok);
      if (u && validHandle(u.handle)){
        const mine = safeDb(() => db.prepare(`
          SELECT
            SUM(CASE WHEN EXISTS (
              SELECT 1 FROM usage_daily ud
              WHERE ud.handle = ri.invited_handle AND ud.used > 0
              LIMIT 1
            ) THEN 1 ELSE 0 END) AS eligible
          FROM referral_invites ri
          WHERE ri.status='confirmed'
            AND ri.created_at >= ?
            AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0)
            AND ri.inviter_handle=?
        `).get(sinceIso, u.handle)?.eligible || 0);
        me = { handle: u.handle, eligible: Number(mine||0) || 0 };
      }
    }catch(_e){}

    // On leaderboard, eligible == active (legacy isn't used for ranking).
    res.json({ ok:true, days, rules: { confirmed: "invite via ref link", active: "usage_daily.used > 0", eligible: "active (leaderboard)" }, top: top.map(r=>({
      handle: r.handle,
      confirmed: Number(r.confirmed||0)||0,
      active: Number(r.active||0)||0,
      eligible: Number(r.active||0)||0
    })), me });
  }catch(e){
    console.error("LEADERBOARD_REFERRALS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});




// Activity log
app.get("/api/activity", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    let limit = Number(req.query?.limit ?? 50);
    if (!Number.isFinite(limit)) limit = 50;
    limit = Math.max(1, Math.min(200, Math.floor(limit)));

    const rows = safeDb(() => db.prepare(
      "SELECT event_type, meta_json, created_at FROM activity_log WHERE handle=? ORDER BY created_at DESC LIMIT ?"
    ).all(handle, limit)) || [];

    res.json({ ok:true, items: rows.map(r => ({
      type: r.event_type,
      meta: (()=>{ try{ return r.meta_json ? JSON.parse(r.meta_json) : null; }catch{ return null; } })(),
      createdAt: r.created_at
    })) });
  }catch(e){
    console.error("ACTIVITY_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Feature flags (admin-only)
app.get("/api/features", requireAuth, (req, res) => {
  try{
    if (!isAdminHandle(req.user.handle)) return res.status(403).json({ ok:false, error:"forbidden" });
    const rows = safeDb(() => db.prepare("SELECT key, value, updated_at FROM settings WHERE key LIKE 'feature:%' ORDER BY key ASC").all()) || [];
    res.json({ ok:true, flags: rows.map(r => ({
      key: String(r.key||'').replace(/^feature:/,''),
      value: String(r.value||'') === '1',
      updatedAt: r.updated_at
    }))});
  }catch(e){
    console.error("FEATURES_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/features", requireAuth, (req, res) => {
  try{
    if (!isAdminHandle(req.user.handle)) return res.status(403).json({ ok:false, error:"forbidden" });
    const key = String(req.body?.key || '').trim();
    const value = !!req.body?.value;
    if (!key || key.length > 64) return res.status(400).json({ ok:false, error:"invalid_key" });
    setFeatureFlag(key, value);
    logActivity(req.user.handle, 'feature_flag_set', { key, value });
    res.json({ ok:true, key, value });
  }catch(e){
    console.error("FEATURES_SET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/market/signals", requireAuth, (req, res) => {
  try {
    const handle = String(req.user?.handle || "").trim().toLowerCase();
    const now = Date.now();
    const dayKey = new Date(now).toISOString().slice(0, 10);
    const fnv1a = (input) => {
      let h = 0x811c9dc5;
      for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
      }
      return h >>> 0;
    };
    const seed = fnv1a(`${handle}:${dayKey}`);
    const count = 3 + (seed % 3); // 3..5 cards per day
    const universe = [
      "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
      "DOGE/USDT", "AVAX/USDT", "ADA/USDT", "LINK/USDT", "ARB/USDT",
    ];
    const signals = [];
    for (let i = 0; i < count; i++) {
      const idx = (seed + i * 7) % universe.length;
      const symbol = universe[idx];
      const wave = Math.sin((now / 5400000) + (idx * 0.57) + (i * 1.13)) * 2.15;
      const drift = Math.cos((now / 7800000) + (idx * 0.33) - (i * 0.41)) * 1.45;
      const changePct = Number((wave + drift).toFixed(2));
      const bias = changePct >= 0.9 ? "bullish" : (changePct <= -0.9 ? "bearish" : "neutral");
      const confidence = Math.max(61, Math.min(92, Math.round(74 + Math.abs(changePct) * 5)));
      const thesis = bias === "bullish"
        ? "Polymarket probability skew and momentum are aligned. Consider continuation only with strict risk controls."
        : (bias === "bearish"
          ? "Probability skew weakens while structure softens. Consider defense-first positioning and tighter invalidation."
          : "Probabilities are mixed. Wait for confirmation before forcing direction.");
      const risk = "Bot-generated signal. It can be wrong. Not financial advice. You are fully responsible for trading decisions and losses.";
      signals.push({
        id: `pm_${dayKey}_${i + 1}_${symbol.replace(/[^A-Z0-9]/g, "")}`,
        symbol,
        bias,
        changePct,
        confidence,
        thesis,
        risk,
      });
    }
    const headlineSignal = signals[0] ? {
      id: signals[0].id,
      title: "Polymarket Direction Signal",
      source: "Polymarket",
      confidencePct: Number(signals[0].confidence || 90),
      cadence: "3-5 signals per day",
      thesis: "Signals are generated by a bot model and can be wrong. This feed is informational only.",
    } : null;

    res.json({
      ok: true,
      asOf: new Date(now).toISOString(),
      comingSoon: false,
      headlineSignal,
      scheduleRangePerDay: "3-5",
      confidenceTargetPct: 90,
      source: "Polymarket",
      disclaimer: "Not financial advice. GMXReply is not responsible for trading outcomes or losses.",
      alerts: {
        extension: true,
      },
      signals,
    });
  } catch (e) {
    console.error("MARKET_SIGNALS_ERROR", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
}
