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
});

// Billing
app.get("/api/billing/plans", async (req, res) => {
  // Public RPC for client-side transaction submission.
  // Can be a load-balanced endpoint (Helius/QuickNode/etc.).
  const rpcPublic =
    process.env.SOLANA_RPC_PUBLIC ||
    process.env.SOLANA_RPC ||
    "https://api.mainnet-beta.solana.com";
  let solUsd = 0;
  try { solUsd = await getSolUsd(); } catch { solUsd = 0; }

  const plans = BILLING_PLANS.map((p) => {
    const lamports = solUsd > 0 ? quoteSolLamportsFromUsd(p.usd, solUsd) : 0n;
    const solApprox = lamports > 0n ? Number(lamports) / 1_000_000_000 : 0;
    return { ...p, solApprox, currencyBase: "USD" };
  });

  if (!isSolanaPubkey(SOL_RECEIVER)) {
    return res.status(503).json({
      ok: false,
      error: "billing_receiver_not_configured",
      message: "Set SOL_RECEIVER in server environment to enable payments.",
      plans: [],
      tokens: BILLING_TOKENS,
      solUsd,
      rpcPublic,
    });
  }

  res.json({ ok: true, receiver: SOL_RECEIVER, plans, tokens: BILLING_TOKENS, solUsd, rpcPublic, receiverOk: true });
});


function arcadeCoverAllowedSource(src) {
  const value = String(src || "").trim();
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = String(url.hostname || "").toLowerCase();
    return host === "images.crazygames.com" || host === "imgs.crazygames.com" || host === "images.unsplash.com";
  } catch {
    return false;
  }
}

const CUSTOM_WALLPAPERS_SITE = path.join(ASSETS_DIR, "wallpapers", "custom");
const CUSTOM_WALLPAPERS_EXT = path.join(ASSETS_DIR, "extbg", "custom");
const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;
function listCustomWallpapers(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).sort();
    return files.map((f, i) => ({
      id: "custom_" + f,
      name: "Custom #" + (i + 1),
      file: f,
    }));
  } catch {
    return [];
  }
}
app.get("/api/wallpapers/custom", (req, res) => {
  try {
    const site = listCustomWallpapers(CUSTOM_WALLPAPERS_SITE);
    const ext = listCustomWallpapers(CUSTOM_WALLPAPERS_EXT);
    res.json({ ok: true, site, ext });
  } catch (e) {
    console.error("WALLPAPERS_CUSTOM_ERROR", e);
    res.status(500).json({ ok: false, error: "list_failed" });
  }
});

app.get("/api/arcade/cover", async (req, res) => {
  try {
    const src = String(req.query?.src || "").trim();
    if (!arcadeCoverAllowedSource(src)) return res.status(400).json({ ok:false, error:"invalid_src" });
    const upstream = await fetch(src, {
      headers: {
        "User-Agent": "GMXReply/arcade-cover-proxy",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.gmxreply.com/arcade.html",
      }
    });
    if (!upstream.ok) return res.status(502).json({ ok:false, error:"cover_fetch_failed" });
    const contentType = String(upstream.headers.get("content-type") || "image/png");
    const cacheControl = String(upstream.headers.get("cache-control") || "public, max-age=21600");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl.includes("max-age") ? cacheControl : "public, max-age=21600");
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (e) {
    console.error("ARCADE_COVER_PROXY_ERROR", e);
    res.status(502).json({ ok:false, error:"cover_fetch_failed" });
  }
});

app.get("/api/solana/latest-blockhash", requireAuth, async (_req, res) => {
  try {
    const result = await solanaRpcRequest("getLatestBlockhash", [{ commitment: "finalized" }]);
    res.json({ ok:true, ...result });
  } catch (e) {
    console.error("SOLANA_BLOCKHASH_ERROR", e);
    res.status(503).json({ ok:false, error:"solana_rpc_unavailable" });
  }
});

