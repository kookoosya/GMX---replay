import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import fs from "node:fs";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local env file (.env) if present (for stable local dev). Does not override existing process.env.
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.disable("x-powered-by");
app.disable("etag");

// Static shared assets (wallpapers/extbg/arcade covers)
const ASSETS_DIR = path.join(__dirname, "assets");
function setSharedAssetHeaders(res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  } catch {}
}
app.use(
  ["/assets", "/bridge/assets"],
  (req, res, next) => { setSharedAssetHeaders(res); next(); },
  express.static(ASSETS_DIR, {
    maxAge: "24h",
    redirect: false,
    setHeaders: (res) => setSharedAssetHeaders(res),
  })
);


const PORT = Number(process.env.PORT) || 10000;
const TRUST_PROXY = String(process.env.TRUST_PROXY || "").trim() === "1";
const DEV_MODE = String(process.env.NODE_ENV || "").toLowerCase() !== "production";
const DEV_RUN_TOKEN = String(process.env.GMX_DEV_RUN_TOKEN || "").trim();
const DEV_ADMIN_SESSION_ONLY = DEV_MODE && String(process.env.ALLOW_DEV_ADMIN_SESSION || "1").trim() !== "0";
const STARTED_AT = new Date().toISOString();
const BUILD_ID =
  process.env.BUILD_ID ||
  process.env.RENDER_GIT_COMMIT ||
  crypto.randomBytes(8).toString("hex");

const LOG_DIR = path.join(__dirname, "logs");
const APP_LOG_FILE = path.join(LOG_DIR, "app.log");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");
const SHUTDOWN_GRACE_MS = Math.max(1000, Math.min(30000, Number(process.env.SHUTDOWN_GRACE_MS || "8000") || 8000));
const HEALTH_CACHE_TTL_MS = Math.max(1000, Math.min(60000, Number(process.env.HEALTH_CACHE_TTL_MS || "15000") || 15000));
let HTTP_SERVER = null;
let SHUTDOWN_STARTED = false;
let LAST_HEALTH = { at: 0, data: null };

function ensureLogDir() {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}

function safeSerialize(value) {
  try {
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function writeLog(level, message, meta) {
  const line = `[${new Date().toISOString()}] ${level} ${message}${meta ? ` ${safeSerialize(meta)}` : ""}`;
  const stream = level === "ERROR" ? ERROR_LOG_FILE : APP_LOG_FILE;
  const printer = level === "ERROR" ? console.error : (level === "WARN" ? console.warn : console.log);
  try { ensureLogDir(); fs.appendFileSync(stream, line + "\n", "utf8"); } catch {}
  try { printer(line); } catch {}
}

function closeServerQuietly() {
  if (!HTTP_SERVER) return;
  try {
    HTTP_SERVER.close(() => {
      writeLog("INFO", "HTTP_SERVER_CLOSED");
    });
  } catch (err) {
    writeLog("ERROR", "HTTP_SERVER_CLOSE_FAILED", { error: err?.message || String(err) });
  }
}

function beginShutdown(reason, err, opts = {}) {
  if (SHUTDOWN_STARTED) return;
  SHUTDOWN_STARTED = true;
  const level = String(opts.level || (err ? "ERROR" : "WARN")).toUpperCase();
  const exitCode = Number.isInteger(opts.exitCode) ? opts.exitCode : (err ? 1 : 0);
  writeLog(level, "PROCESS_SHUTDOWN", {
    reason,
    exitCode,
    error: err?.stack || err?.message || (err ? String(err) : null),
  });
  closeServerQuietly();
  process.exitCode = exitCode;
  const timer = setTimeout(() => {
    process.exit(exitCode);
  }, SHUTDOWN_GRACE_MS);
  if (typeof timer?.unref === "function") timer.unref();
}

async function getHealthSnapshot(force = false) {
  const now = Date.now();
  if (!force && LAST_HEALTH.data && (now - LAST_HEALTH.at) < HEALTH_CACHE_TTL_MS) {
    return LAST_HEALTH.data;
  }

  const checks = {
    sqlite: { ok: true },
    supabase: { ok: null, skipped: true },
  };

  try {
    if (DB_MODE === "sqlite") db.prepare("SELECT 1 AS ok").get();
  } catch (err) {
    checks.sqlite = { ok: false, error: err?.message || String(err) };
  }

  if (DB_MODE === "supabase") {
    checks.supabase = { ok: false, skipped: false };
    if (!SUPABASE_CONFIGURED) {
      checks.supabase = { ok: false, skipped: false, error: "missing_env" };
    } else {
      try {
        const sb = getSupabaseAdmin();
        if (!sb) {
          checks.supabase = { ok: false, skipped: false, error: "client_inactive" };
        } else {
          const probe = await sb.from("users").select("handle", { head: true, count: "exact" }).limit(1);
          if (probe.error) {
            checks.supabase = { ok: false, skipped: false, error: probe.error.message || String(probe.error) };
          } else {
            checks.supabase = { ok: true, skipped: false };
          }
        }
      } catch (err) {
        checks.supabase = { ok: false, skipped: false, error: err?.message || String(err) };
      }
    }
  }

  const degraded = [];
  if (checks.sqlite.ok === false) degraded.push("sqlite");
  if (checks.supabase.ok === false) degraded.push("supabase");

  const data = {
    ok: degraded.length === 0,
    status: degraded.length ? "degraded" : "ok",
    time: nowIso(),
    build: BUILD_ID,
    startedAt: STARTED_AT,
    uptimeSec: Math.round(process.uptime()),
    dbMode: DB_MODE,
    supabaseConfigured: SUPABASE_CONFIGURED,
    supabaseActive: supabaseActive(),
    checks,
    degraded,
    memoryMb: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    ...(DEV_RUN_TOKEN ? { devRunToken: DEV_RUN_TOKEN } : {}),
  };

  LAST_HEALTH = { at: now, data };
  return data;
}

const ADMIN_HANDLE_ENV = String(process.env.ADMIN_HANDLE || "").trim();
const DEFAULT_ADMIN_HANDLE = String(process.env.DEFAULT_ADMIN_HANDLE || "@Kristofer_Sol_").trim();
let ADMIN_HANDLE_CACHE = null;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "CHANGE_ME_ADMIN_SECRET";
// Admin password strategy:
// - Render (public) MUST set ADMIN_PASSWORD explicitly.
// - Local/dev should work out-of-the-box (so Admin tools can be tested without env setup).
// NOTE: Some local setups run with NODE_ENV=production; we still allow the fallback unless we're on Render.
const IS_RENDER = Boolean(process.env.RENDER || process.env.RENDER_GIT_COMMIT || process.env.RENDER_SERVICE_ID);
const RAW_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
const RAW_ADMIN_SECRET = String(process.env.ADMIN_SECRET || "").trim();
// In production (NODE_ENV=production) we REQUIRE explicit ADMIN_PASSWORD.
const ADMIN_PASSWORD = RAW_ADMIN_PASSWORD || (DEV_MODE
  ? ((RAW_ADMIN_SECRET && RAW_ADMIN_SECRET !== "CHANGE_ME_ADMIN_SECRET") ? RAW_ADMIN_SECRET : "admin")
  : ""
);
const ADMIN_SESSION_HOURS = Math.max(1, Math.min(168, Number(process.env.ADMIN_SESSION_HOURS || "24") || 24));

const SOL_RECEIVER =
  process.env.SOL_RECEIVER ||
  "2idG5EVab4ATDHSTXUmqEaKzrorNJEMjBhTDgcPT3Bfb";

// Solana stablecoins (mainnet) — override via env if needed.
// USDC mint is documented by Solana docs and widely used across the ecosystem.
// USDT mint is documented by Tether for Solana.
const USDC_MINT = process.env.USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = process.env.USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

const SOL_USD_FALLBACK = Number(process.env.SOL_USD_FALLBACK || "0") || 0;

const EXTENSION_STORE_URL =
  process.env.EXTENSION_STORE_URL || ""; // set after publishing to Chrome Web Store

const CONFIG = {
  // Daily free generation limit (GM and GN each). Override via env GMX_FREE_DAILY.
  FREE_DAILY_BASE: Math.max(0, Math.min(500, Number(process.env.GMX_FREE_DAILY || '70') || 70)),
  // Free saved lines cap (GM and GN each). Override via env GMX_SAVE_CAP_FREE.
  SAVE_CAP_FREE: Math.max(10, Math.min(1000, Number(process.env.GMX_SAVE_CAP_FREE || '70') || 70)),
  // Backend sentinel for unlimited (kept for backwards-compatible UI parsing).
  PRO_DAILY_SENTINEL: 999999,
  // Abuse protection (server-side; UI still shows Unlimited for Pro).
  GEN_MIN_LATENCY_MS: Math.max(0, Math.min(5000, Number(process.env.GMX_GEN_MIN_LATENCY_MS || '250') || 250)),
  GEN_COOLDOWN_MS: Math.max(0, Math.min(10000, Number(process.env.GMX_GEN_COOLDOWN_MS || '900') || 900)),
  BULK_COOLDOWN_MS: Math.max(0, Math.min(20000, Number(process.env.GMX_BULK_COOLDOWN_MS || '2000') || 2000)),
  IP_COOLDOWN_MS: Math.max(0, Math.min(10000, Number(process.env.GMX_IP_COOLDOWN_MS || '500') || 500)),
  // Extra route rate limits (per handle; in addition to global /api limiter)
  GEN_PER_MINUTE: Math.max(10, Math.min(600, Number(process.env.GMX_GEN_PER_MINUTE || '90') || 90)),
  BULK_CALLS_PER_MINUTE: Math.max(5, Math.min(120, Number(process.env.GMX_BULK_CALLS_PER_MINUTE || '30') || 30)),

  // Referral promoter bonus safety cap (free daily bonus added on top of FREE_DAILY_BASE).
  // This prevents "infinite" rewards from low-quality mass referrals.
  REF_BONUS_CAP: Math.max(0, Math.min(1000, Number(process.env.GMX_REF_BONUS_CAP || '120') || 120)),
};

// Entitlement plans used by both site and extension (no hardcoded limits in UI)
const REF_MIN_ACTIVE_DAYS = Math.max(1, Math.min(30, Number(process.env.GMX_REF_ACTIVE_MIN_DAYS || '1') || 1));
const REF_MIN_ACTIVE_USES = Math.max(1, Math.min(1000, Number(process.env.GMX_REF_ACTIVE_MIN_USES || '1') || 1));

const PLANS = {
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
    styles: 'all',
    packs: 'all',
  },
};

const ERROR_CODES = {
  INVALID_HANDLE: 'invalid_handle',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  RATE_LIMITED: 'rate_limited',
  BUSY: 'busy_try_again',
  LIMIT_REACHED: 'limit_reached',
  UPGRADE_REQUIRED: 'upgrade_required',
  SERVER_ERROR: 'server_error',
  INVALID_REQUEST: 'invalid_request',
};

function sendError(res, status, code, extra = {}) {
  return res.status(status).json({ ok: false, error_code: code, ...extra });
}


// --- Safety: never crash silently ---
process.on("unhandledRejection", (err) => {
  beginShutdown("unhandledRejection", err);
});
process.on("uncaughtException", (err) => {
  beginShutdown("uncaughtException", err);
});
process.on("SIGTERM", () => {
  writeLog("WARN", "SIGTERM_RECEIVED");
  beginShutdown("sigterm", null, { level: "WARN", exitCode: 0 });
});
process.on("SIGINT", () => {
  writeLog("WARN", "SIGINT_RECEIVED");
  beginShutdown("sigint", null, { level: "WARN", exitCode: 0 });
});

// Billing plans (base pricing in USD; SOL is quoted at intent creation time).
const BILLING_PLANS = [
  { key: "m1", label: "1 month", usd: 10, days: 30 },
  { key: "m3", label: "3 months", usd: 25, days: 90 },
  { key: "m6", label: "6 months", usd: 50, days: 180 },
  { key: "y1", label: "1 year", usd: 80, days: 365 },
];

const BILLING_TOKENS = [
  { key: "SOL", label: "SOL", kind: "native", decimals: 9 },
  { key: "USDC", label: "USDC", kind: "spl", mint: USDC_MINT, decimals: 6 },
  { key: "USDT", label: "USDT", kind: "spl", mint: USDT_MINT, decimals: 6 },
];

const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Always allow X/Twitter origins and localhost for dev.
const ALWAYS_ALLOW_ORIGINS = new Set([
  "https://x.com",
  "https://twitter.com",
  "https://mobile.twitter.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:10000",
  "http://127.0.0.1:10000",
]);

const EXTENSION_IDS = String(process.env.EXTENSION_IDS || process.env.EXTENSION_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// By default we allow chrome-extension:// origins in production.
// Set EXTENSION_ALLOW_ALL=0 and EXTENSION_IDS=<id1,id2> to lock it down.
const EXTENSION_ALLOW_ALL = String(process.env.EXTENSION_ALLOW_ALL || "1").trim() !== "0";

function isAllowedExtensionOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const id = String(u.hostname || "").trim();
    if (!id) return false;
    // Allow all extension origins by default (safer UX for local/manual installs).
    // If EXTENSION_ALLOW_ALL=0, only allow IDs listed in EXTENSION_IDS.
    if (!EXTENSION_IDS.length) return EXTENSION_ALLOW_ALL;
    return EXTENSION_IDS.includes(id);
  } catch {
    return false;
  }
}


function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser or same-origin
  if (ALWAYS_ALLOW_ORIGINS.has(origin)) return true;
  if (origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")) return isAllowedExtensionOrigin(origin);
  if (origin.startsWith("http://localhost:")) return true;
  if (origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.startsWith("https://localhost:")) return true;
  if (origin.startsWith("https://127.0.0.1:")) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

app.use(
  cors({
    origin: (origin, cb) => {
      try {
        return cb(null, isAllowedOrigin(origin));
      } catch {
        return cb(null, false);
      }
    },
    credentials: false,
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","X-Admin-Key","X-Admin-Token","X-GMX-Client","X-GMX-Ext-Version"],
  })
);
app.use(express.json({ limit: "256kb" }));

app.use((req, res, next) => {
  const incoming = String(req.headers["x-request-id"] || "").trim();
  const requestId = incoming || crypto.randomBytes(8).toString("hex");
  req.requestId = requestId;
  req.startedAtMs = Date.now();
  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () => {
    if (res.statusCode >= 500) {
      writeLog("ERROR", "HTTP_5XX", {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - req.startedAtMs,
      });
    }
  });
  next();
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    // Strict CSP: no inline scripts (we moved site JS out of HTML).
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        // Allow local React bridge (Vite) to embed /app during development.
        // Production stays locked.
        frameAncestors: DEV_MODE
          ? ["'self'", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
          : ["'none'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.mainnet-beta.solana.com",
          "https://ipfs.io",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: ["'self'", "data:"],
        upgradeInsecureRequests: [],
      },
    },
  })
);


app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Route-level burst controls (per handle) for generation endpoints.
const genBurstLimiter = rateLimit({
  windowMs: 60_000,
  max: CONFIG.GEN_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> String(req.user?.handle || clientIp(req)),
});

const bulkBurstLimiter = rateLimit({
  windowMs: 60_000,
  max: CONFIG.BULK_CALLS_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> String(req.user?.handle || clientIp(req)),
});


// Extra-hard limits for init/consume (account safety + anti-abuse)
const initLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(clientIp(req)),
});

const consumeLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.handle || clientIp(req)),
});


// ---------- DB ----------
const DB_MODE = (String(process.env.DB_MODE || "sqlite").trim().toLowerCase() === "supabase") ? "supabase" : "sqlite";
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let SUPABASE_ADMIN = null;
function getSupabaseAdmin() {
  if (DB_MODE !== "supabase") return null;
  if (SUPABASE_ADMIN) return SUPABASE_ADMIN;
  if (!SUPABASE_CONFIGURED) {
    console.warn("[supabase] DB_MODE=supabase but env missing; supabase disabled (sqlite fallback stays on)");
    return null;
  }
  SUPABASE_ADMIN = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return SUPABASE_ADMIN;
}


function supabaseActive() {
  return DB_MODE === "supabase" && SUPABASE_CONFIGURED && !!getSupabaseAdmin();
}

async function sbEnsureUser(handle) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  if (!h) return { ok: false, error: "missing_handle" };

  const r = await sb.from("users").upsert({ handle: h }, { onConflict: "handle" });
  if (r.error) throw r.error;
  return { ok: true };
}

async function sbCloudListsGet(handle) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  const r = await sb
    .from("cloud_lists")
    .select("kind, scope, lang, content, updated_at")
    .eq("handle", h)
    .order("updated_at", { ascending: false });
  if (r.error) throw r.error;
  return { ok: true, rows: r.data || [] };
}

async function sbCloudListsUpsert(handle, items) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  const now = nowIso();
  const rows = [];
  for (const it of Array.isArray(items) ? items : []) {
    const kind = String(it?.kind || "").toLowerCase();
    const scope = String(it?.scope || "").toLowerCase();
    const lang = String(it?.lang || "*").toLowerCase();
    const content = String(it?.content || "");
    if (kind !== "gm" && kind !== "gn") continue;
    if (scope !== "global" && scope !== "lang") continue;
    if (!lang) continue;
    if (content.length > 200000) continue; // hard cap
    rows.push({ handle: h, kind, scope, lang, content, updated_at: now });
  }
  if (!rows.length) return { ok: true, saved: 0, updated_at: now };
  const r = await sb.from("cloud_lists").upsert(rows, { onConflict: "handle,kind,scope,lang" });
  if (r.error) throw r.error;
  return { ok: true, saved: rows.length, updated_at: now };
}

async function sbFavoritesGet(handle, kind, limit) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  let q = sb.from("favorites").select("kind, reply, created_at").eq("handle", h);
  if (kind === "gm" || kind === "gn") q = q.eq("kind", kind);
  const r = await q.order("created_at", { ascending: false }).limit(limit);
  if (r.error) throw r.error;
  return { ok: true, rows: r.data || [] };
}

async function sbFavoritesCount(handle) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  const r = await sb.from("favorites").select("reply_hash", { count: "exact", head: true }).eq("handle", h);
  if (r.error) throw r.error;
  return { ok: true, count: r.count || 0 };
}

async function sbFavoritesHas(handle, kind, reply_hash) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  const r = await sb
    .from("favorites")
    .select("reply_hash")
    .eq("handle", h)
    .eq("kind", String(kind || "").toLowerCase())
    .eq("reply_hash", String(reply_hash || ""))
    .maybeSingle();
  if (r.error) throw r.error;
  return { ok: true, exists: Boolean(r.data) };
}

async function sbFavoritesDelete(handle, kind, reply_hash) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  const r = await sb
    .from("favorites")
    .delete()
    .eq("handle", h)
    .eq("kind", String(kind || "").toLowerCase())
    .eq("reply_hash", String(reply_hash || ""));
  if (r.error) throw r.error;
  return { ok: true };
}

async function sbFavoritesUpsert(handle, kind, reply_hash, reply) {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, error: "supabase_inactive" };
  const h = String(handle || "").trim();
  const row = {
    handle: h,
    kind: String(kind || "").toLowerCase(),
    reply_hash: String(reply_hash || ""),
    reply: String(reply || ""),
    created_at: nowIso(),
  };
  const r = await sb.from("favorites").upsert(row, { onConflict: "handle,kind,reply_hash" });
  if (r.error) throw r.error;
  return { ok: true };
}


async function sbGetDailyUsed(handle, day, kind) {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const k = String(kind || "").toLowerCase();
  const col = k === "gn" ? "gn_used" : "gm_used";

  const r = await sb
    .from("usage_daily")
    .select(col)
    .eq("handle", String(handle))
    .eq("day", String(day))
    .maybeSingle();

  if (r.error) {
    // Keep service alive; fall back to sqlite if needed
    console.warn("SB_GET_DAILY_USED_ERROR", r.error?.message || r.error);
    return 0;
  }
  return Number(r.data?.[col] ?? 0);
}

async function sbConsumeDailyAtomic(handle, day, kind, limit, by = 1, plan = "free") {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, used: 0, limit, plan, error: "supabase_inactive", _sb_error: "supabase_inactive" };

  await sbEnsureUser(handle);

  const rpc = await sb.rpc("usage_daily_consume", {
    p_handle: String(handle),
    p_day: String(day),
    p_kind: String(kind).toLowerCase(),
    p_by: Number(by) || 1,
    p_limit: Number(limit) || 0,
    p_plan: String(plan || "free"),
  });

  if (rpc.error) {
    console.warn("SB_CONSUME_RPC_ERROR", rpc.error?.message || rpc.error);
    // Try to read current usage to return a stable payload
    const used = await sbGetDailyUsed(handle, day, kind);
    return { ok: false, used, limit, plan, error: "supabase_error", _sb_error: rpc.error?.message || String(rpc.error) };
  }

  const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
  const out = {
    ok: !!row?.ok,
    used: Number(row?.used ?? 0),
    limit: Number(row?.limit ?? limit),
    plan: String(row?.plan ?? plan),
  };

  // Mirror usage into sqlite usage_daily so legacy referral logic stays correct in supabase mode
  // (without changing the externally visible quota which comes from Supabase).
  if (out.ok) {
    try { mirrorSupabaseUsageToSqlite(handle, day, kind, out.used); } catch (_e) {}
    try { await sbReferralsMarkFirstUse(handle); } catch (_e) {}
  }

  return out;
}

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");

function nowIso() {
  return new Date().toISOString();
}
function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}
function nextResetUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}
function randHex(n = 12) {
  return crypto.randomBytes(n).toString("hex");
}
function sha256(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}


// ---------- Concurrency guard (protects server during spikes) ----------
function createSemaphore(max){
  let active = 0;
  const queue = [];
  return {
    async acquire(timeoutMs=8000){
      if (active < max){ active++; return true; }
      return await new Promise((resolve)=>{
        const started = Date.now();
        const item = ()=>{
          if (active < max){ active++; return resolve(true); }
          if (Date.now() - started >= timeoutMs){ return resolve(false); }
          queue.push(item);
        };
        queue.push(item);
        // tick
        setImmediate(()=>{
          const fn = queue.shift();
          if (fn) fn();
        });
      });
    },
    release(){
      active = Math.max(0, active-1);
      // drain one
      const fn = queue.shift();
      if (fn) setImmediate(fn);
    },
    get active(){ return active; },
    get queued(){ return queue.length; }
  };
}

const GEN_SEMAPHORE = createSemaphore(Math.max(5, Math.min(200, Number(process.env.GMX_MAX_CONCURRENT_GEN || '50') || 50)));

// Atomic daily usage consume (prevents race conditions on parallel requests)
function ensureDailyRow(handle, day, kind) {
  safeDb(() => {
    db.prepare(
      "INSERT OR IGNORE INTO usage_daily(handle, day, kind, used) VALUES(?,?,?,0)"
    ).run(handle, day, kind);
  });
}
function getDailyUsed(handle, day, kind) {
  ensureDailyRow(handle, day, kind);
  return (
    safeDb(() =>
      db
        .prepare("SELECT used FROM usage_daily WHERE handle=? AND day=? AND kind=?")
        .get(handle, day, kind)
    )?.used || 0
  );
}

function consumeDailyAtomic(handle, day, kind, limit, by=1){
  ensureDailyRow(handle, day, kind);
  if (!Number.isFinite(limit) || limit >= 999999){ // unlimited sentinel
    safeDb(() =>
      db.prepare("UPDATE usage_daily SET used=used+? WHERE handle=? AND day=? AND kind=?")
        .run(by, handle, day, kind)
    );
    return { ok:true, used:getDailyUsed(handle, day, kind), limit };
  }
  // Try conditional update
  const res = safeDb(() =>
    db.prepare("UPDATE usage_daily SET used=used+? WHERE handle=? AND day=? AND kind=? AND used+? <= ?")
      .run(by, handle, day, kind, by, limit)
  );
  if (!res || res.changes === 0){
    const used = getDailyUsed(handle, day, kind);
    return { ok:false, used, limit };
  }
  const used = getDailyUsed(handle, day, kind);
  return { ok:true, used, limit };
}

// Back-compat increment (used for non-capped tool counters)
function incDaily(handle, day, kind, by = 1) {
  consumeDailyAtomic(handle, day, kind, 999999, by);
}


function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function clientIp(req){
  // Security note: do NOT trust X-Forwarded-For unless you are behind a proxy
  // that overwrites/sanitizes it. Enable via TRUST_PROXY=1.
  const ua = (req.headers['user-agent'] || '').toString(); // keep read to avoid lint warnings in older builds
  if (TRUST_PROXY){
    const xf = (req.headers['x-forwarded-for'] || '').toString();
    const ip = (xf.split(',')[0] || req.socket.remoteAddress || '').toString().trim();
    return ip || '0.0.0.0';
  }
  const ip = (req.socket.remoteAddress || '').toString().trim();
  return ip || '0.0.0.0';
}

function isLoopbackIp(ip){
  const v = String(ip || '').trim().toLowerCase();
  return v === '127.0.0.1' || v === '::1' || v === '::ffff:127.0.0.1' || v === 'localhost';
}

function canUseDevSessionReset(req){
  if (!DEV_MODE) return false;
  const bodyFlag = req.method === 'GET' ? (req.query?.devReset) : (req.body?.devReset);
  const headerFlag = req.headers['x-dev-reset'];
  const wantsReset = String(bodyFlag || headerFlag || '').trim();
  if (!(wantsReset === '1' || wantsReset.toLowerCase() === 'true')) return false;

  const ip = clientIp(req);
  if (isLoopbackIp(ip)) return true;

  const key = getAdminKey(req);
  if (key && ADMIN_SECRET && ADMIN_SECRET !== 'CHANGE_ME_ADMIN_SECRET' && safeEq(String(key), String(ADMIN_SECRET))) {
    return true;
  }
  return false;
}

function canUseDevAdminSession(req){
  if (!DEV_ADMIN_SESSION_ONLY) return false;
  return isLoopbackIp(clientIp(req));
}

// In-memory cooldowns (per instance). Still protects Render single-instance well.
const LAST_CALL_HANDLE = new Map();
const LAST_CALL_IP = new Map();

async function enforceGenGuard(req, res, kind){
  const h = String(req.user?.handle || '');
  const ip = clientIp(req);
  const now = Date.now();
  const minLat = CONFIG.GEN_MIN_LATENCY_MS;

  // Cooldowns
  const hKey = `${h}:${kind}`;
  const lastH = LAST_CALL_HANDLE.get(hKey) || 0;
  const cdH = (kind === 'bulk') ? CONFIG.BULK_COOLDOWN_MS : CONFIG.GEN_COOLDOWN_MS;
  if (cdH > 0 && now - lastH < cdH){
    const retry = cdH - (now - lastH);
    return { ok:false, status:429, body:{ ok:false, error:'slow_down', retryAfterMs: retry } };
  }
  const lastIp = LAST_CALL_IP.get(ip) || 0;
  if (CONFIG.IP_COOLDOWN_MS > 0 && now - lastIp < CONFIG.IP_COOLDOWN_MS){
    const retry = CONFIG.IP_COOLDOWN_MS - (now - lastIp);
    return { ok:false, status:429, body:{ ok:false, error:'slow_down', retryAfterMs: retry } };
  }

  // Reserve immediately (prevents parallel spam)
  LAST_CALL_HANDLE.set(hKey, now);
  LAST_CALL_IP.set(ip, now);

  // Small artificial latency to smooth bursts and avoid stampedes.
  if (minLat > 0){
    await sleep(minLat);
  }
  return { ok:true };
}

