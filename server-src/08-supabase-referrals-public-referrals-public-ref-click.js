// ---------- SUPABASE REFERRALS (public.referrals + public.ref_clicks) ----------

function mirrorSupabaseUsageToSqlite(handle, day, kind, used) {
  // Keep a monotonic mirror of Supabase usage in SQLite so existing (sync) referral bonus logic works.
  // This mirror is NOT used for quota/limits in Supabase mode.
  const h = String(handle || "").trim();
  const d = String(day || "").trim();
  const k = String(kind || "").toLowerCase().trim();
  const u = Number(used || 0) || 0;
  if (!h || !d || !k) return;
  safeDb(() => {
    db.prepare("INSERT OR IGNORE INTO usage_daily(handle, day, kind, used) VALUES(?,?,?,0)").run(h, d, k, 0);
    // Only move forward
    db.prepare("UPDATE usage_daily SET used=? WHERE handle=? AND day=? AND kind=? AND used < ?")
      .run(u, h, d, k, u);
  });
}

async function sbReferralsUpsertInvite(inviter_handle, invited_handle, created_at = null, confirmed_at = null) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok:false, error:"supabase_inactive" };
  const inv = String(inviter_handle || "").trim();
  const ivd = String(invited_handle || "").trim();
  if (!inv || !ivd) return { ok:false, error:"missing_handles" };

  // If invited_handle is already claimed by someone else (legacy=false), do not overwrite.
  const existing = await sb
    .from("referrals")
    .select("inviter_handle")
    .eq("invited_handle", ivd)
    .eq("legacy", false)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data && String(existing.data.inviter_handle || "") !== inv) {
    return { ok:true, skipped:true, reason:"invited_already_claimed" };
  }

  const row = {
    inviter_handle: inv,
    invited_handle: ivd,
    created_at: created_at || nowIso(),
    confirmed_at: confirmed_at || nowIso(),
    first_use_at: null,
    legacy: false,
    clicks: 0,
  };

  const r = await sb.from("referrals").upsert(row, { onConflict: "inviter_handle,invited_handle" });
  if (r.error) throw r.error;
  return { ok:true };
}

async function sbReferralsMarkFirstUse(invited_handle) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok:false, error:"supabase_inactive" };
  const ivd = String(invited_handle || "").trim();
  if (!ivd) return { ok:false, error:"missing_handle" };

  const r = await sb
    .from("referrals")
    .update({ first_use_at: nowIso() })
    .eq("invited_handle", ivd)
    .eq("legacy", false)
    .is("first_use_at", null)
    .select("inviter_handle")
    .maybeSingle();

  if (r.error) throw r.error;
  return { ok:true, inviter_handle: r.data?.inviter_handle || null, updated: !!r.data };
}

async function sbReferralsCount(inviter_handle, field) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok:false, error:"supabase_inactive", count:0 };
  const inv = String(inviter_handle || "").trim();
  if (!inv) return { ok:true, count:0 };

  let q = sb.from("referrals").select("invited_handle", { count:"exact", head:true }).eq("inviter_handle", inv);
  if (field === "confirmed") q = q.eq("legacy", false).not("confirmed_at", "is", null);
  else if (field === "active") q = q.eq("legacy", false).not("first_use_at", "is", null);
  else if (field === "legacy") q = q.eq("legacy", true);
  const r = await q;
  if (r.error) throw r.error;
  return { ok:true, count: r.count || 0 };
}

async function sbRefClicksUpsert(code, fingerprint) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok:false, error:"supabase_inactive" };
  const c = String(code || "").trim();
  const fp = String(fingerprint || "").trim();
  if (!c || !fp) return { ok:true, skipped:true };
  const row = { code: c, fingerprint: fp, created_at: nowIso() };
  const r = await sb.from("ref_clicks").upsert(row, { onConflict: "code,fingerprint" });
  if (r.error) throw r.error;
  return { ok:true };
}

async function sbRefClicksCount(code) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok:false, error:"supabase_inactive", count:0 };
  const c = String(code || "").trim();
  if (!c) return { ok:true, count:0 };
  const r = await sb.from("ref_clicks").select("fingerprint", { count:"exact", head:true }).eq("code", c);
  if (r.error) throw r.error;
  return { ok:true, count: r.count || 0 };
}

