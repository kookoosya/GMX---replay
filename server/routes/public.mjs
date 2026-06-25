/** Public try endpoints (no auth). Register after initGenerator(). */

import { countConnectedToday } from "../lib/home-public-stats.mjs";

export function registerPublicRoutes(deps) {
  const {
    app,
    sendError,
    normLang,
    generateRankedCandidates,
    composeReply,
    sanitizeSingle,
    safeDb,
    db,
    todayKeyUTC,
    supabaseActive,
    getSupabaseAdmin,
  } = deps;

  app.get("/api/public/random", (req, res) => {
    try {
      const kind = String(req.query.kind || "").toLowerCase();
      const mode = String(req.query.mode || "min").toLowerCase();
      const lang = normLang(req.query.lang);
      const style = String(req.query.style || "classic").toLowerCase();

      if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
      if (!["min", "mid", "max"].includes(mode)) return sendError(res, 400, "invalid_mode");

      const list = generateRankedCandidates(null, kind, mode, lang, style, 1, 0, true);
      const reply = String(
        (list && list[0]) || sanitizeSingle(composeReply(kind, mode, lang, style), mode, kind) || ""
      ).trim();
      res.json({ ok: true, kind, mode, lang, reply });
    } catch (e) {
      console.error("PUBLIC_RANDOM_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/public/random-bulk", (req, res) => {
    try {
      const kind = String(req.query.kind || "").toLowerCase();
      const mode = String(req.query.mode || "min").toLowerCase();
      const lang = normLang(req.query.lang);
      const style = String(req.query.style || "classic").toLowerCase();
      let count = Number(req.query.count ?? req.query.n ?? req.query.limit ?? 5);
      if (!Number.isFinite(count)) count = 5;
      count = Math.max(1, Math.min(10, Math.floor(count)));

      if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
      if (!["min", "mid", "max"].includes(mode)) return sendError(res, 400, "invalid_mode");

      const list = generateRankedCandidates(null, kind, mode, lang, style, count, 0, true);
      res.json({ ok: true, kind, mode, lang, count: list.length, list });
    } catch (e) {
      console.error("PUBLIC_RANDOM_BULK_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });

  app.get("/api/public/stats", async (_req, res) => {
    try {
      const connectedToday = await countConnectedToday({
        safeDb,
        db,
        todayKeyUTC,
        supabaseActive,
        getSupabaseAdmin,
      });
      res.json({ ok: true, connectedToday, day: todayKeyUTC() });
    } catch (e) {
      console.error("PUBLIC_STATS_ERROR", e);
      res.status(500).json({ ok: false, error: "server_error" });
    }
  });
}
