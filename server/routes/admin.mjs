/** Admin dashboard routes + auto leaderboard awards loop. */

export function registerAdminRoutes(deps) {
  const {
    app,
    crypto,
    path,
    DB_PATH,
    BUILD_ID,
    STARTED_AT,
    ADMIN_SECRET,
    safeDb,
    db,
    nowIso,
    todayKeyUTC,
    randHex,
    getBearer,
    getAdminKey,
    getAdminToken,
    canUseDevAdminSession,
    adminSessionGet,
    userByToken,
    userByHandle,
    isAdminHandle,
    normalizeHandle,
    validHandle,
    ensureUser,
    subscriptionInfo,
    grantReferralReward,
    logActivity,
    ext,
    grants,
  } = deps;

  const {
    EXT_SELECTORS,
    normalizeSelectorsPayload,
    setExtSelectorsOverride,
    resetExtSelectorsOverride,
    getExtSelectorsRollout,
    setExtSelectorsRolloutMeta,
    getEffectiveExtSelectors,
  } = ext;

  const {
    adminCodeCreate,
    ensureGrantTarget,
    subscriptionGrantToHandle,
    accessUnlocksForHandle,
    recordAdminGrant,
    applyAdminCodeToHandle,
  } = grants;

  function requireAdmin(req, res, next) {
    try {
      const at0 = getAdminToken(req);
      if (at0 && canUseDevAdminSession(req)) {
        const s0 = adminSessionGet(at0);
        if (!s0) return res.status(401).json({ ok: false, error: "unauthorized", hint: "invalid_admin_session" });
        req.admin = { by: "admin_session", handle: String(s0.handle || "@admin") };
        return next();
      }

      const tok = getBearer(req);
      const u = userByToken(tok);
      if (!u) return res.status(401).json({ ok: false, error: "unauthorized" });
      if (!isAdminHandle(u.handle)) return res.status(403).json({ ok: false, error: "forbidden" });

      const at = getAdminToken(req);
      if (at) {
        const s = adminSessionGet(at);
        if (!s) return res.status(401).json({ ok: false, error: "unauthorized", hint: "invalid_admin_session" });
        if (String(s.handle) !== String(u.handle)) {
          return res.status(403).json({ ok: false, error: "forbidden", hint: "session_handle_mismatch" });
        }
        req.admin = { by: "token+admin_session", handle: u.handle };
        return next();
      }

      const key = getAdminKey(req);
      if (key) {
        if (!ADMIN_SECRET || ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
          return res.status(500).json({ ok: false, error: "server_error", hint: "admin_secret_not_configured" });
        }
        if (key !== ADMIN_SECRET) return res.status(401).json({ ok: false, error: "unauthorized" });
        req.admin = { by: "admin_secret", handle: u.handle };
        return next();
      }

      return res.status(401).json({ ok: false, error: "unauthorized" });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  function recordExtSelectorsHistory({ action, note, selectors_json, version, rollout_percent, rollout_salt }) {
    safeDb(() => {
      db.prepare(
        "INSERT INTO ext_selectors_history(action, note, created_at, selectors_json, version, rollout_percent, rollout_salt) VALUES(?,?,?,?,?,?,?)"
      ).run(
        String(action || ""),
        note ? String(note) : null,
        nowIso(),
        selectors_json ? String(selectors_json) : null,
        Number.isFinite(Number(version)) ? Number(version) : null,
        Number.isFinite(Number(rollout_percent)) ? Number(rollout_percent) : null,
        rollout_salt ? String(rollout_salt) : null
      );
    });
  }

  function listExtSelectorsHistory(limit = 15) {
    const lim = Math.max(1, Math.min(50, Math.floor(Number(limit) || 15)));
    return (
      safeDb(() =>
        db
          .prepare(
            "SELECT id, action, note, created_at, version, rollout_percent, rollout_salt FROM ext_selectors_history ORDER BY id DESC LIMIT ?"
          )
          .all(lim)
      ) || []
    );
  }

  function adminSelectorsPayload() {
    const { selectors, overrideUpdatedAt, override } = getEffectiveExtSelectors();
    const rollout = getExtSelectorsRollout();
    return {
      ok: true,
      build: BUILD_ID,
      default: EXT_SELECTORS,
      override: override
        ? {
            version: override.version,
            composer: override.composer,
            tweetText: override.tweetText,
            anchors: override.anchors,
            updated_at: override.updated_at,
          }
        : null,
      overrideUpdatedAt,
      effective: selectors,
      rollout,
      preview: override
        ? { version: override.version, composer: override.composer, tweetText: override.tweetText, anchors: override.anchors }
        : EXT_SELECTORS,
      history: listExtSelectorsHistory(15),
    };
  }

  app.get("/api/admin/ext/selectors", requireAdmin, (req, res) => {
    try {
      res.json(adminSelectorsPayload());
    } catch (e) {
      console.error("ADMIN_EXT_SELECTORS_GET_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.post("/api/admin/ext/selectors", requireAdmin, (req, res) => {
    try {
      const action = String(req.body?.action || "").toLowerCase().trim() || "save";

      if (action === "rollout") {
        const p = Number(req.body?.rollout_percent ?? 100);
        const meta = setExtSelectorsRolloutMeta({ rollout_percent: p, rollout_salt: getExtSelectorsRollout().rollout_salt });
        recordExtSelectorsHistory({
          action: "rollout",
          note: req.body?.note,
          selectors_json: null,
          version: null,
          rollout_percent: meta.rollout_percent,
          rollout_salt: meta.rollout_salt,
        });
        return res.json(adminSelectorsPayload());
      }

      if (action === "rotate_salt") {
        const p = Number(req.body?.rollout_percent ?? getExtSelectorsRollout().rollout_percent ?? 100);
        const meta = setExtSelectorsRolloutMeta({ rollout_percent: p, rollout_salt: randHex(8) });
        recordExtSelectorsHistory({
          action: "rotate_salt",
          note: req.body?.note,
          selectors_json: null,
          version: null,
          rollout_percent: meta.rollout_percent,
          rollout_salt: meta.rollout_salt,
        });
        return res.json(adminSelectorsPayload());
      }

      if (action === "rollback") {
        const hid = Number(req.body?.historyId || req.body?.id || 0);
        if (!hid) return res.status(400).json({ ok: false, error: "missing_historyId" });
        const row = safeDb(() =>
          db.prepare("SELECT selectors_json, rollout_percent, rollout_salt FROM ext_selectors_history WHERE id=?").get(hid)
        );
        if (!row) return res.status(404).json({ ok: false, error: "history_not_found" });

        if (row.selectors_json) {
          try {
            setExtSelectorsOverride(JSON.parse(row.selectors_json));
          } catch {
            resetExtSelectorsOverride();
          }
        } else {
          resetExtSelectorsOverride();
        }

        setExtSelectorsRolloutMeta({
          rollout_percent:
            row.rollout_percent !== null && row.rollout_percent !== undefined
              ? row.rollout_percent
              : getExtSelectorsRollout().rollout_percent,
          rollout_salt: row.rollout_salt ? String(row.rollout_salt) : getExtSelectorsRollout().rollout_salt,
        });

        recordExtSelectorsHistory({
          action: "rollback",
          note: req.body?.note,
          selectors_json: row.selectors_json || null,
          version: null,
          rollout_percent: getExtSelectorsRollout().rollout_percent,
          rollout_salt: getExtSelectorsRollout().rollout_salt,
        });
        return res.json(adminSelectorsPayload());
      }

      if (action === "reset" || action === "default") {
        resetExtSelectorsOverride();
        recordExtSelectorsHistory({
          action: "reset",
          note: req.body?.note,
          selectors_json: null,
          version: null,
          rollout_percent: getExtSelectorsRollout().rollout_percent,
          rollout_salt: getExtSelectorsRollout().rollout_salt,
        });
        return res.json(adminSelectorsPayload());
      }

      if (action === "touch" || action === "refresh" || action === "bump") {
        const existing = ext.getExtSelectorsOverride();
        const base = existing ? existing : { ...EXT_SELECTORS, updated_at: null };
        const bumped = {
          version: Number(base.version || 1) + 1,
          composer: Array.isArray(base.composer) ? base.composer : EXT_SELECTORS.composer,
          tweetText: Array.isArray(base.tweetText) ? base.tweetText : EXT_SELECTORS.tweetText,
          anchors: Array.isArray(base.anchors) ? base.anchors : EXT_SELECTORS.anchors,
        };
        setExtSelectorsOverride(bumped);
        recordExtSelectorsHistory({
          action: "touch",
          note: req.body?.note,
          selectors_json: JSON.stringify(bumped),
          version: bumped.version,
          rollout_percent: getExtSelectorsRollout().rollout_percent,
          rollout_salt: getExtSelectorsRollout().rollout_salt,
        });
        return res.json(adminSelectorsPayload());
      }

      let payload = req.body?.selectors ?? req.body?.json ?? req.body?.payload ?? req.body;
      if (typeof payload === "string") {
        payload = payload.trim();
        payload = payload ? JSON.parse(payload) : null;
      }

      const norm = normalizeSelectorsPayload(payload);
      if (!norm?.composer?.length || !norm?.anchors?.length) {
        return res.status(400).json({ ok: false, error: "invalid_selectors_payload" });
      }

      setExtSelectorsOverride(norm);
      recordExtSelectorsHistory({
        action: "save",
        note: req.body?.note,
        selectors_json: JSON.stringify(norm),
        version: norm.version,
        rollout_percent: getExtSelectorsRollout().rollout_percent,
        rollout_salt: getExtSelectorsRollout().rollout_salt,
      });
      return res.json(adminSelectorsPayload());
    } catch (e) {
      const msg = String(e?.message || "");
      if (/json/i.test(msg)) {
        return res.status(400).json({ ok: false, error: "invalid_json" });
      }
      console.error("ADMIN_EXT_SELECTORS_POST_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, (req, res) => {
    try {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const totalUsers = safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users").get()?.c || 0);
      const onlineUsers10m = safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE last_seen >= ?").get(tenMinAgo)?.c || 0);
      const day = todayKeyUTC();
      const totalInsertsToday = safeDb(() =>
        db.prepare("SELECT COALESCE(SUM(used),0) AS s FROM usage_daily WHERE day=?").get(day)?.s || 0
      );
      const extensionUsers = safeDb(() =>
        db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE used > 0").get()?.c || 0
      );

      res.json({
        ok: true,
        onlineUsers10m,
        totalUsers,
        extensionUsers,
        totalInsertsToday,
        build: BUILD_ID,
      });
    } catch (e) {
      console.error("ADMIN_STATS_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/metrics", requireAdmin, (req, res) => {
    try {
      let hours = Number(req.query?.hours ?? 24);
      if (!Number.isFinite(hours)) hours = 24;
      hours = Math.max(1, Math.min(720, Math.floor(hours)));
      const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();

      const day = todayKeyUTC();
      const dau = safeDb(() =>
        db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE day=? AND used>0").get(day)?.c || 0
      );

      const start = new Date();
      start.setUTCDate(start.getUTCDate() - 29);
      const startDay = start.toISOString().slice(0, 10);
      const mau = safeDb(() =>
        db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE day>=? AND used>0").get(startDay)?.c || 0
      );

      const proActive = safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE sub_status='active'").get()?.c || 0);

      const byType =
        safeDb(() =>
          db
            .prepare(
              "SELECT event_type, COUNT(*) AS total, COUNT(DISTINCT handle) AS users FROM activity_log WHERE created_at>=? GROUP BY event_type"
            )
            .all(sinceIso)
        ) || [];

      const asMap = {};
      for (const r of byType) {
        asMap[String(r.event_type)] = { total: Number(r.total || 0), users: Number(r.users || 0) };
      }
      const get = (k) => asMap[k] || { total: 0, users: 0 };

      const funnel = {
        limit_hit: get("limit_hit"),
        upgrade_modal_open: get("upgrade_modal_open"),
        pay_click: get("pay_click"),
        pay_success: get("pay_success"),
        pay_fail: get("pay_fail"),
        busy_try_again: get("busy_try_again"),
      };

      const opened = funnel.upgrade_modal_open.users || 0;
      const clicked = funnel.pay_click.users || 0;
      const success = funnel.pay_success.users || 0;

      res.json({
        ok: true,
        windowHours: hours,
        since: sinceIso,
        dau,
        mau,
        proActive,
        funnel,
        rates: {
          open_to_click: opened ? clicked / opened : 0,
          click_to_success: clicked ? success / clicked : 0,
          open_to_success: opened ? success / opened : 0,
        },
        build: BUILD_ID,
      });
    } catch (e) {
      console.error("ADMIN_METRICS_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/ext/health", requireAdmin, (req, res) => {
    try {
      let hours = Number(req.query?.hours ?? 24);
      if (!Number.isFinite(hours)) hours = 24;
      hours = Math.max(1, Math.min(168, Math.floor(hours)));
      const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();

      const totals = safeDb(() => {
        const r = db
          .prepare(
            "SELECT COUNT(*) AS total, SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS okCnt FROM ext_events WHERE created_at >= ?"
          )
          .get(sinceIso);
        const total = Number(r?.total || 0);
        const okCnt = Number(r?.okCnt || 0);
        return { total, ok: okCnt, fail: Math.max(0, total - okCnt) };
      }) || { total: 0, ok: 0, fail: 0 };

      const byType =
        safeDb(() =>
          db
            .prepare(
              "SELECT event_type, COUNT(*) AS total, SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS okCnt FROM ext_events WHERE created_at >= ? GROUP BY event_type ORDER BY total DESC"
            )
            .all(sinceIso)
        ) || [];

      const topErrors =
        safeDb(() =>
          db
            .prepare(
              "SELECT error_code, COUNT(*) AS c FROM ext_events WHERE created_at >= ? AND ok=0 AND error_code IS NOT NULL AND error_code <> '' GROUP BY error_code ORDER BY c DESC LIMIT 12"
            )
            .all(sinceIso)
        ) || [];

      const versions =
        safeDb(() =>
          db
            .prepare(
              "SELECT ext_version, COUNT(*) AS c FROM ext_events WHERE created_at >= ? AND ext_version IS NOT NULL AND ext_version <> '' GROUP BY ext_version ORDER BY c DESC LIMIT 12"
            )
            .all(sinceIso)
        ) || [];

      const last =
        safeDb(() =>
          db
            .prepare(
              "SELECT created_at, event_type, ok, error_code, ext_version FROM ext_events WHERE created_at >= ? ORDER BY id DESC LIMIT 30"
            )
            .all(sinceIso)
        ) || [];

      res.json({
        ok: true,
        hours,
        sinceIso,
        totals,
        byType: byType.map((r) => ({
          event_type: r.event_type,
          total: Number(r.total || 0),
          ok: Number(r.okCnt || 0),
          fail: Math.max(0, Number(r.total || 0) - Number(r.okCnt || 0)),
        })),
        topErrors: topErrors.map((r) => ({ error_code: r.error_code, count: Number(r.c || 0) })),
        versions: versions.map((r) => ({ ext_version: r.ext_version, count: Number(r.c || 0) })),
        last,
        build: BUILD_ID,
      });
    } catch (e) {
      console.error("ADMIN_EXT_HEALTH_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/faq", requireAdmin, (_req, res) => {
    res.status(410).json({ ok: false, error: "admin_faq_retired" });
  });

  app.post("/api/admin/faq", requireAdmin, (_req, res) => {
    res.status(410).json({ ok: false, error: "admin_faq_retired" });
  });

  app.post("/api/admin/codes", requireAdmin, (req, res) => {
    try {
      let n = Number(req.body?.n || 5);
      if (!Number.isFinite(n)) n = 5;
      n = Math.max(1, Math.min(50, Math.floor(n)));

      const note = String(req.body?.note || "promo").slice(0, 64);
      const grantTypeInput = String(req.body?.grantType || "").trim().toLowerCase();

      let grantType = "subscription";
      let grantValue = 0;
      let days = Number(req.body?.days || 0);
      if (!Number.isFinite(days)) days = 0;
      days = Math.max(0, Math.min(3650, Math.floor(days)));

      if (grantTypeInput === "eligible_credit") {
        const allowed = new Set([1, 3, 5, 7, 15, 30]);
        const value = Math.floor(Number(req.body?.grantValue || 0) || 0);
        if (!allowed.has(value)) return res.status(400).json({ ok: false, error: "invalid_grant_value" });
        grantType = "eligible_credit";
        grantValue = value;
        days = 0;
      } else {
        grantType = "subscription";
        grantValue = 0;
      }

      const tier = grantType === "subscription" ? (days === 0 ? "unlimited" : "paid") : "grant";
      const codes = [];
      safeDb(() => {
        for (let i = 0; i < n; i++) {
          let code = randHex(6);
          for (let t = 0; t < 12; t++) {
            const exists = db.prepare("SELECT 1 FROM admin_codes WHERE code=?").get(code);
            if (!exists) break;
            code = randHex(6);
          }
          db.prepare(
            "INSERT INTO admin_codes(code, note, tier, days, grant_type, grant_value, created_at) VALUES(?,?,?,?,?,?,?)"
          ).run(code, note, tier, days, grantType, grantValue, nowIso());
          codes.push(code);
        }
      });

      res.json({ ok: true, codes, tier, days, grantType, grantValue });
    } catch (e) {
      console.error("ADMIN_CODES_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/codes", requireAdmin, (req, res) => {
    try {
      const limit = Math.max(20, Math.min(200, Number(req.query?.limit || 100) || 100));
      const rows = safeDb(() =>
        db
          .prepare(
            "SELECT code, note, tier, days, grant_type, grant_value, created_at FROM admin_codes ORDER BY created_at DESC LIMIT ?"
          )
          .all(limit)
      );
      res.json({
        ok: true,
        rows,
        presets: {
          eligibleCredits: [1, 3, 5, 7, 15, 30],
          paidDays: [90, 180, 365],
          batchSizes: [1, 5, 10, 25],
          notes: ["promo", "giveaway", "partner", "lb_7d", "lb_30d"],
        },
      });
    } catch (e) {
      console.error("ADMIN_CODES_LIST_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.post("/api/admin/grant", requireAdmin, (req, res) => {
    try {
      const handle = normalizeHandle(req.body?.handle);
      if (!validHandle(handle)) return res.status(400).json({ ok: false, error: "invalid_request", hint: "invalid_handle" });

      const note = String(req.body?.note || "manual").trim().slice(0, 64) || "manual";
      const grantType = String(req.body?.grantType || "subscription").trim().toLowerCase();
      const adminHandle = String(req.admin?.handle || req.user?.handle || "").trim() || null;

      if (grantType === "eligible_credit") {
        const rawValue = req.body?.grantValue;
        if (rawValue == null || String(rawValue).trim() === "") {
          return res.status(400).json({ ok: false, error: "invalid_request", hint: "grant_value_required" });
        }
        const value = Math.floor(Number(rawValue) || 0);
        const allowed = new Set([1, 3, 5, 7, 15, 30]);
        if (!allowed.has(value)) return res.status(400).json({ ok: false, error: "invalid_grant_value" });

        const h = ensureGrantTarget(handle);
        const refKey = `AGRANT_${randHex(8)}`;
        const granted = grantReferralReward(h, "eligible_credit", value, "admin_manual", refKey, {
          adminHandle,
          note,
          grantType,
          grantValue: value,
        });
        if (!granted) return res.status(409).json({ ok: false, error: "conflict", hint: "grant_not_applied" });

        const row = recordAdminGrant({ handle: h, grantType: "eligible_credit", grantValue: value, note, adminHandle });
        const sub = subscriptionInfo({ ...(userByHandle(h) || {}), handle: h });
        const unlocks = accessUnlocksForHandle(h);
        logActivity(h, "admin_manual_grant", { grantType: "eligible_credit", grantValue: value, note, adminHandle });
        return res.json({ ok: true, handle: h, grantType: "eligible_credit", grantValue: value, note, row, sub, unlocks });
      }

      if (grantType !== "subscription") {
        return res.status(400).json({ ok: false, error: "invalid_request", hint: "invalid_grant_type" });
      }

      const rawDays = req.body?.days;
      if (rawDays == null || String(rawDays).trim() === "") {
        return res.status(400).json({ ok: false, error: "invalid_request", hint: "days_required" });
      }
      let days = Number(rawDays);
      if (!Number.isFinite(days)) return res.status(400).json({ ok: false, error: "invalid_grant_value" });
      days = Math.max(0, Math.min(3650, Math.floor(days)));

      const sub = subscriptionGrantToHandle({ handle, days });
      const h = String(handle || "").trim();
      const row = recordAdminGrant({ handle: h, grantType: "subscription", grantValue: days, note, adminHandle });
      logActivity(h, "admin_manual_grant", { grantType: "subscription", grantValue: days, note, adminHandle });
      return res.json({ ok: true, handle: h, grantType: "subscription", grantValue: days, note, row, sub });
    } catch (e) {
      console.error("ADMIN_GRANT_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/grants", requireAdmin, (req, res) => {
    try {
      const limit = Math.max(20, Math.min(200, Number(req.query?.limit || 50) || 50));
      const q = String(req.query?.q || "").trim().toLowerCase();

      let sql = "SELECT id, handle, grant_type, grant_value, note, admin_handle, created_at FROM admin_grants WHERE 1=1";
      const args = [];
      if (q) {
        sql += " AND (LOWER(handle) LIKE ? OR LOWER(COALESCE(note,'')) LIKE ? OR LOWER(COALESCE(admin_handle,'')) LIKE ?)";
        const like = `%${q}%`;
        args.push(like, like, like);
      }
      sql += " ORDER BY created_at DESC LIMIT ?";
      args.push(limit);

      const rows = safeDb(() => db.prepare(sql).all(...args)) || [];
      res.json({ ok: true, rows });
    } catch (e) {
      console.error("ADMIN_GRANTS_LIST_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/leaderboard/referrals", requireAdmin, (req, res) => {
    try {
      const days = Math.max(7, Math.min(180, Number(req.query.days || 7) || 7));
      const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const top =
        safeDb(() =>
          db
            .prepare(
              `
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
    `
            )
            .all(sinceIso)
        ) || [];

      res.json({
        ok: true,
        days,
        since: sinceIso,
        top: top.map((r, i) => ({
          rank: i + 1,
          handle: r.handle,
          confirmed: Number(r.confirmed || 0) || 0,
          active: Number(r.active || 0) || 0,
          eligible: Number(r.active || 0) || 0,
        })),
      });
    } catch (e) {
      console.error("ADMIN_LEADERBOARD_GET_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.post("/api/admin/leaderboard/award", requireAdmin, (req, res) => {
    try {
      const windowDays = Math.max(7, Math.min(180, Number(req.body?.days || 7) || 7));
      const place = Math.max(1, Math.min(3, Number(req.body?.place || 1) || 1));

      const awardDays =
        Math.max(1, Math.min(365, Number(req.body?.awardDays || 0) || 0)) ||
        (() => {
          if (windowDays >= 30) return place === 1 ? 30 : place === 2 ? 7 : 3;
          return place === 1 ? 7 : 3;
        })();

      const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

      const top3 =
        safeDb(() =>
          db
            .prepare(
              `
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
      ORDER BY active DESC, handle ASC
      LIMIT 3
    `
            )
            .all(sinceIso)
        ) || [];

      const winner = top3[place - 1];
      const override = !!req.body?.override;
      const requestedHandle = String(req.body?.handle || "").trim();
      if (!winner && !override) {
        return res.status(409).json({ ok: false, error: "conflict", hint: "no_current_winner_for_place" });
      }
      if (override && !requestedHandle) {
        return res.status(400).json({ ok: false, error: "invalid_request", hint: "handle_required_for_override" });
      }

      const handle = String(requestedHandle || winner?.handle || "").trim();
      if (!validHandle(handle)) return res.status(400).json({ ok: false, error: "invalid_request", hint: "invalid_handle" });

      if (!override && winner && handle !== winner.handle) {
        return res.status(409).json({ ok: false, error: "conflict", hint: "handle_not_current_winner", winner: winner.handle });
      }

      const today = new Date().toISOString().slice(0, 10);
      const requestedCycleKey = String(req.body?.cycleKey || "").trim();
      const cycleKey = requestedCycleKey || `manual_${today}`;
      const note = `lb_${windowDays}d_place${place}_${cycleKey}`;
      const code = adminCodeCreate({ note, tier: "paid", days: awardDays });

      const ins = safeDb(() =>
        db
          .prepare(
            `
      INSERT OR IGNORE INTO leaderboard_awards(period_days, cycle_key, place, handle, award_days, code, created_at)
      VALUES(?,?,?,?,?,?,?)
    `
          )
          .run(windowDays, cycleKey, place, handle, awardDays, code, nowIso())
      );

      if (!ins || ins.changes !== 1) {
        return res.status(409).json({ ok: false, error: "conflict", hint: "already_awarded_for_cycle_place" });
      }

      const sub = applyAdminCodeToHandle({ handle, code, days: awardDays });
      return res.json({ ok: true, windowDays, awardDays, place, handle, code, sub });
    } catch (e) {
      console.error("ADMIN_LEADERBOARD_AWARD_ERROR", e);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/leaderboard/awards", requireAdmin, (req, res) => {
    try {
      const days = Math.max(7, Math.min(180, Number(req.query?.days || 0) || 0));
      const limit = Math.max(10, Math.min(500, Number(req.query?.limit || 200) || 200));
      const rows =
        safeDb(() =>
          db
            .prepare(
              `
      SELECT period_days, cycle_key, place, handle, award_days, code, created_at
      FROM leaderboard_awards
      WHERE (?=0 OR period_days=?)
      ORDER BY created_at DESC
      LIMIT ?
    `
            )
            .all(days ? days : 0, days ? days : 0, limit)
        ) || [];
      return res.json({ ok: true, rows });
    } catch (e) {
      console.error("ADMIN_LEADERBOARD_AWARDS_ERROR", e);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/redemptions", requireAdmin, (req, res) => {
    try {
      const limit = Math.max(20, Math.min(500, Number(req.query?.limit || 200) || 200));
      const q = String(req.query?.q || "").trim().toLowerCase();
      const grantKind = String(req.query?.grantKind || "all").trim().toLowerCase();

      let sql = `
        SELECT r.code, r.handle, r.created_at, c.tier, c.days, c.note, c.grant_type, c.grant_value
        FROM code_redemptions r
        LEFT JOIN admin_codes c ON c.code = r.code
        WHERE 1=1
      `;
      const args = [];

      if (grantKind === "eligible_credit") {
        sql += " AND c.grant_type='eligible_credit'";
      } else if (grantKind === "subscription") {
        sql += " AND (c.grant_type IS NULL OR c.grant_type='subscription')";
      }

      if (q) {
        sql += " AND (LOWER(r.code) LIKE ? OR LOWER(COALESCE(r.handle,'')) LIKE ? OR LOWER(COALESCE(c.note,'')) LIKE ?)";
        const like = `%${q}%`;
        args.push(like, like, like);
      }

      sql += " ORDER BY r.created_at DESC LIMIT ?";
      args.push(limit);

      const rows = safeDb(() => db.prepare(sql).all(...args)) || [];
      res.json({ ok: true, rows });
    } catch (e) {
      console.error("ADMIN_REDEMPTIONS_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/admin/diag", requireAdmin, (req, res) => {
    res.json({
      ok: true,
      build: BUILD_ID,
      db: path.basename(String(DB_PATH || "")) || "data.sqlite",
      startedAt: STARTED_AT,
    });
  });

  const AUTO_AWARDS_ENABLED = String(process.env.AUTO_AWARDS || "1").trim() !== "0";
  let __AUTO_AWARD_LOCK = false;

  function startOfUtcWeek(d) {
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const dow = dt.getUTCDay();
    const delta = dow === 0 ? 6 : dow - 1;
    dt.setUTCDate(dt.getUTCDate() - delta);
    return dt;
  }

  function startOfUtcMonth(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  function awardDaysFor(periodDays, place) {
    const p = Math.max(1, Math.min(3, Number(place) || 1));
    if (Number(periodDays) >= 30) return p === 1 ? 30 : p === 2 ? 7 : 3;
    return p === 1 ? 7 : 3;
  }

  function getTopReferrersBetween({ sinceIso, untilIso, limit = 3 }) {
    return (
      safeDb(() =>
        db
          .prepare(
            `
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
      AND ri.created_at < ?
      AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0)
    GROUP BY ri.inviter_handle
    HAVING active > 0
    ORDER BY active DESC, handle ASC
    LIMIT ?
  `
          )
          .all(sinceIso, untilIso, limit)
      ) || []
    );
  }

  function awardsCount({ periodDays, cycleKey }) {
    return (
      safeDb(() =>
        db
          .prepare(
            `
    SELECT COUNT(*) AS c
    FROM leaderboard_awards
    WHERE period_days=? AND cycle_key=?
  `
          )
          .get(periodDays, cycleKey)
      )?.c || 0
    );
  }

  function awardExists({ periodDays, cycleKey, place }) {
    return !!safeDb(() =>
      db
        .prepare(
          `
    SELECT 1 FROM leaderboard_awards
    WHERE period_days=? AND cycle_key=? AND place=?
    LIMIT 1
  `
        )
        .get(periodDays, cycleKey, place)
    );
  }

  async function runAutoLeaderboardAwards() {
    if (!AUTO_AWARDS_ENABLED) return;
    if (__AUTO_AWARD_LOCK) return;
    __AUTO_AWARD_LOCK = true;
    try {
      const now = new Date();
      const cycles = [
        { periodDays: 7, until: startOfUtcWeek(now) },
        { periodDays: 30, until: startOfUtcMonth(now) },
      ];

      for (const c of cycles) {
        const untilIso = c.until.toISOString();
        const sinceIso = new Date(c.until.getTime() - c.periodDays * 24 * 60 * 60 * 1000).toISOString();
        const cycleKey = `${c.periodDays}d_${untilIso.slice(0, 10)}`;

        if (awardsCount({ periodDays: c.periodDays, cycleKey }) >= 3) continue;

        const top = getTopReferrersBetween({ sinceIso, untilIso, limit: 3 });
        if (!top?.length) continue;

        for (let i = 0; i < 3; i++) {
          const place = i + 1;
          const winner = top[i];
          if (!winner?.handle) continue;
          if (awardExists({ periodDays: c.periodDays, cycleKey, place })) continue;

          const handle = String(winner.handle).trim();
          if (!validHandle(handle)) continue;

          const awardDays = awardDaysFor(c.periodDays, place);
          const note = `lb_auto_${cycleKey}_p${place}`;
          const code = adminCodeCreate({ note, tier: "paid", days: awardDays });

          const ins = safeDb(() =>
            db
              .prepare(
                `
          INSERT OR IGNORE INTO leaderboard_awards(period_days, cycle_key, place, handle, award_days, code, created_at)
          VALUES(?,?,?,?,?,?,?)
        `
              )
              .run(c.periodDays, cycleKey, place, handle, awardDays, code, nowIso())
          );

          if (ins?.changes === 1) {
            applyAdminCodeToHandle({ handle, code, days: awardDays });
          }
        }
      }
    } catch (e) {
      console.error("AUTO_LEADERBOARD_AWARDS_ERROR", e);
    } finally {
      __AUTO_AWARD_LOCK = false;
    }
  }

  function startAutoAwardsLoop() {
    if (!AUTO_AWARDS_ENABLED) return;
    try {
      runAutoLeaderboardAwards();
    } catch {}
    setInterval(() => {
      runAutoLeaderboardAwards();
    }, 10 * 60 * 1000);
  }

  return { startAutoAwardsLoop };
}
