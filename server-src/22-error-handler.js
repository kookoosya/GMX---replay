import { registerErrorRoutes } from "./server/routes/errors.mjs";

registerErrorRoutes({ app, writeLog, sendError, ERROR_CODES });

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
    publicDir: path.join(__dirname, "public"),
    health: "/api/health",
    version: "/api/version",
  });
  try {
    startAutoAwardsLoop();
  } catch (_e) {
    writeLog("ERROR", "AUTO_AWARDS_LOOP_FAILED", { error: _e?.message || String(_e) });
  }
});
