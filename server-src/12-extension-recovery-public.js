import { registerGenerateRoutes } from "./server/routes/generate.mjs";

// ---------- EXTENSION RECOVERY (public) ----------
const EXT_SELECTORS = {
  version: 1,
  // Keep selectors broad: X changes often; we prefer multiple fallbacks.
  composer: [
    'div[data-testid^="tweetTextarea_"] div[role="textbox"]',
    'div[role="dialog"] div[role="textbox"]',
    'div[role="textbox"][data-testid*="tweetTextarea"]',
    'div[role="textbox"][contenteditable="true"]',
    'div[role="textbox"]'
  ],
  tweetText: [
    'article div[data-testid="tweetText"]',
    'div[data-testid="tweetText"]',
    'article [lang]'
  ],
  anchors: [
    'div[data-testid="toolBar"]',
    'div[data-testid="tweetButtonInline"]',
    'div[role="group"]'
  ]
};

function normalizeSelectorsPayload(obj){
  if (!obj || typeof obj !== "object") return null;
  const pickArr = (v, max = 60) =>
    (Array.isArray(v) ? v : [])
      .map(s => String(s || "").trim())
      .filter(Boolean)
      .slice(0, max);

  const payload = {
    version: Number(obj.version || EXT_SELECTORS.version || 1),
    composer: pickArr(obj.composer, 80),
    tweetText: pickArr(obj.tweetText, 80),
    anchors: pickArr(obj.anchors, 80),
  };
  if (!Number.isFinite(payload.version) || payload.version <= 0) payload.version = 1;
  return payload;
}

function getExtSelectorsOverride(){
  const row = safeDb(() =>
    db.prepare("SELECT json, updated_at FROM ext_selectors WHERE id=1").get()
  );
  if (!row?.json) return null;
  try{
    const parsed = JSON.parse(row.json);
    const norm = normalizeSelectorsPayload(parsed);
    if (!norm) return null;
    return { ...norm, updated_at: row.updated_at };
  }catch(_e){
    return null;
  }
}

function setExtSelectorsOverride(payload){
  const norm = normalizeSelectorsPayload(payload);
  if (!norm) return null;
  safeDb(() =>
    db.prepare(
      `INSERT INTO ext_selectors(id, json, updated_at)
       VALUES(1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at`
    ).run(JSON.stringify(norm), nowIso())
  );
  return norm;
}

function resetExtSelectorsOverride(){
  safeDb(() => db.prepare("DELETE FROM ext_selectors WHERE id=1").run());
}

function getExtSelectorsRollout(){
  // Singleton row id=1
  let row = safeDb(() => db.prepare("SELECT rollout_percent, rollout_salt, updated_at FROM ext_selectors_meta WHERE id=1").get());
  if (!row){
    // Safety: create if missing
    const salt = randHex(8);
    safeDb(() => db.prepare("INSERT OR IGNORE INTO ext_selectors_meta(id, rollout_percent, rollout_salt, updated_at) VALUES(1, 100, ?, ?)").run(salt, nowIso()));
    row = { rollout_percent: 100, rollout_salt: salt, updated_at: nowIso() };
  }
  const p = Math.max(0, Math.min(100, Number(row.rollout_percent ?? 100)));
  return {
    rollout_percent: Number.isFinite(p) ? p : 100,
    rollout_salt: String(row.rollout_salt || ""),
    updated_at: String(row.updated_at || "")
  };
}

function setExtSelectorsRolloutMeta({ rollout_percent, rollout_salt }){
  const p0 = Number(rollout_percent);
  const p = Math.max(0, Math.min(100, Number.isFinite(p0) ? Math.floor(p0) : 100));
  const salt = String(rollout_salt || "").trim() || randHex(8);
  safeDb(() =>
    db.prepare(
      `INSERT INTO ext_selectors_meta(id, rollout_percent, rollout_salt, updated_at)
       VALUES(1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET rollout_percent=excluded.rollout_percent, rollout_salt=excluded.rollout_salt, updated_at=excluded.updated_at`
    ).run(p, salt, nowIso())
  );
  return { rollout_percent: p, rollout_salt: salt, updated_at: nowIso() };
}

function inRolloutForClient(clientId, rolloutPercent, rolloutSalt){
  const p = Math.max(0, Math.min(100, Number(rolloutPercent ?? 100)));
  if (p >= 100) return true;
  if (p <= 0) return false;
  const cid = String(clientId || "").trim();
  if (!cid) return false;
  const salt = String(rolloutSalt || "");
  const h = sha256(cid + "|" + salt);
  const n = parseInt(h.slice(0, 8), 16);
  const bucket = (Number.isFinite(n) ? n : 0) % 100;
  return bucket < p;
}

