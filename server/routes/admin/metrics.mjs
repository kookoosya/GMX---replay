/** Admin conversion metrics */

export function registerAdminMetricsRoutes(deps) {
  const { app, requireAdmin, safeDb, db, nowIso, todayKeyUTC, BUILD_ID, randHex, logActivity, setFeatureFlag, isAdminHandle, getAdminHandle, setSetting, grantReferralReward, referralCountActive, computeReferralUnlocks, userByHandle, subscriptionInfo, normalizeSelectorsPayload, setExtSelectorsRolloutMeta, getExtSelectorsRollout, setExtSelectorsOverride, resetExtSelectorsOverride, getExtSelectorsOverride, recordExtSelectorsHistory, adminSelectorsPayload } = deps;

app.get("/api/admin/metrics", requireAdmin, (req, res) => {
  try{
    let hours = Number(req.query?.hours ?? 24);
    if (!Number.isFinite(hours)) hours = 24;
    hours = Math.max(1, Math.min(720, Math.floor(hours))); // up to 30 days
    const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    // Usage-based active users (DAU / MAU)
    const day = todayKeyUTC();
    const dau =
      safeDb(() => db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE day=? AND used>0").get(day)?.c || 0);

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 29);
    const startDay = start.toISOString().slice(0,10);
    const mau =
      safeDb(() => db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE day>=? AND used>0").get(startDay)?.c || 0);

    const proActive =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE sub_status='active'").get()?.c || 0);

    // Event funnel (from activity_log)
    const byType = safeDb(() =>
      db.prepare(
        "SELECT event_type, COUNT(*) AS total, COUNT(DISTINCT handle) AS users FROM activity_log WHERE created_at>=? GROUP BY event_type"
      ).all(sinceIso)
    ) || [];

    const asMap = {};
    for (const r of byType){
      asMap[String(r.event_type)] = { total: Number(r.total||0), users: Number(r.users||0) };
    }

    const get = (k)=> asMap[k] || { total:0, users:0 };

    const funnel = {
      limit_hit: get("limit_hit"),
      upgrade_modal_open: get("upgrade_modal_open"),
      pay_click: get("pay_click"),
      pay_success: get("pay_success"),
      pay_fail: get("pay_fail"),
      busy_try_again: get("busy_try_again"),
    };

    // Derived conversion rates (user-based)
    const opened = funnel.upgrade_modal_open.users || 0;
    const clicked = funnel.pay_click.users || 0;
    const success = funnel.pay_success.users || 0;

    const rates = {
      open_to_click: opened ? (clicked / opened) : 0,
      click_to_success: clicked ? (success / clicked) : 0,
      open_to_success: opened ? (success / opened) : 0,
    };

    res.json({
      ok:true,
      windowHours: hours,
      since: sinceIso,
      dau,
      mau,
      proActive,
      funnel,
      rates,
      build: BUILD_ID,
    });
  }catch(e){
    console.error("ADMIN_METRICS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


}
