/** Admin grant helpers (codes, subscription grants, leaderboard prizes). */

export function createAdminGrants(deps) {
  const {
    crypto,
    safeDb,
    db,
    nowIso,
    randHex,
    normalizeHandle,
    validHandle,
    ensureUser,
    userByHandle,
    subscriptionInfo,
    referralCountActive,
    referralRewardTotal,
    computeReferralUnlocks,
    grantReferralReward,
    logActivity,
  } = deps;

  function adminCodeCreate({ note, tier, days, grantType = "subscription", grantValue = 0 }) {
    const code = ("GMX" + crypto.randomBytes(5).toString("hex")).toUpperCase();
    safeDb(() =>
      db
        .prepare(
          "INSERT INTO admin_codes(code, note, tier, days, grant_type, grant_value, created_at) VALUES(?,?,?,?,?,?,?)"
        )
        .run(
          code,
          note ? String(note) : null,
          String(tier || "paid"),
          Number(days || 0) || 0,
          String(grantType || "subscription"),
          Number(grantValue || 0) || 0,
          nowIso()
        )
    );
    return code;
  }

  function ensureGrantTarget(handle) {
    const h = normalizeHandle(handle);
    if (!validHandle(h)) return "";
    ensureUser(h);
    return h;
  }

  function subscriptionGrantToHandle({ handle, days }) {
    const h = ensureGrantTarget(handle);
    if (!h) return subscriptionInfo({ handle: "" });

    const grantDays = Math.max(0, Math.min(3650, Math.floor(Number(days || 0) || 0)));
    safeDb(() => {
      if (grantDays === 0) {
        db.prepare(
          "UPDATE users SET tier='unlimited', paid_until=NULL, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?"
        ).run(nowIso(), h);
        return;
      }

      const row = db.prepare("SELECT paid_until FROM users WHERE handle=?").get(h);
      const base = row?.paid_until ? new Date(row.paid_until) : new Date(0);
      const start = base.getTime() > Date.now() ? base : new Date();
      const next = new Date(start.getTime() + grantDays * 24 * 60 * 60 * 1000);
      db.prepare(
        "UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?"
      ).run(next.toISOString(), nowIso(), h);
    });

    const u2 = userByHandle(h);
    return subscriptionInfo({ ...(u2 || {}), handle: h });
  }

  function accessUnlocksForHandle(handle) {
    const h = String(handle || "").trim();
    if (!h) return computeReferralUnlocks(0, 0);
    const u = userByHandle(h) || { handle: h };
    const ownerRefCode = String(u?.ref_code || "").trim();
    const legacyEligible = ownerRefCode
      ? safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(ownerRefCode)?.c || 0) || 0
      : 0;
    const earnedEligible = Math.max(referralCountActive(h), legacyEligible);
    const manualEligibleCredits = referralRewardTotal(h, "eligible_credit");
    const starterBgSlots = referralRewardTotal(h, "starter_bg_slot");
    return computeReferralUnlocks(earnedEligible + manualEligibleCredits, starterBgSlots);
  }

  function recordAdminGrant({ handle, grantType, grantValue, note = null, adminHandle = null }) {
    const h = String(handle || "").trim();
    if (!h) return null;
    const row = {
      handle: h,
      grant_type: String(grantType || "subscription"),
      grant_value: Math.max(0, Math.floor(Number(grantValue || 0) || 0)),
      note: note ? String(note).slice(0, 64) : null,
      admin_handle: adminHandle ? String(adminHandle).trim().slice(0, 32) : null,
      created_at: nowIso(),
    };
    const out = safeDb(() =>
      db
        .prepare(
          "INSERT INTO admin_grants(handle, grant_type, grant_value, note, admin_handle, created_at) VALUES(?,?,?,?,?,?)"
        )
        .run(row.handle, row.grant_type, row.grant_value, row.note, row.admin_handle, row.created_at)
    );
    return out && out.changes === 1 ? row : null;
  }

  function applyAdminCodeToHandle({ handle, code, days }) {
    const h = ensureGrantTarget(handle);
    if (!h) return subscriptionInfo({ handle: "" });

    safeDb(() =>
      db.prepare("INSERT OR IGNORE INTO code_redemptions(code, handle, created_at) VALUES(?,?,?)").run(code, h, nowIso())
    );

    const sub = subscriptionGrantToHandle({ handle: h, days });
    logActivity(h, "admin_award", { code, days: Number(days || 0) || 0 });
    return sub;
  }

  return {
    adminCodeCreate,
    ensureGrantTarget,
    subscriptionGrantToHandle,
    accessUnlocksForHandle,
    recordAdminGrant,
    applyAdminCodeToHandle,
  };
}
