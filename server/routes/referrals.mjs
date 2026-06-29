/** Referral click, stats, list, public leaderboard */

export function registerReferralsRoutes(deps) {
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
        const eligible = me.eligible;
        if (eligible > 0) {
          const rankRow = safeDb(() => db.prepare(`
            SELECT COUNT(*) + 1 AS rank
            FROM (
              SELECT
                ri.inviter_handle AS handle,
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
            ) AS lb
            WHERE lb.active > ?
               OR (lb.active = ? AND lb.handle < ?)
          `).get(sinceIso, eligible, eligible, u.handle));
          const rank = Number(rankRow?.rank || 0) || 0;
          if (rank > 0) me.rank = rank;
        }
      }
    }catch(_e){}

    // On leaderboard, eligible == active (legacy isn't used for ranking).
    res.json({ ok:true, days, rules: {
      confirmed: "invite via ref link on handle connect",
      active: "usage_daily.used > 0",
      eligible: "active (leaderboard)",
      leaderboardSummary: "referrals with at least one GM or GN use",
      minActiveDays: REF_MIN_ACTIVE_DAYS,
      minUses: REF_MIN_ACTIVE_USES,
    }, top: top.map(r=>({
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




}
