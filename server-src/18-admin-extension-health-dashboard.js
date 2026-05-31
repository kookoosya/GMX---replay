// ---- Admin: extension health dashboard ----
app.get("/api/admin/ext/health", requireAdmin, (req, res) => {
  try{
    let hours = Number(req.query?.hours ?? 24);
    if (!Number.isFinite(hours)) hours = 24;
    hours = Math.max(1, Math.min(168, Math.floor(hours)));
    const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const totals = safeDb(() => {
      const r = db.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS okCnt FROM ext_events WHERE created_at >= ?"
      ).get(sinceIso);
      const total = Number(r?.total || 0);
      const ok = Number(r?.okCnt || 0);
      return { total, ok, fail: Math.max(0, total - ok) };
    }) || { total: 0, ok: 0, fail: 0 };

    const byType = safeDb(() =>
      db.prepare(
        "SELECT event_type, COUNT(*) AS total, SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS okCnt FROM ext_events WHERE created_at >= ? GROUP BY event_type ORDER BY total DESC"
      ).all(sinceIso)
    ) || [];

    const topErrors = safeDb(() =>
      db.prepare(
        "SELECT error_code, COUNT(*) AS c FROM ext_events WHERE created_at >= ? AND ok=0 AND error_code IS NOT NULL AND error_code <> '' GROUP BY error_code ORDER BY c DESC LIMIT 12"
      ).all(sinceIso)
    ) || [];

    const versions = safeDb(() =>
      db.prepare(
        "SELECT ext_version, COUNT(*) AS c FROM ext_events WHERE created_at >= ? AND ext_version IS NOT NULL AND ext_version <> '' GROUP BY ext_version ORDER BY c DESC LIMIT 12"
      ).all(sinceIso)
    ) || [];

    const last = safeDb(() =>
      db.prepare(
        "SELECT created_at, event_type, ok, error_code, ext_version FROM ext_events WHERE created_at >= ? ORDER BY id DESC LIMIT 30"
      ).all(sinceIso)
    ) || [];

    res.json({
      ok:true,
      hours,
      sinceIso,
      totals,
      byType: byType.map(r => ({ event_type: r.event_type, total: Number(r.total||0), ok: Number(r.okCnt||0), fail: Math.max(0, Number(r.total||0) - Number(r.okCnt||0)) })),
      topErrors: topErrors.map(r => ({ error_code: r.error_code, count: Number(r.c||0) })),
      versions: versions.map(r => ({ ext_version: r.ext_version, count: Number(r.c||0) })),
      last,
      build: BUILD_ID,
    });
  }catch(e){
    console.error("ADMIN_EXT_HEALTH_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});
