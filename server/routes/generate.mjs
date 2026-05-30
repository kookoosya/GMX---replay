/** GM/GN generation HTTP routes (site + shared auth). */

export function registerGenerateRoutes(deps) {
  const {
    app,
    requireAuth,
    sendError,
    ERROR_CODES,
    parseAntiLastN,
    normLang,
    generateUnique,
    generateRankedCandidates,
    saveRecent,
  } = deps;

  app.get("/api/generate", requireAuth, (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const kind = String(req.query.kind || "").toLowerCase();
      const mode = String(req.query.mode || "min").toLowerCase();
      const lang = normLang(req.query.lang);
      const style = String(req.query.style || "classic").toLowerCase();
      const antiN = parseAntiLastN(req, 20);

      if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
      if (!["min", "mid", "max"].includes(mode)) return sendError(res, 400, "invalid_mode");

      const reply = generateUnique(handle, kind, mode, lang, style, antiN);
      saveRecent(handle, kind, reply, mode, style);

      res.json({ ok: true, handle, kind, mode, lang, reply });
    } catch (e) {
      console.error("GENERATE_ERROR", e);
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  });

  app.get("/api/generate-bulk", requireAuth, (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const kind = String(req.query.kind || "").toLowerCase();
      const mode = String(req.query.mode || "min").toLowerCase();
      const lang = normLang(req.query.lang);
      const style = String(req.query.style || "classic").toLowerCase();
      const antiN = parseAntiLastN(req, 20);
      let count = Number(req.query.count || 10);
      if (!Number.isFinite(count)) count = 10;
      count = Math.max(1, Math.min(200, Math.floor(count)));

      if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
      if (!["min", "mid", "max"].includes(mode)) return sendError(res, 400, "invalid_mode");

      const list = generateRankedCandidates(handle, kind, mode, lang, style, count, antiN, false);
      for (const r of list) saveRecent(handle, kind, r, mode, style);

      res.json({ ok: true, handle, kind, mode, lang, count: list.length, list });
    } catch (e) {
      console.error("BULK_ERROR", e);
      sendError(res, 500, ERROR_CODES.SERVER_ERROR);
    }
  });
}