async function sbUsageEverUsed(handle) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok:false, error:"supabase_inactive", active:false };
  const h = String(handle || "").trim();
  if (!h) return { ok:true, active:false };
  const r = await sb
    .from("usage_daily")
    .select("day")
    .eq("handle", h)
    .or("gm_used.gt.0,gn_used.gt.0")
    .limit(1);
  if (r.error) throw r.error;
  return { ok:true, active: (r.data || []).length > 0 };
}

async function sbBackfillInvitesFromSqlite(inviter_handle, limit = 500) {
  // For installs that already created sqlite referral_invites before Supabase referral patch was applied.
  // Makes Supabase the source of truth for stats/UI without requiring users to re-init.
  if (!supabaseActive()) return { ok:false, error:"supabase_inactive" };
  const inv = String(inviter_handle || "").trim();
  if (!inv) return { ok:true, upserted:0, marked:0 };

  const rows = safeDb(() => db.prepare(`
    SELECT invited_handle, created_at, confirmed_at
    FROM referral_invites
    WHERE inviter_handle=? AND status='confirmed' AND (fraud_flag IS NULL OR fraud_flag=0)
    ORDER BY created_at DESC
    LIMIT ?
  `).all(inv, Math.max(1, Math.min(2000, Number(limit)||500)))) || [];

  if (!rows.length) return { ok:true, upserted:0, marked:0 };

  const sb = getSupabaseAdmin();
  if (!sb) return { ok:false, error:"supabase_inactive" };

  const invited = rows.map(r => String(r.invited_handle || "").trim()).filter(Boolean);
  const uniqInvited = [...new Set(invited)].slice(0, 2000);

  // Detect already-claimed invited handles to avoid unique violations (invited_handle is unique where legacy=false)
  const existing = await sb
    .from("referrals")
    .select("invited_handle, inviter_handle")
    .in("invited_handle", uniqInvited)
    .eq("legacy", false);

  if (existing.error) throw existing.error;

  const claimedBy = new Map();
  for (const r of (existing.data || [])) {
    claimedBy.set(String(r.invited_handle || ""), String(r.inviter_handle || ""));
  }

  const upsertRows = [];
  for (const r of rows) {
    const ivd = String(r.invited_handle || "").trim();
    if (!ivd) continue;
    const claimed = claimedBy.get(ivd);
    if (claimed && claimed !== inv) continue;
    upsertRows.push({
      inviter_handle: inv,
      invited_handle: ivd,
      created_at: r.created_at || nowIso(),
      confirmed_at: r.confirmed_at || r.created_at || nowIso(),
      first_use_at: null,
      legacy: false,
      clicks: 0,
    });
  }

  if (upsertRows.length) {
    const up = await sb.from("referrals").upsert(upsertRows, { onConflict: "inviter_handle,invited_handle" });
    if (up.error) throw up.error;
  }

  // Mark first_use_at for invited handles that have any usage in Supabase
  let usedHandles = [];
  try {
    const u = await sb
      .from("usage_daily")
      .select("handle")
      .in("handle", uniqInvited)
      .or("gm_used.gt.0,gn_used.gt.0")
      .limit(2000);
    if (u.error) throw u.error;
    usedHandles = [...new Set((u.data || []).map(x => String(x.handle || "").trim()).filter(Boolean))];
  } catch (e) {
    console.warn("SB_REF_BACKFILL_USAGE_ERROR", e?.message || e);
    usedHandles = [];
  }

  // Also mirror "ever used" into sqlite usage_daily so sync referral bonus logic can see active invites.
  try {
    const dayKey = todayKeyUTC();
    for (const h of usedHandles) {
      try { mirrorSupabaseUsageToSqlite(h, dayKey, "gm", 1); } catch (_e) {}
    }
  } catch (_e) {}

  let marked = 0;
  if (usedHandles.length) {
    const upd = await sb
      .from("referrals")
      .update({ first_use_at: nowIso() })
      .eq("inviter_handle", inv)
      .eq("legacy", false)
      .in("invited_handle", usedHandles)
      .is("first_use_at", null)
      .select("invited_handle");
    if (upd.error) throw upd.error;
    marked = (upd.data || []).length;
  }

  return { ok:true, upserted: upsertRows.length, marked };
}



import { createGenerator } from "./server/generation.mjs";
