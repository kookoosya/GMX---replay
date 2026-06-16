// ---------- ACTIVITY / FEATURES ----------
function logActivity(handle, eventType, meta) {
  const h = String(handle || '').trim();
  const t = String(eventType || '').trim();
  if (!h || !t) return;
  let meta_json = null;
  if (meta && typeof meta === 'object') {
    try {
      const s = JSON.stringify(meta);
      meta_json = s.length <= 2048 ? s : s.slice(0, 2048);
    } catch {}
  }
  safeDb(() => {
    db.prepare('INSERT INTO activity_log(handle, event_type, meta_json, created_at) VALUES(?,?,?,?)')
      .run(h, t, meta_json, nowIso());
  });
}

function getFeatureFlag(key, defVal=false){
  const k = String(key||'').trim();
  if (!k) return defVal;
  const row = safeDb(() => db.prepare('SELECT value FROM settings WHERE key=?').get('feature:' + k));
  if (!row) return defVal;
  const v = String(row.value ?? '').trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return defVal;
}

function setFeatureFlag(key, val){
  const k = String(key||'').trim();
  if (!k) return;
  const v = val ? '1' : '0';
  safeDb(() => {
    db.prepare('INSERT OR REPLACE INTO settings(key, value, updated_at) VALUES(?,?,?)')
      .run('feature:' + k, v, nowIso());
  });
}

function referralCountConfirmed(handle){
  const h = String(handle||'').trim();
  if (!h) return 0;
  return safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referral_invites WHERE inviter_handle=? AND status='confirmed' AND (fraud_flag IS NULL OR fraud_flag=0)")
    .get(h)?.c || 0) || 0;
}


function referralCountActive(handle){
  const h = String(handle||'').trim();
  if (!h) return 0;
  // Active = confirmed invite where the invited handle has any recorded usage (usage_daily.used > 0).
  return safeDb(() => db.prepare(
    "SELECT COUNT(*) AS c FROM referral_invites ri WHERE ri.inviter_handle=? AND ri.status='confirmed' AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0) AND EXISTS (SELECT 1 FROM usage_daily ud WHERE ud.handle=ri.invited_handle AND ud.used>0 LIMIT 1)"
  ).get(h)?.c || 0) || 0;
}

