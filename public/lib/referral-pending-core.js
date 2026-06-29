(function (global) {
  if (global.GMXReferralPendingCore) return;

  const REF_PENDING_STORAGE_KEY = "gmx_ref_pending_v1";
  const REF_PENDING_SCHEMA_VERSION = 1;
  const REF_PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const REF_CODE_MIN_LENGTH = 6;
  const REF_CODE_MAX_LENGTH = 32;
  const REF_CODE_PATTERN = /^[a-f0-9]+$/;
  const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

  function normalizeReferralCode(raw) {
    let s = String(raw ?? "").trim();
    if (!s) return "";
    try {
      s = decodeURIComponent(s);
    } catch {
      return "";
    }
    s = s.trim();
    if (!s || CONTROL_CHARS.test(s) || /[<>]/.test(s)) return "";
    if (s.length > REF_CODE_MAX_LENGTH) return "";
    s = s.toLowerCase();
    if (!REF_CODE_PATTERN.test(s)) return "";
    if (s.length < REF_CODE_MIN_LENGTH) return "";
    return s;
  }

  function createPendingRecord(code, opts) {
    opts = opts || {};
    const normalized = normalizeReferralCode(code);
    if (!normalized) return null;
    const capturedAt = Number(opts.now ?? Date.now()) || Date.now();
    const ttlMs = Number(opts.ttlMs ?? REF_PENDING_TTL_MS) || REF_PENDING_TTL_MS;
    return {
      version: REF_PENDING_SCHEMA_VERSION,
      code: normalized,
      capturedAt,
      expiresAt: capturedAt + ttlMs,
      source: String(opts.source || "ref_query"),
    };
  }

  function isPendingValid(record, now) {
    now = now ?? Date.now();
    if (!record || typeof record !== "object") return false;
    if (Number(record.version) !== REF_PENDING_SCHEMA_VERSION) return false;
    const code = normalizeReferralCode(record.code);
    if (!code || code !== String(record.code || "").toLowerCase()) return false;
    const capturedAt = Number(record.capturedAt);
    const expiresAt = Number(record.expiresAt);
    if (!Number.isFinite(capturedAt) || !Number.isFinite(expiresAt)) return false;
    if (expiresAt <= capturedAt) return false;
    return Number(now) < expiresAt;
  }

  function parsePendingRecord(raw, now) {
    now = now ?? Date.now();
    if (!raw) return null;
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
    if (!isPendingValid(parsed, now)) return null;
    return {
      version: REF_PENDING_SCHEMA_VERSION,
      code: normalizeReferralCode(parsed.code),
      capturedAt: Number(parsed.capturedAt),
      expiresAt: Number(parsed.expiresAt),
      source: String(parsed.source || "ref_query"),
    };
  }

  function serializePending(record) {
    return JSON.stringify(record);
  }

  function resolvePendingCapture(existing, queryCode, now, ttlMs) {
    const nowMs = Number(now ?? Date.now()) || Date.now();
    const ttl = Number(ttlMs ?? REF_PENDING_TTL_MS) || REF_PENDING_TTL_MS;
    let pending = existing && isPendingValid(existing, nowMs) ? existing : null;
    const rawQuery = String(queryCode ?? "").trim();
    const next = normalizeReferralCode(queryCode);

    if (!next) {
      if (rawQuery) {
        return { action: "reject_invalid", record: pending, sendClick: false, stripUrl: true };
      }
      return { action: pending ? "keep" : "noop", record: pending, sendClick: false, stripUrl: false };
    }

    if (pending) {
      return { action: "keep", record: pending, sendClick: false, stripUrl: true };
    }

    const created = createPendingRecord(next, { now: nowMs, ttlMs: ttl, source: "ref_query" });
    if (!created) {
      return { action: "reject_invalid", record: null, sendClick: false, stripUrl: true };
    }
    return { action: "create", record: created, sendClick: true, stripUrl: true };
  }

  function resolveRefForInit(pendingRecord, queryCode, now) {
    now = now ?? Date.now();
    const fromQuery = normalizeReferralCode(queryCode);
    if (fromQuery) return fromQuery;
    if (pendingRecord && isPendingValid(pendingRecord, now)) return pendingRecord.code;
    return "";
  }

  function pendingRecordHasSecrets(record) {
    if (!record || typeof record !== "object") return false;
    const forbidden = [
      "token",
      "handle",
      "fingerprint",
      "ip",
      "reward",
      "inviter",
      "invited",
      "inviteId",
      "cookie",
    ];
    return forbidden.some((k) => k in record);
  }

  global.GMXReferralPendingCore = {
    REF_PENDING_STORAGE_KEY,
    REF_PENDING_SCHEMA_VERSION,
    REF_PENDING_TTL_MS,
    REF_CODE_MIN_LENGTH,
    REF_CODE_MAX_LENGTH,
    normalizeReferralCode,
    createPendingRecord,
    isPendingValid,
    parsePendingRecord,
    serializePending,
    resolvePendingCapture,
    resolveRefForInit,
    pendingRecordHasSecrets,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