function getEffectiveExtSelectorsForClient(clientId){
  const rollout = getExtSelectorsRollout();
  const o = getExtSelectorsOverride();
  const hasOverride = !!o;

  const inRollout = hasOverride ? inRolloutForClient(clientId, rollout.rollout_percent, rollout.rollout_salt) : false;

  if (!hasOverride || !inRollout){
    return { selectors: EXT_SELECTORS, overrideUpdatedAt: o?.updated_at || null, override: o || null, rollout, inRollout };
  }

  // Override replaces only selector arrays; keep default keys stable.
  const eff = {
    version: o.version || EXT_SELECTORS.version || 1,
    composer: (o.composer && o.composer.length) ? o.composer : EXT_SELECTORS.composer,
    tweetText: (o.tweetText && o.tweetText.length) ? o.tweetText : EXT_SELECTORS.tweetText,
    anchors: (o.anchors && o.anchors.length) ? o.anchors : EXT_SELECTORS.anchors,
  };

  return { selectors: eff, overrideUpdatedAt: o.updated_at || null, override: o, rollout, inRollout };
}

// For admin/debug views: show the effective override without rollout gating.
function getEffectiveExtSelectors(){
  const o = getExtSelectorsOverride();
  if (!o) return { selectors: EXT_SELECTORS, overrideUpdatedAt: null, override: null };
  const eff = {
    version: o.version || EXT_SELECTORS.version || 1,
    composer: (o.composer && o.composer.length) ? o.composer : EXT_SELECTORS.composer,
    tweetText: (o.tweetText && o.tweetText.length) ? o.tweetText : EXT_SELECTORS.tweetText,
    anchors: (o.anchors && o.anchors.length) ? o.anchors : EXT_SELECTORS.anchors,
  };
  return { selectors: eff, overrideUpdatedAt: o.updated_at || null, override: o };
}

app.get("/api/ext/selectors", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // meta=1 returns a small payload for quick polling (used by the extension to detect selector updates)
  const metaOnly = String(req.query?.meta || "").toLowerCase() === "1" || String(req.query?.meta || "").toLowerCase() === "true";
  const clientId = String(req.query?.client_id || "").trim();

  const { selectors, overrideUpdatedAt, rollout, inRollout } = getEffectiveExtSelectorsForClient(clientId);
  const baseMeta = {
    ok: true,
    build: BUILD_ID,
    overrideUpdatedAt,
    rolloutUpdatedAt: rollout?.updated_at || null,
    rolloutPercent: rollout?.rollout_percent ?? 100,
    inRollout,
    version: selectors?.version || 1
  };

  if (metaOnly){
    return res.json(baseMeta);
  }

  res.json({ ...baseMeta, ...selectors });
});

// Extension diagnostics / health pings.
// IMPORTANT: do not store tweet text or generated replies here. Only coarse error codes + metadata.
app.post("/api/ext/event", (req, res) => {
  try{
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const clientId = String(body.client_id || req.headers["x-gmx-client"] || "").trim();
    const client_hash = sha256(clientId || referralFingerprint(req)).slice(0, 24);
    const event_type = String(body.event_type || body.type || "").toLowerCase().trim();
    const ok = (body.ok === true || body.ok === 1 || body.ok === "1");
    const error_code = String(body.error_code || body.error || "").trim().slice(0, 64) || null;
    const ext_version = String(body.ext_version || body.version || "").trim().slice(0, 32) || null;

    if (!/^[a-z0-9_]{1,32}$/.test(event_type)){
      return res.status(400).json({ ok:false, error:"invalid_event_type" });
    }

    let meta_json = null;
    if (body.meta && typeof body.meta === "object"){
      try{
        const s = JSON.stringify(body.meta);
        meta_json = s.length <= 2048 ? s : s.slice(0, 2048);
      }catch{}
    }

    safeDb(() => {
      db.prepare(
        "INSERT INTO ext_events(created_at, client_hash, ext_version, event_type, ok, error_code, meta_json) VALUES(?,?,?,?,?,?,?)"
      ).run(nowIso(), client_hash, ext_version, event_type, ok ? 1 : 0, error_code, meta_json);
    });
    res.json({ ok:true });
  }catch(e){
    console.error("EXT_EVENT_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

function getExtFaq(){
  const row = safeDb(() => db.prepare("SELECT json, updated_at FROM ext_faq WHERE id=1").get());
  if (!row?.json) return { version: 1, items: [] };
  try{ return JSON.parse(row.json); }catch{ return { version: 1, items: [] }; }
}

app.get("/api/ext/faq", (req, res) => {
  try{
    const row = safeDb(() => db.prepare("SELECT json, updated_at FROM ext_faq WHERE id=1").get());
    const json = row?.json ? JSON.parse(row.json) : { version: 1, items: [] };
    return res.json({ ok:true, updated_at: row?.updated_at || null, faq: json });
  }catch(e){
    console.error("EXT_FAQ_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


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

registerGenerateRoutes({
  app,
  requireAuth,
  sendError,
  ERROR_CODES,
  parseAntiLastN,
  normLang,
  generateUnique,
  generateRankedCandidates,
  saveRecent,
});