// --- Billing helpers ---
const COINGECKO_SOL_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
let SOL_USD_CACHE = { price: 0, ts: 0 };

async function getSolUsd() {
  const now = Date.now();
  if (SOL_USD_CACHE.price > 0 && now - SOL_USD_CACHE.ts < 180_000) {
    return SOL_USD_CACHE.price;
  }
  try {
    const r = await fetch(COINGECKO_SOL_URL, { method: "GET" });
    const j = await r.json();
    const p = Number(j?.solana?.usd || 0);
    if (Number.isFinite(p) && p > 0) {
      SOL_USD_CACHE = { price: p, ts: now };
      return p;
    }
  } catch (_e) {}
  if (SOL_USD_CACHE.price > 0) return SOL_USD_CACHE.price;
  return SOL_USD_FALLBACK > 0 ? SOL_USD_FALLBACK : 0;
}

function toBaseUnits(amount, decimals) {
  // amount is a number in UI units, decimals integer.
  const d = BigInt(Math.max(0, Math.min(18, Number(decimals || 0))));
  const factor = 10n ** d;
  // Avoid floating rounding surprises: stringify with max 9 decimals then parse.
  const s = String(amount);
  const [a, b = ""] = s.split(".");
  const frac = (b + "0".repeat(Number(d))).slice(0, Number(d));
  const whole = BigInt(a || "0");
  const fracN = BigInt(frac || "0");
  return whole * factor + fracN;
}

function uiFromBaseUnits(baseStr, decimals) {
  const base = BigInt(String(baseStr || "0"));
  const d = BigInt(Math.max(0, Math.min(18, Number(decimals || 0))));
  const factor = 10n ** d;
  const whole = base / factor;
  const frac = base % factor;
  if (d === 0n) return String(whole);
  const fracStr = frac.toString().padStart(Number(d), "0").replace(/0+$/, "");
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

function isSolanaPubkey(s) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(s || "").trim());
}