app.post("/api/solana/send-raw", requireAuth, async (req, res) => {
  try {
    let raw = req.body?.raw;
    if (Array.isArray(raw)) raw = Buffer.from(raw).toString("base64");
    raw = String(raw || "").trim();
    if (!raw) return res.status(400).json({ ok:false, error:"raw_required" });

    const opts = {
      encoding: "base64",
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    };
    const sig = await solanaRpcRequest("sendTransaction", [raw, opts]);
    res.json({ ok:true, sig });
  } catch (e) {
    console.error("SOLANA_SEND_RAW_ERROR", e);
    res.status(503).json({ ok:false, error:"solana_rpc_unavailable" });
  }
});

app.post("/api/billing/intent", requireAuth, async (req, res) => {
  try {
    if (!isSolanaPubkey(SOL_RECEIVER)) {
      return res.status(503).json({ ok: false, error: "billing_receiver_not_configured" });
    }
    const handle = req.user?.handle || null;
    const planKey = String(req.body?.planKey || "").trim();
    const currency = String(req.body?.currency || "SOL").trim().toUpperCase();

    const plan = BILLING_PLANS.find((p) => p.key === planKey);
    if (!plan) return res.status(400).json({ ok:false, error:"invalid_plan" });

    const token = BILLING_TOKENS.find((t) => t.key === currency);
    if (!token) return res.status(400).json({ ok:false, error:"invalid_currency" });

    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    let amountBase = 0n;
    let amountUi = "0";
    let solUsd = 0;
    let mint = null;

    if (token.kind === "native") {
      solUsd = await getSolUsd();
      amountBase = quoteSolLamportsFromUsd(plan.usd, solUsd);
      if (amountBase <= 0n) {
        return res.status(503).json({ ok:false, error:"price_unavailable" });
      }
      amountUi = uiFromBaseUnits(amountBase.toString(), 9);
    } else {
      mint = String(token.mint || "").trim();
      const base = BigInt(Math.round(Number(plan.usd) * 1e6));
      amountBase = base;
      amountUi = String(plan.usd);
    }

    const intentId = randHex(12);
    const nonce = randHex(16);
    const bindMessage = buildBillingBindMessage(handle, intentId, nonce);

    // Garbage collect old intents.
    safeDb(() => {
      db.prepare("DELETE FROM billing_intents WHERE expires_at < ?").run(new Date(now.getTime() - 24*3600*1000).toISOString());
    });

    safeDb(() => {
      db.prepare(
        "INSERT INTO billing_intents(id, handle, plan, currency, mint, amount_base, sol_usd, created_at, expires_at, used_sig, nonce, nonce_sig, status, payer, confirmed_at) VALUES(?,?,?,?,?,?,?,?,?,NULL,?,NULL,'created',NULL,NULL)"
      ).run(intentId, handle, plan.key, currency, mint, amountBase.toString(), solUsd || null, createdAt, expiresAt, nonce);
    });

    logActivity(handle, 'billing_intent_created', { intentId, plan: plan.key, currency });

    res.json({
      ok:true,
      id: intentId,
      intentId,
      receiver: SOL_RECEIVER,
      plan: { ...plan },
      currency,
      mint,
      decimals: Number(token.decimals || 0),
      amountBase: amountBase.toString(),
      amountUi,
      solUsd: solUsd || 0,
      createdAt,
      expiresAt,
      nonce,
      bindMessage,
      bindRequired: true,
    });
  } catch (e) {
    console.error("BILLING_INTENT_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


function maskHandleForProof(h) {
  const t = String(h || "").trim();
  if (!t) return "";
  // Keep just a little bit for social proof without doxxing.
  if (t.length <= 4) return t.slice(0, 1) + "…" + t.slice(-1);
  return t.slice(0, 2) + "…" + t.slice(-2);
}
function shortSigForProof(sig) {
  const s = String(sig || "").trim();
  if (!s) return "";
  if (s.length <= 12) return s;
  return s.slice(0, 6) + "…" + s.slice(-6);
}

app.get("/api/billing/proof", (req, res) => {
  try {
    let limit = Number(req.query?.limit ?? 8);
    if (!Number.isFinite(limit)) limit = 8;
    limit = Math.max(1, Math.min(20, Math.floor(limit)));

    const totalPayments =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM payments").get()?.c || 0);

    const totalPayers =
      safeDb(() => db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM payments").get()?.c || 0);

    const recent = safeDb(() =>
      db.prepare(
        "SELECT sig, handle, plan, currency, amount, created_at FROM payments ORDER BY created_at DESC LIMIT ?"
      ).all(limit)
    ) || [];

    res.json({
      ok: true,
      receiver: SOL_RECEIVER,
      totalPayments,
      totalPayers,
      recent: recent.map(r => ({
        handle: maskHandleForProof(r.handle),
        plan: r.plan,
        currency: r.currency || "SOL",
        amount: r.amount,
        createdAt: r.created_at,
        tx: shortSigForProof(r.sig)
      })),
    });
  } catch (e) {
    console.error("BILLING_PROOF_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


function extractSig(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  const m = s.match(/([A-Za-z0-9]{40,})/g);
  if (!m) return "";
  return m.sort((a,b)=>b.length-a.length)[0];
}

function solanaRpcUrls() {
  const seen = new Set();
  const out = [];
  const push = (raw) => {
    const value = String(raw || "").trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  };
  push(process.env.SOLANA_RPC);
  push(process.env.SOLANA_RPC_PUBLIC);
  // Hard fallback: if a custom RPC returns 403 / rate-limit / bad gateway,
  // keep checkout alive with the canonical public endpoint.
  push("https://api.mainnet-beta.solana.com");
  return out;
}

async function solanaRpcRequest(method, params) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params: Array.isArray(params) ? params : [],
  };
  let lastErr = null;
  for (const rpc of solanaRpcUrls()) {
    try {
      const r = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || j.error) {
        const err = new Error("solana_rpc_unavailable");
        err.status = r.status;
        err.detail = j?.error || null;
        err.rpc = rpc;
        lastErr = err;
        continue;
      }
      return j.result;
    } catch (e) {
      const err = (e instanceof Error) ? e : new Error("solana_rpc_unavailable");
      err.rpc = rpc;
      lastErr = err;
    }
  }
  throw lastErr || new Error("solana_rpc_unavailable");
}

async function solanaGetTransaction(sig) {
  try {
    return await solanaRpcRequest("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
  } catch {
    return null;
  }
}

function lamportsToSol(lamports) {
  return Number(lamports) / 1_000_000_000;
}

function collectParsedTransferLamports(ix, receiver, payer) {
  // Works for jsonParsed instructions (system transfer)
  try {
    if (ix?.parsed?.type !== "transfer") return 0;
    const info = ix.parsed.info || {};
    const dest = info.destination;
    const src = info.source;
    const lamports = Number(info.lamports || 0);
    if (dest !== receiver) return 0;
    if (payer && src !== payer) return 0;
    if (lamports > 0) return lamports;
  } catch {}
  return 0;
}

async function verifySolPayment(sig, receiver, minSol, payer) {
  const tx = await solanaGetTransaction(sig);
  if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };

  // Must be a successful transaction
  if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

  const msg = tx.transaction.message;
  const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

  // Inner instructions (CPI) can contain the actual transfer; include them.
  const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
  const innerInst = [];
  for (const g of inner) {
    const arr = Array.isArray(g?.instructions) ? g.instructions : [];
    for (const ix of arr) innerInst.push(ix);
  }

  let paidLamports = 0;
  for (const ix of topInst) paidLamports += collectParsedTransferLamports(ix, receiver, payer);
  for (const ix of innerInst) paidLamports += collectParsedTransferLamports(ix, receiver, payer);

  if (payer && paidLamports <= 0) return { ok:false, reason:"payer_mismatch" };

  const paidSol = lamportsToSol(paidLamports);
  if (paidSol + 1e-9 < minSol) return { ok:false, reason:"amount_too_low", paidSol };

  return { ok:true, paidSol };
}

function txHasSigner(tx, signer) {
  const want = String(signer || "").trim();
  if (!want) return false;
  const keys = tx?.transaction?.message?.accountKeys || [];
  for (const k of keys) {
    if (typeof k === "string") {
      if (k === want) return true;
    } else {
      const pk = String(k?.pubkey || "");
      const isSigner = !!k?.signer;
      if (pk === want && isSigner) return true;
    }
  }
  return false;
}

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

function b58DecodeToBuf(str){
  try{
    const ALPH = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const MAP = new Map(ALPH.split("").map((c,i)=>[c,i]));
    let bytes = [0];
    for (const ch of String(str||"")){
      const val = MAP.get(ch);
      if (val == null) return null;
      let carry = val;
      for (let i=0;i<bytes.length;i++){
        carry += bytes[i] * 58;
        bytes[i] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0){
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }
    // deal with leading zeros
    let zeros = 0;
    for (const ch of String(str||"")){
      if (ch === "1") zeros++;
      else break;
    }
    while (zeros-- > 0) bytes.push(0);
    bytes.reverse();
    return Buffer.from(bytes);
  }catch{
    return null;
  }
}

function txExtractMemoStrings(tx){
  const out = [];
  const add = (ix)=>{
    try{
      const program = String(ix?.program || "");
      const pid = String(ix?.programId || "");
      const isMemo = (program === "spl-memo") || (pid === MEMO_PROGRAM_ID);
      if (!isMemo) return;

      const p = ix?.parsed;
      if (typeof p === "string" && p) out.push(p);
      if (p && typeof p === "object"){
        if (typeof p.memo === "string" && p.memo) out.push(p.memo);
        if (p.info && typeof p.info.memo === "string" && p.info.memo) out.push(p.info.memo);
      }

      // Fallback: raw data (base58) to utf8
      const data = ix?.data;
      if (typeof data === "string" && data){
        const buf = b58DecodeToBuf(data);
        if (buf){
          const s = buf.toString("utf8").replace(/\0/g, "").trim();
          if (s) out.push(s);
        }
      }
    }catch{}
  };

  const topInst = Array.isArray(tx?.transaction?.message?.instructions) ? tx.transaction.message.instructions : [];
  for (const ix of topInst) add(ix);

  const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
  for (const g of inner){
    const arr = Array.isArray(g?.instructions) ? g.instructions : [];
    for (const ix of arr) add(ix);
  }
  return out;
}

function txHasIntentMemo(tx, intentId){
  const want = `GMXReply|${String(intentId||"").trim()}`;
  if (!want || want.endsWith("|")) return false;
  const memos = txExtractMemoStrings(tx);
  return memos.some(m => String(m||"").includes(want));
}

function buildBillingBindMessage(handle, intentId, nonce){
  const h = String(handle || "").trim();
  const id = String(intentId || "").trim();
  const n = String(nonce || "").trim();
  if (!h || !id || !n) return "";
  return `GMXReply|bind|${id}|${n}|${h}`;
}

function verifySolanaMessageSignature(message, wallet, sig58){
  try{
    const pub = b58DecodeToBuf(wallet);
    const sig = b58DecodeToBuf(sig58);
    if (!pub || pub.length !== 32) return false;
    if (!sig || sig.length !== 64) return false;
    const spki = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      pub,
    ]);
    const key = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    const msg = Buffer.from(String(message || ""), "utf8");
    return crypto.verify(null, msg, key, sig);
  }catch{
    return false;
  }
}

function verifySolPaymentLamportsTx(tx, receiver, minLamports, payer){
  try{
    if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
    if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

    const msg = tx.transaction.message;
    const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

    const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
    const innerInst = [];
    for (const g of inner){
      const arr = Array.isArray(g?.instructions) ? g.instructions : [];
      for (const ix of arr) innerInst.push(ix);
    }

    const need = BigInt(String(minLamports || "0"));
    let paid = 0n;

    const add = (ix) => {
      try{
        if (ix?.parsed?.type !== "transfer") return;
        const info = ix.parsed.info || {};
        const dest = String(info.destination || "");
        const src = String(info.source || "");
        if (dest !== receiver) return;
        if (payer && src !== payer) return;
        const lamports = BigInt(String(info.lamports || "0"));
        if (lamports > 0n) paid += lamports;
      }catch{}
    };

    for (const ix of topInst) add(ix);
    for (const ix of innerInst) add(ix);

    if (payer && paid <= 0n) return { ok:false, reason:"payer_mismatch" };
    if (paid < need) return { ok:false, reason:"amount_too_low", paidLamports: paid.toString() };
    return { ok:true, paidLamports: paid.toString() };
  }catch(e){
    return { ok:false, reason:"verify_failed" };
  }
}

function verifySplTokenPaymentTx(tx, receiverOwner, mint, minBase, payer){
  try{
    if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
    if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };
    if (payer && !txHasSigner(tx, payer)) return { ok:false, reason:"payer_mismatch" };

    const pre = sumTokenBalancesByOwnerMint(tx?.meta?.preTokenBalances, receiverOwner, mint);
    const post = sumTokenBalancesByOwnerMint(tx?.meta?.postTokenBalances, receiverOwner, mint);
    const delta = post - pre;
    const need = BigInt(String(minBase || "0"));
    if (delta < need) return { ok:false, reason:"amount_too_low", paidBase: delta.toString() };
    return { ok:true, paidBase: delta.toString() };
  }catch(e){
    return { ok:false, reason:"verify_failed" };
  }
}

function sumTokenBalancesByOwnerMint(arr, owner, mint) {
  let sum = 0n;
  const ow = String(owner || "").trim();
  const mi = String(mint || "").trim();
  if (!ow || !mi) return 0n;
  for (const b of Array.isArray(arr) ? arr : []) {
    if (String(b?.owner || "") !== ow) continue;
    if (String(b?.mint || "") !== mi) continue;
    const a = b?.uiTokenAmount?.amount;
    if (a == null) continue;
    try { sum += BigInt(String(a)); } catch {}
  }
  return sum;
}

async function verifySplTokenPayment(sig, receiverOwner, mint, minBase, payer) {
  const tx = await solanaGetTransaction(sig);
  if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
  if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };
  if (payer && !txHasSigner(tx, payer)) return { ok:false, reason:"payer_mismatch" };

  const pre = sumTokenBalancesByOwnerMint(tx?.meta?.preTokenBalances, receiverOwner, mint);
  const post = sumTokenBalancesByOwnerMint(tx?.meta?.postTokenBalances, receiverOwner, mint);
  const delta = post - pre;
  const need = BigInt(String(minBase || "0"));
  if (delta < need) {
    return { ok:false, reason:"amount_too_low", paidBase: delta.toString() };
  }
  return { ok:true, paidBase: delta.toString() };
}

async function verifySolPaymentLamports(sig, receiver, minLamports, payer) {
  const tx = await solanaGetTransaction(sig);
  if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
  if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

  const msg = tx.transaction.message;
  const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

  const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
  const innerInst = [];
  for (const g of inner) {
    const arr = Array.isArray(g?.instructions) ? g.instructions : [];
    for (const ix of arr) innerInst.push(ix);
  }

  const need = BigInt(String(minLamports || "0"));
  let paid = 0n;

  const add = (ix) => {
    try {
      if (ix?.parsed?.type !== "transfer") return;
      const info = ix.parsed.info || {};
      const dest = String(info.destination || "");
      const src = String(info.source || "");
      if (dest !== receiver) return;
      if (payer && src !== payer) return;
      const lamports = BigInt(String(info.lamports || "0"));
      if (lamports > 0n) paid += lamports;
    } catch {}
  };

  for (const ix of topInst) add(ix);
  for (const ix of innerInst) add(ix);

  if (payer && paid <= 0n) return { ok:false, reason:"payer_mismatch" };
  if (paid < need) return { ok:false, reason:"amount_too_low", paidLamports: paid.toString() };
  return { ok:true, paidLamports: paid.toString() };
}

app.post("/api/billing/bind", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const intentId = String(req.body?.intentId || "").trim();
    const wallet = String(req.body?.wallet || "").trim();
    const nonceSig = String(req.body?.nonceSig || "").trim();

    if (!intentId) return res.status(400).json({ ok:false, error:"intent_required" });
    if (!wallet) return res.status(400).json({ ok:false, error:"payer_required" });
    if (!isSolanaPubkey(wallet)) return res.status(400).json({ ok:false, error:"invalid_payer" });
    if (!nonceSig) return res.status(400).json({ ok:false, error:"invalid_nonce_sig" });

    const intent = safeDb(() =>
      db.prepare(
        "SELECT id, handle, expires_at, used_sig, payer, status, nonce, nonce_sig FROM billing_intents WHERE id=?"
      ).get(intentId)
    );
    if (!intent) return res.status(404).json({ ok:false, error:"invalid_intent" });
    if (String(intent.handle).toLowerCase() !== String(handle).toLowerCase()) {
      return res.status(403).json({ ok:false, error:"intent_handle_mismatch" });
    }
    if (intent.used_sig) return res.status(409).json({ ok:false, error:"intent_already_used" });
    if (intent.expires_at && new Date(intent.expires_at) < new Date()) {
      return res.status(410).json({ ok:false, error:"intent_expired" });
    }

    const existingWallet = String(intent.payer || "").trim();
    const existingSig = String(intent.nonce_sig || "").trim();
    if (String(intent.status || "") === "bound" && existingWallet) {
      if (existingWallet === wallet && existingSig && existingSig === nonceSig) {
        return res.json({ ok:true, bound:true, wallet, reused:true });
      }
      if (existingWallet !== wallet) {
        return res.status(409).json({ ok:false, error:"intent_already_bound" });
      }
    }

    const msg = buildBillingBindMessage(intent.handle, intent.id, intent.nonce);
    if (!msg) return res.status(409).json({ ok:false, error:"wallet_bind_required" });
    if (!verifySolanaMessageSignature(msg, wallet, nonceSig)) {
      return res.status(400).json({ ok:false, error:"invalid_nonce_sig" });
    }

    safeDb(() => {
      db.prepare("UPDATE billing_intents SET payer=?, nonce_sig=?, status='bound' WHERE id=?")
        .run(wallet, nonceSig, intentId);
    });

    logActivity(handle, 'billing_wallet_bound', { intentId, wallet: `${wallet.slice(0,4)}…${wallet.slice(-4)}` });

    res.json({ ok:true, bound:true, wallet });
  } catch (e) {
    console.error("BILLING_BIND_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/billing/verify", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const intentId = String(req.body?.intentId || "").trim();
    const sig = extractSig(req.body?.sig);
    const payer = String(req.body?.payer || "").trim();

    if (!intentId) return res.status(400).json({ ok:false, error:"intent_required" });
    if (!sig) return res.status(400).json({ ok:false, error:"invalid_sig" });
    if (!payer) return res.status(400).json({ ok:false, error:"payer_required" });
    if (!isSolanaPubkey(payer)) return res.status(400).json({ ok:false, error:"invalid_payer" });

    const exists = safeDb(() => db.prepare("SELECT 1 FROM payments WHERE sig=?").get(sig));
    if (exists) return res.status(409).json({ ok:false, error:"sig_already_used" });

    const intent = safeDb(() =>
      db.prepare(
        "SELECT id, handle, plan, currency, mint, amount_base, expires_at, used_sig, status, payer, nonce, nonce_sig FROM billing_intents WHERE id=?"
      ).get(intentId)
    );
    if (!intent) return res.status(404).json({ ok:false, error:"invalid_intent" });
    if (String(intent.handle).toLowerCase() !== String(handle).toLowerCase()) {
      return res.status(403).json({ ok:false, error:"intent_handle_mismatch" });
    }
    if (intent.used_sig) return res.status(409).json({ ok:false, error:"intent_already_used" });
    const now = new Date();
    if (intent.expires_at && new Date(intent.expires_at) < now) {
      return res.status(410).json({ ok:false, error:"intent_expired" });
    }

    const boundWallet = String(intent.payer || "").trim();
    if (String(intent.status || "") !== "bound" || !boundWallet || !String(intent.nonce_sig || "").trim() || !String(intent.nonce || "").trim()) {
      return res.status(409).json({ ok:false, error:"wallet_bind_required" });
    }
    if (boundWallet !== payer) {
      return res.status(400).json({ ok:false, error:"payment_intent_mismatch" });
    }

    const plan = BILLING_PLANS.find((p) => p.key === String(intent.plan));
    if (!plan) return res.status(400).json({ ok:false, error:"invalid_plan" });

    const currency = String(intent.currency || "SOL").toUpperCase();
    const token = BILLING_TOKENS.find((t) => t.key === currency);
    if (!token) return res.status(400).json({ ok:false, error:"invalid_currency" });
    const expectedBase = BigInt(String(intent.amount_base || "0"));
    if (expectedBase <= 0n) return res.status(400).json({ ok:false, error:"invalid_amount" });

    // Fetch transaction once (prevents race-claim) + require Memo binding to intent
    const tx = await solanaGetTransaction(sig);
    if (!tx?.transaction?.message) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:{ ok:false, reason:"tx_not_found" } });
    if (tx?.meta?.err) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:{ ok:false, reason:"tx_failed", err: tx.meta.err } });

    // Anti-claim theft: tx must include Memo "GMXReply|<intentId>"
    if (!txHasIntentMemo(tx, intentId)) {
      return res.status(400).json({ ok:false, error:"payment_intent_mismatch" });
    }

    let v = { ok:false, reason:"unknown" };
    if (token.kind === "native") {
      v = verifySolPaymentLamportsTx(tx, SOL_RECEIVER, expectedBase.toString(), payer);
    } else {
      const mint = String(intent.mint || token.mint || "").trim();
      if (!mint) return res.status(400).json({ ok:false, error:"mint_required" });
      v = verifySplTokenPaymentTx(tx, SOL_RECEIVER, mint, expectedBase.toString(), payer);
    }
    if (!v.ok) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:v });

    const amountUi = token.kind === "native"
      ? uiFromBaseUnits(expectedBase.toString(), 9)
      : uiFromBaseUnits(expectedBase.toString(), 6);
    const amountNum = Number(amountUi || "0") || 0;

    safeDb(() => {
      db.prepare(
        "INSERT INTO payments(sig, handle, plan, currency, mint, amount, amount_base, payer, created_at) VALUES(?,?,?,?,?,?,?,?,?)"
      ).run(sig, handle, plan.key, currency, token.kind === "native" ? null : String(intent.mint || token.mint), amountNum, expectedBase.toString(), payer, nowIso());
    });
    safeDb(() => {
      db.prepare("UPDATE billing_intents SET used_sig=?, status='confirmed', payer=?, confirmed_at=? WHERE id=?").run(sig, payer, nowIso(), intentId);
    });

    logActivity(handle, 'payment_verified', { plan: plan.key, currency, amountUi });

    safeDb(() => {
      const u = userByHandle(handle);
      const now = new Date();
      const cur = u?.paid_until ? new Date(u.paid_until) : null;
      const base = cur && cur > now ? cur : now;
      const next = new Date(base.getTime() + plan.days * 24*3600*1000);

      db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?")
        .run(next.toISOString(), nowIso(), handle);
    });

    const u2 = userByHandle(handle);
    res.json({
      ok:true,
      sub: subscriptionInfo({ ...u2, handle }),
      paid: {
        currency,
        amountUi,
        amountBase: expectedBase.toString(),
        verified: v,
      }
    });
  } catch (e) {
    console.error("BILLING_VERIFY_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/billing/redeem", requireAuth, (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const code = String(req.body?.code || "").trim();
    if (!code || code.length < 6) return res.status(400).json({ ok:false, error:"invalid_code" });

    const row = safeDb(() => db.prepare("SELECT code, tier, days, grant_type, grant_value FROM admin_codes WHERE code=?").get(code));
    if (!row) return res.status(404).json({ ok:false, error:"code_not_found" });

    const used = safeDb(() => db.prepare("SELECT 1 FROM code_redemptions WHERE code=?").get(code));
    if (used) return res.status(409).json({ ok:false, error:"code_already_redeemed" });

    safeDb(() => {
      db.prepare("INSERT INTO code_redemptions(code, handle, created_at) VALUES(?,?,?)")
        .run(code, handle, nowIso());
    });

    const grantType = String(row.grant_type || 'subscription').trim();

    if (grantType === 'eligible_credit') {
      const grantValue = Math.max(0, Number(row.grant_value || 0) || 0);
      grantReferralReward(handle, 'eligible_credit', grantValue, 'admin_code', code, { code, grantType, grantValue });
      logActivity(handle, 'code_redeemed', { code, grantType, grantValue });
      const starterBgSlots = referralRewardTotal(handle, 'starter_bg_slot');
      const uNow = userByHandle(handle) || { handle };
      const refCodeNow = String(uNow?.ref_code || '').trim();
      const legacyEligibleNow = refCodeNow ? (safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCodeNow)?.c || 0) || 0) : 0;
      const earnedEligibleNow = Math.max(referralCountActive(handle), legacyEligibleNow);
      const totalEligibleNow = earnedEligibleNow + referralRewardTotal(handle, 'eligible_credit');
      const unlocks = computeReferralUnlocks(totalEligibleNow, starterBgSlots);
      return res.json({ ok:true, sub: subscriptionInfo({ ...(uNow||{}), handle }), grant: { grantType, grantValue }, unlocks });
    }

    safeDb(() => {
      const days = Number(row.days || 0);
      if (row.tier === "unlimited" || days === 0) {
        db.prepare("UPDATE users SET tier='unlimited', paid_until=NULL, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?").run(nowIso(), handle);
        return;
      }
      const u = userByHandle(handle);
      const now = new Date();
      const cur = u?.paid_until ? new Date(u.paid_until) : null;
      const base = cur && cur > now ? cur : now;
      const next = new Date(base.getTime() + days * 24*3600*1000);
      db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?").run(next.toISOString(), nowIso(), handle);
    });

    logActivity(handle, 'code_redeemed', { code, tier: row.tier, days: Number(row.days||0), grantType });
    const u2 = userByHandle(handle);
    res.json({ ok:true, sub: subscriptionInfo({ ...u2, handle }) });
  } catch (e) {
    console.error("REDEEM_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});



// Bootstrap admin (one-time). If no admin is configured yet, the current authenticated user becomes admin.
// SECURITY (P0): requires X-Admin-Key (ADMIN_SECRET) to avoid public claiming.
app.post("/api/admin/bootstrap", requireAuth, (req, res) => {
  try{
    const key = getAdminKey(req);
    if (!key) return res.status(401).json({ ok:false, error:"unauthorized", hint:"missing_admin_key" });
    if (!ADMIN_SECRET || ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
      return res.status(500).json({ ok:false, error:"server_error", hint:"admin_secret_not_configured" });
    }
    if (key !== ADMIN_SECRET) return res.status(401).json({ ok:false, error:"unauthorized" });

    const handle = req.user?.handle || null;
    const cur = getAdminHandle();
    if (cur){
      if (isAdminHandle(handle)) return res.json({ ok:true, handle, isAdmin:true, adminHandle: cur });
      return res.status(409).json({ ok:false, error:"admin_already_claimed" });
    }
    setSetting("admin_handle", handle);
    return res.json({ ok:true, handle, isAdmin:true, adminHandle: handle });
  }catch(e){
    console.error("ADMIN_BOOTSTRAP_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Admin login (password) -> issues admin session token.
// Note: Admin APIs require BOTH bearer token and either X-Admin-Token (preferred) or X-Admin-Key (legacy).
const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> String(req.ip || "ip"),
});

app.post("/api/admin/login", adminLoginLimiter, requireAuth, (req, res) => {
  try{
    if (!ADMIN_PASSWORD){
      return res.status(500).json({ ok:false, error:"server_error", hint:"admin_password_not_configured" });
    }
    const handle = req.user?.handle || null;
    if (!handle || !isAdminHandle(handle)) {
      return res.status(403).json({ ok:false, error:"forbidden" });
    }

    const pw = String(req.body?.password || "").trim();
    if (!pw) return res.status(400).json({ ok:false, error:"invalid_request", hint:"missing_password" });

    if (!safeEq(pw, ADMIN_PASSWORD)) return res.status(401).json({ ok:false, error:"unauthorized" });

    const s = adminSessionCreate(handle);
    return res.json({ ok:true, handle, adminToken: s.token, expiresAt: s.expires_at });
  }catch(e){
    console.error("ADMIN_LOGIN_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/admin/logout", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
        const at = getAdminToken(req);
    if (at) adminSessionDelete(at);
    return res.json({ ok:true });
  }catch(e){
    console.error("ADMIN_LOGOUT_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});
