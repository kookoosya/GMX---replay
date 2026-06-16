/** Admin auth middleware factory. */

export function createRequireAdmin(deps) {
  const {
    getAdminToken,
    canUseDevAdminSession,
    adminSessionGet,
    getBearer,
    userByToken,
    isAdminHandle,
    getAdminKey,
    ADMIN_SECRET,
  } = deps;

  return function requireAdmin(req, res, next) {
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
  };
}
