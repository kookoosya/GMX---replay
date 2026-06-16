/** Admin bootstrap, password login, logout. */

export function registerAdminAuthRoutes(deps) {
  const {
    app,
    requireAuth,
    rateLimit,
    getAdminKey,
    getAdminToken,
    safeEq,
    adminSessionCreate,
    adminSessionDelete,
    ADMIN_SECRET,
    ADMIN_PASSWORD,
    getAdminHandle,
    setSetting,
    isAdminHandle,
  } = deps;

  app.post("/api/admin/bootstrap", requireAuth, (req, res) => {
    try {
      const key = getAdminKey(req);
      if (!key) return res.status(401).json({ ok: false, error: "unauthorized", hint: "missing_admin_key" });
      if (!ADMIN_SECRET || ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
        return res.status(500).json({ ok: false, error: "server_error", hint: "admin_secret_not_configured" });
      }
      if (key !== ADMIN_SECRET) return res.status(401).json({ ok: false, error: "unauthorized" });

      const handle = req.user?.handle || null;
      const cur = getAdminHandle();
      if (cur) {
        if (isAdminHandle(handle)) return res.json({ ok: true, handle, isAdmin: true, adminHandle: cur });
        return res.status(409).json({ ok: false, error: "admin_already_claimed" });
      }
      setSetting("admin_handle", handle);
      return res.json({ ok: true, handle, isAdmin: true, adminHandle: handle });
    } catch (e) {
      console.error("ADMIN_BOOTSTRAP_ERROR", e);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  const adminLoginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String(req.ip || "ip"),
  });

  app.post("/api/admin/login", adminLoginLimiter, requireAuth, (req, res) => {
    try {
      if (!ADMIN_PASSWORD) {
        return res.status(500).json({ ok: false, error: "server_error", hint: "admin_password_not_configured" });
      }
      const handle = req.user?.handle || null;
      if (!handle || !isAdminHandle(handle)) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }

      const pw = String(req.body?.password || "").trim();
      if (!pw) return res.status(400).json({ ok: false, error: "invalid_request", hint: "missing_password" });

      if (!safeEq(pw, ADMIN_PASSWORD)) return res.status(401).json({ ok: false, error: "unauthorized" });

      const s = adminSessionCreate(handle);
      return res.json({ ok: true, handle, adminToken: s.token, expiresAt: s.expires_at });
    } catch (e) {
      console.error("ADMIN_LOGIN_ERROR", e);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.post("/api/admin/logout", requireAuth, (req, res) => {
    try {
      const at = getAdminToken(req);
      if (at) adminSessionDelete(at);
      return res.json({ ok: true });
    } catch (e) {
      console.error("ADMIN_LOGOUT_ERROR", e);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  });
}
