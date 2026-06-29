/** Shared server config, plans, billing metadata, error helpers. */

export const USDC_MINT = process.env.USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_MINT = process.env.USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

export const SOL_USD_FALLBACK = Number(process.env.SOL_USD_FALLBACK || "0") || 0;

export const SOL_RECEIVER =
  process.env.SOL_RECEIVER ||
  "2idG5EVab4ATDHSTXUmqEaKzrorNJEMjBhTDgcPT3Bfb";

export const EXTENSION_STORE_URL = process.env.EXTENSION_STORE_URL || "";

export const CONFIG = {
  FREE_DAILY_BASE: Math.max(0, Math.min(500, Number(process.env.GMX_FREE_DAILY || "50") || 50)),
  SAVE_CAP_FREE: Math.max(10, Math.min(1000, Number(process.env.GMX_SAVE_CAP_FREE || "50") || 50)),
  PRO_DAILY_SENTINEL: 999999,
  GEN_MIN_LATENCY_MS: Math.max(0, Math.min(5000, Number(process.env.GMX_GEN_MIN_LATENCY_MS || "250") || 250)),
  GEN_COOLDOWN_MS: Math.max(0, Math.min(10000, Number(process.env.GMX_GEN_COOLDOWN_MS || "900") || 900)),
  BULK_COOLDOWN_MS: Math.max(0, Math.min(20000, Number(process.env.GMX_BULK_COOLDOWN_MS || "2000") || 2000)),
  IP_COOLDOWN_MS: Math.max(0, Math.min(10000, Number(process.env.GMX_IP_COOLDOWN_MS || "500") || 500)),
  GEN_PER_MINUTE: Math.max(10, Math.min(600, Number(process.env.GMX_GEN_PER_MINUTE || "90") || 90)),
  BULK_CALLS_PER_MINUTE: Math.max(5, Math.min(120, Number(process.env.GMX_BULK_CALLS_PER_MINUTE || "30") || 30)),
  REF_BONUS_CAP: Math.max(0, Math.min(1000, Number(process.env.GMX_REF_BONUS_CAP || "120") || 120)),
};

export const REF_MIN_ACTIVE_DAYS = Math.max(1, Math.min(30, Number(process.env.GMX_REF_ACTIVE_MIN_DAYS || "1") || 1));
export const REF_MIN_ACTIVE_USES = Math.max(1, Math.min(1000, Number(process.env.GMX_REF_ACTIVE_MIN_USES || "1") || 1));
/** Client pending attribution TTL (7 days). */
export const REF_PENDING_TTL_MS = Math.max(
  60_000,
  Math.min(30 * 24 * 60 * 60 * 1000, Number(process.env.GMX_REF_PENDING_TTL_MS || String(7 * 24 * 60 * 60 * 1000)) || 7 * 24 * 60 * 60 * 1000)
);

export const PLANS = {
  free: {
    dailyLimit: CONFIG.FREE_DAILY_BASE,
    saveCap: CONFIG.SAVE_CAP_FREE,
    unlimited: false,
    themes: 10,
    wallpapers: 10,
    styles: 1,
    packs: 1,
  },
  pro: {
    dailyLimit: null,
    saveCap: null,
    unlimited: true,
    themes: 100,
    wallpapers: 100,
    styles: "all",
    packs: "all",
  },
};

export const ERROR_CODES = {
  INVALID_HANDLE: "invalid_handle",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  RATE_LIMITED: "rate_limited",
  BUSY: "busy_try_again",
  LIMIT_REACHED: "limit_reached",
  UPGRADE_REQUIRED: "upgrade_required",
  SERVER_ERROR: "server_error",
  INVALID_REQUEST: "invalid_request",
};

export function sendError(res, status, code, extra = {}) {
  return res.status(status).json({ ok: false, error_code: code, ...extra });
}

export const BILLING_PLANS = [
  { key: "m1", label: "1 month", usd: 10, days: 30 },
  { key: "m3", label: "3 months", usd: 25, days: 90 },
  { key: "m6", label: "6 months", usd: 50, days: 180 },
  { key: "y1", label: "1 year", usd: 80, days: 365 },
];

export const BILLING_TOKENS = [
  { key: "SOL", label: "SOL", kind: "native", decimals: 9 },
  { key: "USDC", label: "USDC", kind: "spl", mint: USDC_MINT, decimals: 6 },
  { key: "USDT", label: "USDT", kind: "spl", mint: USDT_MINT, decimals: 6 },
];
