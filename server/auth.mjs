/** Auth middleware, users, referrals helpers. */

export function createAuth(deps) {
  const {
    safeDb,
    db,
    nowIso,
    sendError,
    ERROR_CODES,
    normalizeHandle,
    validHandle,
    randHex,
    ADMIN_HANDLE_ENV,
    setAdminHandleCache,
    CONFIG,
    supabaseActive,
    sbReferralsCount,
    sbRefClicksCount,
    referralCountConfirmed,
    referralCountActive,
    REF_MIN_ACTIVE_DAYS,
    REF_MIN_ACTIVE_USES,
    clientIp,
    sha256,
    isAdminHandle,
  } = deps;

  const AUTH_COOKIE_NAME = (() => {
    const v = String(process.env.AUTH_COOKIE_NAME || "").trim();
    return v || "gmx_token";
  })();

  const AUTH_COOKIE_MAX_AGE_SEC = (() => {
    const raw = Number(process.env.AUTH_COOKIE_MAX_AGE_SEC || "");
    const def = 60 * 60 * 24 * 180;
    const v = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : def;
    return Math.max(60, Math.min(60 * 60 * 24 * 365, v));
  })();

  function parseCookieHeader(cookieHeader) {
    const out = {};
    const h = String(cookieHeader || "").trim();
    if (!h) return out;
    const parts = h.split(";");
    for (const part of parts) {
      const s = part.trim();
      if (!s) continue;
      const eq = s.indexOf("=");
      if (eq <= 0) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if (!k) continue;
      try { v = decodeURIComponent(v); } catch {}
      out[k] = v;
    }
    return out;
  }

  function getAuthToken(req) {
    const h = req.headers.authorization || "";
    const m = String(h).match(/^Bearer\s+(.+)$/i);
    if (m && m[1]) return String(m[1]).trim();

    const x =
      req.headers["x-gmx-token"] ||
      req.headers["x-session-token"] ||
      req.headers["x-access-token"] ||
      req.headers["x-token"] ||
      req.headers["X-GMX-TOKEN"] ||
      req.headers["X-SESSION-TOKEN"] ||
      req.headers["X-ACCESS-TOKEN"] ||
      req.headers["X-TOKEN"];
    if (x) return String(x).trim();

    const cookies = parseCookieHeader(req.headers.cookie || "");
    const candidates = [
      AUTH_COOKIE_NAME,
      "gmx_token",
      "gmx_session",
      "gmxToken",
      "gmxSession",
      "access_token",
      "token",
    ];
    for (const name of candidates) {
      const v = cookies[name];
      if (v) return String(v).trim();
    }

    return "";
  }

  function setAuthCookie(req, res, token) {
    const t = String(token || "").trim();
    if (!t) return;

    const xfProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
    const isSecure = !!(req.secure || xfProto === "https");

    const parts = [
      `${AUTH_COOKIE_NAME}=${encodeURIComponent(t)}`,
      "Path=/",
      `Max-Age=${AUTH_COOKIE_MAX_AGE_SEC}`,
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (isSecure) parts.push("Secure");

    const cookieStr = parts.join("; ");

    const prev = res.getHeader("Set-Cookie");
    if (!prev) {
      res.setHeader("Set-Cookie", cookieStr);
    } else if (Array.isArray(prev)) {
      res.setHeader("Set-Cookie", [...prev, cookieStr]);
    } else {
      res.setHeader("Set-Cookie", [String(prev), cookieStr]);
    }
  }

  function getBearer(req) {
    return getAuthToken(req);
  }

  function userByHandle(handle) {
    return safeDb(() =>
      db
        .prepare(
          "SELECT handle, access_token, tier, paid_until, ref_code, daily_bonus, last_seen FROM users WHERE handle=?"
        )
        .get(handle)
    );
  }

  function userByToken(token) {
    if (!token) return null;
    return safeDb(() =>
      db
        .prepare(
          "SELECT handle, access_token, tier, paid_until, ref_code, daily_bonus, last_seen FROM users WHERE access_token=?"
        )
        .get(token)
    );
  }

  function requireAuth(req, res, next) {
    try {
      const token = getBearer(req);
      if (!token) return res.status(401).json({ ok: false, error: "unauthorized" });

      const tokenUser = userByToken(token);
      if (!tokenUser) return res.status(401).json({ ok: false, error: "unauthorized" });

      const handleParam = normalizeHandle(req.query.handle || req.body?.handle);
      const handle = handleParam && validHandle(handleParam) ? handleParam : tokenUser.handle;
      if (!validHandle(handle)) {
        return res.status(400).json({ ok: false, error: "invalid_handle" });
      }
      if (String(handle).toLowerCase() !== String(tokenUser.handle).toLowerCase()) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }

      safeDb(() =>
        db.prepare("UPDATE users SET last_seen=? WHERE handle=?").run(nowIso(), handle)
      );

      req.user = tokenUser;
      req.user.handle = handle;
      next();
    } catch (e) {
      console.error("AUTH_ERROR", e);
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  }

  function maybeAuth(req, _res, next) {
    try {
      const token = getBearer(req);
      if (!token) { req.user = null; return next(); }
      const tokenUser = userByToken(token);
      if (!tokenUser) { req.user = null; return next(); }

      const handleParam = normalizeHandle(req.query.handle || req.body?.handle);
      const handle = handleParam && validHandle(handleParam) ? handleParam : tokenUser.handle;
      if (!validHandle(handle)) { req.user = null; return next(); }
      if (String(handle).toLowerCase() !== String(tokenUser.handle).toLowerCase()) {
        req.user = null; return next();
      }

      safeDb(() => db.prepare("UPDATE users SET last_seen=? WHERE handle=?").run(nowIso(), handle));
      req.user = tokenUser;
      req.user.handle = handle;
      return next();
    } catch (e) {
      console.error("MAYBE_AUTH_ERROR", e);
      req.user = null;
      return next();
    }
  }

  function ensureUser(handle) {
    safeDb(() => {
      const row = db
        .prepare("SELECT handle FROM users WHERE handle=?")
        .get(handle);

      if (row) {
        db.prepare("UPDATE users SET last_seen=? WHERE handle=?").run(nowIso(), handle);
        return;
      }

      const usersCount = db.prepare("SELECT COUNT(*) AS c FROM users").get()?.c || 0;
      const adminRow = db.prepare("SELECT value FROM settings WHERE key='admin_handle'").get();
      const adminNow = adminRow?.value ? String(adminRow.value) : "";

      let code = randHex(6);
      for (let i = 0; i < 12; i++) {
        const taken = db.prepare("SELECT 1 FROM users WHERE ref_code=?").get(code);
        if (!taken) break;
        code = randHex(6);
      }

      const token = randHex(20);
      db.prepare(
        `INSERT INTO users(handle, created_at, last_seen, access_token, ref_code, tier, paid_until, daily_bonus)
         VALUES(?,?,?,?,?,'free',NULL,0)`
      ).run(handle, nowIso(), nowIso(), token, code);

      if (usersCount === 0 && !adminNow) {
        const targetAdmin = (ADMIN_HANDLE_ENV && validHandle(ADMIN_HANDLE_ENV)) ? ADMIN_HANDLE_ENV : handle;
        db.prepare("INSERT OR REPLACE INTO settings(key, value, updated_at) VALUES('admin_handle', ?, ?)")
          .run(targetAdmin, nowIso());
        setAdminHandleCache(targetAdmin);
      }
    });
  }

  function rotateToken(handle) {
    const token = randHex(20);
    safeDb(() =>
      db
        .prepare("UPDATE users SET access_token=?, last_seen=? WHERE handle=?")
        .run(token, nowIso(), handle)
    );
    return token;
  }

  function referralFingerprint(req) {
    const deviceId = String(req.headers["x-gmx-device-id"] || req.headers["X-GMX-Device-Id"] || "").trim();
    if (deviceId) return sha256("device|" + deviceId).slice(0, 24);
    const ip = clientIp(req);
    const ua = (req.headers["user-agent"] || "").toString();
    return sha256(ip + "|" + ua).slice(0, 24);
  }

  function bonusPer20ForCount(cnt) {
    return (Number(cnt || 0) >= 50) ? 12 : 10;
  }

  function nextBonusAtForChunks(chunks, reachedCap = false) {
    if (reachedCap) return null;
    const c = Math.max(0, Number(chunks || 0) || 0);
    return (c + 1) * 20;
  }

  async function getReferralPromoterSummary(ownerHandle, opts = {}) {
    const handle = String(ownerHandle || "").trim();
    const userRow = opts && typeof opts === "object" ? opts.userRow : null;
    const explicitClicks = Object.prototype.hasOwnProperty.call(opts || {}, "clicks") ? Number(opts.clicks || 0) || 0 : null;
    const refCode = String((opts && opts.refCode) || userRow?.ref_code || userByHandle(handle)?.ref_code || "").trim();
    if (!handle) {
      return {
        confirmedRefs: 0,
        activeRefs: 0,
        strictEligibleRefs: 0,
        eligibleRefs: 0,
        legacyReferrals: 0,
        clicks: explicitClicks ?? 0,
        bonusPer20: bonusPer20ForCount(0),
        bonusChunks: 0,
        rawDailyBonus: 0,
        dailyBonus: 0,
        dailyLimit: CONFIG.FREE_DAILY_BASE,
        nextBonusAt: 20,
        promoter: false,
        capReached: false,
        tierBasis: 0,
      };
    }

    let legacyReferrals = Object.prototype.hasOwnProperty.call(opts || {}, "legacyReferrals") ? Number(opts.legacyReferrals || 0) || 0 : null;
    let confirmedRefs = Object.prototype.hasOwnProperty.call(opts || {}, "confirmedRefs") ? Number(opts.confirmedRefs || 0) || 0 : null;
    let activeRefs = Object.prototype.hasOwnProperty.call(opts || {}, "activeRefs") ? Number(opts.activeRefs || 0) || 0 : null;
    let clicks = explicitClicks;

    if (legacyReferrals === null || confirmedRefs === null || activeRefs === null || clicks === null) {
      if (supabaseActive()) {
        if (legacyReferrals === null) {
          try { legacyReferrals = (await sbReferralsCount(handle, "legacy")).count || 0; } catch { legacyReferrals = 0; }
        }
        if (confirmedRefs === null) {
          try { confirmedRefs = (await sbReferralsCount(handle, "confirmed")).count || 0; } catch { confirmedRefs = 0; }
        }
        if (activeRefs === null) {
          try { activeRefs = (await sbReferralsCount(handle, "active")).count || 0; } catch { activeRefs = 0; }
        }
        if (clicks === null) {
          if (refCode) {
            try { clicks = (await sbRefClicksCount(refCode)).count || 0; } catch { clicks = 0; }
          } else {
            clicks = 0;
          }
        }
      } else {
        if (legacyReferrals === null) {
          legacyReferrals = refCode
            ? (safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCode)?.c || 0) || 0)
            : 0;
        }
        if (confirmedRefs === null) confirmedRefs = referralCountConfirmed(handle);
        if (activeRefs === null) activeRefs = referralCountActive(handle);
        if (clicks === null) {
          clicks = refCode
            ? (safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM ref_clicks WHERE code=?").get(refCode)?.c || 0) || 0)
            : 0;
        }
      }
    }

    legacyReferrals = Math.max(0, Number(legacyReferrals || 0) || 0);
    confirmedRefs = Math.max(0, Number(confirmedRefs || 0) || 0);
    activeRefs = Math.max(0, Number(activeRefs || 0) || 0);
    clicks = Math.max(0, Number(clicks || 0) || 0);

    const strictEligibleRefs = activeRefs;
    const eligibleRefs = Math.max(strictEligibleRefs, legacyReferrals);
    const bonusChunks = Math.max(0, Math.floor(eligibleRefs / 20));
    const tierBasis = Math.max(eligibleRefs, confirmedRefs);
    const bonusPer20 = bonusPer20ForCount(tierBasis);
    const rawDailyBonus = bonusChunks * bonusPer20;
    const dailyBonus = Math.max(0, Math.min(CONFIG.REF_BONUS_CAP, rawDailyBonus));
    const capReached = CONFIG.REF_BONUS_CAP > 0 && rawDailyBonus >= CONFIG.REF_BONUS_CAP;
    const dailyLimit = CONFIG.FREE_DAILY_BASE + dailyBonus;
    return {
      confirmedRefs,
      activeRefs,
      strictEligibleRefs,
      eligibleRefs,
      legacyReferrals,
      clicks,
      bonusPer20,
      bonusChunks,
      rawDailyBonus,
      dailyBonus,
      dailyLimit,
      nextBonusAt: nextBonusAtForChunks(bonusChunks, capReached),
      promoter: bonusChunks > 0,
      capReached,
      tierBasis,
    };
  }

  function awardReferralBonus(ownerHandle) {
    const handle = String(ownerHandle || "").trim();
    return safeDb(() => {
      if (!handle) return 0;
      const user = userByHandle(handle) || { handle };
      const refCode = String(user?.ref_code || "").trim();
      const legacyReferrals = refCode
        ? (safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCode)?.c || 0) || 0)
        : 0;
      const confirmedRefs = referralCountConfirmed(handle);
      const activeRefs = referralCountActive(handle);
      const eligibleRefs = Math.max(activeRefs, legacyReferrals);
      const bonusChunks = Math.max(0, Math.floor(eligibleRefs / 20));
      const bonusPer20 = bonusPer20ForCount(Math.max(eligibleRefs, confirmedRefs));
      const nextBonus = Math.max(0, Math.min(CONFIG.REF_BONUS_CAP, bonusChunks * bonusPer20));
      try { db.prepare("UPDATE users SET daily_bonus=? WHERE handle=?").run(nextBonus, handle); } catch {}
      return nextBonus;
    });
  }

  async function getDailyLimit(handle, opts = {}) {
    const summary = await getReferralPromoterSummary(handle, opts);
    return Number(summary?.dailyLimit || 0) || CONFIG.FREE_DAILY_BASE;
  }

  function referralRewardTotal(handle, rewardType) {
    return safeDb(() => Number(db.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM referral_rewards WHERE handle=? AND reward_type=?").get(handle, rewardType)?.s || 0) || 0) || 0;
  }

  function hasReferralReward(handle, rewardType) {
    return !!safeDb(() => db.prepare("SELECT 1 FROM referral_rewards WHERE handle=? AND reward_type=? LIMIT 1").get(handle, rewardType));
  }

  function grantReferralReward(handle, rewardType, amount = 0, source = "system", code = null, meta = null) {
    const h = String(handle || "").trim();
    const rt = String(rewardType || "").trim();
    if (!h || !rt) return false;
    return !!safeDb(() => {
      if (code) {
        const exists = db.prepare("SELECT 1 FROM referral_rewards WHERE handle=? AND reward_type=? AND code=? LIMIT 1").get(h, rt, code);
        if (exists) return false;
      }
      const info = meta && typeof meta === "object" ? JSON.stringify(meta) : (meta == null ? null : String(meta));
      const out = db.prepare("INSERT INTO referral_rewards(handle, reward_type, amount, meta_json, code, source, created_at) VALUES(?,?,?,?,?,?,?)").run(h, rt, Number(amount || 0) || 0, info, code, source || "system", nowIso());
      return !!(out && out.changes === 1);
    });
  }

  function maybeAwardStarterReward(handle) {
    const h = String(handle || "").trim();
    if (!h || hasReferralReward(h, "starter_bg_slot")) return false;
    const everUsed = (safeDb(() => db.prepare("SELECT COALESCE(SUM(used),0) AS s FROM usage_daily WHERE handle=? AND used>0").get(h)?.s || 0) || 0) > 0;
    if (!everUsed) return false;
    const invite = safeDb(() => db.prepare("SELECT fraud_flag, fraud_reason FROM referral_invites WHERE invited_handle=? AND status='confirmed' LIMIT 1").get(h));
    if (!invite || Number(invite.fraud_flag || 0)) return false;
    return grantReferralReward(h, "starter_bg_slot", 1, "starter", null, { reason: "eligible_referred_user" });
  }

  function mapReferralNotCountedReason(fraudReason, activeDays, inserts, hasActivity) {
    if (!hasActivity) return "NO_ACTIVITY_YET";
    const fr = String(fraudReason || "").trim();
    if (fr === "fingerprint_dup") return "DEVICE_DUPLICATE";
    if (fr === "ip_burst") return "BURST_FLAG";
    if (fr) return "SUSPICIOUS_PATTERN";
    if (Number(activeDays || 0) < REF_MIN_ACTIVE_DAYS || Number(inserts || 0) < REF_MIN_ACTIVE_USES) return "LOW_ACTIVITY";
    return null;
  }

  function classifyReferralEntry({ activeDays = 0, inserts = 0, fraud = false, fraudReason = null, hasActivity = false }) {
    if (!hasActivity) return { status: "confirmed", eligible: false, notCountedReason: "NO_ACTIVITY_YET" };
    if (fraud) return { status: "active", eligible: false, notCountedReason: mapReferralNotCountedReason(fraudReason, activeDays, inserts, true) };
    if (Number(activeDays || 0) < REF_MIN_ACTIVE_DAYS || Number(inserts || 0) < REF_MIN_ACTIVE_USES) {
      return { status: "active", eligible: false, notCountedReason: "LOW_ACTIVITY" };
    }
    return { status: "eligible", eligible: true, notCountedReason: null };
  }

  function computeReferralUnlocks(totalEligible, starterSlots = 0) {
    const eligible = Math.max(0, Number(totalEligible || 0) || 0);
    const starter = Math.max(0, Number(starterSlots || 0) || 0);
    let bgSlots = 3;
    if (eligible >= 1) bgSlots = 5;
    if (eligible >= 3) bgSlots = 8;
    if (eligible >= 7) bgSlots = 12;
    if (eligible >= 15) bgSlots = 9999;
    const unlimitedBg = bgSlots >= 9999;
    const bgSlotsTotal = unlimitedBg ? bgSlots : (bgSlots + starter);
    return {
      eligible,
      bgSlotsBase: bgSlots,
      starterBgSlots: starter,
      bgSlots: bgSlotsTotal,
      unlimitedBg,
      cosmeticsOnePack: eligible >= 3,
      cosmeticsAllPacks: eligible >= 15,
      saveCapBonus: eligible >= 7 ? 50 : 0,
      proTrial7dUnlocked: eligible >= 30,
      discount50Unlocked: eligible >= 50,
      toolkitUnlocked: eligible >= 100,
      nextUnlockAt: eligible < 1 ? 1 : eligible < 3 ? 3 : eligible < 7 ? 7 : eligible < 15 ? 15 : eligible < 30 ? 30 : eligible < 50 ? 50 : eligible < 100 ? 100 : null,
    };
  }

  function subscriptionInfo(u) {
    const tier = u?.tier || "free";
    const until = u?.paid_until ? new Date(u.paid_until) : null;
    const now = new Date();

    if (isAdminHandle(u?.handle)) {
      return { active: true, tier: "unlimited", daysLeft: 9999, paidUntil: null, isUnlimited: true };
    }

    if (tier === "unlimited") return { active: true, tier: "unlimited", daysLeft: 9999, paidUntil: u?.paid_until || null, isUnlimited: true };
    if (tier === "paid" && until && until > now) {
      const daysLeft = Math.ceil((until - now) / (24 * 3600 * 1000));
      return { active: true, tier: "paid", daysLeft, paidUntil: u.paid_until, isUnlimited: false };
    }
    return { active: false, tier: "free", daysLeft: 0, paidUntil: u?.paid_until || null, isUnlimited: false };
  }

  async function insertLimitForUser(u, opts = {}) {
    const sub = subscriptionInfo(u);
    if (sub.active) return CONFIG.PRO_DAILY_SENTINEL;
    return getDailyLimit(u?.handle, opts);
  }

  return {
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_MAX_AGE_SEC,
    getAuthToken,
    setAuthCookie,
    getBearer,
    userByHandle,
    userByToken,
    requireAuth,
    maybeAuth,
    ensureUser,
    rotateToken,
    referralFingerprint,
    getReferralPromoterSummary,
    awardReferralBonus,
    getDailyLimit,
    referralRewardTotal,
    hasReferralReward,
    grantReferralReward,
    maybeAwardStarterReward,
    mapReferralNotCountedReason,
    classifyReferralEntry,
    computeReferralUnlocks,
    subscriptionInfo,
    insertLimitForUser,
  };
}