function quoteSolLamportsFromUsd(usd, solUsd) {
  const u = Number(usd || 0);
  const p = Number(solUsd || 0);
  if (!Number.isFinite(u) || u <= 0) return 0n;
  if (!Number.isFinite(p) || p <= 0) return 0n;
  // Use integer math (microusd) to avoid floating rounding.
  const usdMicros = BigInt(Math.round(u * 1e6));
  const priceMicros = BigInt(Math.round(p * 1e6));
  const num = usdMicros * 1_000_000_000n;
  const lamports = (num + priceMicros - 1n) / priceMicros; // ceil
  return lamports;
}
function validHandle(h) {
  return /^@[A-Za-z0-9_]{1,15}$/.test(h);
}
function normalizeHandle(h) {
  let t = String(h || "").trim();
  t = t.replace(/^https?:\/\/(www\.)?x\.com\//i, "");
  t = t.replace(/^https?:\/\/(www\.)?twitter\.com\//i, "");
  t = t.replace(/^@+/, "");
  t = t.replace(/[^A-Za-z0-9_]/g, "");
  t = t.slice(0, 15);
  return t ? "@" + t : "";
}
function getSetting(key){
  try{
    const row = safeDb(() => db.prepare("SELECT value FROM settings WHERE key=?").get(String(key)));
    return (row && row.value != null) ? String(row.value) : null;
  }catch(_e){
    return null;
  }
}
function setSetting(key, value){
  safeDb(() => db.prepare(
    "INSERT OR REPLACE INTO settings(key, value, updated_at) VALUES(?,?,?)"
  ).run(String(key), (value == null ? null : String(value)), nowIso()));
  if (String(key) === "admin_handle") ADMIN_HANDLE_CACHE = (value == null ? "" : String(value));
}
function getAdminHandle(){
  if (ADMIN_HANDLE_CACHE !== null) return ADMIN_HANDLE_CACHE;

  const fromDb = getSetting("admin_handle");
  if (fromDb && validHandle(fromDb)) {
    ADMIN_HANDLE_CACHE = fromDb;
    return ADMIN_HANDLE_CACHE;
  }

  if (ADMIN_HANDLE_ENV && validHandle(ADMIN_HANDLE_ENV)) {
    ADMIN_HANDLE_CACHE = ADMIN_HANDLE_ENV;
    // persist env bootstrap once so we are stable across restarts
    try{
      const cur = getSetting("admin_handle");
      if (!cur) setSetting("admin_handle", ADMIN_HANDLE_ENV);
    }catch(_e){}
    return ADMIN_HANDLE_CACHE;
  }

  // Fallback for this project: show Admin tab for the configured default handle,
  // but admin API still requires X-Admin-Key so this is not enough to "break in".
  if (DEFAULT_ADMIN_HANDLE && validHandle(DEFAULT_ADMIN_HANDLE)) {
    ADMIN_HANDLE_CACHE = DEFAULT_ADMIN_HANDLE;
    try{
      const cur = getSetting("admin_handle");
      if (!cur) setSetting("admin_handle", DEFAULT_ADMIN_HANDLE);
    }catch(_e){}
    return ADMIN_HANDLE_CACHE;
  }

  ADMIN_HANDLE_CACHE = "";
  return ADMIN_HANDLE_CACHE;
}
function isAdminHandle(h) {
  const ah = getAdminHandle();
  return !!ah && String(h || "").toLowerCase() === String(ah).toLowerCase();
}
function originFromReq(req) {
  const proto =
    (req.headers["x-forwarded-proto"] || "").toString().split(",")[0].trim() ||
    (req.secure ? "https" : "http");
  const host =
    (req.headers["x-forwarded-host"] || req.headers.host || "")
      .toString()
      .split(",")[0]
      .trim() || "localhost";
  return `${proto}://${host}`;
}
function parseAntiLastN(req, def = 20) {
  let n = Number(req?.query?.anti_last_n ?? def);
  if (!Number.isFinite(n)) n = def;
  n = Math.floor(n);
  if (n <= 0) return 0;
  // Anti-repeat window must be >= 20 when enabled.
  n = Math.max(20, n);
  return Math.max(20, Math.min(60, n));
}



function ensureSchema() {
  // Pre-migrate leaderboard_awards for legacy SQLite files before any schema exec.
  // Some older builds attempted to create indexes referencing period_days during db.exec;
  // if the existing table lacks that column, SQLite throws SQLITE_ERROR and the server fails to start.
  try {
    const has = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='leaderboard_awards'").get();
    if (has) {
      const cols = (db.prepare("PRAGMA table_info(leaderboard_awards)").all() || []).map((r) => String(r.name));
      const addCol = (name, sql) => {
        if (!cols.includes(name)) {
          try { db.prepare(sql).run(); } catch (_e) {}
        }
      };
      addCol('period_days', "ALTER TABLE leaderboard_awards ADD COLUMN period_days INTEGER NOT NULL DEFAULT 7");
      addCol('cycle_key', "ALTER TABLE leaderboard_awards ADD COLUMN cycle_key TEXT NOT NULL DEFAULT ''");
      addCol('place', "ALTER TABLE leaderboard_awards ADD COLUMN place INTEGER NOT NULL DEFAULT 0");
      addCol('handle', "ALTER TABLE leaderboard_awards ADD COLUMN handle TEXT NOT NULL DEFAULT ''");
      addCol('award_days', "ALTER TABLE leaderboard_awards ADD COLUMN award_days INTEGER NOT NULL DEFAULT 0");
      addCol('code', "ALTER TABLE leaderboard_awards ADD COLUMN code TEXT NOT NULL DEFAULT ''");
      addCol('created_at', "ALTER TABLE leaderboard_awards ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
    }
  } catch (_e) {}


  // Pre-migrate referral_invites for older SQLite files (anti-fraud columns).
  try {
    const has = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='referral_invites'").get();
    if (has) {
      const cols = (db.prepare("PRAGMA table_info(referral_invites)").all() || []).map((r) => String(r.name));
      const addCol = (name, sql) => {
        if (!cols.includes(name)) {
          try { db.prepare(sql).run(); } catch (_e) {}
        }
      };
      addCol('fingerprint', "ALTER TABLE referral_invites ADD COLUMN fingerprint TEXT");
      addCol('ip_hash', "ALTER TABLE referral_invites ADD COLUMN ip_hash TEXT");
      addCol('ua_hash', "ALTER TABLE referral_invites ADD COLUMN ua_hash TEXT");
      addCol('fraud_flag', "ALTER TABLE referral_invites ADD COLUMN fraud_flag INTEGER DEFAULT 0");
      addCol('fraud_reason', "ALTER TABLE referral_invites ADD COLUMN fraud_reason TEXT");
    }
  } catch (_e) {}
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      handle TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      access_token TEXT NOT NULL,
      ref_code TEXT,
      tier TEXT DEFAULT 'free',
      paid_until TEXT,
      daily_bonus INTEGER DEFAULT 0
    );

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL
);


    CREATE TABLE IF NOT EXISTS usage_daily (
      handle TEXT NOT NULL,
      day TEXT NOT NULL,
      kind TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      PRIMARY KEY(handle, day, kind)
    );

    CREATE TABLE IF NOT EXISTS recent_replies (
      handle TEXT NOT NULL,
      kind TEXT NOT NULL,
      reply TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recent_reply_shapes (
      kind TEXT NOT NULL,
      mode TEXT NOT NULL,
      family TEXT NOT NULL,
      reply_hash TEXT NOT NULL,
      shape TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS referrals (
      owner_handle TEXT NOT NULL,
      code TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(code, fingerprint)
    );

    CREATE TABLE IF NOT EXISTS ref_clicks (
      code TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(code, fingerprint)
    );


    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      handle TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_exp ON admin_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS admin_codes (
      code TEXT PRIMARY KEY,
      note TEXT,
      tier TEXT NOT NULL,
      days INTEGER DEFAULT 0,
      grant_type TEXT DEFAULT 'subscription',
      grant_value INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS code_redemptions (
      code TEXT PRIMARY KEY,
      handle TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Automatic leaderboard prizes ledger (idempotency + history)
    CREATE TABLE IF NOT EXISTS leaderboard_awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_days INTEGER NOT NULL,
      cycle_key TEXT NOT NULL,
      place INTEGER NOT NULL,
      handle TEXT NOT NULL,
      award_days INTEGER NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT NOT NULL,
      grant_type TEXT NOT NULL,
      grant_value INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      admin_handle TEXT,
      created_at TEXT NOT NULL
    );


    CREATE TABLE IF NOT EXISTS payments (
      sig TEXT PRIMARY KEY,
      handle TEXT NOT NULL,
      plan TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SOL',
      mint TEXT,
      amount REAL NOT NULL,
      amount_base TEXT,
      payer TEXT,
      created_at TEXT NOT NULL
    );

    -- Short-lived server-side quotes to lock the exact amount (SOL is priced at intent creation time).
    CREATE TABLE IF NOT EXISTS billing_intents (
      id TEXT PRIMARY KEY,
      handle TEXT NOT NULL,
      plan TEXT NOT NULL,
      currency TEXT NOT NULL,
      mint TEXT,
      amount_base TEXT NOT NULL,
      sol_usd REAL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_sig TEXT,
      nonce TEXT,
      nonce_sig TEXT,
      status TEXT NOT NULL DEFAULT 'created',
      payer TEXT,
      confirmed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_billing_intents_handle_time ON billing_intents(handle, created_at);


    -- Activity log for UX trust + debugging (no sensitive content)
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT NOT NULL,
      event_type TEXT NOT NULL,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_log_handle_time ON activity_log(handle, created_at);

    -- Referral ledger (handle-based, fraud-resistant compared to fingerprint-only)
    CREATE TABLE IF NOT EXISTS referral_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_handle TEXT NOT NULL,
      invited_handle TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL,
      confirmed_at TEXT,
      fingerprint TEXT,
      ip_hash TEXT,
      ua_hash TEXT,
      fraud_flag INTEGER DEFAULT 0,
      fraud_reason TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_invites_pair ON referral_invites(inviter_handle, invited_handle);
    CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_invites_invited ON referral_invites(invited_handle);
    CREATE INDEX IF NOT EXISTS idx_referral_invites_inviter ON referral_invites(inviter_handle, status);

    CREATE TABLE IF NOT EXISTS referral_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      amount INTEGER DEFAULT 0,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_referral_rewards_handle_time ON referral_rewards(handle, created_at);

    
        CREATE TABLE IF NOT EXISTS ext_selectors (
      id INTEGER PRIMARY KEY CHECK (id=1),
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Canary rollout + history for extension selectors hotfixes
    CREATE TABLE IF NOT EXISTS ext_selectors_meta (
      id INTEGER PRIMARY KEY CHECK (id=1),
      rollout_percent INTEGER NOT NULL DEFAULT 100,
      rollout_salt TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ext_selectors_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      selectors_json TEXT,
      version INTEGER,
      rollout_percent INTEGER,
      rollout_salt TEXT
    );

    -- Extension health events (no tweet text / no reply text stored)
    CREATE TABLE IF NOT EXISTS ext_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      client_hash TEXT NOT NULL,
      ext_version TEXT,
      event_type TEXT NOT NULL,
      ok INTEGER NOT NULL,
      error_code TEXT,
      meta_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_ext_events_time ON ext_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_ext_events_type ON ext_events(event_type, created_at);

    -- FAQ content controlled from Admin
    CREATE TABLE IF NOT EXISTS ext_faq (
      id INTEGER PRIMARY KEY CHECK (id=1),
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS favorites (
      handle TEXT NOT NULL,
      kind TEXT NOT NULL,
      reply_hash TEXT NOT NULL,
      reply TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(handle, kind, reply_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_favorites ON favorites(handle, kind, created_at);


    CREATE TABLE IF NOT EXISTS cloud_lists (
      handle TEXT NOT NULL,
      kind TEXT NOT NULL,
      scope TEXT NOT NULL,
      lang TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(handle, kind, scope, lang)
    );

    CREATE INDEX IF NOT EXISTS idx_cloud_lists ON cloud_lists(handle, kind, updated_at);

CREATE INDEX IF NOT EXISTS idx_recent_replies ON recent_replies(handle, kind, created_at);
    CREATE INDEX IF NOT EXISTS idx_recent_reply_shapes_lookup ON recent_reply_shapes(kind, mode, family, created_at);
    CREATE INDEX IF NOT EXISTS idx_usage_daily ON usage_daily(day, kind);
  `);

  // Schema migrations (idempotent; safe for existing SQLite files)
  const alters = [
    "ALTER TABLE referral_invites ADD COLUMN fingerprint TEXT",
    "ALTER TABLE referral_invites ADD COLUMN ip_hash TEXT",
    "ALTER TABLE referral_invites ADD COLUMN ua_hash TEXT",
    "ALTER TABLE referral_invites ADD COLUMN fraud_flag INTEGER DEFAULT 0",
    "ALTER TABLE referral_invites ADD COLUMN fraud_reason TEXT",
  ];
  for (const sql of alters) {
    try { db.prepare(sql).run(); } catch (_e) {}
  }
  try { db.prepare("CREATE INDEX IF NOT EXISTS idx_referral_invites_fp ON referral_invites(inviter_handle, fingerprint)").run(); } catch (_e) {}
  try { db.prepare("CREATE INDEX IF NOT EXISTS idx_referral_invites_ip_time ON referral_invites(inviter_handle, ip_hash, created_at)").run(); } catch (_e) {}

  // Additional schema migrations for newer referral / admin grant flows.
  safeDb(() => {
    const codeCols = (db.prepare("PRAGMA table_info(admin_codes)").all() || []).map((r) => String(r.name));
    const addCodeCol = (name, sql) => {
      if (!codeCols.includes(name)) {
        try { db.prepare(sql).run(); } catch (_e) {}
      }
    };
    addCodeCol('grant_type', "ALTER TABLE admin_codes ADD COLUMN grant_type TEXT DEFAULT 'subscription'");
    addCodeCol('grant_value', "ALTER TABLE admin_codes ADD COLUMN grant_value INTEGER DEFAULT 0");
  });
  safeDb(() => {
    const rewardCols = (db.prepare("PRAGMA table_info(referral_rewards)").all() || []).map((r) => String(r.name));
    const addRewardCol = (name, sql) => {
      if (!rewardCols.includes(name)) {
        try { db.prepare(sql).run(); } catch (_e) {}
      }
    };
    addRewardCol('code', "ALTER TABLE referral_rewards ADD COLUMN code TEXT");
    addRewardCol('source', "ALTER TABLE referral_rewards ADD COLUMN source TEXT DEFAULT 'system'");
  });
  try { db.prepare("CREATE INDEX IF NOT EXISTS idx_referral_rewards_lookup ON referral_rewards(handle, reward_type, code)").run(); } catch (_e) {}

  // Ensure leaderboard_awards columns exist before creating indexes (older DBs may have legacy schema)
  safeDb(() => {
    const cols = (db.prepare("PRAGMA table_info(leaderboard_awards)").all() || []).map((r) => String(r.name));
    const addCol = (name, sql) => {
      if (!cols.includes(name)) {
        try { db.prepare(sql).run(); } catch (_e) {}
      }
    };
    addCol("period_days", "ALTER TABLE leaderboard_awards ADD COLUMN period_days INTEGER NOT NULL DEFAULT 7");
    addCol("cycle_key", "ALTER TABLE leaderboard_awards ADD COLUMN cycle_key TEXT NOT NULL DEFAULT ''");
    addCol("place", "ALTER TABLE leaderboard_awards ADD COLUMN place INTEGER NOT NULL DEFAULT 0");
    addCol("handle", "ALTER TABLE leaderboard_awards ADD COLUMN handle TEXT NOT NULL DEFAULT ''");
    addCol("award_days", "ALTER TABLE leaderboard_awards ADD COLUMN award_days INTEGER NOT NULL DEFAULT 0");
    addCol("code", "ALTER TABLE leaderboard_awards ADD COLUMN code TEXT NOT NULL DEFAULT ''");
    addCol("created_at", "ALTER TABLE leaderboard_awards ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
    try { db.prepare("UPDATE leaderboard_awards SET created_at=? WHERE created_at IS NULL OR created_at=''").run(nowIso()); } catch (_e) {}
  });
  try { db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_leaderboard_awards_cycle_place ON leaderboard_awards(period_days, cycle_key, place)").run(); } catch (_e) {}
  try { db.prepare("CREATE INDEX IF NOT EXISTS idx_leaderboard_awards_time ON leaderboard_awards(created_at)").run(); } catch (_e) {}

  safeDb(() => {
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS admin_grants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          handle TEXT NOT NULL,
          grant_type TEXT NOT NULL,
          grant_value INTEGER NOT NULL DEFAULT 0,
          note TEXT,
          admin_handle TEXT,
          created_at TEXT NOT NULL
        )
      `).run();
    } catch (_e) {}
    const cols = (db.prepare("PRAGMA table_info(admin_grants)").all() || []).map((r) => String(r.name));
    const addCol = (name, sql) => {
      if (!cols.includes(name)) {
        try { db.prepare(sql).run(); } catch (_e) {}
      }
    };
    addCol("handle", "ALTER TABLE admin_grants ADD COLUMN handle TEXT NOT NULL DEFAULT ''");
    addCol("grant_type", "ALTER TABLE admin_grants ADD COLUMN grant_type TEXT NOT NULL DEFAULT 'subscription'");
    addCol("grant_value", "ALTER TABLE admin_grants ADD COLUMN grant_value INTEGER NOT NULL DEFAULT 0");
    addCol("note", "ALTER TABLE admin_grants ADD COLUMN note TEXT");
    addCol("admin_handle", "ALTER TABLE admin_grants ADD COLUMN admin_handle TEXT");
    addCol("created_at", "ALTER TABLE admin_grants ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
    try { db.prepare("UPDATE admin_grants SET created_at=? WHERE created_at IS NULL OR created_at=''").run(nowIso()); } catch (_e) {}
  });
  try { db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_grants_time ON admin_grants(created_at)").run(); } catch (_e) {}
  try { db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_grants_handle_time ON admin_grants(handle, created_at)").run(); } catch (_e) {}


  // Seed singleton rows (id=1) for meta/faq.
  safeDb(() => {
    const salt = randHex(8);
    db.prepare(
      "INSERT OR IGNORE INTO ext_selectors_meta(id, rollout_percent, rollout_salt, updated_at) VALUES(1, 100, ?, ?)"
    ).run(salt, nowIso());
    db.prepare(
      "INSERT OR IGNORE INTO ext_faq(id, json, updated_at) VALUES(1, ?, ?)"
    ).run(JSON.stringify({ version: 1, items: [] }), nowIso());
  });

  // Light migrations for older DBs (avoid breaking existing installs).
  safeDb(() => {
    const cols = (db.prepare("PRAGMA table_info(payments)").all() || []).map((r) => String(r.name));
    if (!cols.includes("currency")) {
      db.prepare("ALTER TABLE payments ADD COLUMN currency TEXT NOT NULL DEFAULT 'SOL'").run();
    }
    if (!cols.includes("mint")) {
      db.prepare("ALTER TABLE payments ADD COLUMN mint TEXT").run();
    }
    if (!cols.includes("amount_base")) {
      db.prepare("ALTER TABLE payments ADD COLUMN amount_base TEXT").run();
    }
    if (!cols.includes("payer")) {
      db.prepare("ALTER TABLE payments ADD COLUMN payer TEXT").run();
    }
  });


  safeDb(() => {
    const cols = (db.prepare("PRAGMA table_info(users)").all() || []).map((r) => String(r.name));
    const addCol = (name, sql) => {
      if (!cols.includes(name)) {
        try { db.prepare(sql).run(); } catch {}
      }
    };
// Base columns for older DBs (pre v31)
addCol("created_at", "ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
addCol("last_seen", "ALTER TABLE users ADD COLUMN last_seen TEXT NOT NULL DEFAULT ''");
addCol("access_token", "ALTER TABLE users ADD COLUMN access_token TEXT NOT NULL DEFAULT ''");
addCol("ref_code", "ALTER TABLE users ADD COLUMN ref_code TEXT");
addCol("tier", "ALTER TABLE users ADD COLUMN tier TEXT NOT NULL DEFAULT 'free'");
addCol("paid_until", "ALTER TABLE users ADD COLUMN paid_until TEXT");
addCol("daily_bonus", "ALTER TABLE users ADD COLUMN daily_bonus INTEGER NOT NULL DEFAULT 0");

// Backfill empty values
try { db.prepare("UPDATE users SET created_at=? WHERE created_at IS NULL OR created_at=''").run(nowIso()); } catch {}
try { db.prepare("UPDATE users SET last_seen=? WHERE last_seen IS NULL OR last_seen=''").run(nowIso()); } catch {}
try {
  const rows = db.prepare("SELECT handle, access_token FROM users").all() || [];
  for (const r of rows){
    const h = String(r.handle||"").trim();
    if (!h) continue;
    const tok = String(r.access_token||"").trim();
    if (!tok){
      db.prepare("UPDATE users SET access_token=? WHERE handle=?").run(randHex(20), h);
    }
  }
} catch {}
try {
  const rows = db.prepare("SELECT handle, ref_code FROM users").all() || [];
  for (const r of rows){
    const h = String(r.handle||"").trim();
    if (!h) continue;
    const cur = String(r.ref_code||"").trim();
    if (cur) continue;
    let code = randHex(6);
    for (let i = 0; i < 12; i++) {
      const taken = db.prepare("SELECT 1 FROM users WHERE ref_code=?").get(code);
      if (!taken) break;
      code = randHex(6);
    }
    db.prepare("UPDATE users SET ref_code=? WHERE handle=?").run(code, h);
  }
} catch {}

    // Subscription state machine (future-proofing)
    addCol("sub_status", "ALTER TABLE users ADD COLUMN sub_status TEXT NOT NULL DEFAULT 'free'");
    addCol("grace_until", "ALTER TABLE users ADD COLUMN grace_until TEXT");
    addCol("blocked_reason", "ALTER TABLE users ADD COLUMN blocked_reason TEXT");
    addCol("sub_updated_at", "ALTER TABLE users ADD COLUMN sub_updated_at TEXT");
  });

  safeDb(() => {
    const cols = (db.prepare("PRAGMA table_info(billing_intents)").all() || []).map((r) => String(r.name));
    const addCol = (name, sql) => {
      if (!cols.includes(name)) {
        try { db.prepare(sql).run(); } catch {}
      }
    };
    // Payment intent lifecycle
    addCol("nonce", "ALTER TABLE billing_intents ADD COLUMN nonce TEXT");
    addCol("nonce_sig", "ALTER TABLE billing_intents ADD COLUMN nonce_sig TEXT");
    addCol("status", "ALTER TABLE billing_intents ADD COLUMN status TEXT NOT NULL DEFAULT 'created'");
    addCol("payer", "ALTER TABLE billing_intents ADD COLUMN payer TEXT");
    addCol("confirmed_at", "ALTER TABLE billing_intents ADD COLUMN confirmed_at TEXT");
  });
}
ensureSchema();

function sleepSync(ms){
  const t = Math.max(0, Math.floor(Number(ms) || 0));
  if (t <= 0) return;
  try{
    const ia = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(ia, 0, 0, t);
  }catch{
    const end = Date.now() + t;
    while (Date.now() < end) {}
  }
}

function safeDb(fn) {
  // SQLite can occasionally throw SQLITE_BUSY / "database is locked" during dev (parallel requests, AV, etc).
  // Retry a few times with a tiny backoff to avoid random 500s.
  for (let attempt = 0; attempt < 4; attempt++){
    try{
      return fn();
    }catch(e){
      const msg = String(e?.message || e);

      // Auto-heal schema drift (older DB files).
      if (/no such table|no such column|has no column|no column named/i.test(msg)){
        try{ ensureSchema(); }catch{}
        continue;
      }

      // Soft-retry busy/locked errors.
      if (/SQLITE_BUSY|database is locked|database locked|busy timeout/i.test(msg)){
        sleepSync(30 * (attempt + 1));
        continue;
      }

      throw e;
    }
  }

  // Final attempt (let it throw if it still fails).
  return fn();
}

function isOptionalHistoryDbError(error) {
  const msg = String(error?.message || error || "");
  return /SQLITE_CORRUPT|database disk image is malformed|malformed/i.test(msg);
}

function safeOptionalHistoryDb(fn, fallback, tag = "history") {
  try {
    const value = safeDb(fn);
    return value == null ? fallback : value;
  } catch (error) {
    if (isOptionalHistoryDbError(error)) {
      try {
        console.warn("OPTIONAL_HISTORY_DB_DEGRADED", {
          tag,
          error: String(error?.message || error || "db_error"),
        });
      } catch {}
      return fallback;
    }
    throw error;
  }
}


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


// ---------- AUTH ----------
const AUTH_COOKIE_NAME = (() => {
  const v = String(process.env.AUTH_COOKIE_NAME || "").trim();
  return v || "gmx_token";
})();

const AUTH_COOKIE_MAX_AGE_SEC = (() => {
  const raw = Number(process.env.AUTH_COOKIE_MAX_AGE_SEC || "");
  const def = 60 * 60 * 24 * 180; // 180 days
  const v = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : def;
  return Math.max(60, Math.min(60 * 60 * 24 * 365, v));
})();

function parseCookieHeader(cookieHeader) {
  const out = {};
  const h = String(cookieHeader || "").trim();
  if (!h) return out;
  const parts = h.split(";");
  for (const part of parts) {
    const s = part.trim();
    if (!s) continue;
    const eq = s.indexOf("=");
    if (eq <= 0) continue;
    const k = s.slice(0, eq).trim();
    let v = s.slice(eq + 1).trim();
    if (!k) continue;
    try { v = decodeURIComponent(v); } catch {}
    out[k] = v;
  }
  return out;
}

function getAuthToken(req) {
  // 1) Authorization: Bearer <token>
  const h = req.headers.authorization || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  if (m && m[1]) return String(m[1]).trim();

  // 2) Back-compat / alt headers
  const x =
    req.headers["x-gmx-token"] ||
    req.headers["x-session-token"] ||
    req.headers["x-access-token"] ||
    req.headers["x-token"] ||
    req.headers["X-GMX-TOKEN"] ||
    req.headers["X-SESSION-TOKEN"] ||
    req.headers["X-ACCESS-TOKEN"] ||
    req.headers["X-TOKEN"];
  if (x) return String(x).trim();

  // 3) Cookie
  const cookies = parseCookieHeader(req.headers.cookie || "");
  const candidates = [
    AUTH_COOKIE_NAME,
    "gmx_token",
    "gmx_session",
    "gmxToken",
    "gmxSession",
    "access_token",
    "token",
  ];
  for (const name of candidates) {
    const v = cookies[name];
    if (v) return String(v).trim();
  }

  return "";
}

function setAuthCookie(req, res, token) {
  const t = String(token || "").trim();
  if (!t) return;

  const xfProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  const isSecure = !!(req.secure || xfProto === "https");

  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(t)}`,
    "Path=/",
    `Max-Age=${AUTH_COOKIE_MAX_AGE_SEC}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isSecure) parts.push("Secure");

  const cookieStr = parts.join("; ");

  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", cookieStr);
  } else if (Array.isArray(prev)) {
    res.setHeader("Set-Cookie", [...prev, cookieStr]);
  } else {
    res.setHeader("Set-Cookie", [String(prev), cookieStr]);
  }
}

// Back-compat name used across the codebase
function getBearer(req) {
  return getAuthToken(req);
}

function userByHandle(handle) {
  return safeDb(() =>
    db
      .prepare(
        "SELECT handle, access_token, tier, paid_until, ref_code, daily_bonus, last_seen FROM users WHERE handle=?"
      )
      .get(handle)
  );
}

function userByToken(token) {
  if (!token) return null;
  return safeDb(() =>
    db
      .prepare(
        "SELECT handle, access_token, tier, paid_until, ref_code, daily_bonus, last_seen FROM users WHERE access_token=?"
      )
      .get(token)
  );
}

function requireAuth(req, res, next) {
  try {
    const token = getBearer(req);
    if (!token) return res.status(401).json({ ok: false, error: "unauthorized" });

    // Prefer token-based auth (more robust for clients).
    // If handle is provided, it must match the token owner.
    const tokenUser = userByToken(token);
    if (!tokenUser) return res.status(401).json({ ok: false, error: "unauthorized" });

    const handleParam = normalizeHandle(req.query.handle || req.body?.handle);
    const handle = handleParam && validHandle(handleParam) ? handleParam : tokenUser.handle;
    if (!validHandle(handle)) {
      return res.status(400).json({ ok: false, error: "invalid_handle" });
    }
    if (String(handle).toLowerCase() !== String(tokenUser.handle).toLowerCase()) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    safeDb(() =>
      db.prepare("UPDATE users SET last_seen=? WHERE handle=?").run(nowIso(), handle)
    );

    req.user = tokenUser;
    req.user.handle = handle;
    next();
  } catch (e) {
    console.error("AUTH_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
}

// Optional auth: attaches req.user when a valid token is present.
// Never responds with 401; callers can treat unauthenticated as "free".
function maybeAuth(req, _res, next){
  try{
    const token = getBearer(req);
    if (!token){ req.user = null; return next(); }
    const tokenUser = userByToken(token);
    if (!tokenUser){ req.user = null; return next(); }

    const handleParam = normalizeHandle(req.query.handle || req.body?.handle);
    const handle = handleParam && validHandle(handleParam) ? handleParam : tokenUser.handle;
    if (!validHandle(handle)) { req.user = null; return next(); }
    if (String(handle).toLowerCase() !== String(tokenUser.handle).toLowerCase()){
      req.user = null; return next();
    }

    safeDb(() => db.prepare("UPDATE users SET last_seen=? WHERE handle=?").run(nowIso(), handle));
    req.user = tokenUser;
    req.user.handle = handle;
    return next();
  }catch(e){
    console.error("MAYBE_AUTH_ERROR", e);
    req.user = null;
    return next();
  }
}

function ensureUser(handle) {
  safeDb(() => {
    const row = db
      .prepare("SELECT handle FROM users WHERE handle=?")
      .get(handle);

    if (row) {
      db.prepare("UPDATE users SET last_seen=? WHERE handle=?").run(nowIso(), handle);
      return;
    }

    // Auto-bootstrap admin on first user (out-of-the-box local deploy)
    const usersCount = db.prepare("SELECT COUNT(*) AS c FROM users").get()?.c || 0;
    const adminRow = db.prepare("SELECT value FROM settings WHERE key=\'admin_handle\'").get();
    const adminNow = adminRow?.value ? String(adminRow.value) : "";

    let code = randHex(6);
    for (let i = 0; i < 12; i++) {
      const taken = db.prepare("SELECT 1 FROM users WHERE ref_code=?").get(code);
      if (!taken) break;
      code = randHex(6);
    }

    const token = randHex(20);
    db.prepare(
      `INSERT INTO users(handle, created_at, last_seen, access_token, ref_code, tier, paid_until, daily_bonus)
       VALUES(?,?,?,?,?,'free',NULL,0)`
    ).run(handle, nowIso(), nowIso(), token, code);

    // Claim admin automatically for the very first user if none is configured.
    if (usersCount === 0 && !adminNow){
      const targetAdmin = (ADMIN_HANDLE_ENV && validHandle(ADMIN_HANDLE_ENV)) ? ADMIN_HANDLE_ENV : handle;
      db.prepare("INSERT OR REPLACE INTO settings(key, value, updated_at) VALUES('admin_handle', ?, ?)")
        .run(targetAdmin, nowIso());
      ADMIN_HANDLE_CACHE = targetAdmin;
    }
  });
}

function rotateToken(handle) {
  const token = randHex(20);
  safeDb(() =>
    db
      .prepare("UPDATE users SET access_token=?, last_seen=? WHERE handle=?")
      .run(token, nowIso(), handle)
  );
  return token;
}

function referralFingerprint(req) {
  const deviceId = String(req.headers["x-gmx-device-id"] || req.headers["X-GMX-Device-Id"] || "").trim();
  if (deviceId) return sha256("device|" + deviceId).slice(0, 24);
  const ip = clientIp(req);
  const ua = (req.headers["user-agent"] || "").toString();
  return sha256(ip + "|" + ua).slice(0, 24);
}

function bonusPer20ForCount(cnt){
  // Promoters (50+ eligible/confirmed referrals) get a slightly higher bonus step.
  return (Number(cnt||0) >= 50) ? 12 : 10;
}

function nextBonusAtForChunks(chunks, reachedCap = false){
  if (reachedCap) return null;
  const c = Math.max(0, Number(chunks || 0) || 0);
  return (c + 1) * 20;
}

async function getReferralPromoterSummary(ownerHandle, opts = {}) {
  const handle = String(ownerHandle || '').trim();
  const userRow = opts && typeof opts === 'object' ? opts.userRow : null;
  const explicitClicks = Object.prototype.hasOwnProperty.call(opts || {}, 'clicks') ? Number(opts.clicks || 0) || 0 : null;
  const refCode = String((opts && opts.refCode) || userRow?.ref_code || userByHandle(handle)?.ref_code || '').trim();
  if (!handle) {
    return {
      confirmedRefs: 0,
      activeRefs: 0,
      strictEligibleRefs: 0,
      eligibleRefs: 0,
      legacyReferrals: 0,
      clicks: explicitClicks ?? 0,
      bonusPer20: bonusPer20ForCount(0),
      bonusChunks: 0,
      rawDailyBonus: 0,
      dailyBonus: 0,
      dailyLimit: CONFIG.FREE_DAILY_BASE,
      nextBonusAt: 20,
      promoter: false,
      capReached: false,
      tierBasis: 0,
    };
  }

  let legacyReferrals = Object.prototype.hasOwnProperty.call(opts || {}, 'legacyReferrals') ? Number(opts.legacyReferrals || 0) || 0 : null;
  let confirmedRefs = Object.prototype.hasOwnProperty.call(opts || {}, 'confirmedRefs') ? Number(opts.confirmedRefs || 0) || 0 : null;
  let activeRefs = Object.prototype.hasOwnProperty.call(opts || {}, 'activeRefs') ? Number(opts.activeRefs || 0) || 0 : null;
  let clicks = explicitClicks;

  if (legacyReferrals === null || confirmedRefs === null || activeRefs === null || clicks === null) {
    if (supabaseActive()) {
      if (legacyReferrals === null) {
        try { legacyReferrals = (await sbReferralsCount(handle, 'legacy')).count || 0; } catch { legacyReferrals = 0; }
      }
      if (confirmedRefs === null) {
        try { confirmedRefs = (await sbReferralsCount(handle, 'confirmed')).count || 0; } catch { confirmedRefs = 0; }
      }
      if (activeRefs === null) {
        try { activeRefs = (await sbReferralsCount(handle, 'active')).count || 0; } catch { activeRefs = 0; }
      }
      if (clicks === null) {
        if (refCode) {
          try { clicks = (await sbRefClicksCount(refCode)).count || 0; } catch { clicks = 0; }
        } else {
          clicks = 0;
        }
      }
    } else {
      if (legacyReferrals === null) {
        legacyReferrals = refCode
          ? (safeDb(() => db.prepare('SELECT COUNT(*) AS c FROM referrals WHERE code=?').get(refCode)?.c || 0) || 0)
          : 0;
      }
      if (confirmedRefs === null) confirmedRefs = referralCountConfirmed(handle);
      if (activeRefs === null) activeRefs = referralCountActive(handle);
      if (clicks === null) {
        clicks = refCode
          ? (safeDb(() => db.prepare('SELECT COUNT(*) AS c FROM ref_clicks WHERE code=?').get(refCode)?.c || 0) || 0)
          : 0;
      }
    }
  }

  legacyReferrals = Math.max(0, Number(legacyReferrals || 0) || 0);
  confirmedRefs = Math.max(0, Number(confirmedRefs || 0) || 0);
  activeRefs = Math.max(0, Number(activeRefs || 0) || 0);
  clicks = Math.max(0, Number(clicks || 0) || 0);

  const strictEligibleRefs = activeRefs;
  const eligibleRefs = Math.max(strictEligibleRefs, legacyReferrals);
  const bonusChunks = Math.max(0, Math.floor(eligibleRefs / 20));
  const tierBasis = Math.max(eligibleRefs, confirmedRefs);
  const bonusPer20 = bonusPer20ForCount(tierBasis);
  const rawDailyBonus = bonusChunks * bonusPer20;
  const dailyBonus = Math.max(0, Math.min(CONFIG.REF_BONUS_CAP, rawDailyBonus));
  const capReached = CONFIG.REF_BONUS_CAP > 0 && rawDailyBonus >= CONFIG.REF_BONUS_CAP;
  const dailyLimit = CONFIG.FREE_DAILY_BASE + dailyBonus;
  return {
    confirmedRefs,
    activeRefs,
    strictEligibleRefs,
    eligibleRefs,
    legacyReferrals,
    clicks,
    bonusPer20,
    bonusChunks,
    rawDailyBonus,
    dailyBonus,
    dailyLimit,
    nextBonusAt: nextBonusAtForChunks(bonusChunks, capReached),
    promoter: bonusChunks > 0,
    capReached,
    tierBasis,
  };
}

function awardReferralBonus(ownerHandle) {
  const handle = String(ownerHandle || '').trim();
  return safeDb(() => {
    if (!handle) return 0;
    const user = userByHandle(handle) || { handle };
    const refCode = String(user?.ref_code || '').trim();
    const legacyReferrals = refCode
      ? (safeDb(() => db.prepare('SELECT COUNT(*) AS c FROM referrals WHERE code=?').get(refCode)?.c || 0) || 0)
      : 0;
    const confirmedRefs = referralCountConfirmed(handle);
    const activeRefs = referralCountActive(handle);
    const eligibleRefs = Math.max(activeRefs, legacyReferrals);
    const bonusChunks = Math.max(0, Math.floor(eligibleRefs / 20));
    const bonusPer20 = bonusPer20ForCount(Math.max(eligibleRefs, confirmedRefs));
    const nextBonus = Math.max(0, Math.min(CONFIG.REF_BONUS_CAP, bonusChunks * bonusPer20));
    try { db.prepare('UPDATE users SET daily_bonus=? WHERE handle=?').run(nextBonus, handle); } catch {}
    return nextBonus;
  });
}

async function getDailyLimit(handle, opts = {}) {
  const summary = await getReferralPromoterSummary(handle, opts);
  return Number(summary?.dailyLimit || 0) || CONFIG.FREE_DAILY_BASE;
}

function referralRewardTotal(handle, rewardType) {
  return safeDb(() => Number(db.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM referral_rewards WHERE handle=? AND reward_type=?").get(handle, rewardType)?.s || 0) || 0) || 0;
}

function hasReferralReward(handle, rewardType) {
  return !!safeDb(() => db.prepare("SELECT 1 FROM referral_rewards WHERE handle=? AND reward_type=? LIMIT 1").get(handle, rewardType));
}

function grantReferralReward(handle, rewardType, amount = 0, source = 'system', code = null, meta = null) {
  const h = String(handle || '').trim();
  const rt = String(rewardType || '').trim();
  if (!h || !rt) return false;
  return !!safeDb(() => {
    if (code) {
      const exists = db.prepare("SELECT 1 FROM referral_rewards WHERE handle=? AND reward_type=? AND code=? LIMIT 1").get(h, rt, code);
      if (exists) return false;
    }
    const info = meta && typeof meta === 'object' ? JSON.stringify(meta) : (meta == null ? null : String(meta));
    const out = db.prepare("INSERT INTO referral_rewards(handle, reward_type, amount, meta_json, code, source, created_at) VALUES(?,?,?,?,?,?,?)").run(h, rt, Number(amount || 0) || 0, info, code, source || 'system', nowIso());
    return !!(out && out.changes === 1);
  });
}

function maybeAwardStarterReward(handle) {
  const h = String(handle || '').trim();
  if (!h || hasReferralReward(h, 'starter_bg_slot')) return false;
  const everUsed = (safeDb(() => db.prepare("SELECT COALESCE(SUM(used),0) AS s FROM usage_daily WHERE handle=? AND used>0").get(h)?.s || 0) || 0) > 0;
  if (!everUsed) return false;
  const invite = safeDb(() => db.prepare("SELECT fraud_flag, fraud_reason FROM referral_invites WHERE invited_handle=? AND status='confirmed' LIMIT 1").get(h));
  if (!invite || Number(invite.fraud_flag || 0)) return false;
  return grantReferralReward(h, 'starter_bg_slot', 1, 'starter', null, { reason: 'eligible_referred_user' });
}

function mapReferralNotCountedReason(fraudReason, activeDays, inserts, hasActivity) {
  if (!hasActivity) return 'NO_ACTIVITY_YET';
  const fr = String(fraudReason || '').trim();
  if (fr === 'fingerprint_dup') return 'DEVICE_DUPLICATE';
  if (fr === 'ip_burst') return 'BURST_FLAG';
  if (fr) return 'SUSPICIOUS_PATTERN';
  if (Number(activeDays || 0) < REF_MIN_ACTIVE_DAYS || Number(inserts || 0) < REF_MIN_ACTIVE_USES) return 'LOW_ACTIVITY';
  return null;
}

function classifyReferralEntry({ activeDays = 0, inserts = 0, fraud = false, fraudReason = null, hasActivity = false }) {
  if (!hasActivity) return { status: 'confirmed', eligible: false, notCountedReason: 'NO_ACTIVITY_YET' };
  if (fraud) return { status: 'active', eligible: false, notCountedReason: mapReferralNotCountedReason(fraudReason, activeDays, inserts, true) };
  if (Number(activeDays || 0) < REF_MIN_ACTIVE_DAYS || Number(inserts || 0) < REF_MIN_ACTIVE_USES) {
    return { status: 'active', eligible: false, notCountedReason: 'LOW_ACTIVITY' };
  }
  return { status: 'eligible', eligible: true, notCountedReason: null };
}

function computeReferralUnlocks(totalEligible, starterSlots = 0) {
  const eligible = Math.max(0, Number(totalEligible || 0) || 0);
  const starter = Math.max(0, Number(starterSlots || 0) || 0);
  let bgSlots = 3;
  if (eligible >= 1) bgSlots = 5;
  if (eligible >= 3) bgSlots = 8;
  if (eligible >= 7) bgSlots = 12;
  if (eligible >= 15) bgSlots = 9999;
  const unlimitedBg = bgSlots >= 9999;
  const bgSlotsTotal = unlimitedBg ? bgSlots : (bgSlots + starter);
  return {
    eligible,
    bgSlotsBase: bgSlots,
    starterBgSlots: starter,
    bgSlots: bgSlotsTotal,
    unlimitedBg,
    cosmeticsOnePack: eligible >= 3,
    cosmeticsAllPacks: eligible >= 15,
    saveCapBonus: eligible >= 7 ? 50 : 0,
    proTrial7dUnlocked: eligible >= 30,
    discount50Unlocked: eligible >= 50,
    toolkitUnlocked: eligible >= 100,
    nextUnlockAt: eligible < 1 ? 1 : eligible < 3 ? 3 : eligible < 7 ? 7 : eligible < 15 ? 15 : eligible < 30 ? 30 : eligible < 50 ? 50 : eligible < 100 ? 100 : null,
  };
}

function subscriptionInfo(u) {
  const tier = u?.tier || "free";
  const until = u?.paid_until ? new Date(u.paid_until) : null;
  const now = new Date();

  // Owner override: always unlimited for the admin handle
  if (isAdminHandle(u?.handle)) {
    return { active: true, tier: "unlimited", daysLeft: 9999, paidUntil: null, isUnlimited: true };
  }

  if (tier === "unlimited") return { active: true, tier: "unlimited", daysLeft: 9999, paidUntil: u?.paid_until || null, isUnlimited: true };
  if (tier === "paid" && until && until > now) {
    const daysLeft = Math.ceil((until - now) / (24 * 3600 * 1000));
    return { active: true, tier: "paid", daysLeft, paidUntil: u.paid_until, isUnlimited: false };
  }
  return { active: false, tier: "free", daysLeft: 0, paidUntil: u?.paid_until || null, isUnlimited: false };
}

async function insertLimitForUser(u, opts = {}) {
  const sub = subscriptionInfo(u);
  if (sub.active) return CONFIG.PRO_DAILY_SENTINEL;
  return getDailyLimit(u?.handle, opts);
}


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



// ---------- GENERATOR ----------
const LANGS = ["en"];

function normLang(_x) {
  return "en";
}

function pick(arr) {
  const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (!list.length) return "";
  return list[Math.floor(Math.random() * list.length)];
}

const E = (...codes) => String.fromCodePoint(...codes);

const MORNING_EMOJI = [E(0x2600, 0xFE0F), E(0x2615), E(0x2728), E(0x1F305)];
const NIGHT_EMOJI = [E(0x1F319), E(0x1F634), E(0x1F4A4), E(0x2728)];

const SAFE_VOCATIVE = {
  ordinary: ["legend", "ser", "mate", "dear"],
  crypto: ["ser", "legend", "mate", "builder"],
  warm: ["dear", "legend", "mate"],
  calmer: ["ser", "mate", "dear", "legend"],
  builder: ["builder", "legend", "ser", "mate"],
};

const FAMILY_BY_STYLE = {
  classic: "ordinary",
  classy: "ordinary",
  emoji: "ordinary",
  noemoji: "ordinary",
  minimal: "ordinary",
  meme: "ordinary",
  degen: "crypto",
  alpha: "crypto",
  cheer: "warm",
  calm: "calmer",
  builder: "builder",
  focus: "builder",
};

const BANKS = {
  ordinary: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet}! {emoji}",
        "{greet} {voc} {emoji}",
        "{greet}, good one {emoji}",
        "{greet}, nice post {emoji}",
        "{greet}, clean one {emoji}",
        "{greet} {voc}, good one {emoji}",
        "{greet} {voc}, nice gm {emoji}",
        "{greet}, coffee first {emoji}",
        "{greet} {voc}, morning back {emoji}",
        "{greet}, good looks {emoji}",
        "{greet}, easy start {emoji}",
        "{greet}, smooth start {emoji}",
        "{greet}, steady start {emoji}",
        "{greet}, morning reset {emoji}",
        "{greet}, clean read {emoji}",
        "{greet}, good thread {emoji}",
      ],
      mid: [
        "{greet} {voc}, strong gm from you {emoji}",
        "{greet} {voc}, good energy on this one {emoji}",
        "{greet}, hope the day starts easy {emoji}",
        "{greet} {voc}, wishing you a smooth one {emoji}",
        "{greet}, hope the coffee hits early {emoji}",
        "{greet} {voc}, solid way to start the day {emoji}",
        "{greet}, good post to start the day {emoji}",
        "{greet} {voc}, hope today treats you well {emoji}",
        "{greet}, strong post for the morning {emoji}",
        "{greet} {voc}, this one lands nicely {emoji}",
        "{greet}, good morning energy on this one {emoji}",
        "{greet} {voc}, hope the day opens kind {emoji}",
      ],
      max: [
        "{greet} {voc}, strong post and even better morning energy {emoji}",
        "{greet}, good way to start the day, hope it stays kind {emoji}",
        "{greet} {voc}, hope the coffee hits and the day goes easy {emoji}",
        "{greet}, solid post to wake the timeline up a bit {emoji}",
        "{greet} {voc}, good energy here, hope today treats you well {emoji}",
        "{greet}, clean morning reply, hope the rest of the day follows {emoji}",
        "{greet} {voc}, strong gm and a good start to the day {emoji}",
        "{greet}, this is the kind of post the morning needed {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet}! {emoji}",
        "{greet} {voc} {emoji}",
        "{greet}, sleep well {emoji}",
        "{greet}, rest easy {emoji}",
        "{greet} {voc}, good rest {emoji}",
        "{greet}, easy night {emoji}",
        "{greet} {voc}, sleep easy {emoji}",
        "{greet}, calm close {emoji}",
        "{greet}, soft close {emoji}",
        "{greet}, quiet close {emoji}",
        "{greet}, night reset {emoji}",
        "{greet}, proper rest {emoji}",
      ],
      mid: [
        "{greet} {voc}, sleep easy tonight {emoji}",
        "{greet}, rest well and come back strong {emoji}",
        "{greet} {voc}, calm close tonight {emoji}",
        "{greet}, good night and good rest {emoji}",
        "{greet} {voc}, hope the night is kind {emoji}",
        "{greet}, easy close and better morning tomorrow {emoji}",
        "{greet} {voc}, good rest on your side {emoji}",
        "{greet}, soft landing tonight {emoji}",
        "{greet} {voc}, sleep well and reset {emoji}",
        "{greet}, good post to end the day with {emoji}",
      ],
      max: [
        "{greet} {voc}, good rest tonight and a better morning tomorrow {emoji}",
        "{greet}, calm close and good sleep on your side {emoji}",
        "{greet} {voc}, rest well and come back fresh in the morning {emoji}",
        "{greet}, soft end to the day, hope you sleep easy {emoji}",
        "{greet} {voc}, good night energy here, now get some real rest {emoji}",
        "{greet}, this is a good way to close the timeline for the night {emoji}",
        "{greet} {voc}, rest well and let the day go quiet {emoji}",
        "{greet}, sleep easy tonight and wake up good tomorrow {emoji}",
      ],
    },
  },
  crypto: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet} ser {emoji}",
        "{greet} legend {emoji}",
        "{greet}, good alpha {emoji}",
        "{greet}, strong post {emoji}",
        "{greet} ser, nice call {emoji}",
        "{greet}, clean setup {emoji}",
        "{greet} mate, good read {emoji}",
        "{greet}, solid take {emoji}",
        "{greet}, clean tape {emoji}",
        "{greet}, sharp read {emoji}",
        "{greet}, calm session {emoji}",
        "{greet}, good chart {emoji}",
      ],
      mid: [
        "{greet} ser, good alpha on this one {emoji}",
        "{greet}, strong post for the open {emoji}",
        "{greet} legend, clean read here {emoji}",
        "{greet}, good take to start the session {emoji}",
        "{greet} ser, hoping the market stays kind today {emoji}",
        "{greet}, solid setup and calm energy here {emoji}",
        "{greet} mate, this is a clean call {emoji}",
        "{greet}, good morning to a strong chart read {emoji}",
        "{greet} ser, this one reads sharp {emoji}",
        "{greet}, clean post and steady start {emoji}",
      ],
      max: [
        "{greet} ser, clean read here and a strong way to start the session {emoji}",
        "{greet}, good alpha on this one, hope the market stays calm today {emoji}",
        "{greet} legend, solid post and a nice way to open the day {emoji}",
        "{greet}, strong take here, hoping the setup follows through {emoji}",
        "{greet} ser, this is the kind of post that makes the open look better {emoji}",
        "{greet}, clean setup and good energy for the day ahead {emoji}",
        "{greet} mate, sharp read and a steady start to the timeline {emoji}",
        "{greet}, solid call here, hope the session treats you well {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet} ser {emoji}",
        "{greet} legend {emoji}",
        "{greet}, rest easy {emoji}",
        "{greet}, solid close {emoji}",
        "{greet} ser, sleep well {emoji}",
        "{greet}, calm close {emoji}",
        "{greet} mate, good rest {emoji}",
        "{greet}, easy reset {emoji}",
        "{greet}, charts can wait {emoji}",
        "{greet}, soft reset {emoji}",
        "{greet}, proper close {emoji}",
      ],
      mid: [
        "{greet} ser, good rest before the next session {emoji}",
        "{greet}, calm close after a solid day {emoji}",
        "{greet} legend, sleep well and reset {emoji}",
        "{greet}, rest easy and come back fresh tomorrow {emoji}",
        "{greet} ser, good night after a clean post {emoji}",
        "{greet}, soft close and real rest tonight {emoji}",
        "{greet} mate, steady night on your side {emoji}",
        "{greet}, let the charts wait till morning {emoji}",
        "{greet} ser, get some proper rest tonight {emoji}",
        "{greet}, good close and a clean reset {emoji}",
      ],
      max: [
        "{greet} ser, good rest tonight and a calmer session tomorrow {emoji}",
        "{greet}, solid close here, now let the charts wait till morning {emoji}",
        "{greet} legend, sleep well and come back fresh for the next move {emoji}",
        "{greet}, calm night on your side after a strong day {emoji}",
        "{greet} ser, good night and a proper reset before tomorrow opens {emoji}",
        "{greet}, this is a clean way to close the day, rest easy {emoji}",
        "{greet} mate, soft close tonight and better energy tomorrow {emoji}",
        "{greet}, good rest first, the market can wait a few hours {emoji}",
      ],
    },
  },
  warm: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet} dear {emoji}",
        "{greet} legend {emoji}",
        "{greet}, kind energy {emoji}",
        "{greet} mate, good energy {emoji}",
        "{greet} dear, nice one {emoji}",
      ],
      mid: [
        "{greet} dear, hope today is kind to you {emoji}",
        "{greet} legend, sending good energy your way {emoji}",
        "{greet}, warm start on this one {emoji}",
        "{greet} mate, hope the day lands easy {emoji}",
        "{greet} dear, good energy here and I hope it stays with you {emoji}",
      ],
      max: [
        "{greet} dear, good energy on this one and I hope the day stays kind to you {emoji}",
        "{greet} legend, warm morning here, hope the rest of your day follows {emoji}",
        "{greet}, this is a nice way to start the day, sending good energy back {emoji}",
        "{greet} mate, hope the morning feels easy and the day treats you well {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet} dear {emoji}",
        "{greet} legend {emoji}",
        "{greet}, rest easy {emoji}",
        "{greet} dear, sleep well {emoji}",
        "{greet}, soft night {emoji}",
      ],
      mid: [
        "{greet} dear, sleep easy tonight {emoji}",
        "{greet} legend, hope the night is kind {emoji}",
        "{greet}, soft close and good rest {emoji}",
        "{greet} dear, wishing you a calm night {emoji}",
        "{greet}, warm night energy on this one {emoji}",
      ],
      max: [
        "{greet} dear, good rest tonight and a softer morning tomorrow {emoji}",
        "{greet} legend, warm close here, hope you sleep really well {emoji}",
        "{greet}, this is a lovely way to end the day, rest easy tonight {emoji}",
        "{greet} dear, calm sleep on your side and good energy tomorrow {emoji}",
      ],
    },
  },
  calmer: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet}, easy start {emoji}",
        "{greet} mate, calm one {emoji}",
        "{greet}, quiet good one {emoji}",
        "{greet} ser, easy morning {emoji}",
        "{greet}, nice and simple {emoji}",
      ],
      mid: [
        "{greet}, easy start on this one {emoji}",
        "{greet} mate, calm morning energy here {emoji}",
        "{greet}, quiet good post for the morning {emoji}",
        "{greet} ser, hoping for an easy day on your side {emoji}",
        "{greet}, simple morning energy and I like it {emoji}",
      ],
      max: [
        "{greet}, calm way to start the day, hope it stays easy for you {emoji}",
        "{greet} mate, quiet good energy here and a nice way to open the morning {emoji}",
        "{greet}, simple start and the kind of post the morning needed {emoji}",
        "{greet} ser, hope the day lands easy and stays light on your side {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet}, easy night {emoji}",
        "{greet} mate, calm one {emoji}",
        "{greet}, quiet close {emoji}",
        "{greet} ser, sleep easy {emoji}",
        "{greet}, soft one tonight {emoji}",
      ],
      mid: [
        "{greet}, easy night on your side {emoji}",
        "{greet} mate, calm close tonight {emoji}",
        "{greet}, quiet good way to end the day {emoji}",
        "{greet} ser, hope you sleep easy tonight {emoji}",
        "{greet}, simple night energy and good rest {emoji}",
      ],
      max: [
        "{greet}, calm close tonight and a good reset for tomorrow {emoji}",
        "{greet} mate, quiet good energy here, hope you sleep easy {emoji}",
        "{greet}, simple end to the day and a good one to log off on {emoji}",
        "{greet} ser, hope the night stays light and the sleep comes easy {emoji}",
      ],
    },
  },
  builder: {
    gm: {
      greet: ["Gm", "Good morning", "Morning"],
      min: [
        "{greet} builder {emoji}",
        "{greet}, clean ship day {emoji}",
        "{greet} builder, good luck building {emoji}",
        "{greet} ser, good build energy {emoji}",
        "{greet}, ship something good {emoji}",
      ],
      mid: [
        "{greet} builder, hope the build flows today {emoji}",
        "{greet}, clean ship day ahead {emoji}",
        "{greet} ser, good energy for a solid build day {emoji}",
        "{greet} builder, hope you ship something good today {emoji}",
        "{greet}, strong start for a builder morning {emoji}",
      ],
      max: [
        "{greet} builder, hope the build flows and the ship goes clean today {emoji}",
        "{greet}, strong morning for a solid build day, hope it lands well {emoji}",
        "{greet} ser, good energy here for useful work and a clean ship {emoji}",
        "{greet} builder, good post and a nice way to start a work session {emoji}",
      ],
    },
    gn: {
      greet: ["Gn", "Good night", "Night"],
      min: [
        "{greet} builder {emoji}",
        "{greet}, ship more tomorrow {emoji}",
        "{greet} builder, good rest first {emoji}",
        "{greet} ser, build can wait {emoji}",
        "{greet}, rest before the next ship {emoji}",
      ],
      mid: [
        "{greet} builder, good rest before the next ship {emoji}",
        "{greet}, build can wait till tomorrow {emoji}",
        "{greet} ser, sleep first and ship more tomorrow {emoji}",
        "{greet} builder, calm close before the next work session {emoji}",
        "{greet}, good night and a proper reset for the build {emoji}",
      ],
      max: [
        "{greet} builder, get some real rest tonight and ship again tomorrow {emoji}",
        "{greet}, good close for the day, now let the build wait till morning {emoji}",
        "{greet} ser, proper rest first and better work tomorrow {emoji}",
        "{greet} builder, calm night on your side before the next session starts {emoji}",
      ],
    },
  },
};

