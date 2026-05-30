/** User session, usage, entitlements, lightweight events. */

export function registerUserRoutes(deps) {
  const {
    app,
    rateLimit,
    initLimiter,
    requireAuth,
    maybeAuth,
    sendError,
    ERROR_CODES,
    CONFIG,
    DEV_MODE,
    BUILD_ID,
    STARTED_AT,
    nowIso,
    todayKeyUTC,
    nextResetUTC,
    sha256,
    getAuthToken,
    setAuthCookie,
    canUseDevSessionReset,
    normalizeHandle,
    validHandle,
    userByHandle,
    userByToken,
    ensureUser,
    rotateToken,
    safeDb,
    db,
    supabaseActive,
    sbGetDailyUsed,
    sbReferralsUpsertInvite,
    getDailyUsed,
    subscriptionInfo,
    insertLimitForUser,
    awardReferralBonus,
    maybeAwardStarterReward,
    getReferralPromoterSummary,
    referralRewardTotal,
    computeReferralUnlocks,
    referralFingerprint,
    clientIp,
    originFromReq,
    isAdminHandle,
    logActivity,
    toolLimit,
  } = deps;

  async function getUsageFor(handle){
    const h = String(handle || "").trim();
    if (!h) {
      return {
        gm:{ used:0, limit:0 },
        gn:{ used:0, limit:0 },
        resetAt: nextResetUTC(),
        sub: subscriptionInfo({ handle: "" }),
        limits:{ freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0, saveCapFree: CONFIG.SAVE_CAP_FREE, referralUnlocks: computeReferralUnlocks(0, 0) }
      };
    }
    const day = todayKeyUTC();
    // Referral bonuses are disabled in v1 unlock model; we still keep reward ledger in sync.
    try{ awardReferralBonus(h); }catch(_e){}
    try{ maybeAwardStarterReward(h); }catch(_e){}
    const u = userByHandle(h) || { handle: h };
    const promo = await getReferralPromoterSummary(h, { userRow: u });
    const earnedEligible = Math.max(0, Number(promo?.eligibleRefs || 0) || 0);
    const manualEligibleCredits = referralRewardTotal(h, 'eligible_credit');
    const starterBgSlots = referralRewardTotal(h, 'starter_bg_slot');
    const unlocks = computeReferralUnlocks(earnedEligible + manualEligibleCredits, starterBgSlots);
    const limit = await insertLimitForUser({ ...u, handle: h }, promo);

    let gmUsed = 0;
    let gnUsed = 0;
    if (supabaseActive()) {
      gmUsed = await sbGetDailyUsed(h, day, "gm");
      gnUsed = await sbGetDailyUsed(h, day, "gn");
    } else {
      gmUsed = getDailyUsed(h, day, "gm");
      gnUsed = getDailyUsed(h, day, "gn");
    }

    return {
      gm: { used: gmUsed, limit },
      gn: { used: gnUsed, limit },
      resetAt: nextResetUTC(),
      sub: subscriptionInfo({ ...u, handle: h }),
      limits: {
        freeDaily: CONFIG.FREE_DAILY_BASE,
        dailyBonus: Math.max(0, Number(promo?.dailyBonus || 0) || 0),
        saveCapFree: CONFIG.SAVE_CAP_FREE + (unlocks.saveCapBonus || 0),
        referralUnlocks: unlocks,
        bonusPer20: Math.max(0, Number(promo?.bonusPer20 || 0) || 0),
        bonusChunks: Math.max(0, Number(promo?.bonusChunks || 0) || 0),
        nextBonusAt: promo?.nextBonusAt == null ? null : (Number(promo.nextBonusAt || 0) || 0),
        promoter: !!promo?.promoter,
      }
    };
  }

  app.all("/api/user/init", initLimiter, async (req, res) => {
    try {
      const rawHandle = req.method === "GET" ? req.query.handle : req.body?.handle;
      const handle = normalizeHandle(rawHandle);
      if (!validHandle(handle)) return sendError(res, 400, ERROR_CODES.INVALID_HANDLE);

      const rotate = String((req.method === "GET" ? req.query.rotate : req.body?.rotate) || "").trim();

      // SECURITY (P0): prevent account takeover by requiring an existing token for existing users.
      let userRow0 = userByHandle(handle);
      let token = userRow0?.access_token ? String(userRow0.access_token) : "";

      if (userRow0) {
        const authToken = getAuthToken(req);
        const tokenUser = authToken ? userByToken(authToken) : null;
        const authMatches = !!(tokenUser && String(tokenUser.handle).toLowerCase() === String(handle).toLowerCase());

        // Stable session rule:
        // - never rotate automatically for existing users
        // - rotate only when explicitly requested AND the current session matches this handle
        const rotateReq = (rotate === "1" || rotate.toLowerCase() === "true");
        if (rotateReq) {
          if (!authMatches) {
            return res.status(401).json({ ok:false, error:"token_required_for_rotate" });
          }
          token = rotateToken(handle);
          userRow0 = userByHandle(handle);
        } else if (authMatches) {
          token = authToken;
        } else if (canUseDevSessionReset(req)) {
          token = rotateToken(handle);
          userRow0 = userByHandle(handle);
        } else {
          return res.status(401).json({
            ok:false,
            error:"existing_session_required",
            hint:"open_site_or_use_existing_session"
          });
        }
      } else {
        ensureUser(handle);
        userRow0 = userByHandle(handle);
        token = userRow0?.access_token ? String(userRow0.access_token) : "";
      }

      // --- Referrals (anti-fraud v1) ---
      const ref = (req.method === "GET" ? req.query.ref : req.body?.ref) || "";
      const refCode = String(ref || "").trim();

      // In supabase mode we keep sqlite referral_invites for anti-fraud/back-compat,
      // but write the source-of-truth invite to Supabase (public.referrals).
      let sbInvite = null;

      if (refCode) {
        safeDb(() => {
          const owner = db.prepare("SELECT handle FROM users WHERE ref_code=?").get(refCode);
          const inviter = owner?.handle ? String(owner.handle) : "";
          // ignore self-referrals and invalid
          if (inviter && inviter.toLowerCase() !== handle.toLowerCase() && validHandle(inviter)) {
            const already = db.prepare("SELECT inviter_handle FROM referral_invites WHERE invited_handle=?").get(handle);
            if (!already?.inviter_handle) {
              const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
              const cnt = db
                .prepare("SELECT COUNT(1) as c FROM referral_invites WHERE inviter_handle=? AND created_at>=?")
                .get(inviter, since)?.c || 0;

              if (cnt < 120) {
                const fpOverride = DEV_MODE ? String(req.query.fingerprint || req.query.fp || "").trim() : "";
      const fp = fpOverride ? sha256("dev|" + fpOverride).slice(0, 24) : referralFingerprint(req);
                const ip = clientIp(req);
                const ua = (req.headers["user-agent"] || "").toString();
                const ip_hash = sha256(String(ip || "")).slice(0, 16);
                const ua_hash = sha256(String(ua || "")).slice(0, 16);

                // fingerprint de-dup per inviter (one device = one referral for the same inviter)
                const fpDup = db
                  .prepare("SELECT 1 FROM referral_invites WHERE inviter_handle=? AND fingerprint=? LIMIT 1")
                  .get(inviter, fp);

                // soft burst guard: >3 invites from same inviter+ip_hash within 24h => flagged
                const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const ipBurst = db
                  .prepare(
                    "SELECT COUNT(1) as c FROM referral_invites WHERE inviter_handle=? AND ip_hash=? AND created_at>=?"
                  )
                  .get(inviter, ip_hash, since24)?.c || 0;

                const fraud_flag = (fpDup || ipBurst >= 3) ? 1 : 0;
                const fraud_reason = fpDup ? "fingerprint_dup" : (ipBurst >= 3 ? "ip_burst" : null);

                const ts = nowIso();

                try {
                  db.prepare(
                    "INSERT OR IGNORE INTO referral_invites(inviter_handle, invited_handle, status, created_at, confirmed_at, fingerprint, ip_hash, ua_hash, fraud_flag, fraud_reason) VALUES(?,?,?,?,?,?,?,?,?,?)"
                  ).run(inviter, handle, "confirmed", ts, ts, fp, ip_hash, ua_hash, fraud_flag, fraud_reason);
                } catch (_e) {
                  // ignore unique constraint race
                }

                // legacy fingerprint referral is ONLY for sqlite mode (do not pollute legacy in supabase mode)
                if (!supabaseActive()) {
                  try {
                    db.prepare(
                      "INSERT OR IGNORE INTO referrals(owner_handle, code, fingerprint, created_at) VALUES(?,?,?,?)"
                    ).run(inviter, refCode, fp, ts);
                  } catch {}
                }

                // Supabase invite (only if not fraud-flagged)
                if (supabaseActive() && !fraud_flag) {
                  sbInvite = { inviter, invited: handle, created_at: ts, confirmed_at: ts };
                }
              }
            }
          }
        });
      }

      if (supabaseActive() && sbInvite) {
        try {
          await sbReferralsUpsertInvite(sbInvite.inviter, sbInvite.invited, sbInvite.created_at, sbInvite.confirmed_at);
        } catch (e) {
          console.warn("SB_REF_INVITE_UPSERT_ERROR", e?.message || e);
        }
      }

  const userRow = safeDb(() => db.prepare("SELECT * FROM users WHERE handle=?").get(handle));
      const origin = originFromReq(req);
      const isAdmin = isAdminHandle(handle);
      const userRefCode = userRow?.ref_code ? String(userRow.ref_code) : "";
      const sub = subscriptionInfo({ ...(userRow || {}), handle });

      const usage = await getUsageFor(handle);
      const pro = !!sub.active;

      setAuthCookie(req, res, token);

      res.json({
        ok: true,
        token,
        handle,
        isAdmin,
        adminClaimable: false,
        refCode: userRefCode,
        refLink: userRefCode ? `${origin}/app?ref=${userRefCode}` : "",
        sub,
        user: {
          handle,
          sub_status: sub.active ? "active" : (userRow?.sub_status || "free"),
          until: sub.until || null,
        },
        config: {
          build: BUILD_ID,
          startedAt: STARTED_AT,
          saveCapFree: usage?.limits?.saveCapFree || CONFIG.SAVE_CAP_FREE,
          freeDaily: CONFIG.FREE_DAILY_BASE,
          plan: pro ? "pro" : "free",
        },
        usage: {
          ...usage,
          saveCapFree: usage?.limits?.saveCapFree || CONFIG.SAVE_CAP_FREE,
        },
      });
    } catch (e) {
      console.error("INIT_ERROR", e);
      const detail = DEV_MODE ? String(e?.message || e) : "";
      return sendError(res, 500, ERROR_CODES.SERVER_ERROR, detail ? { detail } : {});
    }
  });




  app.get("/api/usage", maybeAuth, async (req, res) => {
    try {
      const handle = req.user?.handle || null;
      if (!handle) {
        return res.json({
          ok: true,
          authenticated: false,
          gm: { used: 0, limit: CONFIG.FREE_DAILY_BASE },
          gn: { used: 0, limit: CONFIG.FREE_DAILY_BASE },
          resetAt: nextResetUTC(),
          sub: subscriptionInfo({ handle: "" }),
          limits: { freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0, saveCapFree: CONFIG.SAVE_CAP_FREE, referralUnlocks: computeReferralUnlocks(0, 0) },
        });
      }

      const usage = await getUsageFor(handle);

      return res.json({
        ok: true,
        authenticated: true,
        gm: usage.gm,
        gn: usage.gn,
        resetAt: usage.resetAt,
        sub: usage.sub,
        limits: usage.limits,
      });
    } catch (e) {
      console.error("USAGE_ERROR", e);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  });


  // Unified user + limits payload for site/extension.
  // Keeps /api/usage for backwards compatibility.

  async function buildAccessEntitlements(handle) {
    const h = String(handle || "").trim();
    const day = todayKeyUTC();

    // keep referral reward ledger current for unlocks before we expose business gating
    try { awardReferralBonus(h); } catch (_e) {}
    try { maybeAwardStarterReward(h); } catch (_e) {}

    const u = userByHandle(h);
    const usage = await getUsageFor(h);
    const sub = usage?.sub || subscriptionInfo({ ...(u || {}), handle: h });

    const studioLimit = toolLimit(sub, 2, 999999);
    const studioUsed = getDailyUsed(h, day, "tool_studio");

    const bulkMaxPerCall = toolLimit(sub, 10, 50);
    const bulkCallsLimit = toolLimit(sub, 3, 999999);
    const bulkCallsUsed = getDailyUsed(h, day, "tool_bulk_calls");

    const historyLimit = toolLimit(sub, 20, 500);
    const favLimit = toolLimit(sub, 10, 200);

    const unlocks = usage?.limits?.referralUnlocks || computeReferralUnlocks(0, 0);
    const isUnlimited = !!sub?.isUnlimited;
    const paidLike = !!sub?.active;

    return {
      handle: h,
      sub,
      resetAt: usage?.resetAt || nextResetUTC(),
      usage: {
        gm: usage?.gm || { used: 0, limit: CONFIG.FREE_DAILY_BASE },
        gn: usage?.gn || { used: 0, limit: CONFIG.FREE_DAILY_BASE },
      },
      tools: {
        studio: { used: studioUsed, limit: studioLimit },
        bulk: { callsUsed: bulkCallsUsed, callsLimit: bulkCallsLimit, maxPerCall: bulkMaxPerCall },
        history: { limit: historyLimit, searchEnabled: !!sub?.active },
        favorites: { limit: favLimit },
      },
      limits: usage?.limits || { freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0, saveCapFree: CONFIG.SAVE_CAP_FREE, referralUnlocks: computeReferralUnlocks(0, 0) },
      extension: {
        plan: isUnlimited ? "unlimited" : paidLike ? "paid" : "free",
        insertMode: paidLike ? "unlimited" : "metered",
        dailyLimitPerKind: paidLike ? null : Number(usage?.gm?.limit || 0) || CONFIG.FREE_DAILY_BASE,
        saveCap: Number(usage?.limits?.saveCapFree || CONFIG.SAVE_CAP_FREE) || CONFIG.SAVE_CAP_FREE,
        backgrounds: {
          unlimited: !!unlocks?.unlimitedBg,
          slots: unlocks?.unlimitedBg ? null : (Number(unlocks?.bgSlots || 0) || 3),
          cosmeticsOnePack: !!unlocks?.cosmeticsOnePack,
          cosmeticsAllPacks: !!unlocks?.cosmeticsAllPacks,
        },
        unlocks: {
          proTrial7d: !!unlocks?.proTrial7dUnlocked,
          discount50: !!unlocks?.discount50Unlocked,
          toolkit: !!unlocks?.toolkitUnlocked,
          nextUnlockAt: unlocks?.nextUnlockAt ?? null,
        },
      },
      refreshedAt: new Date().toISOString(),
    };
  }

  app.get("/api/access/entitlements", requireAuth, async (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const payload = await buildAccessEntitlements(handle);
      res.json({ ok: true, ...payload });
    } catch (e) {
      console.error("ACCESS_ENTITLEMENTS_ERROR", e);
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  });


  // Lightweight conversion/UX events from frontend (no PII; rate-limited)
  const eventLimiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req)=> String(req.user?.handle || clientIp(req)),
  });

  app.post("/api/event", eventLimiter, (req, res) => {
    try{
      const handle = req.user?.handle || null;
      const type = String(req.body?.type || "").trim();
      const meta = req.body?.meta && typeof req.body.meta === 'object' ? req.body.meta : null;

      // Anonymous events are allowed (for pre-connect UX); we simply acknowledge without storing.
      if (!handle){
        return res.json({ ok:true, stored:false });
      }

      const ALLOW = new Set(["tab_open","generate_click","limit_hit","upgrade_modal_open","pay_click","pay_success","pay_fail","pay_error","busy_try_again"]);
      if (!ALLOW.has(type)) return res.status(400).json({ ok:false, error:"invalid_event" });

      logActivity(handle, type, meta || {});
      res.json({ ok:true });
    }catch(e){
      console.error("EVENT_ERROR", e);
      res.status(500).json({ ok:false, error:"server_error" });
    }
  });


  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const payload = await buildAccessEntitlements(handle);

      res.json({
        ok: true,
        handle: payload.handle,
        sub: payload.sub,
        resetAt: payload.resetAt,
        usage: payload.usage,
        tools: payload.tools,
        limits: payload.limits,
      });
    } catch (e) {
      console.error("ME_ERROR", e);
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  });


}
