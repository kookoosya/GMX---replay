// ---------- ADMIN ----------
function requireAdmin(req, res, next) {
  try {
    // First: allow admin session token without user auth only for local loopback dev traffic.
    const at0 = getAdminToken(req);
    if (at0 && canUseDevAdminSession(req)){
      const s0 = adminSessionGet(at0);
      if (!s0) return res.status(401).json({ ok:false, error:"unauthorized", hint:"invalid_admin_session" });
      req.admin = { by: "admin_session", handle: String(s0.handle || "@admin") };
      return next();
    }

    // Otherwise require a valid user bearer token and admin handle.
    const tok = getBearer(req);
    const u = userByToken(tok);
    if (!u) return res.status(401).json({ ok:false, error:"unauthorized" });
    if (!isAdminHandle(u.handle)) return res.status(403).json({ ok:false, error:"forbidden" });

    // Preferred: admin session token (handle + password login)
    const at = getAdminToken(req);
    if (at){
      const s = adminSessionGet(at);
      if (!s) return res.status(401).json({ ok:false, error:"unauthorized", hint:"invalid_admin_session" });
      if (String(s.handle) !== String(u.handle)) return res.status(403).json({ ok:false, error:"forbidden", hint:"session_handle_mismatch" });
      req.admin = { by: "token+admin_session", handle: u.handle };
      return next();
    }

    // Legacy: admin secret header (backwards compatibility)
    const key = getAdminKey(req);
    if (key){
      if (!ADMIN_SECRET || ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
        return res.status(500).json({ ok:false, error:"server_error", hint:"admin_secret_not_configured" });
      }
      if (key !== ADMIN_SECRET) return res.status(401).json({ ok:false, error:"unauthorized" });
      req.admin = { by: "admin_secret", handle: u.handle };
      return next();
    }

    return res.status(401).json({ ok:false, error:"unauthorized" });
  } catch (e) {
    return res.status(500).json({ ok:false, error:"server_error" });
  }
}



function recordExtSelectorsHistory({ action, note, selectors_json, version, rollout_percent, rollout_salt }){
  safeDb(() => {
    db.prepare(
      "INSERT INTO ext_selectors_history(action, note, created_at, selectors_json, version, rollout_percent, rollout_salt) VALUES(?,?,?,?,?,?,?)"
    ).run(
      String(action||""),
      (note ? String(note) : null),
      nowIso(),
      (selectors_json ? String(selectors_json) : null),
      (Number.isFinite(Number(version)) ? Number(version) : null),
      (Number.isFinite(Number(rollout_percent)) ? Number(rollout_percent) : null),
      (rollout_salt ? String(rollout_salt) : null)
    );
  });
}

function listExtSelectorsHistory(limit=15){
  const lim = Math.max(1, Math.min(50, Math.floor(Number(limit)||15)));
  return safeDb(() =>
    db.prepare(
      "SELECT id, action, note, created_at, version, rollout_percent, rollout_salt FROM ext_selectors_history ORDER BY id DESC LIMIT ?"
    ).all(lim)
  ) || [];
}

function adminSelectorsPayload(){
  const { selectors, overrideUpdatedAt, override } = getEffectiveExtSelectors();
  const rollout = getExtSelectorsRollout();
  return {
    ok: true,
    build: BUILD_ID,
    default: EXT_SELECTORS,
    override: override ? { version: override.version, composer: override.composer, tweetText: override.tweetText, anchors: override.anchors, updated_at: override.updated_at } : null,
    overrideUpdatedAt,
    effective: selectors,
    rollout,
    preview: override ? { version: override.version, composer: override.composer, tweetText: override.tweetText, anchors: override.anchors } : EXT_SELECTORS,
    history: listExtSelectorsHistory(15)
  };
}


