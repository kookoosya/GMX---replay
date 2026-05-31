/** Admin dashboard stats */

export function registerAdminStatsRoutes(deps) {
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

    const tenMinAgo = new Date(Date.now() - 10*60*1000).toISOString();

    const totalUsers =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users").get()?.c || 0);

    const onlineUsers10m =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE last_seen >= ?").get(tenMinAgo)?.c || 0);

    const day = todayKeyUTC();
    const totalInsertsToday =
      safeDb(() =>
        db.prepare("SELECT COALESCE(SUM(used),0) AS s FROM usage_daily WHERE day=?").get(day)?.s || 0
      );

    const extensionUsers =
      safeDb(() =>
        db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE used > 0").get()?.c || 0
      );

    res.json({
      ok:true,
      onlineUsers10m,
      totalUsers,
      extensionUsers,
      totalInsertsToday,
      build: BUILD_ID,
    });
  } catch (e) {
    console.error("ADMIN_STATS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

}
