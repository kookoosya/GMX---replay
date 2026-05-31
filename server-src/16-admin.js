import { createRequireAdmin } from "./server/admin/middleware.mjs";

// ---------- ADMIN middleware + extension selector helpers ----------
const requireAdmin = createRequireAdmin({
  getAdminToken,
  canUseDevAdminSession,
  adminSessionGet,
  getBearer,
  userByToken,
  isAdminHandle,
  getAdminKey,
  ADMIN_SECRET,
});

function recordExtSelectorsHistory({ action, note, selectors_json, version, rollout_percent, rollout_salt }){
  safeDb(() => {
    db.prepare(
      "INSERT INTO ext_selectors_history(action, note, created_at, selectors_json, version, rollout_percent, rollout_salt) VALUES(?,?,?,?,?,?,?)"
    ).run(
      String(action||""),
      (note ? String(note) : null),
      nowIso(),
      (selectors_json ? String(selectors_json) : null),
      (Number.isFinite(Number(version)) ? Number(version) : null),
      (Number.isFinite(Number(rollout_percent)) ? Number(rollout_percent) : null),
      (rollout_salt ? String(rollout_salt) : null)
    );
  });
}

function listExtSelectorsHistory(limit=15){
  const lim = Math.max(1, Math.min(50, Math.floor(Number(limit)||15)));
  return safeDb(() =>
    db.prepare(
      "SELECT id, action, note, created_at, version, rollout_percent, rollout_salt FROM ext_selectors_history ORDER BY id DESC LIMIT ?"
    ).all(lim)
  ) || [];
}

function adminSelectorsPayload(){
  const { selectors, overrideUpdatedAt, override } = getEffectiveExtSelectors();
  const rollout = getExtSelectorsRollout();
  return {
    ok: true,
    build: BUILD_ID,
    default: EXT_SELECTORS,
    override: override ? { version: override.version, composer: override.composer, tweetText: override.tweetText, anchors: override.anchors, updated_at: override.updated_at } : null,
    overrideUpdatedAt,
    effective: selectors,
    rollout,
    preview: override ? { version: override.version, composer: override.composer, tweetText: override.tweetText, anchors: override.anchors } : EXT_SELECTORS,
    history: listExtSelectorsHistory(15)
  };
}


