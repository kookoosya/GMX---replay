/** Authenticated random single and bulk generation */

import {
  freeGenLimitsFromPromo,
  getFreeGenState,
  consumeFreeGenAtomic,
  ensureFreeGenMigratedAsync,
} from "../free-gen-quota.mjs";

export function registerRandomRoutes(deps) {
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
    sbRefClicksUpsert,
    sbSumLegacyGenUsed,
  } = deps;

  async function freeGenContext(handle) {
    try { awardReferralBonus(handle); } catch (_e) {}
    try { maybeAwardStarterReward(handle); } catch (_e) {}
    const u = userByHandle(handle) || { handle };
    const promo = await getReferralPromoterSummary(handle, { userRow: u });
    const sub = subscriptionInfo({ ...u, handle });
    const limits = freeGenLimitsFromPromo(CONFIG, promo);
    await ensureFreeGenMigratedAsync(safeDb, db, handle, limits.total, { sbSumLegacyGenUsed });
    const state = getFreeGenState(safeDb, db, handle, sub.active ? 999999 : limits.total);
    return { u, sub, limits, state };
  }

  function limitReachedBody(state, limits, requested = 1) {
    return {
      ok: false,
      error: "limit_reached",
      used: state.used,
      limit: limits.total,
      baseLimit: limits.base,
      bonusLimit: limits.bonus,
      requested,
      remaining: Math.max(0, limits.total - state.used),
      resetAt: null,
      shared: true,
    };
  }

// ---------- PRO TOOLS (server-side gated; requires auth) ----------
function toolLimit(sub, freeLimit, proLimit){
  return sub?.active ? proLimit : freeLimit;
}
function toolError(res, feature, used, limit, proLimit){
  return res.status(402).json({ ok:false, error:"upgrade_required", feature, used, limit, proLimit });
}


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

    const ctx = await freeGenContext(handle);
    if (!ctx.sub.active && ctx.state.remaining < 1) {
      try{ logActivity(handle, 'limit_hit', { kind, used: ctx.state.used, limit: ctx.limits.total, source: 'ext_random' }); }catch{}
      return res.status(429).json(limitReachedBody(ctx.state, ctx.limits, 1));
    }

    const reply = generateUnique(handle, kind, mode, lang, style, antiN);
    if (!String(reply || "").trim()) {
      return res.status(502).json({ ok: false, error: "empty_reply" });
    }

    let consume = { ok: true, used: ctx.state.used, limit: ctx.limits.total, remaining: ctx.state.remaining };
    if (!ctx.sub.active) {
      consume = consumeFreeGenAtomic(safeDb, db, handle, 1, ctx.limits.total, kind);
      if (!consume.ok) {
        return res.status(429).json(limitReachedBody(getFreeGenState(safeDb, db, handle, ctx.limits.total), ctx.limits, 1));
      }
    }

    saveRecent(handle, kind, reply, mode, style);
    logActivity(handle, 'gen', { kind, mode, lang, style, antiN });
    const newUsed = consume.used;

    res.json({
      ok:true,
      handle,
      kind,
      reply,
      usage:{
        used: newUsed,
        limit: ctx.sub.active ? null : ctx.limits.total,
        baseLimit: ctx.limits.base,
        bonusLimit: ctx.limits.bonus,
        remaining: ctx.sub.active ? null : Math.max(0, ctx.limits.total - newUsed),
        resetAt: null,
        shared: true,
      }
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

    const ctx = await freeGenContext(handle);
    if (!ctx.sub.active && ctx.state.remaining < count) {
      try{ logActivity(handle, 'limit_hit', { kind, used: ctx.state.used, limit: ctx.limits.total, requested: count, source: 'ext_random_bulk' }); }catch{}
      return res.status(429).json(limitReachedBody(ctx.state, ctx.limits, count));
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

    const chargeCount = list.length;
    if (!chargeCount) {
      return res.status(502).json({ ok: false, error: "empty_reply", count: 0, list: [] });
    }

    let consume = { ok: true, used: ctx.state.used, limit: ctx.limits.total, remaining: ctx.state.remaining };
    if (!ctx.sub.active) {
      consume = consumeFreeGenAtomic(safeDb, db, handle, chargeCount, ctx.limits.total, kind);
      if (!consume.ok) {
        return res.status(429).json(limitReachedBody(getFreeGenState(safeDb, db, handle, ctx.limits.total), ctx.limits, chargeCount));
      }
    }
    const newUsed = consume.used;

    res.json({
      ok:true,
      handle,
      kind,
      mode,
      lang,
      count: list.length,
      list,
      usage:{
        used: newUsed,
        limit: ctx.sub.active ? null : ctx.limits.total,
        baseLimit: ctx.limits.base,
        bonusLimit: ctx.limits.bonus,
        remaining: ctx.sub.active ? null : Math.max(0, ctx.limits.total - newUsed),
        resetAt: null,
        shared: true,
      }
    });
  } catch (e) {
    console.error("RANDOM_BULK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  } finally {
    if (slotAcquired) GEN_SEMAPHORE.release();
  }
});


}
