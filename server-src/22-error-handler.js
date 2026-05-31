// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
  writeLog("ERROR", "EXPRESS_ERROR", {
    requestId: req?.requestId || null,
    path: req?.originalUrl || null,
    method: req?.method || null,
    error: err?.stack || err?.message || String(err),
  });
  if (res.headersSent) return next(err);
  // Prefer JSON for API routes
  if (String(req.originalUrl || "").startsWith("/api")) {
    return sendError(res, 500, ERROR_CODES.SERVER_ERROR, { requestId: req?.requestId || null });
  }
  res.status(500).send("server_error");
});

app.use("/api", (req, res) => {
  sendError(res, 404, "not_found", { path: req.originalUrl });
});


HTTP_SERVER = app.listen(PORT, "0.0.0.0", () => {
  try {
    HTTP_SERVER.headersTimeout = 65_000;
    HTTP_SERVER.requestTimeout = 60_000;
    HTTP_SERVER.keepAliveTimeout = 5_000;
  } catch {}
  writeLog("INFO", "SERVER_LISTENING", {
    port: PORT,
    dbMode: DB_MODE,
    dbPath: DB_PATH,
    supabaseConfigured: SUPABASE_CONFIGURED,
    publicDir: PUBLIC_DIR,
    health: "/api/health",
    version: "/api/version",
  });
  try { startAutoAwardsLoop(); } catch (_e) {
    writeLog("ERROR", "AUTO_AWARDS_LOOP_FAILED", { error: _e?.message || String(_e) });
  }
});
