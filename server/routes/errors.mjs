/** Express error handler + API 404 fallback. */

export function registerErrorRoutes(deps) {
  const { app, writeLog, sendError, ERROR_CODES } = deps;

  app.use((err, req, res, next) => {
    writeLog("ERROR", "EXPRESS_ERROR", {
      requestId: req?.requestId || null,
      path: req?.originalUrl || null,
      method: req?.method || null,
      error: err?.stack || err?.message || String(err),
    });
    if (res.headersSent) return next(err);
    if (String(req.originalUrl || "").startsWith("/api")) {
      return sendError(res, 500, ERROR_CODES.SERVER_ERROR, { requestId: req?.requestId || null });
    }
    res.status(500).send("server_error");
  });

  app.use("/api", (req, res) => {
    sendError(res, 404, "not_found", { path: req.originalUrl });
  });
}
