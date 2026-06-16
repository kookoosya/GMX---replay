// ---------- AUTO LEADERBOARD PRIZES (7d / 30d) ----------
const AUTO_AWARDS_ENABLED = String(process.env.AUTO_AWARDS || "1").trim() !== "0";
let __AUTO_AWARD_LOCK = false;

function utcDateParts(d){
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() };
}
function startOfUtcWeek(d){
  // Monday 00:00 UTC of current week
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0,0,0,0));
  const dow = dt.getUTCDay(); // 0 Sun ... 6 Sat
  const delta = (dow === 0) ? 6 : (dow - 1);
  dt.setUTCDate(dt.getUTCDate() - delta);
  return dt;
}
function startOfUtcMonth(d){
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0,0,0,0));
}
function awardDaysFor(periodDays, place){
  const p = Math.max(1, Math.min(3, Number(place)||1));
  if (Number(periodDays) >= 30) return p === 1 ? 30 : (p === 2 ? 7 : 3);
  return p === 1 ? 7 : 3;
}
function getTopReferrersBetween({ sinceIso, untilIso, limit=3 }){
  return safeDb(() => db.prepare(`
    SELECT
      ri.inviter_handle AS handle,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM usage_daily ud
        WHERE ud.handle = ri.invited_handle AND ud.used > 0
        LIMIT 1
      ) THEN 1 ELSE 0 END) AS active
    FROM referral_invites ri
    WHERE ri.status='confirmed'
      AND ri.created_at >= ?
      AND ri.created_at < ?
      AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0)
    GROUP BY ri.inviter_handle
    HAVING active > 0
    ORDER BY active DESC, handle ASC
    LIMIT ?
  `).all(sinceIso, untilIso, limit)) || [];
}
function awardsCount({ periodDays, cycleKey }){
  return safeDb(() => db.prepare(`
    SELECT COUNT(*) AS c
    FROM leaderboard_awards
    WHERE period_days=? AND cycle_key=?
  `).get(periodDays, cycleKey))?.c || 0;
}
function awardExists({ periodDays, cycleKey, place }){
  return !!safeDb(() => db.prepare(`
    SELECT 1 FROM leaderboard_awards
    WHERE period_days=? AND cycle_key=? AND place=?
    LIMIT 1
  `).get(periodDays, cycleKey, place));
}

async function runAutoLeaderboardAwards(){
  if (!AUTO_AWARDS_ENABLED) return;
  if (__AUTO_AWARD_LOCK) return;
  __AUTO_AWARD_LOCK = true;
  try{
    const now = new Date();

    const cycles = [
      { periodDays: 7, until: startOfUtcWeek(now) },
      { periodDays: 30, until: startOfUtcMonth(now) },
    ];

    for (const c of cycles){
      const untilIso = c.until.toISOString();
      const sinceIso = new Date(c.until.getTime() - c.periodDays*24*60*60*1000).toISOString();
      const cycleKey = `${c.periodDays}d_${untilIso.slice(0,10)}`;

      // If already fully awarded, skip.
      if (awardsCount({ periodDays: c.periodDays, cycleKey }) >= 3) continue;

      const top = getTopReferrersBetween({ sinceIso, untilIso, limit: 3 });
      if (!top || !top.length) continue;

      for (let i=0; i<3; i++){
        const place = i+1;
        const winner = top[i];
        if (!winner || !winner.handle) continue;
        if (awardExists({ periodDays: c.periodDays, cycleKey, place })) continue;

        const handle = String(winner.handle).trim();
        if (!validHandle(handle)) continue;

        const awardDays = awardDaysFor(c.periodDays, place);
        const note = `lb_auto_${cycleKey}_p${place}`;

        const code = adminCodeCreate({ note, tier:"paid", days: awardDays });

        const ins = safeDb(() => db.prepare(`
          INSERT OR IGNORE INTO leaderboard_awards(period_days, cycle_key, place, handle, award_days, code, created_at)
          VALUES(?,?,?,?,?,?,?)
        `).run(c.periodDays, cycleKey, place, handle, awardDays, code, nowIso()));

        // Apply prize only if we won the race for this cycle+place (important if multiple instances run).
        if (ins && ins.changes === 1){
          applyAdminCodeToHandle({ handle, code, days: awardDays });
        }
      }
    }
  }catch(e){
    console.error("AUTO_LEADERBOARD_AWARDS_ERROR", e);
  }finally{
    __AUTO_AWARD_LOCK = false;
  }
}

function startAutoAwardsLoop(){
  if (!AUTO_AWARDS_ENABLED) return;
  // Run once on boot, then keep checking. Idempotent because we record awards per cycle+place.
  try{ runAutoLeaderboardAwards(); }catch(_e){}
  setInterval(()=>{ runAutoLeaderboardAwards(); }, 10*60*1000);
}

app.get("/api/admin/redemptions", requireAdmin, (req, res) => {
  try {
    const limit = Math.max(20, Math.min(500, Number(req.query?.limit || 200) || 200));
    const q = String(req.query?.q || "").trim().toLowerCase();
    const grantKind = String(req.query?.grantKind || "all").trim().toLowerCase();

    let sql = `
        SELECT r.code, r.handle, r.created_at, c.tier, c.days, c.note, c.grant_type, c.grant_value
        FROM code_redemptions r
        LEFT JOIN admin_codes c ON c.code = r.code
        WHERE 1=1
      `;
    const args = [];

    if (grantKind === "eligible_credit") {
      sql += " AND c.grant_type='eligible_credit'";
    } else if (grantKind === "subscription") {
      sql += " AND (c.grant_type IS NULL OR c.grant_type='subscription')";
    }

    if (q) {
      sql += " AND (LOWER(r.code) LIKE ? OR LOWER(COALESCE(r.handle,'')) LIKE ? OR LOWER(COALESCE(c.note,'')) LIKE ?)";
      const like = `%${q}%`;
      args.push(like, like, like);
    }

    sql += " ORDER BY r.created_at DESC LIMIT ?";
    args.push(limit);

    const rows = safeDb(() => db.prepare(sql).all(...args)) || [];
    res.json({ ok:true, rows });
  } catch (e) {
    console.error("ADMIN_REDEMPTIONS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/admin/diag", requireAdmin, (req, res) => {
  res.json({
    ok:true,
    build: BUILD_ID,
    db: path.basename(String(DB_PATH || "")) || "data.sqlite",
    startedAt: STARTED_AT
  });
});
