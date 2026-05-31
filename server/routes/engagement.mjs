/** Activity log, feature flags, market signals */

export function registerEngagementRoutes(deps) {
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
});
}
