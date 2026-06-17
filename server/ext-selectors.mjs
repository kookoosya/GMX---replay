/** Extension DOM selector overrides + rollout (shared by ext + admin routes). */

export const EXT_SELECTORS = {
  version: 1,
  composer: [
    'div[data-testid^="tweetTextarea_"] div[role="textbox"]',
    'div[role="dialog"] div[role="textbox"]',
    'div[role="textbox"][data-testid*="tweetTextarea"]',
    'div[role="textbox"][contenteditable="true"]',
    'div[role="textbox"]',
  ],
  tweetText: [
    'article div[data-testid="tweetText"]',
    'div[data-testid="tweetText"]',
    'article [lang]',
  ],
  anchors: [
    'div[data-testid="toolBar"]',
    'div[data-testid="tweetButtonInline"]',
    'div[role="group"]',
  ],
};

export function createExtSelectors({ safeDb, db, nowIso, sha256, randHex }) {
  function normalizeSelectorsPayload(obj) {
    if (!obj || typeof obj !== "object") return null;
    const pickArr = (v, max = 60) =>
      (Array.isArray(v) ? v : [])
        .map((s) => String(s || "").trim())
        .filter(Boolean)
        .slice(0, max);

    const payload = {
      version: Number(obj.version || EXT_SELECTORS.version || 1),
      composer: pickArr(obj.composer, 80),
      tweetText: pickArr(obj.tweetText, 80),
      anchors: pickArr(obj.anchors, 80),
    };
    if (!Number.isFinite(payload.version) || payload.version <= 0) payload.version = 1;
    return payload;
  }

  function getExtSelectorsOverride() {
    const row = safeDb(() => db.prepare("SELECT json, updated_at FROM ext_selectors WHERE id=1").get());
    if (!row?.json) return null;
    try {
      const parsed = JSON.parse(row.json);
      const norm = normalizeSelectorsPayload(parsed);
      if (!norm) return null;
      return { ...norm, updated_at: row.updated_at };
    } catch {
      return null;
    }
  }

  function setExtSelectorsOverride(payload) {
    const norm = normalizeSelectorsPayload(payload);
    if (!norm) return null;
    safeDb(() =>
      db
        .prepare(
          `INSERT INTO ext_selectors(id, json, updated_at)
       VALUES(1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at`
        )
        .run(JSON.stringify(norm), nowIso())
    );
    return norm;
  }

  function resetExtSelectorsOverride() {
    safeDb(() => db.prepare("DELETE FROM ext_selectors WHERE id=1").run());
  }

  function getExtSelectorsRollout() {
    let row = safeDb(() =>
      db.prepare("SELECT rollout_percent, rollout_salt, updated_at FROM ext_selectors_meta WHERE id=1").get()
    );
    if (!row) {
      const salt = randHex(8);
      safeDb(() =>
        db
          .prepare("INSERT OR IGNORE INTO ext_selectors_meta(id, rollout_percent, rollout_salt, updated_at) VALUES(1, 100, ?, ?)")
          .run(salt, nowIso())
      );
      row = { rollout_percent: 100, rollout_salt: salt, updated_at: nowIso() };
    }
    const p = Math.max(0, Math.min(100, Number(row.rollout_percent ?? 100)));
    return {
      rollout_percent: Number.isFinite(p) ? p : 100,
      rollout_salt: String(row.rollout_salt || ""),
      updated_at: String(row.updated_at || ""),
    };
  }

  function setExtSelectorsRolloutMeta({ rollout_percent, rollout_salt }) {
    const p0 = Number(rollout_percent);
    const p = Math.max(0, Math.min(100, Number.isFinite(p0) ? Math.floor(p0) : 100));
    const salt = String(rollout_salt || "").trim() || randHex(8);
    safeDb(() =>
      db
        .prepare(
          `INSERT INTO ext_selectors_meta(id, rollout_percent, rollout_salt, updated_at)
       VALUES(1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET rollout_percent=excluded.rollout_percent, rollout_salt=excluded.rollout_salt, updated_at=excluded.updated_at`
        )
        .run(p, salt, nowIso())
    );
    return { rollout_percent: p, rollout_salt: salt, updated_at: nowIso() };
  }

  function inRolloutForClient(clientId, rolloutPercent, rolloutSalt) {
    const p = Math.max(0, Math.min(100, Number(rolloutPercent ?? 100)));
    if (p >= 100) return true;
    if (p <= 0) return false;
    const cid = String(clientId || "").trim();
    if (!cid) return false;
    const salt = String(rolloutSalt || "");
    const h = sha256(cid + "|" + salt);
    const n = parseInt(h.slice(0, 8), 16);
    const bucket = (Number.isFinite(n) ? n : 0) % 100;
    return bucket < p;
  }

  function getEffectiveExtSelectorsForClient(clientId) {
    const rollout = getExtSelectorsRollout();
    const o = getExtSelectorsOverride();
    const hasOverride = !!o;
    const inRollout = hasOverride ? inRolloutForClient(clientId, rollout.rollout_percent, rollout.rollout_salt) : false;

    if (!hasOverride || !inRollout) {
      return { selectors: EXT_SELECTORS, overrideUpdatedAt: o?.updated_at || null, override: o || null, rollout, inRollout };
    }

    const eff = {
      version: o.version || EXT_SELECTORS.version || 1,
      composer: o.composer?.length ? o.composer : EXT_SELECTORS.composer,
      tweetText: o.tweetText?.length ? o.tweetText : EXT_SELECTORS.tweetText,
      anchors: o.anchors?.length ? o.anchors : EXT_SELECTORS.anchors,
    };

    return { selectors: eff, overrideUpdatedAt: o.updated_at || null, override: o, rollout, inRollout };
  }

  function getEffectiveExtSelectors() {
    const o = getExtSelectorsOverride();
    if (!o) return { selectors: EXT_SELECTORS, overrideUpdatedAt: null, override: null };
    const eff = {
      version: o.version || EXT_SELECTORS.version || 1,
      composer: o.composer?.length ? o.composer : EXT_SELECTORS.composer,
      tweetText: o.tweetText?.length ? o.tweetText : EXT_SELECTORS.tweetText,
      anchors: o.anchors?.length ? o.anchors : EXT_SELECTORS.anchors,
    };
    return { selectors: eff, overrideUpdatedAt: o.updated_at || null, override: o };
  }

  return {
    EXT_SELECTORS,
    normalizeSelectorsPayload,
    getExtSelectorsOverride,
    setExtSelectorsOverride,
    resetExtSelectorsOverride,
    getExtSelectorsRollout,
    setExtSelectorsRolloutMeta,
    getEffectiveExtSelectorsForClient,
    getEffectiveExtSelectors,
  };
}