const RE_BANNED_WORDS = /\b(?:captain|sunshine|anon|my\s+g|goat|boss|chief|soldier|army|frens|friends|everyone|everybody|y['’]all|gang|pepe|wojak|champ|queen|babe|cutie|baby|love|darling|warrior|kings|queens|fam|team|chads?)\b/gi;
const RE_BANNED_CRYPTO_HYPE = /\b(?:wagmi|lfg|hodl|ath|moon|ape|aping|bags?)\b|diamond\s+hands?/gi;
const RE_BANNED_MARKET_EMOJI = /[\u{1F4C8}\u{1F4C9}\u{1F4CA}\u{1F4B0}\u{1F48E}\u{1F680}\u{26A1}\u{1F438}\u{1F410}]/gu;
const RE_ANY_EMOJI = /[\p{Extended_Pictographic}]/gu;
const RE_GM_BAD_EMOJI = /[\u{1F319}\u{1F634}\u{1F4A4}\u{1F6CC}]/gu;
const RE_GN_BAD_EMOJI = /[\u{2600}\u{FE0F}\u{2615}\u{1F305}]/gu;

function renderTemplate(template, bank, kind) {
  const greet = pick(bank.greet || [kind === "gm" ? "Gm" : "Gn"]);
  const familyVoc = SAFE_VOCATIVE[bank.familyKey] || SAFE_VOCATIVE.ordinary;
  const emoji = kind === "gm" ? pick(MORNING_EMOJI) : pick(NIGHT_EMOJI);
  return String(template || "")
    .replace(/\{greet\}/g, greet)
    .replace(/\{voc\}/g, pick(familyVoc))
    .replace(/\{emoji\}/g, emoji)
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCaseGreeting(text, kind) {
  let out = String(text || "").trim();
  if (!out) return kind === "gm" ? "Gm" : "Gn";
  out = out.replace(/^(gm|good morning|morning|gn|good night|night)/i, (m) => {
    const low = m.toLowerCase();
    if (low === "gm") return "Gm";
    if (low === "gn") return "Gn";
    if (low === "morning") return "Morning";
    if (low === "night") return "Night";
    if (low === "good morning") return "Good morning";
    if (low === "good night") return "Good night";
    return m;
  });
  return out;
}

function tightenMinimal(text, kind) {
  const raw = String(text || "").trim();
  const firstEmoji = (raw.match(RE_ANY_EMOJI) || [""])[0] || "";
  let out = raw.replace(RE_ANY_EMOJI, " ").replace(/[!,]/g, " ").replace(/\s+/g, " ").trim();
  let words = out.split(/\s+/).filter(Boolean);
  const cap = kind === "gm" ? 4 : 5;
  if (words.length > cap) words = words.slice(0, cap);
  out = words.join(" ").trim();
  out = sentenceCaseGreeting(out, kind);
  if (firstEmoji) out = `${out} ${firstEmoji}`.trim();
  return out.trim();
}

function sanitizeSingle(text, mode, kind) {
  let out = String(text || "");
  out = out.replace(/[—–]/g, " ");
  out = out.replace(RE_BANNED_WORDS, " ");
  out = out.replace(RE_BANNED_CRYPTO_HYPE, " ");
  out = out.replace(RE_BANNED_MARKET_EMOJI, " ");
  out = out.replace(/\b(fr|wagmi|lfg)\s+(fr|wagmi|lfg)\b/gi, "$1");
  out = out.replace(/\s{2,}/g, " ").trim();
  out = out.replace(/\s+([,!?])/g, "$1");
  out = out.replace(/,{2,}/g, ",").replace(/!{2,}/g, "!");
  out = sentenceCaseGreeting(out, kind);

  if (kind === "gm") out = out.replace(RE_GM_BAD_EMOJI, " ");
  if (kind === "gn") out = out.replace(RE_GN_BAD_EMOJI, " ");

  const emojiHits = out.match(RE_ANY_EMOJI) || [];
  if (emojiHits.length > 1) {
    const keep = emojiHits[0];
    out = out.replace(RE_ANY_EMOJI, " ").replace(/\s+/g, " ").trim();
    out = `${out} ${keep}`.trim();
  }

  if (mode === "min") {
    const parts = out.split(",").map((x) => String(x || "").trim()).filter(Boolean);
    if (parts.length > 1) out = parts.slice(0, 1).join(", ");
  }

  out = out.replace(/\b(gm|gn)\s+(gm|gn)\b/gi, "$1");
  out = out.replace(/\b(morning)\s+(morning)\b/gi, "$1");
  out = out.replace(/\b(night)\s+(night)\b/gi, "$1");
  out = out.replace(/\s{2,}/g, " ").trim();
  out = out.replace(/^[,\s]+|[,\s]+$/g, "");
  return out;
}

function applyStyle(base, style, kind, mode) {
  const s = String(style || "classic").toLowerCase().trim();
  let out = sanitizeSingle(base, mode, kind);
  if (!out) out = kind === "gm" ? "Gm" : "Gn";
  if (s === "noemoji") {
    out = out.replace(RE_ANY_EMOJI, " ").replace(/\s+/g, " ").trim();
    if (mode === "min") out = tightenMinimal(out, kind).replace(RE_ANY_EMOJI, "").replace(/\s+/g, " ").trim();
    return sentenceCaseGreeting(out, kind);
  }
  if (s === "minimal" || mode === "min") return tightenMinimal(out, kind);
  return out;
}

function bankFor(kind, style) {
  const familyKey = FAMILY_BY_STYLE[String(style || "classic").toLowerCase().trim()] || "ordinary";
  const family = BANKS[familyKey] || BANKS.ordinary;
  const bank = family[kind] || BANKS.ordinary[kind];
  return { ...bank, familyKey };
}

function composeReply(kind, mode, _lang, style) {
  const bank = bankFor(kind, style);
  const modeKey = ["min", "mid", "max"].includes(String(mode || "").toLowerCase()) ? String(mode).toLowerCase() : "mid";
  const templates = Array.isArray(bank[modeKey]) && bank[modeKey].length ? bank[modeKey] : bank.mid;
  const template = pick(templates);
  const rendered = renderTemplate(template, bank, kind);
  return applyStyle(rendered, style, kind, modeKey);
}

function shapeFingerprint(text, kind) {
  return String(text || "")
    .toLowerCase()
    .replace(RE_ANY_EMOJI, " ")
    .replace(/\b(gm|good morning|morning)\b/g, "gm")
    .replace(/\b(gn|good night|night)\b/g, "gn")
    .replace(/\b(legend|ser|mate|bro|brother|dear|degen|builder)\b/g, "@voc")
    .replace(/\b(good one|nice post|clean one|strong post|solid post|good post|clean post|strong take|solid take|clean read|good read|nice gm)\b/g, "@post")
    .replace(/\b(sleep easy|sleep well|rest easy|rest well|good rest|real rest|proper rest|easy reset|soft landing|calm close|easy close|soft close)\b/g, "@close")
    .replace(/\b(start the day|start the session|open the day|open the morning|open the session|close the day|end the day)\b/g, "@phase")
    .replace(/\b(good|nice|solid|strong|clean|calm|soft|easy|quiet|smooth|kind|warm|steady|proper|real)\b/g, "@adj")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\b(a|an|the|and|to|your|you|on|this|that|here|today|tonight|tomorrow|back|really|just|one|side)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function modeProfile(text) {
  const t = String(text || "").trim();
  if (!t) return { chars: 0, words: 0 };
  const chars = Array.from(t).length;
  const words = t.replace(RE_ANY_EMOJI, " ").replace(/[^A-Za-z0-9\s']+/g, " ").split(/\s+/).filter(Boolean).length;
  return { chars, words };
}

function passesModeProfile(text, mode) {
  const { chars, words } = modeProfile(text);
  if (!chars || !words) return false;
  if (mode === "min") return chars <= 40 && words >= 2 && words <= 6;
  if (mode === "mid") return chars >= 18 && chars <= 84 && words >= 4 && words <= 12;
  return chars >= 28 && chars <= 116 && words >= 6 && words <= 18;
}

function isNearDuplicateShape(a, b) {
  const left = String(a || "").trim();
  const right = String(b || "").trim();
  if (!left || !right) return false;
  if (left === right) return true;
  const la = left.split(/\s+/).filter(Boolean);
  const lb = right.split(/\s+/).filter(Boolean);
  if (!la.length || !lb.length) return false;
  const sa = new Set(la);
  const sb = new Set(lb);
  let inter = 0;
  for (const token of sa) if (sb.has(token)) inter++;
  const minSize = Math.min(sa.size, sb.size);
  const unionSize = new Set([...sa, ...sb]).size;
  if (!minSize || !unionSize) return false;
  const containment = inter / minSize;
  const jaccard = inter / unionSize;
  if (minSize <= 2) return containment === 1;
  if (minSize <= 4) return containment >= 0.85;
  return containment >= 0.8 || jaccard >= 0.7;
}

function replyQualityScore(text, kind, mode) {
  const t = String(text || "").trim();
  if (!t) return -1e9;
  const chars = Array.from(t).length;
  const words = t.replace(RE_ANY_EMOJI, " ").replace(/[^A-Za-z0-9\s']+/g, " ").split(/\s+/).filter(Boolean);
  const emojiHits = t.match(RE_ANY_EMOJI) || [];
  let score = 0;

  if (mode === "min") {
    if (chars >= 6 && chars <= 34) score += 16;
    else if (chars <= 42) score += 8;
    else score -= 16;
    if (words.length >= 2 && words.length <= 6) score += 12;
    else if (words.length <= 7) score += 5;
    else score -= 12;
  } else if (mode === "mid") {
    if (chars >= 16 && chars <= 72) score += 12;
    else if (chars <= 84) score += 5;
    else score -= 10;
    if (words.length >= 4 && words.length <= 11) score += 10;
    else if (words.length <= 13) score += 4;
    else score -= 8;
  } else {
    if (chars >= 24 && chars <= 96) score += 10;
    else if (chars <= 112) score += 4;
    else score -= 10;
    if (words.length >= 6 && words.length <= 15) score += 9;
    else if (words.length <= 17) score += 3;
    else score -= 8;
  }

  if (new RegExp(`^(gm|good morning|morning)\\b`, "i").test(t) && kind === "gm") score += 10;
  if (new RegExp(`^(gn|good night|night)\\b`, "i").test(t) && kind === "gn") score += 10;
  if (emojiHits.length === 1) score += 6;
  else if (emojiHits.length === 0) score += 1;
  else score -= 4 * (emojiHits.length - 1);

  RE_BANNED_WORDS.lastIndex = 0;
  RE_BANNED_CRYPTO_HYPE.lastIndex = 0;
  RE_BANNED_MARKET_EMOJI.lastIndex = 0;
  if (RE_BANNED_WORDS.test(t)) score -= 50;
  if (RE_BANNED_CRYPTO_HYPE.test(t)) score -= 24;
  if (RE_BANNED_MARKET_EMOJI.test(t)) score -= 25;
  if (/\b(feed|open|room|brain|lane|soldier|army|frens|goat|boss|pepe|wojak)\b/i.test(t)) score -= 20;

  const uniq = new Set(words.map((w) => w.toLowerCase()));
  score += Math.min(8, uniq.size);
  return score;
}

const GLOBAL_RECENT = {
  gm: [],
  gn: [],
};

function getRecentRows(handle, kind, limit = 20) {
  return safeOptionalHistoryDb(
    () => db
      .prepare(
        "SELECT reply FROM recent_replies WHERE handle=? AND kind=? ORDER BY created_at DESC LIMIT ?"
      )
      .all(handle, kind, limit),
    [],
    "recent_rows"
  );
}

function getRecentSet(handle, kind, limit = 20) {
  const rows = getRecentRows(handle, kind, limit);
  return new Set(rows.map((r) => String(r.reply || "").trim()).filter(Boolean));
}

function rememberGlobal(kind, reply) {
  const k = kind === "gn" ? "gn" : "gm";
  const list = GLOBAL_RECENT[k];
  const txt = String(reply || "").trim();
  if (!txt) return;
  list.unshift(txt);
  if (list.length > 400) list.length = 400;
}

function getGlobalShapeRows(kind, mode, family, limit = 1200) {
  return safeOptionalHistoryDb(
    () => db
      .prepare(
        "SELECT reply_hash, shape FROM recent_reply_shapes WHERE kind=? AND mode=? AND family=? ORDER BY created_at DESC LIMIT ?"
      )
      .all(kind, mode, family, limit),
    [],
    "global_shape_rows"
  );
}

function rememberGlobalShape(kind, mode, style, reply) {
  const txt = String(reply || "").trim();
  if (!txt) return;
  const safeKind = kind === "gn" ? "gn" : "gm";
  const safeMode = ["min", "mid", "max"].includes(String(mode || "").toLowerCase()) ? String(mode).toLowerCase() : "mid";
  const family = bankFor(safeKind, style).familyKey || "ordinary";
  const shape = shapeFingerprint(txt, safeKind);
  if (!shape) return;
  const replyHash = sha256(`${safeKind}|${safeMode}|${family}|${txt}`).slice(0, 32);
  safeOptionalHistoryDb(() => {
    safeDb(() => {
      db.prepare(
        "INSERT INTO recent_reply_shapes(kind, mode, family, reply_hash, shape, created_at) VALUES(?,?,?,?,?,?)"
      ).run(safeKind, safeMode, family, replyHash, shape, nowIso());

      db.prepare(`
        DELETE FROM recent_reply_shapes
        WHERE rowid NOT IN (
          SELECT rowid FROM recent_reply_shapes
          WHERE kind=? AND mode=? AND family=?
          ORDER BY created_at DESC
          LIMIT 8000
        ) AND kind=? AND mode=? AND family=?
      `).run(safeKind, safeMode, family, safeKind, safeMode, family);
    });
    return true;
  }, false, "remember_global_shape");
}

function saveRecent(handle, kind, reply, mode = "mid", style = "classic") {
  safeOptionalHistoryDb(() => {
    safeDb(() => {
      db.prepare(
        "INSERT INTO recent_replies(handle, kind, reply, created_at) VALUES(?,?,?,?)"
      ).run(handle, kind, reply, nowIso());

      db.prepare(`
        DELETE FROM recent_replies
        WHERE rowid NOT IN (
          SELECT rowid FROM recent_replies
          WHERE handle=? AND kind=?
          ORDER BY created_at DESC
          LIMIT 120
        ) AND handle=? AND kind=?
      `).run(handle, kind, handle, kind);
    });
    return true;
  }, false, "save_recent");
  rememberGlobal(kind, reply);
  rememberGlobalShape(kind, mode, style, reply);
}

function generateRankedCandidates(handle, kind, mode, lang, style, count = 1, antiLastN = 20, allowRecent = false) {
  const recent = handle ? getRecentSet(handle, kind, antiLastN) : new Set();
  const recentShapes = new Set(Array.from(recent).map((x) => shapeFingerprint(x, kind)).filter(Boolean));
  const recentShapeList = Array.from(recentShapes).slice(0, 240);
  const { familyKey } = bankFor(kind, style);
  const globalRecent = new Set((GLOBAL_RECENT[kind] || []).slice(0, 160));
  const globalShapeRows = getGlobalShapeRows(kind, mode, familyKey, 1600);
  const globalShapes = new Set([
    ...Array.from(globalRecent).map((x) => shapeFingerprint(x, kind)).filter(Boolean),
    ...globalShapeRows.map((row) => String(row?.shape || "").trim()).filter(Boolean),
  ]);
  const globalShapeList = Array.from(globalShapes).slice(0, 480);
  const seenText = new Set();
  const seenShape = new Set();
  const seenShapeList = [];
  const pool = [];
  let tries = 0;
  const wantPool = Math.max(count * (mode === "min" ? 20 : 16), mode === "min" ? 64 : 48);
  const maxTries = Math.max(3200, count * (mode === "min" ? 760 : 520));

  const collect = ({ allowHistory = false, relaxGlobalShape = false, relaxGlobalExact = false, relaxHistoryShape = false, relaxSeenShape = false } = {}) => {
    while (pool.length < wantPool && tries < maxTries) {
      tries++;
      const candidate = sanitizeSingle(composeReply(kind, mode, lang, style), mode, kind);
      if (!candidate || !passesModeProfile(candidate, mode)) continue;
      const fp = shapeFingerprint(candidate, kind);
      if (!fp) continue;
      if (!allowHistory && (recent.has(candidate) || (!relaxHistoryShape && (recentShapes.has(fp) || recentShapeList.some((shape) => isNearDuplicateShape(shape, fp)))))) continue;
      if (!relaxGlobalExact && globalRecent.has(candidate)) continue;
      if (!relaxGlobalShape && (globalShapes.has(fp) || globalShapeList.some((shape) => isNearDuplicateShape(shape, fp)))) continue;
      if (seenText.has(candidate) || (!relaxSeenShape && (seenShape.has(fp) || seenShapeList.some((shape) => isNearDuplicateShape(shape, fp))))) continue;
      seenText.add(candidate);
      seenShape.add(fp);
      seenShapeList.push(fp);
      pool.push({
        text: candidate,
        fp,
        score: replyQualityScore(candidate, kind, mode),
      });
    }
  };

  collect({ allowHistory: Boolean(allowRecent), relaxGlobalShape: false });
  if (pool.length < Math.max(6, Math.min(count, Math.ceil(count * 0.65)))) {
    collect({ allowHistory: Boolean(allowRecent), relaxGlobalShape: true });
  }
  if (!allowRecent && pool.length < count) {
    collect({ allowHistory: true, relaxGlobalShape: false });
  }
  if (pool.length < count) {
    collect({ allowHistory: true, relaxGlobalShape: true });
  }
  if (pool.length < count) {
    collect({ allowHistory: true, relaxGlobalShape: true, relaxGlobalExact: true });
  }
  if (pool.length < count) {
    collect({
      allowHistory: true,
      relaxGlobalShape: true,
      relaxGlobalExact: true,
      relaxHistoryShape: true,
      relaxSeenShape: true
    });
  }


  if (pool.length < count) {
    const emergencyMaxTries = Math.max(600, count * 120);
    let emergencyTries = 0;
    while (pool.length < count && emergencyTries < emergencyMaxTries) {
      emergencyTries++;
      const candidate = sanitizeSingle(composeReply(kind, mode, lang, style), mode, kind);
      if (!candidate) continue;
      const fp = shapeFingerprint(candidate, kind) || candidate.toLowerCase();
      if (seenText.has(candidate)) continue;
      seenText.add(candidate);
      seenShape.add(fp);
      seenShapeList.push(fp);
      pool.push({
        text: candidate,
        fp,
        score: replyQualityScore(candidate, kind, mode) - 0.25,
      });
    }
  }

  pool.sort((a, b) => b.score - a.score);
  if (!pool.length) return [];
  if (count <= 1) return [pool[0].text];

  const out = [];
  const usedShape = new Set();
  const usedText = new Set();
  for (const item of pool) {
    if (!item || !item.text || !item.fp) continue;
    if (usedShape.has(item.fp) || usedText.has(item.text)) continue;
    usedShape.add(item.fp);
    usedText.add(item.text);
    out.push(item.text);
    if (out.length >= count) break;
  }

  if (out.length < count) {
    for (const item of pool) {
      if (!item || !item.text) continue;
      if (usedText.has(item.text)) continue;
      usedText.add(item.text);
      out.push(item.text);
      if (out.length >= count) break;
    }
  }

  return out.slice(0, count);
}

function generateUnique(handle, kind, mode, lang, style, antiLastN = 20) {
  const list = generateRankedCandidates(handle, kind, mode, lang, style, 1, antiLastN, false);
  if (Array.isArray(list) && list.length) return String(list[0] || "").trim();
  return sanitizeSingle(composeReply(kind, mode, lang, style), mode, kind);
}

// ---------- API ----------
app.get("/api/health", async (req, res) => {
  const force = String(req.query.force || "").trim() === "1";
  const payload = await getHealthSnapshot(force);
  res.status(payload.ok ? 200 : 503).json(payload);
});

app.get("/api/version", (req, res) => {
  res.json({
    ok: true,
    build: BUILD_ID,
    startedAt: STARTED_AT,
    ...(DEV_RUN_TOKEN ? { devRunToken: DEV_RUN_TOKEN } : {}),
  });
});

app.get("/api/config", (req, res) => {
  // Single source of truth for plans/limits/flags. UI should not hardcode numbers.
  res.json({
    ok: true,
    build: BUILD_ID,
    startedAt: STARTED_AT,
    serverTime: nowIso(),
    limits: {
      freeDaily: CONFIG.FREE_DAILY_BASE,
      saveCapFree: CONFIG.SAVE_CAP_FREE,
    },
    plans: PLANS,
    billing: {
      receiver: SOL_RECEIVER,
      tokens: BILLING_TOKENS.map((t) => ({ key: t.key, label: t.label, kind: t.kind, decimals: t.decimals })),
      plans: BILLING_PLANS,
    },
    extension: {
      storeUrl: EXTENSION_STORE_URL,
    },
  });
});

app.get("/status", (req, res) => {
  // Lightweight status/health endpoint (HTML or JSON)
  const payload = {
    ok: true,
    build: BUILD_ID,
    startedAt: STARTED_AT,
    serverTime: nowIso(),
    uptimeSec: Math.round(process.uptime()),
    db: "ok",
  };
  const accept = String(req.headers.accept || "");
  if (accept.includes("text/html")) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Status</title><style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:24px}code{background:#f3f3f3;padding:2px 6px;border-radius:6px}</style></head><body><h1>GMXReply status</h1><p><strong>OK</strong></p><p>Build: <code>${payload.build}</code></p><p>Started: <code>${payload.startedAt}</code></p><p>Server time: <code>${payload.serverTime}</code></p><p>Uptime: <code>${payload.uptimeSec}s</code></p></body></html>`);
  }
  res.json(payload);
});


// ---------- PUBLIC TRY (no auth) ----------
app.get("/api/public/random", (req, res) => {
  try {
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    // Public try: rank a small candidate pool first so even guest mode gets stronger lines.
    const list = generateRankedCandidates(null, kind, mode, lang, style, 1, 0, true);
    const reply = String((list && list[0]) || sanitizeSingle(composeReply(kind, mode, lang, style), mode, kind) || "").trim();
    res.json({ ok:true, kind, mode, lang, reply });
  } catch (e) {
    console.error("PUBLIC_RANDOM_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/public/random-bulk", (req, res) => {
  try {
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    // Support multiple param names for convenience/compat with older clients.
    // count is canonical; n/limit are accepted aliases.
    let count = Number((req.query.count ?? req.query.n ?? req.query.limit) ?? 5);
    if (!Number.isFinite(count)) count = 5;
    count = Math.max(1, Math.min(10, Math.floor(count)));

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const list = generateRankedCandidates(null, kind, mode, lang, style, count, 0, true);
    res.json({ ok:true, kind, mode, lang, count: list.length, list });
  } catch (e) {
    console.error("PUBLIC_RANDOM_BULK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


// ---------- EXTENSION RECOVERY (public) ----------
const EXT_SELECTORS = {
  version: 1,
  // Keep selectors broad: X changes often; we prefer multiple fallbacks.
  composer: [
    'div[data-testid^="tweetTextarea_"] div[role="textbox"]',
    'div[role="dialog"] div[role="textbox"]',
    'div[role="textbox"][data-testid*="tweetTextarea"]',
    'div[role="textbox"][contenteditable="true"]',
    'div[role="textbox"]'
  ],
  tweetText: [
    'article div[data-testid="tweetText"]',
    'div[data-testid="tweetText"]',
    'article [lang]'
  ],
  anchors: [
    'div[data-testid="toolBar"]',
    'div[data-testid="tweetButtonInline"]',
    'div[role="group"]'
  ]
};

function normalizeSelectorsPayload(obj){
  if (!obj || typeof obj !== "object") return null;
  const pickArr = (v, max = 60) =>
    (Array.isArray(v) ? v : [])
      .map(s => String(s || "").trim())
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

function getExtSelectorsOverride(){
  const row = safeDb(() =>
    db.prepare("SELECT json, updated_at FROM ext_selectors WHERE id=1").get()
  );
  if (!row?.json) return null;
  try{
    const parsed = JSON.parse(row.json);
    const norm = normalizeSelectorsPayload(parsed);
    if (!norm) return null;
    return { ...norm, updated_at: row.updated_at };
  }catch(_e){
    return null;
  }
}

function setExtSelectorsOverride(payload){
  const norm = normalizeSelectorsPayload(payload);
  if (!norm) return null;
  safeDb(() =>
    db.prepare(
      `INSERT INTO ext_selectors(id, json, updated_at)
       VALUES(1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at`
    ).run(JSON.stringify(norm), nowIso())
  );
  return norm;
}

function resetExtSelectorsOverride(){
  safeDb(() => db.prepare("DELETE FROM ext_selectors WHERE id=1").run());
}

function getExtSelectorsRollout(){
  // Singleton row id=1
  let row = safeDb(() => db.prepare("SELECT rollout_percent, rollout_salt, updated_at FROM ext_selectors_meta WHERE id=1").get());
  if (!row){
    // Safety: create if missing
    const salt = randHex(8);
    safeDb(() => db.prepare("INSERT OR IGNORE INTO ext_selectors_meta(id, rollout_percent, rollout_salt, updated_at) VALUES(1, 100, ?, ?)").run(salt, nowIso()));
    row = { rollout_percent: 100, rollout_salt: salt, updated_at: nowIso() };
  }
  const p = Math.max(0, Math.min(100, Number(row.rollout_percent ?? 100)));
  return {
    rollout_percent: Number.isFinite(p) ? p : 100,
    rollout_salt: String(row.rollout_salt || ""),
    updated_at: String(row.updated_at || "")
  };
}

function setExtSelectorsRolloutMeta({ rollout_percent, rollout_salt }){
  const p0 = Number(rollout_percent);
  const p = Math.max(0, Math.min(100, Number.isFinite(p0) ? Math.floor(p0) : 100));
  const salt = String(rollout_salt || "").trim() || randHex(8);
  safeDb(() =>
    db.prepare(
      `INSERT INTO ext_selectors_meta(id, rollout_percent, rollout_salt, updated_at)
       VALUES(1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET rollout_percent=excluded.rollout_percent, rollout_salt=excluded.rollout_salt, updated_at=excluded.updated_at`
    ).run(p, salt, nowIso())
  );
  return { rollout_percent: p, rollout_salt: salt, updated_at: nowIso() };
}

function inRolloutForClient(clientId, rolloutPercent, rolloutSalt){
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

function getEffectiveExtSelectorsForClient(clientId){
  const rollout = getExtSelectorsRollout();
  const o = getExtSelectorsOverride();
  const hasOverride = !!o;

  const inRollout = hasOverride ? inRolloutForClient(clientId, rollout.rollout_percent, rollout.rollout_salt) : false;

  if (!hasOverride || !inRollout){
    return { selectors: EXT_SELECTORS, overrideUpdatedAt: o?.updated_at || null, override: o || null, rollout, inRollout };
  }

  // Override replaces only selector arrays; keep default keys stable.
  const eff = {
    version: o.version || EXT_SELECTORS.version || 1,
    composer: (o.composer && o.composer.length) ? o.composer : EXT_SELECTORS.composer,
    tweetText: (o.tweetText && o.tweetText.length) ? o.tweetText : EXT_SELECTORS.tweetText,
    anchors: (o.anchors && o.anchors.length) ? o.anchors : EXT_SELECTORS.anchors,
  };

  return { selectors: eff, overrideUpdatedAt: o.updated_at || null, override: o, rollout, inRollout };
}

// For admin/debug views: show the effective override without rollout gating.
function getEffectiveExtSelectors(){
  const o = getExtSelectorsOverride();
  if (!o) return { selectors: EXT_SELECTORS, overrideUpdatedAt: null, override: null };
  const eff = {
    version: o.version || EXT_SELECTORS.version || 1,
    composer: (o.composer && o.composer.length) ? o.composer : EXT_SELECTORS.composer,
    tweetText: (o.tweetText && o.tweetText.length) ? o.tweetText : EXT_SELECTORS.tweetText,
    anchors: (o.anchors && o.anchors.length) ? o.anchors : EXT_SELECTORS.anchors,
  };
  return { selectors: eff, overrideUpdatedAt: o.updated_at || null, override: o };
}

app.get("/api/ext/selectors", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // meta=1 returns a small payload for quick polling (used by the extension to detect selector updates)
  const metaOnly = String(req.query?.meta || "").toLowerCase() === "1" || String(req.query?.meta || "").toLowerCase() === "true";
  const clientId = String(req.query?.client_id || "").trim();

  const { selectors, overrideUpdatedAt, rollout, inRollout } = getEffectiveExtSelectorsForClient(clientId);
  const baseMeta = {
    ok: true,
    build: BUILD_ID,
    overrideUpdatedAt,
    rolloutUpdatedAt: rollout?.updated_at || null,
    rolloutPercent: rollout?.rollout_percent ?? 100,
    inRollout,
    version: selectors?.version || 1
  };

  if (metaOnly){
    return res.json(baseMeta);
  }

  res.json({ ...baseMeta, ...selectors });
});

// Extension diagnostics / health pings.
// IMPORTANT: do not store tweet text or generated replies here. Only coarse error codes + metadata.
app.post("/api/ext/event", (req, res) => {
  try{
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const clientId = String(body.client_id || req.headers["x-gmx-client"] || "").trim();
    const client_hash = sha256(clientId || referralFingerprint(req)).slice(0, 24);
    const event_type = String(body.event_type || body.type || "").toLowerCase().trim();
    const ok = (body.ok === true || body.ok === 1 || body.ok === "1");
    const error_code = String(body.error_code || body.error || "").trim().slice(0, 64) || null;
    const ext_version = String(body.ext_version || body.version || "").trim().slice(0, 32) || null;

    if (!/^[a-z0-9_]{1,32}$/.test(event_type)){
      return res.status(400).json({ ok:false, error:"invalid_event_type" });
    }

    let meta_json = null;
    if (body.meta && typeof body.meta === "object"){
      try{
        const s = JSON.stringify(body.meta);
        meta_json = s.length <= 2048 ? s : s.slice(0, 2048);
      }catch{}
    }

    safeDb(() => {
      db.prepare(
        "INSERT INTO ext_events(created_at, client_hash, ext_version, event_type, ok, error_code, meta_json) VALUES(?,?,?,?,?,?,?)"
      ).run(nowIso(), client_hash, ext_version, event_type, ok ? 1 : 0, error_code, meta_json);
    });
    res.json({ ok:true });
  }catch(e){
    console.error("EXT_EVENT_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

function getExtFaq(){
  const row = safeDb(() => db.prepare("SELECT json, updated_at FROM ext_faq WHERE id=1").get());
  if (!row?.json) return { version: 1, items: [] };
  try{ return JSON.parse(row.json); }catch{ return { version: 1, items: [] }; }
}

app.get("/api/ext/faq", (req, res) => {
  try{
    const row = safeDb(() => db.prepare("SELECT json, updated_at FROM ext_faq WHERE id=1").get());
    const json = row?.json ? JSON.parse(row.json) : { version: 1, items: [] };
    return res.json({ ok:true, updated_at: row?.updated_at || null, faq: json });
  }catch(e){
    console.error("EXT_FAQ_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


async function getUsageFor(handle){
  const h = String(handle || "").trim();
  if (!h) {
    return {
      gm:{ used:0, limit:0 },
      gn:{ used:0, limit:0 },
      resetAt: nextResetUTC(),
      sub: subscriptionInfo({ handle: "" }),
      limits:{ freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0, saveCapFree: CONFIG.SAVE_CAP_FREE, referralUnlocks: computeReferralUnlocks(0, 0) }
    };
  }
  const day = todayKeyUTC();
  // Referral bonuses are disabled in v1 unlock model; we still keep reward ledger in sync.
  try{ awardReferralBonus(h); }catch(_e){}
  try{ maybeAwardStarterReward(h); }catch(_e){}
  const u = userByHandle(h) || { handle: h };
  const promo = await getReferralPromoterSummary(h, { userRow: u });
  const earnedEligible = Math.max(0, Number(promo?.eligibleRefs || 0) || 0);
  const manualEligibleCredits = referralRewardTotal(h, 'eligible_credit');
  const starterBgSlots = referralRewardTotal(h, 'starter_bg_slot');
  const unlocks = computeReferralUnlocks(earnedEligible + manualEligibleCredits, starterBgSlots);
  const limit = await insertLimitForUser({ ...u, handle: h }, promo);

  let gmUsed = 0;
  let gnUsed = 0;
  if (supabaseActive()) {
    gmUsed = await sbGetDailyUsed(h, day, "gm");
    gnUsed = await sbGetDailyUsed(h, day, "gn");
  } else {
    gmUsed = getDailyUsed(h, day, "gm");
    gnUsed = getDailyUsed(h, day, "gn");
  }

  return {
    gm: { used: gmUsed, limit },
    gn: { used: gnUsed, limit },
    resetAt: nextResetUTC(),
    sub: subscriptionInfo({ ...u, handle: h }),
    limits: {
      freeDaily: CONFIG.FREE_DAILY_BASE,
      dailyBonus: Math.max(0, Number(promo?.dailyBonus || 0) || 0),
      saveCapFree: CONFIG.SAVE_CAP_FREE + (unlocks.saveCapBonus || 0),
      referralUnlocks: unlocks,
      bonusPer20: Math.max(0, Number(promo?.bonusPer20 || 0) || 0),
      bonusChunks: Math.max(0, Number(promo?.bonusChunks || 0) || 0),
      nextBonusAt: promo?.nextBonusAt == null ? null : (Number(promo.nextBonusAt || 0) || 0),
      promoter: !!promo?.promoter,
    }
  };
}

app.all("/api/user/init", initLimiter, async (req, res) => {
  try {
    const rawHandle = req.method === "GET" ? req.query.handle : req.body?.handle;
    const handle = normalizeHandle(rawHandle);
    if (!validHandle(handle)) return sendError(res, 400, ERROR_CODES.INVALID_HANDLE);

    const rotate = String((req.method === "GET" ? req.query.rotate : req.body?.rotate) || "").trim();

    // SECURITY (P0): prevent account takeover by requiring an existing token for existing users.
    let userRow0 = userByHandle(handle);
    let token = userRow0?.access_token ? String(userRow0.access_token) : "";

    if (userRow0) {
      const authToken = getAuthToken(req);
      const tokenUser = authToken ? userByToken(authToken) : null;
      const authMatches = !!(tokenUser && String(tokenUser.handle).toLowerCase() === String(handle).toLowerCase());

      // Stable session rule:
      // - never rotate automatically for existing users
      // - rotate only when explicitly requested AND the current session matches this handle
      const rotateReq = (rotate === "1" || rotate.toLowerCase() === "true");
      if (rotateReq) {
        if (!authMatches) {
          return res.status(401).json({ ok:false, error:"token_required_for_rotate" });
        }
        token = rotateToken(handle);
        userRow0 = userByHandle(handle);
      } else if (authMatches) {
        token = authToken;
      } else if (canUseDevSessionReset(req)) {
        token = rotateToken(handle);
        userRow0 = userByHandle(handle);
      } else {
        return res.status(401).json({
          ok:false,
          error:"existing_session_required",
          hint:"open_site_or_use_existing_session"
        });
      }
    } else {
      ensureUser(handle);
      userRow0 = userByHandle(handle);
      token = userRow0?.access_token ? String(userRow0.access_token) : "";
    }

    // --- Referrals (anti-fraud v1) ---
    const ref = (req.method === "GET" ? req.query.ref : req.body?.ref) || "";
    const refCode = String(ref || "").trim();

    // In supabase mode we keep sqlite referral_invites for anti-fraud/back-compat,
    // but write the source-of-truth invite to Supabase (public.referrals).
    let sbInvite = null;

    if (refCode) {
      safeDb(() => {
        const owner = db.prepare("SELECT handle FROM users WHERE ref_code=?").get(refCode);
        const inviter = owner?.handle ? String(owner.handle) : "";
        // ignore self-referrals and invalid
        if (inviter && inviter.toLowerCase() !== handle.toLowerCase() && validHandle(inviter)) {
          const already = db.prepare("SELECT inviter_handle FROM referral_invites WHERE invited_handle=?").get(handle);
          if (!already?.inviter_handle) {
            const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const cnt = db
              .prepare("SELECT COUNT(1) as c FROM referral_invites WHERE inviter_handle=? AND created_at>=?")
              .get(inviter, since)?.c || 0;

            if (cnt < 120) {
              const fpOverride = DEV_MODE ? String(req.query.fingerprint || req.query.fp || "").trim() : "";
    const fp = fpOverride ? sha256("dev|" + fpOverride).slice(0, 24) : referralFingerprint(req);
              const ip = clientIp(req);
              const ua = (req.headers["user-agent"] || "").toString();
              const ip_hash = sha256(String(ip || "")).slice(0, 16);
              const ua_hash = sha256(String(ua || "")).slice(0, 16);

              // fingerprint de-dup per inviter (one device = one referral for the same inviter)
              const fpDup = db
                .prepare("SELECT 1 FROM referral_invites WHERE inviter_handle=? AND fingerprint=? LIMIT 1")
                .get(inviter, fp);

              // soft burst guard: >3 invites from same inviter+ip_hash within 24h => flagged
              const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
              const ipBurst = db
                .prepare(
                  "SELECT COUNT(1) as c FROM referral_invites WHERE inviter_handle=? AND ip_hash=? AND created_at>=?"
                )
                .get(inviter, ip_hash, since24)?.c || 0;

              const fraud_flag = (fpDup || ipBurst >= 3) ? 1 : 0;
              const fraud_reason = fpDup ? "fingerprint_dup" : (ipBurst >= 3 ? "ip_burst" : null);

              const ts = nowIso();

              try {
                db.prepare(
                  "INSERT OR IGNORE INTO referral_invites(inviter_handle, invited_handle, status, created_at, confirmed_at, fingerprint, ip_hash, ua_hash, fraud_flag, fraud_reason) VALUES(?,?,?,?,?,?,?,?,?,?)"
                ).run(inviter, handle, "confirmed", ts, ts, fp, ip_hash, ua_hash, fraud_flag, fraud_reason);
              } catch (_e) {
                // ignore unique constraint race
              }

              // legacy fingerprint referral is ONLY for sqlite mode (do not pollute legacy in supabase mode)
              if (!supabaseActive()) {
                try {
                  db.prepare(
                    "INSERT OR IGNORE INTO referrals(owner_handle, code, fingerprint, created_at) VALUES(?,?,?,?)"
                  ).run(inviter, refCode, fp, ts);
                } catch {}
              }

              // Supabase invite (only if not fraud-flagged)
              if (supabaseActive() && !fraud_flag) {
                sbInvite = { inviter, invited: handle, created_at: ts, confirmed_at: ts };
              }
            }
          }
        }
      });
    }

    if (supabaseActive() && sbInvite) {
      try {
        await sbReferralsUpsertInvite(sbInvite.inviter, sbInvite.invited, sbInvite.created_at, sbInvite.confirmed_at);
      } catch (e) {
        console.warn("SB_REF_INVITE_UPSERT_ERROR", e?.message || e);
      }
    }

const userRow = safeDb(() => db.prepare("SELECT * FROM users WHERE handle=?").get(handle));
    const origin = originFromReq(req);
    const isAdmin = isAdminHandle(handle);
    const userRefCode = userRow?.ref_code ? String(userRow.ref_code) : "";
    const sub = subscriptionInfo({ ...(userRow || {}), handle });

    const usage = await getUsageFor(handle);
    const pro = !!sub.active;

    setAuthCookie(req, res, token);

    res.json({
      ok: true,
      token,
      handle,
      isAdmin,
      adminClaimable: false,
      refCode: userRefCode,
      refLink: userRefCode ? `${origin}/app?ref=${userRefCode}` : "",
      sub,
      user: {
        handle,
        sub_status: sub.active ? "active" : (userRow?.sub_status || "free"),
        until: sub.until || null,
      },
      config: {
        build: BUILD_ID,
        startedAt: STARTED_AT,
        saveCapFree: usage?.limits?.saveCapFree || CONFIG.SAVE_CAP_FREE,
        freeDaily: CONFIG.FREE_DAILY_BASE,
        plan: pro ? "pro" : "free",
      },
      usage: {
        ...usage,
        saveCapFree: usage?.limits?.saveCapFree || CONFIG.SAVE_CAP_FREE,
      },
    });
  } catch (e) {
    console.error("INIT_ERROR", e);
    const detail = DEV_MODE ? String(e?.message || e) : "";
    return sendError(res, 500, ERROR_CODES.SERVER_ERROR, detail ? { detail } : {});
  }
});




app.get("/api/usage", maybeAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    if (!handle) {
      return res.json({
        ok: true,
        authenticated: false,
        gm: { used: 0, limit: CONFIG.FREE_DAILY_BASE },
        gn: { used: 0, limit: CONFIG.FREE_DAILY_BASE },
        resetAt: nextResetUTC(),
        sub: subscriptionInfo({ handle: "" }),
        limits: { freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0, saveCapFree: CONFIG.SAVE_CAP_FREE, referralUnlocks: computeReferralUnlocks(0, 0) },
      });
    }

    const usage = await getUsageFor(handle);

    return res.json({
      ok: true,
      authenticated: true,
      gm: usage.gm,
      gn: usage.gn,
      resetAt: usage.resetAt,
      sub: usage.sub,
      limits: usage.limits,
    });
  } catch (e) {
    console.error("USAGE_ERROR", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});


// Unified user + limits payload for site/extension.
// Keeps /api/usage for backwards compatibility.

async function buildAccessEntitlements(handle) {
  const h = String(handle || "").trim();
  const day = todayKeyUTC();

  // keep referral reward ledger current for unlocks before we expose business gating
  try { awardReferralBonus(h); } catch (_e) {}
  try { maybeAwardStarterReward(h); } catch (_e) {}

  const u = userByHandle(h);
  const usage = await getUsageFor(h);
  const sub = usage?.sub || subscriptionInfo({ ...(u || {}), handle: h });

  const studioLimit = toolLimit(sub, 2, 999999);
  const studioUsed = getDailyUsed(h, day, "tool_studio");

  const bulkMaxPerCall = toolLimit(sub, 10, 50);
  const bulkCallsLimit = toolLimit(sub, 3, 999999);
  const bulkCallsUsed = getDailyUsed(h, day, "tool_bulk_calls");

  const historyLimit = toolLimit(sub, 20, 500);
  const favLimit = toolLimit(sub, 10, 200);

  const unlocks = usage?.limits?.referralUnlocks || computeReferralUnlocks(0, 0);
  const isUnlimited = !!sub?.isUnlimited;
  const paidLike = !!sub?.active;

  return {
    handle: h,
    sub,
    resetAt: usage?.resetAt || nextResetUTC(),
    usage: {
      gm: usage?.gm || { used: 0, limit: CONFIG.FREE_DAILY_BASE },
      gn: usage?.gn || { used: 0, limit: CONFIG.FREE_DAILY_BASE },
    },
    tools: {
      studio: { used: studioUsed, limit: studioLimit },
      bulk: { callsUsed: bulkCallsUsed, callsLimit: bulkCallsLimit, maxPerCall: bulkMaxPerCall },
      history: { limit: historyLimit, searchEnabled: !!sub?.active },
      favorites: { limit: favLimit },
    },
    limits: usage?.limits || { freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0, saveCapFree: CONFIG.SAVE_CAP_FREE, referralUnlocks: computeReferralUnlocks(0, 0) },
    extension: {
      plan: isUnlimited ? "unlimited" : paidLike ? "paid" : "free",
      insertMode: paidLike ? "unlimited" : "metered",
      dailyLimitPerKind: paidLike ? null : Number(usage?.gm?.limit || 0) || CONFIG.FREE_DAILY_BASE,
      saveCap: Number(usage?.limits?.saveCapFree || CONFIG.SAVE_CAP_FREE) || CONFIG.SAVE_CAP_FREE,
      backgrounds: {
        unlimited: !!unlocks?.unlimitedBg,
        slots: unlocks?.unlimitedBg ? null : (Number(unlocks?.bgSlots || 0) || 3),
        cosmeticsOnePack: !!unlocks?.cosmeticsOnePack,
        cosmeticsAllPacks: !!unlocks?.cosmeticsAllPacks,
      },
      unlocks: {
        proTrial7d: !!unlocks?.proTrial7dUnlocked,
        discount50: !!unlocks?.discount50Unlocked,
        toolkit: !!unlocks?.toolkitUnlocked,
        nextUnlockAt: unlocks?.nextUnlockAt ?? null,
      },
    },
    refreshedAt: new Date().toISOString(),
  };
}

app.get("/api/access/entitlements", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const payload = await buildAccessEntitlements(handle);
    res.json({ ok: true, ...payload });
  } catch (e) {
    console.error("ACCESS_ENTITLEMENTS_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
});


// Lightweight conversion/UX events from frontend (no PII; rate-limited)
const eventLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> String(req.user?.handle || clientIp(req)),
});

app.post("/api/event", eventLimiter, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const type = String(req.body?.type || "").trim();
    const meta = req.body?.meta && typeof req.body.meta === 'object' ? req.body.meta : null;

    // Anonymous events are allowed (for pre-connect UX); we simply acknowledge without storing.
    if (!handle){
      return res.json({ ok:true, stored:false });
    }

    const ALLOW = new Set(["tab_open","generate_click","limit_hit","upgrade_modal_open","pay_click","pay_success","pay_fail","pay_error","busy_try_again"]);
    if (!ALLOW.has(type)) return res.status(400).json({ ok:false, error:"invalid_event" });

    logActivity(handle, type, meta || {});
    res.json({ ok:true });
  }catch(e){
    console.error("EVENT_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const payload = await buildAccessEntitlements(handle);

    res.json({
      ok: true,
      handle: payload.handle,
      sub: payload.sub,
      resetAt: payload.resetAt,
      usage: payload.usage,
      tools: payload.tools,
      limits: payload.limits,
    });
  } catch (e) {
    console.error("ME_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
});

// Site generator (does not consume quota)
app.get("/api/generate", requireAuth, (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const reply = generateUnique(handle, kind, mode, lang, style, antiN);
    saveRecent(handle, kind, reply, mode, style);

    res.json({ ok: true, handle, kind, mode, lang, reply });
  } catch (e) {
    console.error("GENERATE_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
});

app.get("/api/generate-bulk", requireAuth, (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);
    let count = Number(req.query.count || 10);
    if (!Number.isFinite(count)) count = 10;
    count = Math.max(1, Math.min(200, Math.floor(count)));

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const list = generateRankedCandidates(handle, kind, mode, lang, style, count, antiN, false);

    for (const r of list) saveRecent(handle, kind, r, mode, style);

    res.json({ ok:true, handle, kind, mode, lang, count:list.length, list });
  } catch (e) {
    console.error("BULK_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
});



// ---------- CLOUD SYNC (Pro; server-side gated) ----------
function requirePro(req, res, next){
  const handle = req.user?.handle || null;
  const u0 = req.user && req.user.handle ? req.user : null;
  const u = u0 || userByHandle(handle);
  const sub = subscriptionInfo({ ...(u||{}), handle });
  if (sub?.active) return next();
  return res.status(402).json({ ok:false, error:"upgrade_required", feature:"cloud_sync" });
}


app.get("/api/cloud/lists", requireAuth, requirePro, async (req, res) => {
  try{
    const handle = req.user?.handle || null;

    const sb = getSupabaseAdmin();
    if (sb){
      const r = await sbCloudListsGet(handle);
      return res.json({ ok:true, handle, rows: r.rows });
    }

    // sqlite fallback
    const rows = safeDb(() => db.prepare(`
      SELECT kind, scope, lang, content, updated_at
      FROM cloud_lists
      WHERE handle=?
      ORDER BY updated_at DESC
    `).all(handle));
    res.json({ ok:true, handle, rows });
  }catch(e){
    console.error("CLOUD_LISTS_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/cloud/lists", requireAuth, requirePro, async (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok:false, error:"no_items" });

    const sb = getSupabaseAdmin();
    if (sb){
      const r = await sbCloudListsUpsert(handle, items);
      return res.json({ ok:true, handle, saved: r.saved, updated_at: r.updated_at });
    }

    // sqlite fallback
    const now = nowIso();
    safeDb(() => {
      const st = db.prepare(`
        INSERT INTO cloud_lists(handle, kind, scope, lang, content, updated_at)
        VALUES(?,?,?,?,?,?)
        ON CONFLICT(handle, kind, scope, lang)
        DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at
      `);
      const tx = db.transaction((arr) => {
        for (const it of arr){
          const kind = String(it?.kind||"").toLowerCase();
          const scope = String(it?.scope||"").toLowerCase();
          const lang = String(it?.lang||"*").toLowerCase();
          const content = String(it?.content||"");
          if (kind!=="gm" && kind!=="gn") continue;
          if (scope!=="global" && scope!=="lang") continue;
          if (content.length > 200000) continue; // hard cap
          st.run(handle, kind, scope, lang, content, now);
        }
      });
      tx(items);
    });

    res.json({ ok:true, handle, saved: items.length, updated_at: now });
  }catch(e){
    console.error("CLOUD_LISTS_POST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// ---------- PRO TOOLS (server-side gated; requires auth) ----------
function toolLimit(sub, freeLimit, proLimit){
  return sub?.active ? proLimit : freeLimit;
}
function toolError(res, feature, used, limit, proLimit){
  return res.status(402).json({ ok:false, error:"upgrade_required", feature, used, limit, proLimit });
}

// Studio preview: Free 2/day, Pro unlimited
app.get("/api/tools/preview", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const day = todayKeyUTC();
    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const limit = toolLimit(sub, 2, 999999);
    const used = getDailyUsed(handle, day, "tool_studio");
    if (used >= limit) return toolError(res, "studio", used, limit, 999999);

    const reply = generateUnique(handle, kind, mode, lang, style, antiN);
    incDaily(handle, day, "tool_studio", 1);

    res.json({ ok:true, handle, kind, mode, lang, reply, usage:{ used: used+1, limit } });
  }catch(e){
    console.error("TOOLS_PREVIEW_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Bulk: Free max 10/call and 3 calls/day, Pro max 50/call unlimited calls
app.get("/api/tools/bulk", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);
    let count = Number(req.query.count || 10);
    if (!Number.isFinite(count)) count = 10;
    count = Math.max(1, Math.min(200, Math.floor(count)));

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const day = todayKeyUTC();
    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const maxPerCall = toolLimit(sub, 10, 50);
    const callsLimit = toolLimit(sub, 3, 999999);

    const callsUsed = getDailyUsed(handle, day, "tool_bulk_calls");
    if (callsUsed >= callsLimit) return toolError(res, "bulk_calls", callsUsed, callsLimit, 999999);

    if (!sub.active && count > maxPerCall) {
      return toolError(res, "bulk_size", count, maxPerCall, 50);
    }
    count = Math.min(count, maxPerCall);

    const recent = getRecentSet(handle, kind, antiN);
    const seen = new Set();
    const list = [];
    let tries = 0;
    const maxTries = Math.max(3000, count * 300);

    while (list.length < count && tries < maxTries) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (recent.has(r)) continue;
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }
    while (list.length < count && tries < maxTries * 2) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }

    incDaily(handle, day, "tool_bulk_calls", 1);

    res.json({ ok:true, handle, kind, mode, lang, count:list.length, list, usage:{ callsUsed: callsUsed+1, callsLimit, maxPerCall } });
  }catch(e){
    console.error("TOOLS_BULK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// History: Free 20 items, Pro 500 + search
app.get("/api/tools/history", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "all").toLowerCase();
    const before = String(req.query.before || "").trim();
    const q = String(req.query.q || "").trim();

    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const limit = toolLimit(sub, 20, 500);

    if (q && !sub.active) return toolError(res, "history_search", 0, 0, 1);

    const rows = safeOptionalHistoryDb(() => {
      const params = [handle];
      let where = "handle=?";
      if (kind === "gm" || kind === "gn"){
        where += " AND kind=?";
        params.push(kind);
      }
      if (before){
        where += " AND created_at < ?";
        params.push(before);
      }
      if (q){
        where += " AND reply LIKE ?";
        params.push("%" + q + "%");
      }
      params.push(limit);

      return safeDb(() => db.prepare(
        `SELECT kind, reply, created_at FROM recent_replies WHERE ${where} ORDER BY created_at DESC LIMIT ?`
      ).all(...params));
    }, [], "tools_history_read");

    const nextBefore = rows.length ? rows[rows.length-1].created_at : "";
    res.json({ ok:true, handle, kind, q: q || "", limit, count: rows.length, nextBefore, rows });
  }catch(e){
    console.error("TOOLS_HISTORY_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Favorites: Free 10, Pro 200
app.get("/api/tools/favorites", requireAuth, async (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "all").toLowerCase();
    const sub = subscriptionInfo({ ...(req.user||{}), handle });

    const limit = toolLimit(sub, 10, 200);

    const sb = getSupabaseAdmin();
    if (sb){
      const r = await sbFavoritesGet(handle, kind, limit);
      return res.json({ ok:true, handle, kind, limit, count: r.rows.length, rows: r.rows });
    }

    // sqlite fallback
    let rows = [];
    safeDb(() => {
      const params = [handle];
      let where = "handle=?";
      if (kind === "gm" || kind === "gn"){
        where += " AND kind=?";
        params.push(kind);
      }
      params.push(limit);
      rows = db.prepare(
        `SELECT kind, reply, created_at FROM favorites WHERE ${where} ORDER BY created_at DESC LIMIT ?`
      ).all(...params);
    });

    res.json({ ok:true, handle, kind, limit, count: rows.length, rows });
  }catch(e){
    console.error("TOOLS_FAVORITES_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/tools/favorites/toggle", requireAuth, async (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.body?.kind || "").toLowerCase();
    const reply = String(req.body?.reply || "").trim();

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!reply) return res.status(400).json({ ok:false, error:"invalid_reply" });

    const sub = subscriptionInfo({ ...(req.user||{}), handle });
    const max = toolLimit(sub, 10, 200);

    const h = sha256(reply).slice(0, 24);

    const sb = getSupabaseAdmin();
    if (sb){
      const ex = await sbFavoritesHas(handle, kind, h);
      if (ex.exists){
        await sbFavoritesDelete(handle, kind, h);
        return res.json({ ok:true, action:"removed" });
      }

      const cnt = await sbFavoritesCount(handle);
      if ((cnt.count || 0) >= max) return toolError(res, "favorites_limit", cnt.count || 0, max, 200);

      await sbFavoritesUpsert(handle, kind, h, reply);
      return res.json({ ok:true, action:"added" });
    }

    // sqlite fallback
    const existing = safeDb(() => db.prepare(
      "SELECT 1 AS x FROM favorites WHERE handle=? AND kind=? AND reply_hash=?"
    ).get(handle, kind, h));

    if (existing?.x){
      safeDb(() => db.prepare(
        "DELETE FROM favorites WHERE handle=? AND kind=? AND reply_hash=?"
      ).run(handle, kind, h));
      return res.json({ ok:true, action:"removed" });
    }

    const cnt = safeDb(() => db.prepare(
      "SELECT COUNT(*) AS c FROM favorites WHERE handle=?"
    ).get(handle)?.c || 0);
    if (cnt >= max) return toolError(res, "favorites_limit", cnt, max, 200);

    safeDb(() => db.prepare(
      "INSERT OR REPLACE INTO favorites(handle, kind, reply_hash, reply, created_at) VALUES(?,?,?,?,?)"
    ).run(handle, kind, h, reply, nowIso()));

    res.json({ ok:true, action:"added" });
  }catch(e){
    console.error("TOOLS_FAVORITES_TOGGLE_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Consume quota without generating (for list inserts from extension)
app.post("/api/consume", requireAuth, consumeLimiter, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.body?.kind || req.query?.kind || "").toLowerCase();
    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");

    const day = todayKeyUTC();
    try { awardReferralBonus(handle); } catch (_e) {}
    try { maybeAwardStarterReward(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const limit = await insertLimitForUser({ ...u, handle }, { userRow: u });

    const sub = subscriptionInfo({ ...u, handle });
    const plan = sub.active ? "pro" : "free";

    const consume = supabaseActive()
      ? await sbConsumeDailyAtomic(handle, day, kind, limit, 1, plan)
      : consumeDailyAtomic(handle, day, kind, limit, 1);

    if (!consume.ok) {
      if (consume.error === "supabase_error" || consume.error === "supabase_inactive") {
        return res.status(503).json({
          ok: false,
          error: "supabase_error",
          detail: consume._sb_error || null,
          resetAt: nextResetUTC(),
        });
      }
      return res.status(429).json({
        ok: false,
        error: "limit_reached",
        used: consume.used,
        limit: consume.limit,
        resetAt: nextResetUTC(),
      });
    }

    try {
      logActivity(handle, "consume", { kind });
    } catch {}

    return res.json({
      ok: true,
      handle,
      kind,
      usage: {
        used: consume.used,
        limit: consume.limit,
        remaining:
          Number.isFinite(limit) && limit < 999999 ? Math.max(0, limit - consume.used) : null,
        resetAt: nextResetUTC(),
      },
    });
  } catch (e) {
    console.error("CONSUME_ERROR", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});



// Extension endpoint (consumes quota)
app.get("/api/random", requireAuth, genBurstLimiter, async (req, res) => {
  let slotAcquired = false;
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const guard = await enforceGenGuard(req, res, 'single');
    if (!guard.ok) return res.status(guard.status).json(guard.body);

    const gotSlot = await GEN_SEMAPHORE.acquire(8000);
    if (!gotSlot){
      try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style }); }catch{}
      return res.status(503).json({ ok:false, error:'busy_try_again' });
    }
    slotAcquired = true;


    const day = todayKeyUTC();
    try { awardReferralBonus(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const limit = await insertLimitForUser({ ...u, handle }, { userRow: u });

    const sub = subscriptionInfo({ ...u, handle });
    const plan = sub.active ? "pro" : "free";


    // consume quota atomically (prevents parallel overspend)
    const consume = supabaseActive()
      ? await sbConsumeDailyAtomic(handle, day, kind, limit, 1, plan)
      : consumeDailyAtomic(handle, day, kind, limit, 1);
    if (!consume.ok) {
      if (consume.error === "supabase_error" || consume.error === "supabase_inactive") {
        try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style, sb: consume._sb_error || null }); }catch{}
        return res.status(503).json({
          ok: false,
          error: "supabase_error",
          detail: consume._sb_error || null,
          resetAt: nextResetUTC(),
        });
      }
      try{ logActivity(handle, 'limit_hit', { kind, used: consume.used, limit: consume.limit, resetAt: nextResetUTC() }); }catch{}
      return res.status(429).json({ ok:false, error:"limit_reached", used: consume.used, limit: consume.limit, resetAt: nextResetUTC() });
    }

    const reply = generateUnique(handle, kind, mode, lang, style, antiN);
    saveRecent(handle, kind, reply, mode, style);
    logActivity(handle, 'gen', { kind, mode, lang, style, antiN });
    const newUsed = consume.used;

    res.json({
      ok:true,
      handle,
      kind,
      reply,
      usage:{ used:newUsed, limit, remaining: (Number.isFinite(limit) && limit < 999999) ? Math.max(0, limit-newUsed) : null, resetAt: nextResetUTC() }
    });
  } catch (e) {
    console.error("RANDOM_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  } finally {
    if (slotAcquired) GEN_SEMAPHORE.release();
  }
});


app.get("/api/random-bulk", requireAuth, bulkBurstLimiter, async (req, res) => {
  let slotAcquired = false;
  try {
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "").toLowerCase();
    const mode = String(req.query.mode || "min").toLowerCase();
    const lang = normLang(req.query.lang);
    const style = String(req.query.style || "classic").toLowerCase();
    const antiN = parseAntiLastN(req, 20);
    // Support multiple param names for convenience/compat with older clients.
    // count is canonical; n/limit are accepted aliases.
    let count = Number((req.query.count ?? req.query.n ?? req.query.limit) ?? 10);
    if (!Number.isFinite(count)) count = 10;
    count = Math.max(1, Math.min(200, Math.floor(count)));

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const guard = await enforceGenGuard(req, res, 'bulk');
    if (!guard.ok) return res.status(guard.status).json(guard.body);

    const gotSlot = await GEN_SEMAPHORE.acquire(12000);
    if (!gotSlot){
      try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style, count }); }catch{}
      return res.status(503).json({ ok:false, error:'busy_try_again' });
    }
    slotAcquired = true;


    const day = todayKeyUTC();
    try { awardReferralBonus(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const limit = await insertLimitForUser({ ...u, handle }, { userRow: u });

    const sub = subscriptionInfo({ ...u, handle });
    const plan = sub.active ? "pro" : "free";


    const consume = supabaseActive()
      ? await sbConsumeDailyAtomic(handle, day, kind, limit, count, plan)
      : consumeDailyAtomic(handle, day, kind, limit, count);
    if (!consume.ok) {
      if (consume.error === "supabase_error" || consume.error === "supabase_inactive") {
        try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style, count, sb: consume._sb_error || null }); }catch{}
        return res.status(503).json({
          ok: false,
          error: "supabase_error",
          detail: consume._sb_error || null,
          resetAt: nextResetUTC(),
        });
      }
      const curUsed = consume.used;
      try{ logActivity(handle, 'limit_hit', { kind, used: curUsed, limit: consume.limit, requested: count, resetAt: nextResetUTC() }); }catch{}
      return res.status(429).json({
        ok:false,
        error:"limit_reached",
        used: curUsed,
        limit: consume.limit,
        requested: count,
        remaining: Math.max(0, consume.limit - curUsed),
        resetAt: nextResetUTC()
      });
    }

    const recent = getRecentSet(handle, kind, antiN);
    const seen = new Set();
    const list = [];
    let tries = 0;
    const maxTries = Math.max(4000, count * 400);

    while (list.length < count && tries < maxTries) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (recent.has(r)) continue;
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }

    // If still short, relax anti-repeat but keep batch uniqueness
    while (list.length < count && tries < maxTries * 2) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }

    for (const r of list) saveRecent(handle, kind, r, mode, style);
    logActivity(handle, 'gen_bulk', { kind, mode, lang, style, antiN, count: list.length });

    const newUsed = consume.used;

    res.json({
      ok:true,
      handle,
      kind,
      mode,
      lang,
      count: list.length,
      list,
      usage:{ used:newUsed, limit, remaining: (Number.isFinite(limit) && limit < 999999) ? Math.max(0, limit-newUsed) : null, resetAt: nextResetUTC() }
    });
  } catch (e) {
    console.error("RANDOM_BULK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  } finally {
    if (slotAcquired) GEN_SEMAPHORE.release();
  }
});


// Track referral link clicks (promoter analytics; no auth)
app.get("/api/referral/click", async (req, res) => {
  try {
    const ref = String(req.query.ref || req.query.code || "").trim();
    if (!ref) return res.json({ ok:true });

    // only count clicks for valid codes
    const owner = safeDb(() => db.prepare("SELECT handle FROM users WHERE ref_code=?").get(ref));
    if (!owner?.handle) return res.json({ ok:true });

    const fp = referralFingerprint(req);

    // Supabase is source of truth in supabase mode
    if (supabaseActive()) {
      try { await sbRefClicksUpsert(ref, fp); } catch (e) { console.warn("SB_REF_CLICK_ERROR", e?.message || e); }
    }

    // Keep sqlite for back-compat / legacy UIs
    safeDb(() => {
      db.prepare(
        "INSERT OR IGNORE INTO ref_clicks(code, fingerprint, created_at) VALUES(?,?,?)"
      ).run(ref, fp, nowIso());
    });

    res.json({ ok:true });
  } catch (e) {
    console.error("REF_CLICK_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Referrals
app.get("/api/referral/stats", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const origin = originFromReq(req);

    try { awardReferralBonus(handle); } catch (_e) {}

    const u = userByHandle(handle);
    const refCode = u?.ref_code || "";

    let legacyReferrals = 0;
    let confirmedRefs = 0;
    let activeRefs = 0;
    let clicks = 0;
    let ownerActive = false;

    if (supabaseActive()) {
      try { await sbBackfillInvitesFromSqlite(handle); } catch (e) { console.warn("SB_REF_BACKFILL_ERROR", e?.message || e); }

      try { legacyReferrals = (await sbReferralsCount(handle, "legacy")).count || 0; } catch {}
      try { confirmedRefs = (await sbReferralsCount(handle, "confirmed")).count || 0; } catch {}
      try { activeRefs = (await sbReferralsCount(handle, "active")).count || 0; } catch {}

      if (refCode) {
        try { clicks = (await sbRefClicksCount(refCode)).count || 0; } catch {}
      }

      try { ownerActive = !!(await sbUsageEverUsed(handle)).active; } catch { ownerActive = false; }
    } else {
      legacyReferrals = refCode
        ? (safeDb(() =>
            db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCode)?.c || 0
          ) || 0)
        : 0;

      confirmedRefs = referralCountConfirmed(handle);
      activeRefs = referralCountActive(handle);

      clicks = refCode
        ? (safeDb(() =>
            db.prepare("SELECT COUNT(*) AS c FROM ref_clicks WHERE code=?").get(refCode)?.c || 0
          ) || 0)
        : 0;

      ownerActive = safeDb(() => (db
        .prepare("SELECT SUM(used) AS s FROM usage_daily WHERE handle=? AND used>0")
        .get(handle)?.s || 0)) > 0;
    }

    const promo = await getReferralPromoterSummary(handle, {
      userRow: u,
      refCode,
      legacyReferrals,
      confirmedRefs,
      activeRefs,
      clicks,
    });
    const strictEligibleRefs = Math.max(0, Number(promo?.strictEligibleRefs || 0) || 0);
    const eligibleRefs = Math.max(0, Number(promo?.eligibleRefs || 0) || 0);
    const adminEligibleCredits = referralRewardTotal(handle, 'eligible_credit');
    const starterBgSlots = referralRewardTotal(handle, 'starter_bg_slot');
    const effectiveEligibleRefs = eligibleRefs + adminEligibleCredits;
    const unlocks = computeReferralUnlocks(effectiveEligibleRefs, starterBgSlots);

    const dailyLimit = await insertLimitForUser({ ...u, handle }, promo);

    res.json({
      ok: true,
      refCode,
      confirmedRefs,
      activeRefs,
      strictEligibleRefs,
      eligibleRefs,
      effectiveEligibleRefs,
      adminEligibleCredits,
      legacyReferrals,
      clicks,
      dailyLimit,
      freeDaily: CONFIG.FREE_DAILY_BASE,
      dailyBonus: Math.max(0, Number(promo?.dailyBonus || 0) || 0),
      bonusCap: CONFIG.REF_BONUS_CAP,
      ownerActive,
      bonusPer20: Math.max(0, Number(promo?.bonusPer20 || 0) || 0),
      bonusChunks: Math.max(0, Number(promo?.bonusChunks || 0) || 0),
      nextBonusAt: promo?.nextBonusAt == null ? null : (Number(promo.nextBonusAt || 0) || 0),
      promoter: !!promo?.promoter,
      unlocks,
      starter: { starterBgSlots },
      rewards: {
        proTrial7dUnlocked: unlocks.proTrial7dUnlocked,
        discount50Unlocked: unlocks.discount50Unlocked,
        toolkitUnlocked: unlocks.toolkitUnlocked,
      },
      refLink: refCode ? `${origin}/app?ref=${refCode}` : "",
      // Back-compat fields used by older UIs:
      referrals: eligibleRefs,
      eligible: eligibleRefs,
    });
  } catch (e) {
    console.error("REF_STATS_ERROR", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// List invited users for a promoter (P1)

// List invited users for a promoter (P1)
app.get("/api/referral/list", requireAuth, async (req, res) => {
  try{
    const inviter = req.user.handle;
    const days = Math.max(7, Math.min(90, Number(req.query.days || 30) || 30));
    const sinceIso = new Date(Date.now() - days*24*60*60*1000).toISOString();
    const sinceDay = sinceIso.slice(0,10);

    // Supabase source-of-truth in supabase mode
    if (supabaseActive()) {
      try { await sbBackfillInvitesFromSqlite(inviter); } catch (e) { console.warn("SB_REF_BACKFILL_LIST_ERROR", e?.message || e); }

      const sb = getSupabaseAdmin();
      if (sb) {
        const rr = await sb
          .from("referrals")
          .select("invited_handle, created_at, confirmed_at, first_use_at")
          .eq("inviter_handle", inviter)
          .eq("legacy", false)
          .not("confirmed_at", "is", null)
          .order("created_at", { ascending: false })
          .limit(500);

        if (rr.error) throw rr.error;

        const base = (rr.data || []).map((r)=>({
          handle: String(r.invited_handle || "").trim(),
          joinedAt: r.created_at || null,
          confirmedAt: r.confirmed_at || null,
          firstUseAt: r.first_use_at || null,
        })).filter(x => !!x.handle);

        const handles = base.map(x => x.handle);

        // Best-effort usage summary (may be limited by API max rows).
        const usageAgg = new Map(); // handle -> { used_total, active_days, last_day }
        if (handles.length) {
          try{
            const ur = await sb
              .from("usage_daily")
              .select("handle, day, gm_used, gn_used")
              .in("handle", handles)
              .gte("day", sinceDay)
              .or("gm_used.gt.0,gn_used.gt.0")
              .range(0, 20000);

            if (ur.error) throw ur.error;

            for (const row of (ur.data || [])) {
              const h = String(row.handle || "").trim();
              const day = String(row.day || "").trim();
              const gm = Number(row.gm_used || 0) || 0;
              const gn = Number(row.gn_used || 0) || 0;
              const sum = gm + gn;
              if (!h || !day || sum <= 0) continue;

              const cur = usageAgg.get(h) || { used_total: 0, active_days: 0, days: new Set(), last_day: null };
              cur.used_total += sum;
              if (!cur.days.has(day)) {
                cur.days.add(day);
                cur.active_days += 1;
              }
              if (!cur.last_day || String(day) > String(cur.last_day)) cur.last_day = day;
              usageAgg.set(h, cur);
            }
          }catch(e){
            console.warn("SB_REF_LIST_USAGE_ERROR", e?.message || e);
          }
        }

        // Best-effort last_seen (optional column)
        const lastSeen = new Map();
        if (handles.length) {
          try{
            const ur = await sb.from("users").select("handle, last_seen").in("handle", handles).range(0, 2000);
            if (ur.error) throw ur.error;
            for (const r of (ur.data || [])) {
              const h = String(r.handle || "").trim();
              if (h) lastSeen.set(h, r.last_seen || null);
            }
          }catch(e){
            // ignore if column missing or RLS blocks
          }
        }

        const list = base.map((r)=> {
          const agg = usageAgg.get(r.handle);
          const inserts = agg ? Number(agg.used_total || 0) : 0;
          const activeDays = agg ? Number(agg.active_days || 0) : 0;
          const hasActivity = !!r.firstUseAt || inserts > 0;
          const statusInfo = classifyReferralEntry({ activeDays, inserts, fraud: false, fraudReason: null, hasActivity });
          return {
            handle: r.handle,
            joinedAt: r.joinedAt,
            confirmedAt: r.confirmedAt,
            inserts,
            activeDays,
            lastInsertAt: agg?.last_day ? (String(agg.last_day) + "T00:00:00Z") : null,
            lastSeen: lastSeen.get(r.handle) ?? null,
            fraud: false,
            fraudReason: null,
            eligible: statusInfo.eligible,
            status: statusInfo.status,
            notCountedReason: statusInfo.notCountedReason,
          };
        });

        return res.json({ ok:true, days, inviter, list, thresholds: { minDays: REF_MIN_ACTIVE_DAYS, minUses: REF_MIN_ACTIVE_USES } });
      }
      // If Supabase is misconfigured mid-flight, fall back to sqlite below.
    }

    // SQLite fallback (legacy / offline)
    const rows = safeDb(() => db.prepare(`
      SELECT
        ri.invited_handle AS handle,
        ri.created_at AS joined_at,
        ri.confirmed_at AS confirmed_at,
        COALESCE(ud.used_total, 0) AS used_total,
        COALESCE(ud.active_days, 0) AS active_days,
        COALESCE(ud.last_day, NULL) AS last_day,
        COALESCE(u.last_seen, NULL) AS last_seen,
        COALESCE(ri.fraud_flag, 0) AS fraud_flag,
        COALESCE(ri.fraud_reason, NULL) AS fraud_reason,
        EXISTS (SELECT 1 FROM usage_daily ud2 WHERE ud2.handle=ri.invited_handle AND ud2.used>0 LIMIT 1) AS ever_used
      FROM referral_invites ri
      LEFT JOIN users u ON u.handle = ri.invited_handle
      LEFT JOIN (
        SELECT
          handle,
          SUM(used) AS used_total,
          COUNT(DISTINCT day) AS active_days,
          MAX(day) AS last_day
        FROM usage_daily
        WHERE day >= ? AND used > 0
        GROUP BY handle
      ) ud ON ud.handle = ri.invited_handle
      WHERE ri.inviter_handle=? AND ri.status='confirmed'
      ORDER BY ri.created_at DESC
      LIMIT 500
    `).all(sinceDay, inviter)) || [];

    const list = rows.map((r)=>{
      const inserts = Number(r.used_total||0) || 0;
      const activeDays = Number(r.active_days||0) || 0;
      const fraud = !!Number(r.fraud_flag||0);
      const fraudReason = r.fraud_reason || null;
      const hasActivity = !!Number(r.ever_used||0);
      const statusInfo = classifyReferralEntry({ activeDays, inserts, fraud, fraudReason, hasActivity });
      return {
        handle: r.handle,
        joinedAt: r.joined_at,
        confirmedAt: r.confirmed_at,
        inserts,
        activeDays,
        lastInsertAt: r.last_day ? (String(r.last_day) + "T00:00:00Z") : null,
        lastSeen: r.last_seen || null,
        fraud,
        fraudReason,
        eligible: statusInfo.eligible,
        status: statusInfo.status,
        notCountedReason: statusInfo.notCountedReason,
      };
    });

    return res.json({ ok:true, days, inviter, list, thresholds: { minDays: REF_MIN_ACTIVE_DAYS, minUses: REF_MIN_ACTIVE_USES } });
  }catch(e){
    console.error("REFERRAL_LIST_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Public leaderboard for referrals (P1)
// Public leaderboard for referrals (P1)
app.get("/api/leaderboard/referrals", (req, res) => {
  try{
    const days = Math.max(7, Math.min(180, Number(req.query.days || 30) || 30));
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

    // Optional "me" block if caller provides a token
    let me = null;
    try{
      const tok = getBearer(req);
      const u = userByToken(tok);
      if (u && validHandle(u.handle)){
        const mine = safeDb(() => db.prepare(`
          SELECT
            SUM(CASE WHEN EXISTS (
              SELECT 1 FROM usage_daily ud
              WHERE ud.handle = ri.invited_handle AND ud.used > 0
              LIMIT 1
            ) THEN 1 ELSE 0 END) AS eligible
          FROM referral_invites ri
          WHERE ri.status='confirmed'
            AND ri.created_at >= ?
            AND (ri.fraud_flag IS NULL OR ri.fraud_flag=0)
            AND ri.inviter_handle=?
        `).get(sinceIso, u.handle)?.eligible || 0);
        me = { handle: u.handle, eligible: Number(mine||0) || 0 };
      }
    }catch(_e){}

    // On leaderboard, eligible == active (legacy isn't used for ranking).
    res.json({ ok:true, days, rules: { confirmed: "invite via ref link", active: "usage_daily.used > 0", eligible: "active (leaderboard)" }, top: top.map(r=>({
      handle: r.handle,
      confirmed: Number(r.confirmed||0)||0,
      active: Number(r.active||0)||0,
      eligible: Number(r.active||0)||0
    })), me });
  }catch(e){
    console.error("LEADERBOARD_REFERRALS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});




// Activity log
app.get("/api/activity", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    let limit = Number(req.query?.limit ?? 50);
    if (!Number.isFinite(limit)) limit = 50;
    limit = Math.max(1, Math.min(200, Math.floor(limit)));

    const rows = safeDb(() => db.prepare(
      "SELECT event_type, meta_json, created_at FROM activity_log WHERE handle=? ORDER BY created_at DESC LIMIT ?"
    ).all(handle, limit)) || [];

    res.json({ ok:true, items: rows.map(r => ({
      type: r.event_type,
      meta: (()=>{ try{ return r.meta_json ? JSON.parse(r.meta_json) : null; }catch{ return null; } })(),
      createdAt: r.created_at
    })) });
  }catch(e){
    console.error("ACTIVITY_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Feature flags (admin-only)
app.get("/api/features", requireAuth, (req, res) => {
  try{
    if (!isAdminHandle(req.user.handle)) return res.status(403).json({ ok:false, error:"forbidden" });
    const rows = safeDb(() => db.prepare("SELECT key, value, updated_at FROM settings WHERE key LIKE 'feature:%' ORDER BY key ASC").all()) || [];
    res.json({ ok:true, flags: rows.map(r => ({
      key: String(r.key||'').replace(/^feature:/,''),
      value: String(r.value||'') === '1',
      updatedAt: r.updated_at
    }))});
  }catch(e){
    console.error("FEATURES_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/features", requireAuth, (req, res) => {
  try{
    if (!isAdminHandle(req.user.handle)) return res.status(403).json({ ok:false, error:"forbidden" });
    const key = String(req.body?.key || '').trim();
    const value = !!req.body?.value;
    if (!key || key.length > 64) return res.status(400).json({ ok:false, error:"invalid_key" });
    setFeatureFlag(key, value);
    logActivity(req.user.handle, 'feature_flag_set', { key, value });
    res.json({ ok:true, key, value });
  }catch(e){
    console.error("FEATURES_SET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Billing
app.get("/api/billing/plans", async (req, res) => {
  // Public RPC for client-side transaction submission.
  // Can be a load-balanced endpoint (Helius/QuickNode/etc.).
  const rpcPublic =
    process.env.SOLANA_RPC_PUBLIC ||
    process.env.SOLANA_RPC ||
    "https://api.mainnet-beta.solana.com";
  let solUsd = 0;
  try { solUsd = await getSolUsd(); } catch { solUsd = 0; }

  const plans = BILLING_PLANS.map((p) => {
    const lamports = solUsd > 0 ? quoteSolLamportsFromUsd(p.usd, solUsd) : 0n;
    const solApprox = lamports > 0n ? Number(lamports) / 1_000_000_000 : 0;
    return { ...p, solApprox, currencyBase: "USD" };
  });

  res.json({ ok:true, receiver: SOL_RECEIVER, plans, tokens: BILLING_TOKENS, solUsd, rpcPublic });
});


function arcadeCoverAllowedSource(src) {
  const value = String(src || "").trim();
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = String(url.hostname || "").toLowerCase();
    return host === "images.crazygames.com" || host === "images.unsplash.com";
  } catch {
    return false;
  }
}

app.get("/api/arcade/cover", async (req, res) => {
  try {
    const src = String(req.query?.src || "").trim();
    if (!arcadeCoverAllowedSource(src)) return res.status(400).json({ ok:false, error:"invalid_src" });
    const upstream = await fetch(src, {
      headers: {
        "User-Agent": "GMXReply/arcade-cover-proxy",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.gmxreply.com/arcade.html",
      }
    });
    if (!upstream.ok) return res.status(502).json({ ok:false, error:"cover_fetch_failed" });
    const contentType = String(upstream.headers.get("content-type") || "image/png");
    const cacheControl = String(upstream.headers.get("cache-control") || "public, max-age=21600");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl.includes("max-age") ? cacheControl : "public, max-age=21600");
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (e) {
    console.error("ARCADE_COVER_PROXY_ERROR", e);
    res.status(502).json({ ok:false, error:"cover_fetch_failed" });
  }
});

app.get("/api/solana/latest-blockhash", requireAuth, async (_req, res) => {
  try {
    const result = await solanaRpcRequest("getLatestBlockhash", [{ commitment: "finalized" }]);
    res.json({ ok:true, ...result });
  } catch (e) {
    console.error("SOLANA_BLOCKHASH_ERROR", e);
    res.status(503).json({ ok:false, error:"solana_rpc_unavailable" });
  }
});

app.post("/api/solana/send-raw", requireAuth, async (req, res) => {
  try {
    let raw = req.body?.raw;
    if (Array.isArray(raw)) raw = Buffer.from(raw).toString("base64");
    raw = String(raw || "").trim();
    if (!raw) return res.status(400).json({ ok:false, error:"raw_required" });

    const opts = {
      encoding: "base64",
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    };
    const sig = await solanaRpcRequest("sendTransaction", [raw, opts]);
    res.json({ ok:true, sig });
  } catch (e) {
    console.error("SOLANA_SEND_RAW_ERROR", e);
    res.status(503).json({ ok:false, error:"solana_rpc_unavailable" });
  }
});

app.post("/api/billing/intent", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const planKey = String(req.body?.planKey || "").trim();
    const currency = String(req.body?.currency || "SOL").trim().toUpperCase();

    const plan = BILLING_PLANS.find((p) => p.key === planKey);
    if (!plan) return res.status(400).json({ ok:false, error:"invalid_plan" });

    const token = BILLING_TOKENS.find((t) => t.key === currency);
    if (!token) return res.status(400).json({ ok:false, error:"invalid_currency" });

    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    let amountBase = 0n;
    let amountUi = "0";
    let solUsd = 0;
    let mint = null;

    if (token.kind === "native") {
      solUsd = await getSolUsd();
      amountBase = quoteSolLamportsFromUsd(plan.usd, solUsd);
      if (amountBase <= 0n) {
        return res.status(503).json({ ok:false, error:"price_unavailable" });
      }
      amountUi = uiFromBaseUnits(amountBase.toString(), 9);
    } else {
      mint = String(token.mint || "").trim();
      const base = BigInt(Math.round(Number(plan.usd) * 1e6));
      amountBase = base;
      amountUi = String(plan.usd);
    }

    const intentId = randHex(12);
    const nonce = randHex(16);
    const bindMessage = buildBillingBindMessage(handle, intentId, nonce);

    // Garbage collect old intents.
    safeDb(() => {
      db.prepare("DELETE FROM billing_intents WHERE expires_at < ?").run(new Date(now.getTime() - 24*3600*1000).toISOString());
    });

    safeDb(() => {
      db.prepare(
        "INSERT INTO billing_intents(id, handle, plan, currency, mint, amount_base, sol_usd, created_at, expires_at, used_sig, nonce, nonce_sig, status, payer, confirmed_at) VALUES(?,?,?,?,?,?,?,?,?,NULL,?,NULL,'created',NULL,NULL)"
      ).run(intentId, handle, plan.key, currency, mint, amountBase.toString(), solUsd || null, createdAt, expiresAt, nonce);
    });

    logActivity(handle, 'billing_intent_created', { intentId, plan: plan.key, currency });

    res.json({
      ok:true,
      id: intentId,
      intentId,
      receiver: SOL_RECEIVER,
      plan: { ...plan },
      currency,
      mint,
      decimals: Number(token.decimals || 0),
      amountBase: amountBase.toString(),
      amountUi,
      solUsd: solUsd || 0,
      createdAt,
      expiresAt,
      nonce,
      bindMessage,
      bindRequired: true,
    });
  } catch (e) {
    console.error("BILLING_INTENT_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


function maskHandleForProof(h) {
  const t = String(h || "").trim();
  if (!t) return "";
  // Keep just a little bit for social proof without doxxing.
  if (t.length <= 4) return t.slice(0, 1) + "…" + t.slice(-1);
  return t.slice(0, 2) + "…" + t.slice(-2);
}
function shortSigForProof(sig) {
  const s = String(sig || "").trim();
  if (!s) return "";
  if (s.length <= 12) return s;
  return s.slice(0, 6) + "…" + s.slice(-6);
}

app.get("/api/billing/proof", (req, res) => {
  try {
    let limit = Number(req.query?.limit ?? 8);
    if (!Number.isFinite(limit)) limit = 8;
    limit = Math.max(1, Math.min(20, Math.floor(limit)));

    const totalPayments =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM payments").get()?.c || 0);

    const totalPayers =
      safeDb(() => db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM payments").get()?.c || 0);

    const recent = safeDb(() =>
      db.prepare(
        "SELECT sig, handle, plan, currency, amount, created_at FROM payments ORDER BY created_at DESC LIMIT ?"
      ).all(limit)
    ) || [];

    res.json({
      ok: true,
      receiver: SOL_RECEIVER,
      totalPayments,
      totalPayers,
      recent: recent.map(r => ({
        handle: maskHandleForProof(r.handle),
        plan: r.plan,
        currency: r.currency || "SOL",
        amount: r.amount,
        createdAt: r.created_at,
        tx: shortSigForProof(r.sig)
      })),
    });
  } catch (e) {
    console.error("BILLING_PROOF_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


function extractSig(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  const m = s.match(/([A-Za-z0-9]{40,})/g);
  if (!m) return "";
  return m.sort((a,b)=>b.length-a.length)[0];
}

function solanaRpcUrls() {
  const seen = new Set();
  const out = [];
  const push = (raw) => {
    const value = String(raw || "").trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  };
  push(process.env.SOLANA_RPC);
  push(process.env.SOLANA_RPC_PUBLIC);
  // Hard fallback: if a custom RPC returns 403 / rate-limit / bad gateway,
  // keep checkout alive with the canonical public endpoint.
  push("https://api.mainnet-beta.solana.com");
  return out;
}

async function solanaRpcRequest(method, params) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params: Array.isArray(params) ? params : [],
  };
  let lastErr = null;
  for (const rpc of solanaRpcUrls()) {
    try {
      const r = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || j.error) {
        const err = new Error("solana_rpc_unavailable");
        err.status = r.status;
        err.detail = j?.error || null;
        err.rpc = rpc;
        lastErr = err;
        continue;
      }
      return j.result;
    } catch (e) {
      const err = (e instanceof Error) ? e : new Error("solana_rpc_unavailable");
      err.rpc = rpc;
      lastErr = err;
    }
  }
  throw lastErr || new Error("solana_rpc_unavailable");
}

async function solanaGetTransaction(sig) {
  try {
    return await solanaRpcRequest("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
  } catch {
    return null;
  }
}

function lamportsToSol(lamports) {
  return Number(lamports) / 1_000_000_000;
}

function collectParsedTransferLamports(ix, receiver, payer) {
  // Works for jsonParsed instructions (system transfer)
  try {
    if (ix?.parsed?.type !== "transfer") return 0;
    const info = ix.parsed.info || {};
    const dest = info.destination;
    const src = info.source;
    const lamports = Number(info.lamports || 0);
    if (dest !== receiver) return 0;
    if (payer && src !== payer) return 0;
    if (lamports > 0) return lamports;
  } catch {}
  return 0;
}

async function verifySolPayment(sig, receiver, minSol, payer) {
  const tx = await solanaGetTransaction(sig);
  if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };

  // Must be a successful transaction
  if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

  const msg = tx.transaction.message;
  const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

  // Inner instructions (CPI) can contain the actual transfer; include them.
  const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
  const innerInst = [];
  for (const g of inner) {
    const arr = Array.isArray(g?.instructions) ? g.instructions : [];
    for (const ix of arr) innerInst.push(ix);
  }

  let paidLamports = 0;
  for (const ix of topInst) paidLamports += collectParsedTransferLamports(ix, receiver, payer);
  for (const ix of innerInst) paidLamports += collectParsedTransferLamports(ix, receiver, payer);

  if (payer && paidLamports <= 0) return { ok:false, reason:"payer_mismatch" };

  const paidSol = lamportsToSol(paidLamports);
  if (paidSol + 1e-9 < minSol) return { ok:false, reason:"amount_too_low", paidSol };

  return { ok:true, paidSol };
}

function txHasSigner(tx, signer) {
  const want = String(signer || "").trim();
  if (!want) return false;
  const keys = tx?.transaction?.message?.accountKeys || [];
  for (const k of keys) {
    if (typeof k === "string") {
      if (k === want) return true;
    } else {
      const pk = String(k?.pubkey || "");
      const isSigner = !!k?.signer;
      if (pk === want && isSigner) return true;
    }
  }
  return false;
}

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

function b58DecodeToBuf(str){
  try{
    const ALPH = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const MAP = new Map(ALPH.split("").map((c,i)=>[c,i]));
    let bytes = [0];
    for (const ch of String(str||"")){
      const val = MAP.get(ch);
      if (val == null) return null;
      let carry = val;
      for (let i=0;i<bytes.length;i++){
        carry += bytes[i] * 58;
        bytes[i] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0){
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }
    // deal with leading zeros
    let zeros = 0;
    for (const ch of String(str||"")){
      if (ch === "1") zeros++;
      else break;
    }
    while (zeros-- > 0) bytes.push(0);
    bytes.reverse();
    return Buffer.from(bytes);
  }catch{
    return null;
  }
}

function txExtractMemoStrings(tx){
  const out = [];
  const add = (ix)=>{
    try{
      const program = String(ix?.program || "");
      const pid = String(ix?.programId || "");
      const isMemo = (program === "spl-memo") || (pid === MEMO_PROGRAM_ID);
      if (!isMemo) return;

      const p = ix?.parsed;
      if (typeof p === "string" && p) out.push(p);
      if (p && typeof p === "object"){
        if (typeof p.memo === "string" && p.memo) out.push(p.memo);
        if (p.info && typeof p.info.memo === "string" && p.info.memo) out.push(p.info.memo);
      }

      // Fallback: raw data (base58) to utf8
      const data = ix?.data;
      if (typeof data === "string" && data){
        const buf = b58DecodeToBuf(data);
        if (buf){
          const s = buf.toString("utf8").replace(/\0/g, "").trim();
          if (s) out.push(s);
        }
      }
    }catch{}
  };

  const topInst = Array.isArray(tx?.transaction?.message?.instructions) ? tx.transaction.message.instructions : [];
  for (const ix of topInst) add(ix);

  const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
  for (const g of inner){
    const arr = Array.isArray(g?.instructions) ? g.instructions : [];
    for (const ix of arr) add(ix);
  }
  return out;
}

function txHasIntentMemo(tx, intentId){
  const want = `GMXReply|${String(intentId||"").trim()}`;
  if (!want || want.endsWith("|")) return false;
  const memos = txExtractMemoStrings(tx);
  return memos.some(m => String(m||"").includes(want));
}

function buildBillingBindMessage(handle, intentId, nonce){
  const h = String(handle || "").trim();
  const id = String(intentId || "").trim();
  const n = String(nonce || "").trim();
  if (!h || !id || !n) return "";
  return `GMXReply|bind|${id}|${n}|${h}`;
}

function verifySolanaMessageSignature(message, wallet, sig58){
  try{
    const pub = b58DecodeToBuf(wallet);
    const sig = b58DecodeToBuf(sig58);
    if (!pub || pub.length !== 32) return false;
    if (!sig || sig.length !== 64) return false;
    const spki = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      pub,
    ]);
    const key = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    const msg = Buffer.from(String(message || ""), "utf8");
    return crypto.verify(null, msg, key, sig);
  }catch{
    return false;
  }
}

function verifySolPaymentLamportsTx(tx, receiver, minLamports, payer){
  try{
    if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
    if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

    const msg = tx.transaction.message;
    const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

    const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
    const innerInst = [];
    for (const g of inner){
      const arr = Array.isArray(g?.instructions) ? g.instructions : [];
      for (const ix of arr) innerInst.push(ix);
    }

    const need = BigInt(String(minLamports || "0"));
    let paid = 0n;

    const add = (ix) => {
      try{
        if (ix?.parsed?.type !== "transfer") return;
        const info = ix.parsed.info || {};
        const dest = String(info.destination || "");
        const src = String(info.source || "");
        if (dest !== receiver) return;
        if (payer && src !== payer) return;
        const lamports = BigInt(String(info.lamports || "0"));
        if (lamports > 0n) paid += lamports;
      }catch{}
    };

    for (const ix of topInst) add(ix);
    for (const ix of innerInst) add(ix);

    if (payer && paid <= 0n) return { ok:false, reason:"payer_mismatch" };
    if (paid < need) return { ok:false, reason:"amount_too_low", paidLamports: paid.toString() };
    return { ok:true, paidLamports: paid.toString() };
  }catch(e){
    return { ok:false, reason:"verify_failed" };
  }
}

function verifySplTokenPaymentTx(tx, receiverOwner, mint, minBase, payer){
  try{
    if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
    if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };
    if (payer && !txHasSigner(tx, payer)) return { ok:false, reason:"payer_mismatch" };

    const pre = sumTokenBalancesByOwnerMint(tx?.meta?.preTokenBalances, receiverOwner, mint);
    const post = sumTokenBalancesByOwnerMint(tx?.meta?.postTokenBalances, receiverOwner, mint);
    const delta = post - pre;
    const need = BigInt(String(minBase || "0"));
    if (delta < need) return { ok:false, reason:"amount_too_low", paidBase: delta.toString() };
    return { ok:true, paidBase: delta.toString() };
  }catch(e){
    return { ok:false, reason:"verify_failed" };
  }
}

function sumTokenBalancesByOwnerMint(arr, owner, mint) {
  let sum = 0n;
  const ow = String(owner || "").trim();
  const mi = String(mint || "").trim();
  if (!ow || !mi) return 0n;
  for (const b of Array.isArray(arr) ? arr : []) {
    if (String(b?.owner || "") !== ow) continue;
    if (String(b?.mint || "") !== mi) continue;
    const a = b?.uiTokenAmount?.amount;
    if (a == null) continue;
    try { sum += BigInt(String(a)); } catch {}
  }
  return sum;
}

async function verifySplTokenPayment(sig, receiverOwner, mint, minBase, payer) {
  const tx = await solanaGetTransaction(sig);
  if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
  if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };
  if (payer && !txHasSigner(tx, payer)) return { ok:false, reason:"payer_mismatch" };

  const pre = sumTokenBalancesByOwnerMint(tx?.meta?.preTokenBalances, receiverOwner, mint);
  const post = sumTokenBalancesByOwnerMint(tx?.meta?.postTokenBalances, receiverOwner, mint);
  const delta = post - pre;
  const need = BigInt(String(minBase || "0"));
  if (delta < need) {
    return { ok:false, reason:"amount_too_low", paidBase: delta.toString() };
  }
  return { ok:true, paidBase: delta.toString() };
}

async function verifySolPaymentLamports(sig, receiver, minLamports, payer) {
  const tx = await solanaGetTransaction(sig);
  if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
  if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

  const msg = tx.transaction.message;
  const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

  const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
  const innerInst = [];
  for (const g of inner) {
    const arr = Array.isArray(g?.instructions) ? g.instructions : [];
    for (const ix of arr) innerInst.push(ix);
  }

  const need = BigInt(String(minLamports || "0"));
  let paid = 0n;

  const add = (ix) => {
    try {
      if (ix?.parsed?.type !== "transfer") return;
      const info = ix.parsed.info || {};
      const dest = String(info.destination || "");
      const src = String(info.source || "");
      if (dest !== receiver) return;
      if (payer && src !== payer) return;
      const lamports = BigInt(String(info.lamports || "0"));
      if (lamports > 0n) paid += lamports;
    } catch {}
  };

  for (const ix of topInst) add(ix);
  for (const ix of innerInst) add(ix);

  if (payer && paid <= 0n) return { ok:false, reason:"payer_mismatch" };
  if (paid < need) return { ok:false, reason:"amount_too_low", paidLamports: paid.toString() };
  return { ok:true, paidLamports: paid.toString() };
}

app.post("/api/billing/bind", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const intentId = String(req.body?.intentId || "").trim();
    const wallet = String(req.body?.wallet || "").trim();
    const nonceSig = String(req.body?.nonceSig || "").trim();

    if (!intentId) return res.status(400).json({ ok:false, error:"intent_required" });
    if (!wallet) return res.status(400).json({ ok:false, error:"payer_required" });
    if (!isSolanaPubkey(wallet)) return res.status(400).json({ ok:false, error:"invalid_payer" });
    if (!nonceSig) return res.status(400).json({ ok:false, error:"invalid_nonce_sig" });

    const intent = safeDb(() =>
      db.prepare(
        "SELECT id, handle, expires_at, used_sig, payer, status, nonce, nonce_sig FROM billing_intents WHERE id=?"
      ).get(intentId)
    );
    if (!intent) return res.status(404).json({ ok:false, error:"invalid_intent" });
    if (String(intent.handle).toLowerCase() !== String(handle).toLowerCase()) {
      return res.status(403).json({ ok:false, error:"intent_handle_mismatch" });
    }
    if (intent.used_sig) return res.status(409).json({ ok:false, error:"intent_already_used" });
    if (intent.expires_at && new Date(intent.expires_at) < new Date()) {
      return res.status(410).json({ ok:false, error:"intent_expired" });
    }

    const existingWallet = String(intent.payer || "").trim();
    const existingSig = String(intent.nonce_sig || "").trim();
    if (String(intent.status || "") === "bound" && existingWallet) {
      if (existingWallet === wallet && existingSig && existingSig === nonceSig) {
        return res.json({ ok:true, bound:true, wallet, reused:true });
      }
      if (existingWallet !== wallet) {
        return res.status(409).json({ ok:false, error:"intent_already_bound" });
      }
    }

    const msg = buildBillingBindMessage(intent.handle, intent.id, intent.nonce);
    if (!msg) return res.status(409).json({ ok:false, error:"wallet_bind_required" });
    if (!verifySolanaMessageSignature(msg, wallet, nonceSig)) {
      return res.status(400).json({ ok:false, error:"invalid_nonce_sig" });
    }

    safeDb(() => {
      db.prepare("UPDATE billing_intents SET payer=?, nonce_sig=?, status='bound' WHERE id=?")
        .run(wallet, nonceSig, intentId);
    });

    logActivity(handle, 'billing_wallet_bound', { intentId, wallet: `${wallet.slice(0,4)}…${wallet.slice(-4)}` });

    res.json({ ok:true, bound:true, wallet });
  } catch (e) {
    console.error("BILLING_BIND_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/billing/verify", requireAuth, async (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const intentId = String(req.body?.intentId || "").trim();
    const sig = extractSig(req.body?.sig);
    const payer = String(req.body?.payer || "").trim();

    if (!intentId) return res.status(400).json({ ok:false, error:"intent_required" });
    if (!sig) return res.status(400).json({ ok:false, error:"invalid_sig" });
    if (!payer) return res.status(400).json({ ok:false, error:"payer_required" });
    if (!isSolanaPubkey(payer)) return res.status(400).json({ ok:false, error:"invalid_payer" });

    const exists = safeDb(() => db.prepare("SELECT 1 FROM payments WHERE sig=?").get(sig));
    if (exists) return res.status(409).json({ ok:false, error:"sig_already_used" });

    const intent = safeDb(() =>
      db.prepare(
        "SELECT id, handle, plan, currency, mint, amount_base, expires_at, used_sig, status, payer, nonce, nonce_sig FROM billing_intents WHERE id=?"
      ).get(intentId)
    );
    if (!intent) return res.status(404).json({ ok:false, error:"invalid_intent" });
    if (String(intent.handle).toLowerCase() !== String(handle).toLowerCase()) {
      return res.status(403).json({ ok:false, error:"intent_handle_mismatch" });
    }
    if (intent.used_sig) return res.status(409).json({ ok:false, error:"intent_already_used" });
    const now = new Date();
    if (intent.expires_at && new Date(intent.expires_at) < now) {
      return res.status(410).json({ ok:false, error:"intent_expired" });
    }

    const boundWallet = String(intent.payer || "").trim();
    if (String(intent.status || "") !== "bound" || !boundWallet || !String(intent.nonce_sig || "").trim() || !String(intent.nonce || "").trim()) {
      return res.status(409).json({ ok:false, error:"wallet_bind_required" });
    }
    if (boundWallet !== payer) {
      return res.status(400).json({ ok:false, error:"payment_intent_mismatch" });
    }

    const plan = BILLING_PLANS.find((p) => p.key === String(intent.plan));
    if (!plan) return res.status(400).json({ ok:false, error:"invalid_plan" });

    const currency = String(intent.currency || "SOL").toUpperCase();
    const token = BILLING_TOKENS.find((t) => t.key === currency);
    if (!token) return res.status(400).json({ ok:false, error:"invalid_currency" });
    const expectedBase = BigInt(String(intent.amount_base || "0"));
    if (expectedBase <= 0n) return res.status(400).json({ ok:false, error:"invalid_amount" });

    // Fetch transaction once (prevents race-claim) + require Memo binding to intent
    const tx = await solanaGetTransaction(sig);
    if (!tx?.transaction?.message) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:{ ok:false, reason:"tx_not_found" } });
    if (tx?.meta?.err) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:{ ok:false, reason:"tx_failed", err: tx.meta.err } });

    // Anti-claim theft: tx must include Memo "GMXReply|<intentId>"
    if (!txHasIntentMemo(tx, intentId)) {
      return res.status(400).json({ ok:false, error:"payment_intent_mismatch" });
    }

    let v = { ok:false, reason:"unknown" };
    if (token.kind === "native") {
      v = verifySolPaymentLamportsTx(tx, SOL_RECEIVER, expectedBase.toString(), payer);
    } else {
      const mint = String(intent.mint || token.mint || "").trim();
      if (!mint) return res.status(400).json({ ok:false, error:"mint_required" });
      v = verifySplTokenPaymentTx(tx, SOL_RECEIVER, mint, expectedBase.toString(), payer);
    }
    if (!v.ok) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:v });

    const amountUi = token.kind === "native"
      ? uiFromBaseUnits(expectedBase.toString(), 9)
      : uiFromBaseUnits(expectedBase.toString(), 6);
    const amountNum = Number(amountUi || "0") || 0;

    safeDb(() => {
      db.prepare(
        "INSERT INTO payments(sig, handle, plan, currency, mint, amount, amount_base, payer, created_at) VALUES(?,?,?,?,?,?,?,?,?)"
      ).run(sig, handle, plan.key, currency, token.kind === "native" ? null : String(intent.mint || token.mint), amountNum, expectedBase.toString(), payer, nowIso());
    });
    safeDb(() => {
      db.prepare("UPDATE billing_intents SET used_sig=?, status='confirmed', payer=?, confirmed_at=? WHERE id=?").run(sig, payer, nowIso(), intentId);
    });

    logActivity(handle, 'payment_verified', { plan: plan.key, currency, amountUi });

    safeDb(() => {
      const u = userByHandle(handle);
      const now = new Date();
      const cur = u?.paid_until ? new Date(u.paid_until) : null;
      const base = cur && cur > now ? cur : now;
      const next = new Date(base.getTime() + plan.days * 24*3600*1000);

      db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?")
        .run(next.toISOString(), nowIso(), handle);
    });

    const u2 = userByHandle(handle);
    res.json({
      ok:true,
      sub: subscriptionInfo({ ...u2, handle }),
      paid: {
        currency,
        amountUi,
        amountBase: expectedBase.toString(),
        verified: v,
      }
    });
  } catch (e) {
    console.error("BILLING_VERIFY_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/billing/redeem", requireAuth, (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const code = String(req.body?.code || "").trim();
    if (!code || code.length < 6) return res.status(400).json({ ok:false, error:"invalid_code" });

    const row = safeDb(() => db.prepare("SELECT code, tier, days, grant_type, grant_value FROM admin_codes WHERE code=?").get(code));
    if (!row) return res.status(404).json({ ok:false, error:"code_not_found" });

    const used = safeDb(() => db.prepare("SELECT 1 FROM code_redemptions WHERE code=?").get(code));
    if (used) return res.status(409).json({ ok:false, error:"code_already_redeemed" });

    safeDb(() => {
      db.prepare("INSERT INTO code_redemptions(code, handle, created_at) VALUES(?,?,?)")
        .run(code, handle, nowIso());
    });

    const grantType = String(row.grant_type || 'subscription').trim();

    if (grantType === 'eligible_credit') {
      const grantValue = Math.max(0, Number(row.grant_value || 0) || 0);
      grantReferralReward(handle, 'eligible_credit', grantValue, 'admin_code', code, { code, grantType, grantValue });
      logActivity(handle, 'code_redeemed', { code, grantType, grantValue });
      const starterBgSlots = referralRewardTotal(handle, 'starter_bg_slot');
      const uNow = userByHandle(handle) || { handle };
      const refCodeNow = String(uNow?.ref_code || '').trim();
      const legacyEligibleNow = refCodeNow ? (safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCodeNow)?.c || 0) || 0) : 0;
      const earnedEligibleNow = Math.max(referralCountActive(handle), legacyEligibleNow);
      const totalEligibleNow = earnedEligibleNow + referralRewardTotal(handle, 'eligible_credit');
      const unlocks = computeReferralUnlocks(totalEligibleNow, starterBgSlots);
      return res.json({ ok:true, sub: subscriptionInfo({ ...(uNow||{}), handle }), grant: { grantType, grantValue }, unlocks });
    }

    safeDb(() => {
      const days = Number(row.days || 0);
      if (row.tier === "unlimited" || days === 0) {
        db.prepare("UPDATE users SET tier='unlimited', paid_until=NULL, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?").run(nowIso(), handle);
        return;
      }
      const u = userByHandle(handle);
      const now = new Date();
      const cur = u?.paid_until ? new Date(u.paid_until) : null;
      const base = cur && cur > now ? cur : now;
      const next = new Date(base.getTime() + days * 24*3600*1000);
      db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?").run(next.toISOString(), nowIso(), handle);
    });

    logActivity(handle, 'code_redeemed', { code, tier: row.tier, days: Number(row.days||0), grantType });
    const u2 = userByHandle(handle);
    res.json({ ok:true, sub: subscriptionInfo({ ...u2, handle }) });
  } catch (e) {
    console.error("REDEEM_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});



// Bootstrap admin (one-time). If no admin is configured yet, the current authenticated user becomes admin.
// SECURITY (P0): requires X-Admin-Key (ADMIN_SECRET) to avoid public claiming.
app.post("/api/admin/bootstrap", requireAuth, (req, res) => {
  try{
    const key = getAdminKey(req);
    if (!key) return res.status(401).json({ ok:false, error:"unauthorized", hint:"missing_admin_key" });
    if (!ADMIN_SECRET || ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
      return res.status(500).json({ ok:false, error:"server_error", hint:"admin_secret_not_configured" });
    }
    if (key !== ADMIN_SECRET) return res.status(401).json({ ok:false, error:"unauthorized" });

    const handle = req.user?.handle || null;
    const cur = getAdminHandle();
    if (cur){
      if (isAdminHandle(handle)) return res.json({ ok:true, handle, isAdmin:true, adminHandle: cur });
      return res.status(409).json({ ok:false, error:"admin_already_claimed" });
    }
    setSetting("admin_handle", handle);
    return res.json({ ok:true, handle, isAdmin:true, adminHandle: handle });
  }catch(e){
    console.error("ADMIN_BOOTSTRAP_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Admin login (password) -> issues admin session token.
// Note: Admin APIs require BOTH bearer token and either X-Admin-Token (preferred) or X-Admin-Key (legacy).
const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> String(req.ip || "ip"),
});

app.post("/api/admin/login", adminLoginLimiter, requireAuth, (req, res) => {
  try{
    if (!ADMIN_PASSWORD){
      return res.status(500).json({ ok:false, error:"server_error", hint:"admin_password_not_configured" });
    }
    const handle = req.user?.handle || null;
    if (!handle || !isAdminHandle(handle)) {
      return res.status(403).json({ ok:false, error:"forbidden" });
    }

    const pw = String(req.body?.password || "").trim();
    if (!pw) return res.status(400).json({ ok:false, error:"invalid_request", hint:"missing_password" });

    if (!safeEq(pw, ADMIN_PASSWORD)) return res.status(401).json({ ok:false, error:"unauthorized" });

    const s = adminSessionCreate(handle);
    return res.json({ ok:true, handle, adminToken: s.token, expiresAt: s.expires_at });
  }catch(e){
    console.error("ADMIN_LOGIN_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/admin/logout", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
        const at = getAdminToken(req);
    if (at) adminSessionDelete(at);
    return res.json({ ok:true });
  }catch(e){
    console.error("ADMIN_LOGOUT_ERROR", e);
    return res.status(500).json({ ok:false, error:"server_error" });
  }
});

// ---------- ADMIN ----------
function getAdminKey(req){
  return String(req.headers["x-admin-key"] || req.headers["X-Admin-Key"] || "").trim();
}

function getAdminToken(req){
  return String(req.headers["x-admin-token"] || req.headers["X-Admin-Token"] || "").trim();
}

function safeEq(a,b){
  try{
    const aa = Buffer.from(String(a||""), "utf8");
    const bb = Buffer.from(String(b||""), "utf8");
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  }catch{ return false; }
}

function adminSessionCleanup(){
  try{
    const now = new Date().toISOString();
    db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").run(now);
  }catch{}
}

function adminSessionCreate(handle){
  adminSessionCleanup();
  const token = crypto.randomBytes(24).toString("hex");
  const created_at = new Date().toISOString();
  const expires_at = new Date(Date.now() + ADMIN_SESSION_HOURS*60*60*1000).toISOString();
  db.prepare("INSERT INTO admin_sessions(token, handle, created_at, expires_at) VALUES(?,?,?,?)").run(token, handle, created_at, expires_at);
  return { token, created_at, expires_at };
}

function adminSessionGet(token){
  adminSessionCleanup();
  if (!token) return null;
  try{
    const row = db.prepare("SELECT token, handle, created_at, expires_at FROM admin_sessions WHERE token=?").get(token);
    if (!row) return null;
    if (String(row.expires_at) < new Date().toISOString()) return null;
    return row;
  }catch{ return null; }
}

function adminSessionDelete(token){
  if (!token) return;
  try{ db.prepare("DELETE FROM admin_sessions WHERE token=?").run(token); }catch{}
}

// ---------- ADMIN ----------
function requireAdmin(req, res, next) {
  try {
    // First: allow admin session token without user auth only for local loopback dev traffic.
    const at0 = getAdminToken(req);
    if (at0 && canUseDevAdminSession(req)){
      const s0 = adminSessionGet(at0);
      if (!s0) return res.status(401).json({ ok:false, error:"unauthorized", hint:"invalid_admin_session" });
      req.admin = { by: "admin_session", handle: String(s0.handle || "@admin") };
      return next();
    }

    // Otherwise require a valid user bearer token and admin handle.
    const tok = getBearer(req);
    const u = userByToken(tok);
    if (!u) return res.status(401).json({ ok:false, error:"unauthorized" });
    if (!isAdminHandle(u.handle)) return res.status(403).json({ ok:false, error:"forbidden" });

    // Preferred: admin session token (handle + password login)
    const at = getAdminToken(req);
    if (at){
      const s = adminSessionGet(at);
      if (!s) return res.status(401).json({ ok:false, error:"unauthorized", hint:"invalid_admin_session" });
      if (String(s.handle) !== String(u.handle)) return res.status(403).json({ ok:false, error:"forbidden", hint:"session_handle_mismatch" });
      req.admin = { by: "token+admin_session", handle: u.handle };
      return next();
    }

    // Legacy: admin secret header (backwards compatibility)
    const key = getAdminKey(req);
    if (key){
      if (!ADMIN_SECRET || ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
        return res.status(500).json({ ok:false, error:"server_error", hint:"admin_secret_not_configured" });
      }
      if (key !== ADMIN_SECRET) return res.status(401).json({ ok:false, error:"unauthorized" });
      req.admin = { by: "admin_secret", handle: u.handle };
      return next();
    }

    return res.status(401).json({ ok:false, error:"unauthorized" });
  } catch (e) {
    return res.status(500).json({ ok:false, error:"server_error" });
  }
}



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


app.get("/api/admin/ext/selectors", requireAdmin, (req, res) => {
  try{
    res.json(adminSelectorsPayload());
  }catch(e){
    console.error("ADMIN_EXT_SELECTORS_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/admin/ext/selectors", requireAdmin, (req, res) => {
  try{
    const action = String(req.body?.action || "").toLowerCase().trim() || "save";

    // Rollout actions affect canary bucket assignment.
    if (action === "rollout"){
      const p = Number(req.body?.rollout_percent ?? 100);
      const meta = setExtSelectorsRolloutMeta({ rollout_percent: p, rollout_salt: getExtSelectorsRollout().rollout_salt });
      recordExtSelectorsHistory({ action:"rollout", note: req.body?.note, selectors_json: null, version: null, rollout_percent: meta.rollout_percent, rollout_salt: meta.rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    if (action === "rotate_salt"){
      const p = Number(req.body?.rollout_percent ?? getExtSelectorsRollout().rollout_percent ?? 100);
      const meta = setExtSelectorsRolloutMeta({ rollout_percent: p, rollout_salt: randHex(8) });
      recordExtSelectorsHistory({ action:"rotate_salt", note: req.body?.note, selectors_json: null, version: null, rollout_percent: meta.rollout_percent, rollout_salt: meta.rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    if (action === "rollback"){
      const hid = Number(req.body?.historyId || req.body?.id || 0);
      if (!hid) return res.status(400).json({ ok:false, error:"missing_historyId" });
      const row = safeDb(() => db.prepare("SELECT selectors_json, rollout_percent, rollout_salt FROM ext_selectors_history WHERE id=?").get(hid));
      if (!row) return res.status(404).json({ ok:false, error:"history_not_found" });

      if (row.selectors_json){
        try{
          const parsed = JSON.parse(row.selectors_json);
          setExtSelectorsOverride(parsed);
        }catch{
          // If history JSON is corrupted, reset override.
          resetExtSelectorsOverride();
        }
      }else{
        resetExtSelectorsOverride();
      }

      const meta = setExtSelectorsRolloutMeta({
        rollout_percent: (row.rollout_percent !== null && row.rollout_percent !== undefined) ? row.rollout_percent : getExtSelectorsRollout().rollout_percent,
        rollout_salt: row.rollout_salt ? String(row.rollout_salt) : getExtSelectorsRollout().rollout_salt
      });

      recordExtSelectorsHistory({ action:"rollback", note: req.body?.note, selectors_json: row.selectors_json || null, version: null, rollout_percent: meta.rollout_percent, rollout_salt: meta.rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    if (action === "reset" || action === "default"){
      resetExtSelectorsOverride();
      recordExtSelectorsHistory({ action:"reset", note: req.body?.note, selectors_json: null, version: null, rollout_percent: getExtSelectorsRollout().rollout_percent, rollout_salt: getExtSelectorsRollout().rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    // Touch = bump version + updated_at, so extensions can pick up a refresh without changing arrays.
    if (action === "touch" || action === "refresh" || action === "bump"){
      const existing = getExtSelectorsOverride();
      const base = existing ? existing : { ...EXT_SELECTORS, updated_at: null };
      const bumped = {
        version: Number(base.version || 1) + 1,
        composer: Array.isArray(base.composer) ? base.composer : EXT_SELECTORS.composer,
        tweetText: Array.isArray(base.tweetText) ? base.tweetText : EXT_SELECTORS.tweetText,
        anchors: Array.isArray(base.anchors) ? base.anchors : EXT_SELECTORS.anchors,
      };
      setExtSelectorsOverride(bumped);
      recordExtSelectorsHistory({ action:"touch", note: req.body?.note, selectors_json: JSON.stringify(bumped), version: bumped.version, rollout_percent: getExtSelectorsRollout().rollout_percent, rollout_salt: getExtSelectorsRollout().rollout_salt });
      return res.json(adminSelectorsPayload());
    }

    let payload = req.body?.selectors ?? req.body?.json ?? req.body?.payload ?? req.body;
    if (typeof payload === "string"){
      payload = payload.trim();
      payload = payload ? JSON.parse(payload) : null;
    }

    const norm = normalizeSelectorsPayload(payload);
    if (!norm || !norm.composer?.length || !norm.anchors?.length){
      return res.status(400).json({ ok:false, error:"invalid_selectors_payload" });
    }

    setExtSelectorsOverride(norm);
    recordExtSelectorsHistory({ action:"save", note: req.body?.note, selectors_json: JSON.stringify(norm), version: norm.version, rollout_percent: getExtSelectorsRollout().rollout_percent, rollout_salt: getExtSelectorsRollout().rollout_salt });
    return res.json(adminSelectorsPayload());
  }catch(e){
    const msg = String(e?.message || "");
    if (/json/i.test(msg)){
      return res.status(400).json({ ok:false, error:"invalid_json" });
    }
    console.error("ADMIN_EXT_SELECTORS_POST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/admin/stats", requireAdmin, (req, res) => {
  try {
    const tenMinAgo = new Date(Date.now() - 10*60*1000).toISOString();

    const totalUsers =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users").get()?.c || 0);

    const onlineUsers10m =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE last_seen >= ?").get(tenMinAgo)?.c || 0);

    const day = todayKeyUTC();
    const totalInsertsToday =
      safeDb(() =>
        db.prepare("SELECT COALESCE(SUM(used),0) AS s FROM usage_daily WHERE day=?").get(day)?.s || 0
      );

    const extensionUsers =
      safeDb(() =>
        db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE used > 0").get()?.c || 0
      );

    res.json({
      ok:true,
      onlineUsers10m,
      totalUsers,
      extensionUsers,
      totalInsertsToday,
      build: BUILD_ID,
    });
  } catch (e) {
    console.error("ADMIN_STATS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// ---- Admin: business / conversion metrics ----
app.get("/api/admin/metrics", requireAdmin, (req, res) => {
  try{
    let hours = Number(req.query?.hours ?? 24);
    if (!Number.isFinite(hours)) hours = 24;
    hours = Math.max(1, Math.min(720, Math.floor(hours))); // up to 30 days
    const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    // Usage-based active users (DAU / MAU)
    const day = todayKeyUTC();
    const dau =
      safeDb(() => db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE day=? AND used>0").get(day)?.c || 0);

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 29);
    const startDay = start.toISOString().slice(0,10);
    const mau =
      safeDb(() => db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM usage_daily WHERE day>=? AND used>0").get(startDay)?.c || 0);

    const proActive =
      safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM users WHERE sub_status='active'").get()?.c || 0);

    // Event funnel (from activity_log)
    const byType = safeDb(() =>
      db.prepare(
        "SELECT event_type, COUNT(*) AS total, COUNT(DISTINCT handle) AS users FROM activity_log WHERE created_at>=? GROUP BY event_type"
      ).all(sinceIso)
    ) || [];

    const asMap = {};
    for (const r of byType){
      asMap[String(r.event_type)] = { total: Number(r.total||0), users: Number(r.users||0) };
    }

    const get = (k)=> asMap[k] || { total:0, users:0 };

    const funnel = {
      limit_hit: get("limit_hit"),
      upgrade_modal_open: get("upgrade_modal_open"),
      pay_click: get("pay_click"),
      pay_success: get("pay_success"),
      pay_fail: get("pay_fail"),
      busy_try_again: get("busy_try_again"),
    };

    // Derived conversion rates (user-based)
    const opened = funnel.upgrade_modal_open.users || 0;
    const clicked = funnel.pay_click.users || 0;
    const success = funnel.pay_success.users || 0;

    const rates = {
      open_to_click: opened ? (clicked / opened) : 0,
      click_to_success: clicked ? (success / clicked) : 0,
      open_to_success: opened ? (success / opened) : 0,
    };

    res.json({
      ok:true,
      windowHours: hours,
      since: sinceIso,
      dau,
      mau,
      proActive,
      funnel,
      rates,
      build: BUILD_ID,
    });
  }catch(e){
    console.error("ADMIN_METRICS_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});


// ---- Admin: extension health dashboard ----
app.get("/api/admin/ext/health", requireAdmin, (req, res) => {
  try{
    let hours = Number(req.query?.hours ?? 24);
    if (!Number.isFinite(hours)) hours = 24;
    hours = Math.max(1, Math.min(168, Math.floor(hours)));
    const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const totals = safeDb(() => {
      const r = db.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS okCnt FROM ext_events WHERE created_at >= ?"
      ).get(sinceIso);
      const total = Number(r?.total || 0);
      const ok = Number(r?.okCnt || 0);
      return { total, ok, fail: Math.max(0, total - ok) };
    }) || { total: 0, ok: 0, fail: 0 };

    const byType = safeDb(() =>
      db.prepare(
        "SELECT event_type, COUNT(*) AS total, SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS okCnt FROM ext_events WHERE created_at >= ? GROUP BY event_type ORDER BY total DESC"
      ).all(sinceIso)
    ) || [];

    const topErrors = safeDb(() =>
      db.prepare(
        "SELECT error_code, COUNT(*) AS c FROM ext_events WHERE created_at >= ? AND ok=0 AND error_code IS NOT NULL AND error_code <> '' GROUP BY error_code ORDER BY c DESC LIMIT 12"
      ).all(sinceIso)
    ) || [];

    const versions = safeDb(() =>
      db.prepare(
        "SELECT ext_version, COUNT(*) AS c FROM ext_events WHERE created_at >= ? AND ext_version IS NOT NULL AND ext_version <> '' GROUP BY ext_version ORDER BY c DESC LIMIT 12"
      ).all(sinceIso)
    ) || [];

    const last = safeDb(() =>
      db.prepare(
        "SELECT created_at, event_type, ok, error_code, ext_version FROM ext_events WHERE created_at >= ? ORDER BY id DESC LIMIT 30"
      ).all(sinceIso)
    ) || [];

    res.json({
      ok:true,
      hours,
      sinceIso,
      totals,
      byType: byType.map(r => ({ event_type: r.event_type, total: Number(r.total||0), ok: Number(r.okCnt||0), fail: Math.max(0, Number(r.total||0) - Number(r.okCnt||0)) })),
      topErrors: topErrors.map(r => ({ error_code: r.error_code, count: Number(r.c||0) })),
      versions: versions.map(r => ({ ext_version: r.ext_version, count: Number(r.c||0) })),
      last,
      build: BUILD_ID,
    });
  }catch(e){
    console.error("ADMIN_EXT_HEALTH_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

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

// ---------- STATIC SITE ----------
const PUBLIC_DIR = path.join(__dirname, "public");
const APP_HTML = path.join(PUBLIC_DIR, "app.html");
const BRIDGE_DIR = path.join(PUBLIC_DIR, "bridge");
const BRIDGE_INDEX = path.join(BRIDGE_DIR, "index.html");

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function sendBridgeIndex(res) {
  try {
    noStore(res);
    if (fs.existsSync(BRIDGE_INDEX)) return res.sendFile(BRIDGE_INDEX);
    res.status(404).send("bridge build not found");
  } catch {
    res.status(500).send("error");
  }
}

app.get("/bridge", (req, res) => {
  sendBridgeIndex(res);
});

app.get("/arcade", (req, res) => {
  noStore(res);
  return res.redirect(302, "/arcade.html");
});

app.use(
  express.static(PUBLIC_DIR, {
    maxAge: "1h",
    redirect: false,
    setHeaders: (res, filePath) => {
      if (
        filePath.endsWith(".html") ||
        filePath.endsWith(".css") ||
        filePath.endsWith(".js") ||
        filePath.endsWith(".json")
      ) {
        noStore(res);
      }
    },
  })
);

app.get("/", (req, res) => {
  noStore(res);
  res.redirect("/app");
});

// Common local dev footgun:
// users sometimes paste URLs like "http://localhost:5173/app…" (unicode ellipsis/quotes)
// which becomes a path like "/app%E2%80%A6". That does not match "/app" or "/app/*".
// If the request starts with "/app" but is NOT "/app" and NOT "/app/…",
// redirect to the canonical legacy entry.
app.use((req, res, next) => {
  try {
    const p = String(req.path || "");
    if (p.startsWith("/app") && p !== "/app" && !p.startsWith("/app/")) {
      return res.redirect(302, "/app");
    }
  } catch {}
  return next();
});

app.get("/app", (req, res) => {
  try {
    noStore(res);
    if (fs.existsSync(APP_HTML)) return res.sendFile(APP_HTML);
    res.status(404).send("app.html not found");
  } catch {
    res.status(500).send("error");
  }
});

app.get("/bridge/*", (req, res) => {
  sendBridgeIndex(res);
});

app.get("/arcade/*", (req, res) => {
  noStore(res);
  return res.redirect(302, "/arcade.html");
});

app.get("/app/*", (req, res) => {
  try {
    noStore(res);
    if (fs.existsSync(APP_HTML)) return res.sendFile(APP_HTML);
    res.status(404).send("app.html not found");
  } catch {
    res.status(500).send("error");
  }
});

app.get("/get-extension", (req, res) => {
  noStore(res);
  if (EXTENSION_STORE_URL) return res.redirect(EXTENSION_STORE_URL);

  res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GMXReply Extension</title></head><body style="font-family:system-ui;margin:24px">
  <h2>GMXReply Chrome Extension</h2>
  <p>The extension is included in the repo under <b>/extension</b>.</p>
  <p><b>Local install:</b> open <b>chrome://extensions</b> → enable Developer mode → <b>Load unpacked</b> → select the <b>extension</b> folder.</p>
  <p>Once published, this page will redirect to the Chrome Web Store automatically.</p>
  <p>Go back to <a href="/app">/app</a>.</p>
</body></html>`);
});


// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
  writeLog("ERROR", "EXPRESS_ERROR", {
    requestId: req?.requestId || null,
    path: req?.originalUrl || null,
    method: req?.method || null,
    error: err?.stack || err?.message || String(err),
  });
  if (res.headersSent) return next(err);
  // Prefer JSON for API routes
  if (String(req.originalUrl || "").startsWith("/api")) {
    return sendError(res, 500, ERROR_CODES.SERVER_ERROR, { requestId: req?.requestId || null });
  }
  res.status(500).send("server_error");
});

app.use("/api", (req, res) => {
  sendError(res, 404, "not_found", { path: req.originalUrl });
});

HTTP_SERVER = app.listen(PORT, "0.0.0.0", () => {
  try {
    HTTP_SERVER.headersTimeout = 65_000;
    HTTP_SERVER.requestTimeout = 60_000;
    HTTP_SERVER.keepAliveTimeout = 5_000;
  } catch {}
  writeLog("INFO", "SERVER_LISTENING", {
    port: PORT,
    dbMode: DB_MODE,
    dbPath: DB_PATH,
    supabaseConfigured: SUPABASE_CONFIGURED,
    publicDir: PUBLIC_DIR,
    health: "/api/health",
    version: "/api/version",
  });
  try { startAutoAwardsLoop(); } catch (_e) {
    writeLog("ERROR", "AUTO_AWARDS_LOOP_FAILED", { error: _e?.message || String(_e) });
  }
});
