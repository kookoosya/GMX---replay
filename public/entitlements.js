// Shared entitlements helper (site + extension)
// Keeps plan logic out of UI and provides a single normalized snapshot shape.
(function(root){
  const DEFAULT_BASE = "https://www.gmxreply.com";
  const STORAGE_KEY = "gmx_access_snapshot_v1";
  const STALE_MS = 5 * 60 * 1000;

  function toNum(v, fallback = 0){
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function finiteOrNull(v){
    if (v === null || typeof v === "undefined") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function normHandle(raw){
    const s = String(raw || "").trim();
    if (!s) return "";
    return s.replace(/^@+/, "").replace(/\s+/g, "");
  }

  function normBase(raw){
    const s = String(raw || "").trim();
    if (!s) return DEFAULT_BASE;
    try{
      const u = new URL(s);
      const host = String(u.hostname || "").toLowerCase();
      if (host === "localhost" || host === "127.0.0.1" || host === "gmxreply.com" || host === "www.gmxreply.com"){
        return String(u.origin || DEFAULT_BASE).replace(/\/+$/, "");
      }
    }catch(_e){}
    return DEFAULT_BASE;
  }

  function isUnlimited(input){
    if (!input || typeof input !== "object") return false;
    if (input.plan === "unlimited") return true;
    if (input.isUnlimited === true) return true;
    if (input.sub && input.sub.isUnlimited === true) return true;
    if (input.extension && input.extension.plan === "unlimited") return true;
    return false;
  }

  function isPro(input){
    if (!input || typeof input !== "object") return false;
    if (isUnlimited(input)) return true;
    if (String(input.sub_status || "") === "active") return true;
    if (input.sub && input.sub.active === true) return true;
    if (input.extension && (input.extension.plan === "paid" || input.extension.plan === "unlimited")) return true;
    if (input.plan === "paid") return true;
    return false;
  }

  function planName(input){
    if (isUnlimited(input)) return "unlimited";
    return isPro(input) ? "pro" : "free";
  }

  function getPlan(config, input){
    const p = planName(input);
    const lookup = p === "unlimited" ? "pro" : p;
    return (config && config.plans && config.plans[lookup]) || (config && config[lookup]) || null;
  }

  function usageFromPayload(payload){
    if (!payload || typeof payload !== "object") return null;
    if (payload.usage && typeof payload.usage === "object") return usageFromPayload(payload.usage);
    const out = {};
    if (typeof payload.used !== "undefined") out.used = toNum(payload.used, 0);
    if (typeof payload.limit !== "undefined") out.limit = finiteOrNull(payload.limit);
    if (typeof payload.resetAt === "string") out.resetAt = payload.resetAt;
    if (!Object.keys(out).length) return null;
    return out;
  }

  function normalizeSnapshot(raw){
    if (!raw || typeof raw !== "object") return null;

    const ext = raw.extension && typeof raw.extension === "object" ? raw.extension : {};
    const usage = raw.usage && typeof raw.usage === "object" ? raw.usage : {};
    const gm = usage.gm && typeof usage.gm === "object" ? usage.gm : {};
    const gn = usage.gn && typeof usage.gn === "object" ? usage.gn : {};

    const planRaw = String(ext.plan || raw.plan || "").toLowerCase();
    const plan =
      planRaw === "unlimited" ? "unlimited" :
      (planRaw === "paid" || planRaw === "pro" || isPro(raw)) ? "paid" :
      "free";

    const insertMode =
      String(ext.insertMode || "").toLowerCase() === "unlimited" || plan !== "free"
        ? "unlimited"
        : "metered";

    const dailyLimit = finiteOrNull(ext.dailyLimitPerKind);
    const gmLimit = gm.limit == null ? dailyLimit : finiteOrNull(gm.limit);
    const gnLimit = gn.limit == null ? dailyLimit : finiteOrNull(gn.limit);

    const snapshot = {
      handle: normHandle(raw.handle),
      plan,
      insertMode,
      dailyLimitPerKind: dailyLimit,
      saveCap: toNum(ext.saveCap, 0),
      gmUsed: toNum(gm.used, 0),
      gnUsed: toNum(gn.used, 0),
      gmLimit,
      gnLimit,
      resetAt: String(raw.resetAt || gm.resetAt || gn.resetAt || "").trim() || null,
      eligibleRefs: raw.limits && raw.limits.referralUnlocks && raw.limits.referralUnlocks.eligible != null
        ? toNum(raw.limits.referralUnlocks.eligible, 0)
        : toNum(raw.eligibleRefs, 0),
      refreshedAt: String(raw.refreshedAt || new Date().toISOString()),
      backgrounds: {
        unlimited: !!(ext.backgrounds && ext.backgrounds.unlimited),
        slots: ext.backgrounds && ext.backgrounds.slots != null ? finiteOrNull(ext.backgrounds.slots) : null,
        cosmeticsOnePack: !!(ext.backgrounds && ext.backgrounds.cosmeticsOnePack),
        cosmeticsAllPacks: !!(ext.backgrounds && ext.backgrounds.cosmeticsAllPacks),
      },
      unlocks: {
        proTrial7d: !!(ext.unlocks && ext.unlocks.proTrial7d),
        discount50: !!(ext.unlocks && ext.unlocks.discount50),
        toolkit: !!(ext.unlocks && ext.unlocks.toolkit),
        nextUnlockAt: ext.unlocks && ext.unlocks.nextUnlockAt != null ? Number(ext.unlocks.nextUnlockAt) : null,
      },
      sub: {
        active: !!(raw.sub && raw.sub.active),
        isUnlimited: !!(raw.sub && raw.sub.isUnlimited),
      },
    };

    return snapshot;
  }

  function cloneSnapshot(snapshot){
    return snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
  }

  function applyUsage(snapshot, kind, usageLike, by = 1){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return null;

    const k = kind === "gn" ? "gn" : "gm";
    const usedKey = k + "Used";
    const limitKey = k + "Limit";
    const usage = usageFromPayload(usageLike);

    if (usage){
      snap[usedKey] = toNum(usage.used, snap[usedKey] || 0);
      if (usage.limit !== null && typeof usage.limit !== "undefined") {
        snap[limitKey] = finiteOrNull(usage.limit);
      }
      if (usage.resetAt) snap.resetAt = String(usage.resetAt);
    } else {
      snap[usedKey] = Math.max(0, toNum(snap[usedKey], 0) + Math.max(0, toNum(by, 0)));
    }

    snap.refreshedAt = new Date().toISOString();
    return snap;
  }

  function isFresh(snapshot, ttlMs = STALE_MS){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return false;
    const ts = Date.parse(String(snap.refreshedAt || ""));
    if (!Number.isFinite(ts)) return false;
    const now = Date.now();
    if ((now - ts) > Math.max(1000, toNum(ttlMs, STALE_MS))) return false;
    if (snap.resetAt){
      const resetTs = Date.parse(String(snap.resetAt || ""));
      if (Number.isFinite(resetTs) && now >= resetTs) return false;
    }
    return true;
  }

  function canGenerate(snapshot, kind){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return true;
    if (snap.insertMode === "unlimited") return true;
    const k = kind === "gn" ? "gn" : "gm";
    const used = toNum(snap[k + "Used"], 0);
    const limit = finiteOrNull(snap[k + "Limit"]);
    if (limit === null) return true;
    return used < limit;
  }

  function usageLabel(snapshot, kind){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return "—";
    const k = kind === "gn" ? "gn" : "gm";
    const used = toNum(snap[k + "Used"], 0);
    const limit = finiteOrNull(snap[k + "Limit"]);
    if (snap.insertMode === "unlimited" || limit === null) return `${used}/∞`;
    return `${used}/${limit}`;
  }

  function planLabel(snapshot){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return "free";
    return snap.plan;
  }


  function eligibleRefsCount(snapshot){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return 0;
    return Math.max(0, toNum(snap.eligibleRefs, 0));
  }

  function unlockedCosmeticsCount(snapshot, total, freeCount = 10){
    const snap = normalizeSnapshot(snapshot);
    const cap = Math.max(0, toNum(total, 0));
    const free = Math.max(0, toNum(freeCount, 0));
    if (!cap) return 0;
    if (cap <= free) return cap;
    if (snap && planLabel(snap) !== "free") return cap;
    const eligible = eligibleRefsCount(snap);
    if (eligible < 10) return Math.min(cap, free);
    const extra = 1 + Math.floor((eligible - 10) / 5);
    return Math.min(cap, free + Math.max(0, extra));
  }

  function resolveAllowedId(snapshot, ids, preferredId, freeCount = 10, fallbackId = ""){
    const list = Array.isArray(ids) ? ids.map((v) => String(v || "").trim()).filter(Boolean) : [];
    const fallback = String(fallbackId || "").trim();
    if (!list.length) return fallback;

    const unlocked = Math.max(1, unlockedCosmeticsCount(snapshot, list.length, freeCount));
    const allowed = new Set(list.slice(0, unlocked));
    const preferred = String(preferredId || "").trim();
    if (preferred && allowed.has(preferred)) return preferred;
    if (fallback && allowed.has(fallback)) return fallback;
    return list[0] || fallback;
  }

  function canUseCustomBackground(snapshot){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return false;
    if (planLabel(snap) !== "free") return true;
    if (snap.backgrounds && snap.backgrounds.unlimited) return true;
    const slots = finiteOrNull(snap.backgrounds && snap.backgrounds.slots);
    return slots === null ? false : slots > 0;
  }

  function storageGet(storageArea, key){
    return new Promise((resolve) => {
      try{
        storageArea.get([key], (obj) => {
          resolve(obj && obj[key] ? obj[key] : null);
        });
      }catch(_e){
        resolve(null);
      }
    });
  }

  function storageSet(storageArea, obj){
    return new Promise((resolve) => {
      try{
        storageArea.set(obj, () => resolve(true));
      }catch(_e){
        resolve(false);
      }
    });
  }

  async function readStored(storageArea){
    const raw = await storageGet(storageArea, STORAGE_KEY);
    return normalizeSnapshot(raw);
  }

  async function writeStored(storageArea, snapshot){
    const snap = normalizeSnapshot(snapshot);
    if (!snap) return false;
    return await storageSet(storageArea, { [STORAGE_KEY]: snap });
  }

  async function fetchSnapshot(base, token, fetchImpl){
    const tok = String(token || "").trim();
    if (!tok) return null;
    const apiBase = normBase(base);
    const fetchFn = fetchImpl || (typeof fetch === "function" ? fetch.bind(root) : null);
    if (!fetchFn) return null;

    const r = await fetchFn(`${apiBase}/api/access/entitlements`, {
      headers: { "Authorization": "Bearer " + tok },
      cache: "no-store",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j || j.ok === false) return null;
    return normalizeSnapshot(j);
  }

  root.GMXEntitlements = {
    DEFAULT_BASE,
    STORAGE_KEY,
    STALE_MS,
    normBase,
    normHandle,
    isPro,
    isUnlimited,
    planName,
    getPlan,
    usageFromPayload,
    normalizeSnapshot,
    cloneSnapshot,
    applyUsage,
    isFresh,
    canGenerate,
    usageLabel,
    planLabel,
    eligibleRefsCount,
    unlockedCosmeticsCount,
    resolveAllowedId,
    canUseCustomBackground,
    readStored,
    writeStored,
    fetchSnapshot,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