app.get("/api/admin/ext/selectors", requireAdmin, (req, res) => {
  try{
    res.json(adminSelectorsPayload());
  }catch(e){
    console.error("ADMIN_EXT_SELECTORS_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/admin/ext/selectors", requireAdmin, (req, res) => {
  try{
    const action = String(req.body?.action || "").toLowerCase().trim() || "save";

    // Rollout actions affect canary bucket assignment.
    if (action === "rollout"){
      const p = Number(req.body?.rollout_percent ?? 100);
      const meta = setExtSelectorsRolloutMeta({ rollout_percent: p, rollout_salt: getExtSelectorsRollout().rollout_salt });
      recordExtSelectorsHistory({ action:"rollout", note: req.body?.note, selectors_json: null, version: null, rollout_percent: meta.rollout_percent, rollout_salt: meta.rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    if (action === "rotate_salt"){
      const p = Number(req.body?.rollout_percent ?? getExtSelectorsRollout().rollout_percent ?? 100);
      const meta = setExtSelectorsRolloutMeta({ rollout_percent: p, rollout_salt: randHex(8) });
      recordExtSelectorsHistory({ action:"rotate_salt", note: req.body?.note, selectors_json: null, version: null, rollout_percent: meta.rollout_percent, rollout_salt: meta.rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    if (action === "rollback"){
      const hid = Number(req.body?.historyId || req.body?.id || 0);
      if (!hid) return res.status(400).json({ ok:false, error:"missing_historyId" });
      const row = safeDb(() => db.prepare("SELECT selectors_json, rollout_percent, rollout_salt FROM ext_selectors_history WHERE id=?").get(hid));
      if (!row) return res.status(404).json({ ok:false, error:"history_not_found" });

      if (row.selectors_json){
        try{
          const parsed = JSON.parse(row.selectors_json);
          setExtSelectorsOverride(parsed);
        }catch{
          // If history JSON is corrupted, reset override.
          resetExtSelectorsOverride();
        }
      }else{
        resetExtSelectorsOverride();
      }

      const meta = setExtSelectorsRolloutMeta({
        rollout_percent: (row.rollout_percent !== null && row.rollout_percent !== undefined) ? row.rollout_percent : getExtSelectorsRollout().rollout_percent,
        rollout_salt: row.rollout_salt ? String(row.rollout_salt) : getExtSelectorsRollout().rollout_salt
      });

      recordExtSelectorsHistory({ action:"rollback", note: req.body?.note, selectors_json: row.selectors_json || null, version: null, rollout_percent: meta.rollout_percent, rollout_salt: meta.rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    if (action === "reset" || action === "default"){
      resetExtSelectorsOverride();
      recordExtSelectorsHistory({ action:"reset", note: req.body?.note, selectors_json: null, version: null, rollout_percent: getExtSelectorsRollout().rollout_percent, rollout_salt: getExtSelectorsRollout().rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    // Touch = bump version + updated_at, so extensions can pick up a refresh without changing arrays.
    if (action === "touch" || action === "refresh" || action === "bump"){
      const existing = getExtSelectorsOverride();
      const base = existing ? existing : { ...EXT_SELECTORS, updated_at: null };
      const bumped = {
        version: Number(base.version || 1) + 1,
        composer: Array.isArray(base.composer) ? base.composer : EXT_SELECTORS.composer,
        tweetText: Array.isArray(base.tweetText) ? base.tweetText : EXT_SELECTORS.tweetText,
        anchors: Array.isArray(base.anchors) ? base.anchors : EXT_SELECTORS.anchors,
      };
      setExtSelectorsOverride(bumped);
      recordExtSelectorsHistory({ action:"touch", note: req.body?.note, selectors_json: JSON.stringify(bumped), version: bumped.version, rollout_percent: getExtSelectorsRollout().rollout_percent, rollout_salt: getExtSelectorsRollout().rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    let payload = req.body?.selectors ?? req.body?.json ?? req.body?.payload ?? req.body;
    if (typeof payload === "string"){
      payload = payload.trim();
      payload = payload ? JSON.parse(payload) : null;
    }

    const norm = normalizeSelectorsPayload(payload);
    if (!norm || !norm.composer?.length || !norm.anchors?.length){
      return res.status(400).json({ ok:false, error:"invalid_selectors_payload" });
    }

    setExtSelectorsOverride(norm);
    recordExtSelectorsHistory({ action:"save", note: req.body?.note, selectors_json: JSON.stringify(norm), version: norm.version, rollout_percent: getExtSelectorsRollout().rollout_percent, rollout_salt: getExtSelectorsRollout().rollout_salt });
    return res.json(adminSelectorsPayload());
  }catch(e){
    const msg = String(e?.message || "");
    if (/json/i.test(msg)){
      return res.status(400).json({ ok:false, error:"invalid_json" });
    }
    console.error("ADMIN_EXT_SELECTORS_POST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/admin/stats", requireAdmin, (req, res) => {
  try {
    const tenMinAgo = new Date(Date.now() - 10*60*1000).toISOString();

    const totalUsers =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users").get()?.c || 0);

    const onlineUsers10m =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE last_seen >= ?").get(tenMinAgo)?.c || 0);

    const day = todayKeyUTC();
    const totalInsertsToday =
      safeDb(() =>
        db.prepare("SELECT COALESCE(SUM(used),0) AS s FROM usage_daily WHERE day=?").get(day)?.s || 0
      );

    const extensionUsers =
      safeDb(() =>
        db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE used > 0").get()?.c || 0
      );

    res.json({
      ok:true,
      onlineUsers10m,
      totalUsers,
      extensionUsers,
      totalInsertsToday,
      build: BUILD_ID,
    });
  } catch (e) {
    console.error("ADMIN_STATS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});
