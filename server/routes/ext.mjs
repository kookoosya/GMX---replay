/** Extension selectors, events, FAQ (public). */

export function registerExtRoutes(deps) {
  const {
    app,
    BUILD_ID,
    safeDb,
    db,
    nowIso,
    sha256,
    referralFingerprint,
    getEffectiveExtSelectorsForClient,
  } = deps;

  app.get("/api/ext/selectors", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const metaOnly =
      String(req.query?.meta || "").toLowerCase() === "1" || String(req.query?.meta || "").toLowerCase() === "true";
    const clientId = String(req.query?.client_id || "").trim();

    const { selectors, overrideUpdatedAt, rollout, inRollout } = getEffectiveExtSelectorsForClient(clientId);
    const baseMeta = {
      ok: true,
      build: BUILD_ID,
      overrideUpdatedAt,
      rolloutUpdatedAt: rollout?.updated_at || null,
      rolloutPercent: rollout?.rollout_percent ?? 100,
      inRollout,
      version: selectors?.version || 1,
    };

    if (metaOnly) {
      return res.json(baseMeta);
    }

    res.json({ ...baseMeta, ...selectors });
  });

  app.post("/api/ext/event", (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const clientId = String(body.client_id || req.headers["x-gmx-client"] || "").trim();
      const client_hash = sha256(clientId || referralFingerprint(req)).slice(0, 24);
      const event_type = String(body.event_type || body.type || "")
        .toLowerCase()
        .trim();
      const ok = body.ok === true || body.ok === 1 || body.ok === "1";
      const error_code = String(body.error_code || body.error || "").trim().slice(0, 64) || null;
      const ext_version = String(body.ext_version || body.version || "").trim().slice(0, 32) || null;

      if (!/^[a-z0-9_]{1,32}$/.test(event_type)) {
        return res.status(400).json({ ok: false, error: "invalid_event_type" });
      }

      let meta_json = null;
      if (body.meta && typeof body.meta === "object") {
        try {
          const s = JSON.stringify(body.meta);
          meta_json = s.length <= 2048 ? s : s.slice(0, 2048);
        } catch {}
      }

      safeDb(() => {
        db.prepare(
          "INSERT INTO ext_events(created_at, client_hash, ext_version, event_type, ok, error_code, meta_json) VALUES(?,?,?,?,?,?,?)"
        ).run(nowIso(), client_hash, ext_version, event_type, ok ? 1 : 0, error_code, meta_json);
      });
      res.json({ ok: true });
    } catch (e) {
      console.error("EXT_EVENT_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/ext/faq", (req, res) => {
    try {
      const row = safeDb(() => db.prepare("SELECT json, updated_at FROM ext_faq WHERE id=1").get());
      const json = row?.json ? JSON.parse(row.json) : { version: 1, items: [] };
      return res.json({ ok: true, updated_at: row?.updated_at || null, faq: json });
    } catch (e) {
      console.error("EXT_FAQ_GET_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });
}
