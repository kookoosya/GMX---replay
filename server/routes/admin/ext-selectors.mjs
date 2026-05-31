/** Admin extension selectors */

export function registerAdminExtSelectorsRoutes(deps) {
  const {
    app,
    requireAdmin,
    safeDb,
    db,
    nowIso,
    todayKeyUTC,
    BUILD_ID,
    randHex,
    normalizeSelectorsPayload,
    setExtSelectorsRolloutMeta,
    getExtSelectorsRollout,
    setExtSelectorsOverride,
    resetExtSelectorsOverride,
    getExtSelectorsOverride,
    recordExtSelectorsHistory,
    adminSelectorsPayload,
  } = deps;

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
}
