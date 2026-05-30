import { registerUserRoutes } from "./server/routes/user.mjs";

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


registerUserRoutes({
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
});



