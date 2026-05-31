// ---- Admin: FAQ content (retired) ----
app.get("/api/admin/faq", requireAdmin, (_req, res) => {
  res.status(410).json({ ok:false, error:"admin_faq_retired" });
});

app.post("/api/admin/faq", requireAdmin, (_req, res) => {
  res.status(410).json({ ok:false, error:"admin_faq_retired" });
});


app.post("/api/admin/codes", requireAdmin, (req, res) => {
  try {
    let n = Number(req.body?.n || 5);
    if (!Number.isFinite(n)) n = 5;
    n = Math.max(1, Math.min(50, Math.floor(n)));

    const note = String(req.body?.note || "promo").slice(0, 64);
    const grantTypeInput = String(req.body?.grantType || '').trim().toLowerCase();

    let grantType = 'subscription';
    let grantValue = 0;
    let days = Number(req.body?.days || 0);
    if (!Number.isFinite(days)) days = 0;
    days = Math.max(0, Math.min(3650, Math.floor(days)));

    if (grantTypeInput === 'eligible_credit') {
      const allowed = new Set([1, 3, 5, 7, 15, 30]);
      const value = Math.floor(Number(req.body?.grantValue || 0) || 0);
      if (!allowed.has(value)) return res.status(400).json({ ok:false, error:'invalid_grant_value' });
      grantType = 'eligible_credit';
      grantValue = value;
      days = 0;
    } else {
      grantType = 'subscription';
      grantValue = 0;
    }

    const tier = grantType === 'subscription' ? (days === 0 ? "unlimited" : "paid") : 'grant';

    const codes = [];
    safeDb(() => {
      for (let i = 0; i < n; i++) {
        let code = randHex(6);
        for (let t = 0; t < 12; t++) {
          const exists = db.prepare("SELECT 1 FROM admin_codes WHERE code=?").get(code);
          if (!exists) break;
          code = randHex(6);
        }
        db.prepare(
          "INSERT INTO admin_codes(code, note, tier, days, grant_type, grant_value, created_at) VALUES(?,?,?,?,?,?,?)"
        ).run(code, note, tier, days, grantType, grantValue, nowIso());
        codes.push(code);
      }
    });

    res.json({ ok:true, codes, tier, days, grantType, grantValue });
  } catch (e) {
    console.error("ADMIN_CODES_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/admin/codes", requireAdmin, (req, res) => {
  try {
    const limit = Math.max(20, Math.min(200, Number(req.query?.limit || 100) || 100));
    const rows = safeDb(() =>
      db
        .prepare("SELECT code, note, tier, days, grant_type, grant_value, created_at FROM admin_codes ORDER BY created_at DESC LIMIT ?")
        .all(limit)
    );
    res.json({ ok:true, rows, presets: { eligibleCredits: [1,3,5,7,15,30], paidDays: [90,180,365], batchSizes: [1,5,10,25], notes: ["promo","giveaway","partner","lb_7d","lb_30d"] } });
  } catch (e) {
    console.error("ADMIN_CODES_LIST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/admin/grant", requireAdmin, (req, res) => {
  try {
    const handle = normalizeHandle(req.body?.handle);
    if (!validHandle(handle)) return res.status(400).json({ ok:false, error:"invalid_request", hint:"invalid_handle" });

    const note = String(req.body?.note || "manual").trim().slice(0, 64) || "manual";
    const grantType = String(req.body?.grantType || "subscription").trim().toLowerCase();
    const adminHandle = String(req.admin?.handle || req.user?.handle || "").trim() || null;

    if (grantType === "eligible_credit") {
      const rawValue = req.body?.grantValue;
      if (rawValue == null || String(rawValue).trim() === "") {
        return res.status(400).json({ ok:false, error:"invalid_request", hint:"grant_value_required" });
      }
      const value = Math.floor(Number(rawValue) || 0);
      const allowed = new Set([1, 3, 5, 7, 15, 30]);
      if (!allowed.has(value)) return res.status(400).json({ ok:false, error:"invalid_grant_value" });

      const h = ensureGrantTarget(handle);
      const refKey = `AGRANT_${randHex(8)}`;
      const granted = grantReferralReward(h, 'eligible_credit', value, 'admin_manual', refKey, { adminHandle, note, grantType, grantValue: value });
      if (!granted) return res.status(409).json({ ok:false, error:"conflict", hint:"grant_not_applied" });

      const row = recordAdminGrant({ handle: h, grantType: 'eligible_credit', grantValue: value, note, adminHandle });
      const sub = subscriptionInfo({ ...(userByHandle(h) || {}), handle: h });
      const unlocks = accessUnlocksForHandle(h);
      logActivity(h, 'admin_manual_grant', { grantType: 'eligible_credit', grantValue: value, note, adminHandle });
      return res.json({ ok:true, handle: h, grantType: 'eligible_credit', grantValue: value, note, row, sub, unlocks });
    }

    if (grantType !== "subscription") {
      return res.status(400).json({ ok:false, error:"invalid_request", hint:"invalid_grant_type" });
    }

    const rawDays = req.body?.days;
    if (rawDays == null || String(rawDays).trim() === "") {
      return res.status(400).json({ ok:false, error:"invalid_request", hint:"days_required" });
    }
    let days = Number(rawDays);
    if (!Number.isFinite(days)) return res.status(400).json({ ok:false, error:"invalid_grant_value" });
    days = Math.max(0, Math.min(3650, Math.floor(days)));

    const sub = subscriptionGrantToHandle({ handle, days });
    const h = String(handle || '').trim();
    const row = recordAdminGrant({ handle: h, grantType: 'subscription', grantValue: days, note, adminHandle });
    logActivity(h, 'admin_manual_grant', { grantType: 'subscription', grantValue: days, note, adminHandle });
    return res.json({ ok:true, handle: h, grantType: 'subscription', grantValue: days, note, row, sub });
  } catch (e) {
    console.error("ADMIN_GRANT_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/admin/grants", requireAdmin, (req, res) => {
  try {
    const limit = Math.max(20, Math.min(200, Number(req.query?.limit || 50) || 50));
    const q = String(req.query?.q || "").trim().toLowerCase();

    let sql = "SELECT id, handle, grant_type, grant_value, note, admin_handle, created_at FROM admin_grants WHERE 1=1";
    const args = [];
    if (q) {
      sql += " AND (LOWER(handle) LIKE ? OR LOWER(COALESCE(note,'')) LIKE ? OR LOWER(COALESCE(admin_handle,'')) LIKE ?)";
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    sql += " ORDER BY created_at DESC LIMIT ?";
    args.push(limit);

    const rows = safeDb(() => db.prepare(sql).all(...args)) || [];
    res.json({ ok:true, rows });
  } catch (e) {
    console.error("ADMIN_GRANTS_LIST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


/**
 * Admin: Leaderboard winners + awards.
 * - Loads top list for a period (7d / 30d).
 * - Awards Pro to top 3 by generating an admin code and applying it immediately.
 */
app.get("/api/admin/leaderboard/referrals", requireAdmin, (req, res) => {
  try{
    const days = Math.max(7, Math.min(180, Number(req.query.days || 7) || 7));
    const sinceIso = new Date(Date.now() - days*24*60*60*1000).toISOString();

    const top = safeDb(() => db.prepare(`
      SELECT
        ri.inviter_handle AS handle,
        COUNT(1) AS confirmed,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM usage_daily ud
          WHERE ud.handle = ri.invited_handle AND ud.used > 0
          LIMIT 1
        ) THEN 1 ELSE 0 END) AS active
      FROM referral_invites ri
      WHERE ri.status='confirmed'
        AND ri.created_at >= ?
        AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0)
      GROUP BY ri.inviter_handle
      HAVING active > 0
      ORDER BY active DESC, handle ASC
      LIMIT 50
    `).all(sinceIso)) || [];

    res.json({
      ok:true,
      days,
      since: sinceIso,
      top: top.map((r,i)=>({
        rank: i+1,
        handle: r.handle,
        confirmed: Number(r.confirmed||0)||0,
        active: Number(r.active||0)||0,
        eligible: Number(r.active||0)||0
      }))
    });
  }catch(e){
    console.error("ADMIN_LEADERBOARD_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

function adminCodeCreate({ note, tier, days, grantType = 'subscription', grantValue = 0 }){
  const code = ("GMX" + crypto.randomBytes(5).toString("hex")).toUpperCase();
  safeDb(() => db.prepare(
    "INSERT INTO admin_codes(code, note, tier, days, grant_type, grant_value, created_at) VALUES(?,?,?,?,?,?,?)"
  ).run(code, note ? String(note) : null, String(tier||"paid"), Number(days||0)||0, String(grantType || 'subscription'), Number(grantValue || 0) || 0, nowIso()));
  return code;
}

function ensureGrantTarget(handle){
  const h = normalizeHandle(handle);
  if (!validHandle(h)) return "";
  ensureUser(h);
  return h;
}

function subscriptionGrantToHandle({ handle, days }){
  const h = ensureGrantTarget(handle);
  if (!h) return subscriptionInfo({ handle: "" });

  const grantDays = Math.max(0, Math.min(3650, Math.floor(Number(days || 0) || 0)));
  safeDb(() => {
    if (grantDays === 0) {
      db.prepare("UPDATE users SET tier='unlimited', paid_until=NULL, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?")
        .run(nowIso(), h);
      return;
    }

    const row = db.prepare("SELECT paid_until FROM users WHERE handle=?").get(h);
    const base = row?.paid_until ? new Date(row.paid_until) : new Date(0);
    const start = (base.getTime() > Date.now()) ? base : new Date();
    const next = new Date(start.getTime() + grantDays*24*60*60*1000);
    db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?")
      .run(next.toISOString(), nowIso(), h);
  });

  const u2 = userByHandle(h);
  return subscriptionInfo({ ...(u2 || {}), handle: h });
}

function accessUnlocksForHandle(handle){
  const h = String(handle || '').trim();
  if (!h) return computeReferralUnlocks(0, 0);
  const u = userByHandle(h) || { handle: h };
  const ownerRefCode = String(u?.ref_code || '').trim();
  const legacyEligible = ownerRefCode ? (safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(ownerRefCode)?.c || 0) || 0) : 0;
  const earnedEligible = Math.max(referralCountActive(h), legacyEligible);
  const manualEligibleCredits = referralRewardTotal(h, 'eligible_credit');
  const starterBgSlots = referralRewardTotal(h, 'starter_bg_slot');
  return computeReferralUnlocks(earnedEligible + manualEligibleCredits, starterBgSlots);
}

function recordAdminGrant({ handle, grantType, grantValue, note = null, adminHandle = null }){
  const h = String(handle || '').trim();
  if (!h) return null;
  const row = {
    handle: h,
    grant_type: String(grantType || 'subscription'),
    grant_value: Math.max(0, Math.floor(Number(grantValue || 0) || 0)),
    note: note ? String(note).slice(0, 64) : null,
    admin_handle: adminHandle ? String(adminHandle).trim().slice(0, 32) : null,
    created_at: nowIso(),
  };
  const out = safeDb(() => db.prepare(
    "INSERT INTO admin_grants(handle, grant_type, grant_value, note, admin_handle, created_at) VALUES(?,?,?,?,?,?)"
  ).run(row.handle, row.grant_type, row.grant_value, row.note, row.admin_handle, row.created_at));
  return out && out.changes === 1 ? row : null;
}

function applyAdminCodeToHandle({ handle, code, days }){
  const h = ensureGrantTarget(handle);
  if (!h) return subscriptionInfo({ handle: "" });

  safeDb(() => db.prepare(
    "INSERT OR IGNORE INTO code_redemptions(code, handle, created_at) VALUES(?,?,?)"
  ).run(code, h, nowIso()));

  const sub = subscriptionGrantToHandle({ handle: h, days });
  logActivity(h, 'admin_award', { code, days: Number(days||0)||0 });
  return sub;
}

app.post("/api/admin/leaderboard/award", requireAdmin, (req, res) => {
  try{
    const windowDays = Math.max(7, Math.min(180, Number(req.body?.days || 7) || 7));
    const place = Math.max(1, Math.min(3, Number(req.body?.place || 1) || 1));

    // Award size (days of paid access) can be different from the leaderboard window.
    const awardDays = Math.max(1, Math.min(365, Number(req.body?.awardDays || 0) || 0)) || (()=>{
      if (windowDays >= 30) return place === 1 ? 30 : (place === 2 ? 7 : 3);
      return place === 1 ? 7 : 3;
    })();

    const sinceIso = new Date(Date.now() - windowDays*24*60*60*1000).toISOString();

    // Load top 3 to ensure we award real winners.
    const top3 = safeDb(() => db.prepare(`
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
        AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0)
      GROUP BY ri.inviter_handle
      HAVING active > 0
      ORDER BY active DESC, handle ASC
      LIMIT 3
    `).all(sinceIso)) || [];

    const winner = top3[place-1];
    const override = !!req.body?.override;
    const requestedHandle = String(req.body?.handle || "").trim();
    if (!winner && !override){
      return res.status(409).json({ ok:false, error:"conflict", hint:"no_current_winner_for_place" });
    }
    if (override && !requestedHandle){
      return res.status(400).json({ ok:false, error:"invalid_request", hint:"handle_required_for_override" });
    }

    const handle = String(requestedHandle || winner?.handle || "").trim();
    if (!validHandle(handle)) return res.status(400).json({ ok:false, error:"invalid_request", hint:"invalid_handle" });

    // Require handle match winner unless admin explicitly sets override=true.
    if (!override && winner && handle !== winner.handle){
      return res.status(409).json({ ok:false, error:"conflict", hint:"handle_not_current_winner", winner: winner.handle });
    }

    const today = new Date().toISOString().slice(0,10);
    const requestedCycleKey = String(req.body?.cycleKey || "").trim();
    const cycleKey = requestedCycleKey || `manual_${today}`;
    const note = `lb_${windowDays}d_place${place}_${cycleKey}`;

    const code = adminCodeCreate({ note, tier:"paid", days: awardDays });

    const ins = safeDb(() => db.prepare(`
      INSERT OR IGNORE INTO leaderboard_awards(period_days, cycle_key, place, handle, award_days, code, created_at)
      VALUES(?,?,?,?,?,?,?)
    `).run(windowDays, cycleKey, place, handle, awardDays, code, nowIso()));

    if (!ins || ins.changes !== 1){
      return res.status(409).json({ ok:false, error:"conflict", hint:"already_awarded_for_cycle_place" });
    }

    const sub = applyAdminCodeToHandle({ handle, code, days: awardDays });

return res.json({ ok:true, windowDays, awardDays, place, handle, code, sub });
  }catch(e){
    console.error("ADMIN_LEADERBOARD_AWARD_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/admin/leaderboard/awards", requireAdmin, (req, res) => {
  try{
    const days = Math.max(7, Math.min(180, Number(req.query?.days || 0) || 0));
    const limit = Math.max(10, Math.min(500, Number(req.query?.limit || 200) || 200));
    const rows = safeDb(() => db.prepare(`
      SELECT period_days, cycle_key, place, handle, award_days, code, created_at
      FROM leaderboard_awards
      WHERE (?=0 OR period_days=?)
      ORDER BY created_at DESC
      LIMIT ?
    `).all(days ? days : 0, days ? days : 0, limit)) || [];
    return res.json({ ok:true, rows });
  }catch(e){
    console.error("ADMIN_LEADERBOARD_AWARDS_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});


