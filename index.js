import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import fs from "node:fs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
app.disable("etag");

const PORT = Number(process.env.PORT) || 10000;
const TRUST_PROXY = String(process.env.TRUST_PROXY || "").trim() === "1";
const DEV_MODE = String(process.env.NODE_ENV || "").toLowerCase() !== "production";
const STARTED_AT = new Date().toISOString();
const BUILD_ID =
  process.env.BUILD_ID ||
  process.env.RENDER_GIT_COMMIT ||
  crypto.randomBytes(8).toString("hex");

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
const ADMIN_PASSWORD = RAW_ADMIN_PASSWORD || (!IS_RENDER
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
  console.error("UNHANDLED_REJECTION", err);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT_EXCEPTION", err);
});

// Billing plans (base pricing in USD; SOL is quoted at intent creation time).
const BILLING_PLANS = [
  { key: "m1", label: "1 month", usd: 10, days: 30 },
  { key: "m3", label: "3 months", usd: 25, days: 90 },
  { key: "m6", label: "6 months", usd: 50, days: 180 },
  { key: "y1", label: "1 year", usd: 100, days: 365 },
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

app.use(
  helmet({
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
      used_sig TEXT
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
      confirmed_at TEXT
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
    addCol("status", "ALTER TABLE billing_intents ADD COLUMN status TEXT NOT NULL DEFAULT 'created'");
    addCol("payer", "ALTER TABLE billing_intents ADD COLUMN payer TEXT");
    addCol("confirmed_at", "ALTER TABLE billing_intents ADD COLUMN confirmed_at TEXT");
  });
}
ensureSchema();

function safeDb(fn) {
  try {
    return fn();
  } catch (e) {
    const msg = String(e?.message || e);
    if (/no such table|no such column|has no column|no column named/i.test(msg)) {
      try {
        ensureSchema();
      } catch {}
      return fn();
    }
    throw e;
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
function getBearer(req) {
  const h = req.headers.authorization || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  if (m) return m[1];
  // Back-compat for older clients
  const x = req.headers["x-gmx-token"] || req.headers["X-GMX-TOKEN"];
  return x ? String(x) : "";
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
  const ip = clientIp(req);
  const ua = (req.headers["user-agent"] || "").toString();
  return sha256(ip + "|" + ua).slice(0, 24);
}

function bonusPer20ForCount(cnt){
  // Promoters (50+ confirmed referrals) get a slightly higher bonus step.
  return (Number(cnt||0) >= 50) ? 12 : 10;
}

function awardReferralBonus(ownerHandle) {
  return safeDb(() => {
    const owner = db
      .prepare("SELECT ref_code FROM users WHERE handle=?")
      .get(ownerHandle);
    if (!owner?.ref_code) return 0;

    const legacy = db
      .prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?")
      .get(owner.ref_code)?.c || 0;

    const confirmed = referralCountConfirmed(ownerHandle);
    const active = referralCountActive(ownerHandle);
    const eligible = Math.max(active, legacy);
    const promoterCount = Math.max(eligible, confirmed);

    // Promoter bonuses require the inviter to be an active user as well.
    // If the inviter never uses the product, we do not grant referral bonus.
    // This protects against "drive-by" influencer farming.
    const ownerActive = (db
      .prepare("SELECT SUM(used) AS s FROM usage_daily WHERE handle=? AND used>0")
      .get(ownerHandle)?.s || 0) > 0;

    const per20 = bonusPer20ForCount(promoterCount);
    let bonus = Math.floor(eligible / 20) * per20;
    if (!ownerActive) bonus = 0;
    if (bonus > CONFIG.REF_BONUS_CAP) bonus = CONFIG.REF_BONUS_CAP;
    db.prepare("UPDATE users SET daily_bonus=? WHERE handle=?").run(bonus, ownerHandle);
    return bonus;
  });
}


function getDailyLimit(handle) {
  const u = userByHandle(handle);
  const bonus = u?.daily_bonus || 0;
  return CONFIG.FREE_DAILY_BASE + bonus;
}

function subscriptionInfo(u) {
  const tier = u?.tier || "free";
  const until = u?.paid_until ? new Date(u.paid_until) : null;
  const now = new Date();

  // Owner override: always unlimited for the admin handle
  if (isAdminHandle(u?.handle)) {
    return { active: true, tier: "unlimited", daysLeft: 9999 };
  }

  if (tier === "unlimited") return { active: true, tier: "unlimited", daysLeft: 9999 };
  if (tier === "paid" && until && until > now) {
    const daysLeft = Math.ceil((until - now) / (24 * 3600 * 1000));
    return { active: true, tier: "paid", daysLeft, paidUntil: u.paid_until };
  }
  return { active: false, tier: "free", daysLeft: 0, paidUntil: u?.paid_until || null };
}

function insertLimitForUser(u) {
  const sub = subscriptionInfo(u);
  if (sub.active) return CONFIG.PRO_DAILY_SENTINEL;
  return getDailyLimit(u.handle);
}

// ---------- GENERATOR ----------
const LANGS = ["en","es","pt","fr","de","it","nl","tr","pl","id","ru","uk","hi","ja","zh"];

function normLang(x) {
  const t = String(x || "").toLowerCase().trim();
  if (LANGS.includes(t)) return t;
  return "en";
}

const PACK = {
  en: {
    gmG: ["GM", "gm", "Good morning", "Morning", "Gm gm"],
    gnG: ["GN", "gn", "Good night", "Night", "Sleep well"],
    vibe: [
      "good vibes", "locked in", "stay sharp", "keep building", "ship something", "stack a small win",
      "stay hydrated", "coffee first", "take it easy", "one step closer", "smooth session"
    ],
    add: [
      "hope your day starts clean",
      "wishing you a calm mind and a clear head",
      "hope you catch a good setup (or just good vibes)",
      "keep it simple and stay consistent",
      "take your time, no need to force it",
      "be kind to yourself today",
      "make it a good one"
    ],
    clos: []
  },
  es: {
    gmG: ["GM", "gm", "Buenos días", "Buen día"],
    gnG: ["GN", "gn", "Buenas noches", "Descansa"],
    vibe: ["buenas vibras", "a darle", "modo build", "tranqui", "paso a paso", "con café"],
    add: ["que tengas un gran día", "hoy se construye", "sin prisa pero sin pausa", "que te salga todo bien"],
    clos: []
  },
  pt: {
    gmG: ["GM", "gm", "Bom dia"],
    gnG: ["GN", "gn", "Boa noite", "Descansa bem"],
    vibe: ["boas vibes", "foco total", "modo build", "com café", "sem estresse"],
    add: ["que seu dia renda", "vai dar bom", "passo a passo", "bora construir"],
    clos: []
  },
  fr: {
    gmG: ["GM", "gm", "Bonjour", "Salut"],
    gnG: ["GN", "gn", "Bonne nuit", "Bonne soirée"],
    vibe: ["bonne vibes", "on build", "tranquille", "café d'abord", "reste focus"],
    add: ["passe une belle journée", "force à toi", "on avance doucement mais sûrement"],
    clos: []
  },
  de: {
    gmG: ["GM", "gm", "Guten Morgen", "Morgen"],
    gnG: ["GN", "gn", "Gute Nacht", "Schlaf gut"],
    vibe: ["gute vibes", "bleib fokussiert", "ruhig bleiben", "kaffee zuerst", "step by step"],
    add: ["hab einen starken tag", "bleib entspannt", "heute wird gebaut"],
    clos: []
  },
  it: {
    gmG: ["GM", "gm", "Buongiorno", "Buon giorno"],
    gnG: ["GN", "gn", "Buonanotte", "Notte"],
    vibe: ["buone vibes", "focus", "con caffè", "piano piano", "si builda"],
    add: ["ti auguro una bella giornata", "forza", "andiamo"],
    clos: []
  },
  nl: {
    gmG: ["GM", "gm", "Goedemorgen", "Morgen"],
    gnG: ["GN", "gn", "Goedenacht", "Slaap lekker"],
    vibe: ["goede vibes", "focus", "koffie eerst", "rustig aan", "bouwen"],
    add: ["maak er een goede dag van", "stap voor stap", "blijven gaan"],
    clos: []
  },
  tr: {
    gmG: ["GM", "gm", "Günaydın"],
    gnG: ["GN", "gn", "İyi geceler", "Uyku zamanı"],
    vibe: ["iyi vibe", "odak", "kahve önce", "sakin", "build modu"],
    add: ["güzel bir gün olsun", "kolay gelsin", "hadi başlayalım"],
    clos: []
  },
  pl: {
    gmG: ["GM", "gm", "Dzień dobry", "Hej"],
    gnG: ["GN", "gn", "Dobranoc", "Śpij dobrze"],
    vibe: ["dobre vibes", "focus", "kawa najpierw", "spokojnie", "build mode"],
    add: ["miłego dnia", "powodzenia", "krok po kroku"],
    clos: []
  },
  id: {
    gmG: ["GM", "gm", "Selamat pagi", "Pagi"],
    gnG: ["GN", "gn", "Selamat malam", "Malam"],
    vibe: ["good vibes", "tetap fokus", "kopi dulu", "pelan-pelan", "build mode"],
    add: ["semoga harimu lancar", "gaskeun", "jaga kesehatan"],
    clos: []
  },
    ru: {
    gmG: ["GM", "gm", "Доброе утро", "Привет"],
    gnG: ["GN", "gn", "Спокойной ночи", "Доброй ночи"],
    vibe: ["хорошего дня", "поехали билдить", "держим фокус", "кофе и в работу", "спокойно, шаг за шагом"],
    add: ["пусть день будет сильным", "удачи сегодня", "всем продуктивного дня"],
    clos: []
  },
  uk: {
    gmG: ["GM", "gm", "Доброго ранку", "Привіт"],
    gnG: ["GN", "gn", "На добраніч", "Гарної ночі"],
    vibe: ["гарного дня", "поїхали будувати", "тримаємо фокус", "кава і в роботу", "крок за кроком"],
    add: ["нехай день буде сильним", "успіхів сьогодні", "всім продуктивного дня"],
    clos: []
  },
ja: {
    gmG: ["GM", "gm", "おはよう", "おはようございます"],
    gnG: ["GN", "gn", "おやすみ", "おやすみなさい"],
    vibe: ["良い感じ", "集中", "まずコーヒー", "コツコツ", "build mode"],
    add: ["良い一日を", "今日も頑張ろう", "無理せずいこう"],
    clos: []
  },
zh: {
    gmG: ["GM", "gm", "早上好", "早安"],
    gnG: ["GN", "gn", "晚安", "睡个好觉"],
    vibe: ["好心情", "专注", "先来咖啡", "慢慢来", "build mode"],
    add: ["祝你今天顺利", "加油", "别太累"],
    clos: []
  },
hi: {
    gmG: ["GM", "gm", "सुप्रभात", "गुड मॉर्निंग"],
    gnG: ["GN", "gn", "शुभ रात्रि", "गुड नाइट"],
    vibe: ["good vibes", "फोकस", "पहले कॉफी", "धीरे-धीरे", "build mode"],
    add: ["आज का दिन अच्छा हो", "ख्याल रखना", "चलो शुरू करें"],
    clos: []
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Emoji helper: keep source ASCII-safe to avoid Windows codepage issues.
const E = (...codes) => String.fromCodePoint(...codes);

const EMOJI = {
  gm: {
    sun: E(0x2600, 0xFE0F),     // ️
    coffee: E(0x2615),          // 
    sparkle: E(0x2728),         // 
    fire: E(0x1F525),           // 
    rocket: E(0x1F680),         // 
    muscle: E(0x1F4AA),         // 
    handshake: E(0x1F91D),      // 
    cool: E(0x1F60E),           // 
    thumbs: E(0x1F44D),         // 
    check: E(0x2705),           // 
    target: E(0x1F3AF),         // 
    smile: E(0x1F60A),           // 
  },
  gn: {
    moon: E(0x1F319),           // 
    sleep: E(0x1F634),          // 
    zzz: E(0x1F4A4),            // 
    star: E(0x2B50),            // ⭐
    sparkle: E(0x2728),         // 
    calm: E(0x1F60C),           // 
    bed: E(0x1F6CC),            // 
  }
};
function chance(p) {
  return Math.random() < p;
}

function sanitizeSingle(text, mode, kind){
  let out = String(text||"");

  // No plural / group addressing
  out = out.replace(/\b(everyone|everybody|guys|folks|friends|frens|fam|team|builders|legends|degenerates|chads)\b/gi, (m)=>{
    const t = m.toLowerCase();
    if (t === "builders") return "builder";
    if (t === "degenerates") return "degen";
    return "";
  });

  // Remove long dashes / list-like dashes
  out = out.replace(/[—–]/g, " ");
  out = out.replace(/\s-\s/g, " ");
  out = out.replace(/(^|\n)\s*[-•]\s+/g, "$1");

  // Enforce emoji intent:
  // GM = daytime only; GN = nighttime only.
  const GM_BAD = /[\u{1F319}\u{1F30C}\u{1F303}\u{1F634}\u{1F4A4}\u{2B50}]/gu;
  const GN_BAD = /[\u{2600}\u{FE0F}\u{1F31E}\u{1F324}\u{26C5}\u{2615}\u{1F950}]/gu;
  if (String(kind||"") === "gm") out = out.replace(GM_BAD, "");
  if (String(kind||"") === "gn") out = out.replace(GN_BAD, "");

  // In max replies, prefer commas over sentence-splitting dots between phrases
  if (String(mode||"") === "max"){
    out = out.replace(/\.\s+(?=[A-Za-zÀ-ÿ])/g, ", ");
  }

  // Clean spacing and stray punctuation
  out = out.replace(/\s{2,}/g, " ").trim();
  out = out.replace(/^\s*,\s*/,"").replace(/\s+,/g, ",").trim();

  return out;
}



function applyStyle(base, style, kind, mode, lang){
  const s = String(style || "classic").toLowerCase().trim();
  let out = String(base || "").replace(/\s+/g, " ").trim();

  // Avoid "everyone" and avoid long dashes.
  const addTail = (tail) => (tail ? (out + " " + tail).replace(/\s+/g," ").trim() : out);

  const EMOJI_RE = /[\p{Extended_Pictographic}]/gu;
  const hasEmoji = () => EMOJI_RE.test(out);

  const slang = ["ser", "degen"];
  const builder = ["ship something", "stay building", "keep shipping", "small steps today"];
  const alpha = ["stay sharp", "keep your head up", "let’s get it", "win the day"];
  const calm = ["have a smooth day", "take it easy", "one step at a time", "stay hydrated"];
  const hype = ["LFG", "we're so back", "send it", "we move"];
  const meme = ["ngmi? nah", "gm is a mindset", "vibes are green", "we keep shipping"];
  const emoji = (kind === "gn") ? [EMOJI.gn.moon, EMOJI.gn.sleep, EMOJI.gn.zzz, EMOJI.gn.star, EMOJI.gn.sparkle, EMOJI.gn.calm, EMOJI.gn.bed] : [EMOJI.gm.sun, EMOJI.gm.rocket, EMOJI.gm.fire, EMOJI.gm.sparkle, EMOJI.gm.muscle, EMOJI.gm.handshake, EMOJI.gm.cool, EMOJI.gm.thumbs];

  if (s === "noemoji"){
    out = out.replace(EMOJI_RE, "").replace(/\s+/g," ").trim();
    return sanitizeSingle(out, mode, kind);
  }

  if (s === "emoji"){
    if (!hasEmoji()) out = addTail(pick(emoji));
    else if (chance(0.35)) out = addTail(pick(emoji));
    return sanitizeSingle(out, mode, kind);
  }

  if (s === "minimal"){
    out = out.split(/[.!?]/)[0].trim();
    if (!out) out = (kind === "gm" ? "gm" : "gn");
    if (chance(0.45)) out = addTail(pick(emoji));
    return sanitizeSingle(out, mode, kind);
  }

  if (s === "degen"){
    if (!/frens|ser|fam|chads/i.test(out) && chance(0.65)) out = out.replace(/^(gm|gn)\b/i, `$1 ${pick(slang)}`);
    if (chance(0.55)) out = addTail(pick(hype));
    if (chance(0.35)) out = addTail(pick(emoji));

    // Guarantee at least 1 emoji for degen unless user explicitly chose noemoji.
    // (Some preset/style combos could otherwise result in zero emojis after sanitization.)
    if (!hasEmoji()) out = addTail(pick(emoji));

    return sanitizeSingle(out, mode, kind);
  }

  if (s === "builder"){
    if (chance(0.85)) out = addTail(pick(builder));
    if (chance(0.35)) out = addTail("ship it");
    if (chance(0.25)) out = addTail(pick(emoji));
    return sanitizeSingle(out, mode, kind);
  }

  if (s === "alpha"){
    if (chance(0.70)) out = addTail(pick(alpha));
    if (chance(0.35)) out = addTail(pick(hype));

    // Keep alpha replies feeling "alive": ensure at least one emoji in most cases
    // (unless style is explicitly noemoji).
    if (!hasEmoji() && chance(0.70)) out = addTail(pick(emoji));

    return sanitizeSingle(out, mode, kind);
  }

  if (s === "calm"){
    if (chance(0.75)) out = addTail(pick(calm));
    if (chance(0.30)) out = addTail("no rush");
    return sanitizeSingle(out, mode, kind);
  }

  if (s === "meme"){
    if (chance(0.85)) out = addTail(pick(meme));
    if (chance(0.40)) out = addTail(pick(emoji));
    return sanitizeSingle(out, mode, kind);
  }

  

if (s === "focus"){
  const focused = ["locked in", "stay focused", "keep it tight", "one task at a time", "quiet execution", "stay consistent"];
  if (chance(0.80)) out = addTail(pick(focused));
  if (chance(0.20)) out = addTail(pick([EMOJI.gm.check, EMOJI.gm.target]));
  return sanitizeSingle(out, mode, kind);
}

if (s === "cheer"){
  const cheerful = ["you got this", "big day ahead", "good energy", "sending good vibes", "make it a good one", "keep smiling"];
  if (chance(0.80)) out = addTail(pick(cheerful));
  if (chance(0.35)) out = addTail(pick([EMOJI.gm.smile, EMOJI.gm.sparkle]));
  return sanitizeSingle(out, mode, kind);
}
if (s === "classy"){
    out = out.replace(/\bser\b/gi, "friend");
    if (chance(0.70)) out = addTail("wishing you a productive one");
    return sanitizeSingle(out, mode, kind);
  }

  return sanitizeSingle(out, mode, kind);
}

function composeReply(kind, mode, lang, style) {
  const L = PACK[lang] || PACK.en;

  const greetArr = (kind === "gm") ? (L.gmG || ["gm"]) : (L.gnG || ["gn"]);
  const greetClean = greetArr.filter(x=>!/(\beveryone\b|\bguys\b|\bfolks\b|team|builders|friends|frens|fam|legends|degenerates|chads)/i.test(String(x)));
  let greet = pick(greetClean.length ? greetClean : greetArr);
  greet = String(greet||"").trim() || (kind==="gm" ? "gm" : "gn");

  // Optional CT-like token, only when greeting starts with GM/GN (English-ish).
  const tokens = ["fren", "friend", "homie", "fam", "legend", "degen"];
  const withToken = (s) => {
    const t = String(s||"").trim();
    if (!/^(gm|gn)\b/i.test(t)) return t;
    if (/\b(fren|friend|homie|fam|legend|degen)\b/i.test(t)) return t;
    return t.replace(/^(gm|gn)\b/i, `$1 ${pick(tokens)}`);
  };

  // Strict emoji pools:
  // Emoji pools tuned to avoid "wrong-time" vibes and avoid problematic glyphs.
  // GM = daytime / positive / building. GN = night / sleep / chill.
  const GM_EMOJI = [EMOJI.gm.sun, EMOJI.gm.coffee, EMOJI.gm.sparkle, EMOJI.gm.fire, EMOJI.gm.rocket, EMOJI.gm.muscle, EMOJI.gm.handshake, EMOJI.gm.thumbs];
  const GN_EMOJI = [EMOJI.gn.moon, EMOJI.gn.sleep, EMOJI.gn.zzz, EMOJI.gn.star, EMOJI.gn.sparkle, EMOJI.gn.calm, EMOJI.gn.bed];
  const emojiPool = (kind === "gm") ? GM_EMOJI : GN_EMOJI;

  const GM_VIBE = [
    "good vibes", "locked in", "keep building", "stay sharp", "ship something",
    "one step closer", "make it count", "smooth session", "stay hydrated", "good energy"
  ];
  const GN_VIBE = [
    "sleep well", "rest up", "recharge", "see you tomorrow",
    "time to log off", "reset and come back stronger", "take it easy"
  ];
  const vibePool = (kind === "gm") ? GM_VIBE : GN_VIBE;

  // min = ultra-short, tiny chance of 1 emoji
  if (mode === "min") {
    let out = greet;
    if (chance(0.30)) out = withToken(out);
    if (chance(0.18)) out = `${out} ${pick(emojiPool)}`;
    return applyStyle(out, style, kind, mode, lang);
  }

  // mid = normal, usually 1 emoji + vibe
  if (mode === "mid") {
    let out = greet;
    if (chance(0.55)) out = withToken(out);
    const parts = [out];
    if (chance(0.85)) parts.push(pick(emojiPool));
    if (chance(0.75)) parts.push(pick(vibePool));
    return applyStyle(parts.join(" ").replace(/\s+/g, " ").trim(), style, kind, mode, lang);
  }

  // max = longer, 1–2 emojis max
  let out = greet;
  if (chance(0.60)) out = withToken(out);
  const parts = [out, pick(emojiPool), pick(vibePool)];
  if (chance(0.35)) parts.push(pick(vibePool));
  if (chance(0.30)) parts.push(pick(emojiPool));
  return applyStyle(parts.join(" ").replace(/\s+/g, " ").trim(), style, kind, mode, lang);
}


function getRecentSet(handle, kind, limit = 20) {
  const rows = safeDb(() =>
    db
      .prepare(
        "SELECT reply FROM recent_replies WHERE handle=? AND kind=? ORDER BY created_at DESC LIMIT ?"
      )
      .all(handle, kind, limit)
  );
  return new Set(rows.map((r) => r.reply));
}

function saveRecent(handle, kind, reply) {
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
}

function generateUnique(handle, kind, mode, lang, style, antiLastN = 20) {
  const recent = getRecentSet(handle, kind, antiLastN);
  for (let i = 0; i < 60; i++) {
    const r = composeReply(kind, mode, lang, style);
    if (!recent.has(r)) return r;
  }
  return composeReply(kind, mode, lang, style);
}

// ---------- API ----------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "backend alive", time: nowIso() });
});

app.get("/api/version", (req, res) => {
  res.json({ ok: true, build: BUILD_ID, startedAt: STARTED_AT });
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

    // Public try: no anti-repeat against user's own history, but still sanitized.
    const reply = sanitizeSingle(composeReply(kind, mode, lang, style), mode, kind);
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
    let count = Number(req.query.count || 5);
    if (!Number.isFinite(count)) count = 5;
    count = Math.max(1, Math.min(10, Math.floor(count)));

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!["min","mid","max"].includes(mode)) return sendError(res, 400, "invalid_mode");

    const seen = new Set();
    const list = [];
    let tries = 0;
    while (list.length < count && tries < 2000) {
      tries++;
      const r = sanitizeSingle(composeReply(kind, mode, lang, style), mode, kind);
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(r);
    }
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


function getUsageFor(handle){
  const h = String(handle || "").trim();
  if (!h) return { gm:{used:0,limit:0}, gn:{used:0,limit:0}, resetAt: nextResetUTC(), sub: subscriptionInfo({ handle: "" }), limits:{ freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0 } };
  const day = todayKeyUTC();
  // Keep referral bonuses in sync for unlocks / free limit
  try{ awardReferralBonus(h); }catch(_e){}
  const u = userByHandle(h) || { handle: h };
  const limit = insertLimitForUser({ ...u, handle: h });
  const gmUsed = getDailyUsed(h, day, "gm");
  const gnUsed = getDailyUsed(h, day, "gn");
  return {
    gm: { used: gmUsed, limit },
    gn: { used: gnUsed, limit },
    resetAt: nextResetUTC(),
    sub: subscriptionInfo({ ...u, handle: h }),
    limits: { freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: u?.daily_bonus || 0 }
  };
}

app.all("/api/user/init", initLimiter, (req, res) => {
  try {
    const rawHandle = req.method === "GET" ? req.query.handle : req.body?.handle;
    const handle = normalizeHandle(rawHandle);
    if (!validHandle(handle)) return sendError(res, 400, ERROR_CODES.INVALID_HANDLE);

    const rotate = String((req.method === "GET" ? req.query.rotate : req.body?.rotate) || "").trim();

    // SECURITY (P0): prevent account takeover by requiring an existing token for existing users.
    let userRow0 = userByHandle(handle);
    let token = userRow0?.access_token ? String(userRow0.access_token) : "";

    if (userRow0) {
  const bearer = getBearer(req);
  const tokenUser = bearer ? userByToken(bearer) : null;
  const bearerMatches = !!(tokenUser && String(tokenUser.handle).toLowerCase() === String(handle).toLowerCase());

  // Allow reconnect by handle. If bearer is missing/invalid, rotate token so the client can recover.
  const rotateReq = (rotate === "1" || rotate.toLowerCase() === "true");
  if (!bearerMatches || rotateReq) {
    token = rotateToken(handle);
    userRow0 = userByHandle(handle);
  } else {
    token = bearer;
  }
} else {
      ensureUser(handle);
      userRow0 = userByHandle(handle);
      token = userRow0?.access_token ? String(userRow0.access_token) : "";
    }

    // --- Referrals (anti-fraud v1) ---
    const ref = (req.method === "GET" ? req.query.ref : req.body?.ref) || "";
    const refCode = String(ref || "").trim();
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
              const fp = referralFingerprint(req);
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

              try {
                db.prepare(
                  "INSERT OR IGNORE INTO referral_invites(inviter_handle, invited_handle, status, created_at, confirmed_at, fingerprint, ip_hash, ua_hash, fraud_flag, fraud_reason) VALUES(?,?,?,?,?,?,?,?,?,?)"
                ).run(inviter, handle, "confirmed", nowIso(), nowIso(), fp, ip_hash, ua_hash, fraud_flag, fraud_reason);
              } catch (_e) {
                // ignore unique constraint race
              }

              // legacy fingerprint referral (kept only for backwards compatibility)
              try {
                db.prepare(
                  "INSERT OR IGNORE INTO referrals(owner_handle, code, fingerprint, created_at) VALUES(?,?,?,?)"
                ).run(inviter, refCode, fp, nowIso());
              } catch {}
            }
          }
        }
      });
    }

    const userRow = safeDb(() => db.prepare("SELECT * FROM users WHERE handle=?").get(handle));
    const origin = originFromReq(req);
    const isAdmin = isAdminHandle(handle);
    const userRefCode = userRow?.ref_code ? String(userRow.ref_code) : "";
    const sub = subscriptionInfo({ ...(userRow || {}), handle });

    const usage = getUsageFor(handle);
    const pro = !!sub.active;

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
        saveCapFree: CONFIG.SAVE_CAP_FREE,
        freeDaily: CONFIG.FREE_DAILY_BASE,
        plan: pro ? "pro" : "free",
      },
      usage: {
        ...usage,
        saveCapFree: CONFIG.SAVE_CAP_FREE,
      },
    });
  } catch (e) {
    console.error("INIT_ERROR", e);
    return sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
});




app.get("/api/usage", maybeAuth, (req, res) => {
  try {
    const handle = req.user?.handle || null;
    if (!handle){
      return res.json({
        ok:true,
        authenticated:false,
        gm:{ used:0, limit: CONFIG.FREE_DAILY_BASE },
        gn:{ used:0, limit: CONFIG.FREE_DAILY_BASE },
        resetAt: nextResetUTC(),
        sub: { active:false, until:null },
        limits: { freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: 0, saveCapFree: CONFIG.SAVE_CAP_FREE },
      });
    }
    const day = todayKeyUTC();

    awardReferralBonus(handle);

    const u = userByHandle(handle);
    const limit = insertLimitForUser({ ...u, handle });

    const gmUsed = getDailyUsed(handle, day, "gm");
    const gnUsed = getDailyUsed(handle, day, "gn");

    res.json({
      ok: true,
      authenticated:true,
      gm: { used: gmUsed, limit },
      gn: { used: gnUsed, limit },
      resetAt: nextResetUTC(),
      sub: subscriptionInfo({ ...u, handle }),
      limits: { freeDaily: CONFIG.FREE_DAILY_BASE, dailyBonus: u?.daily_bonus || 0, saveCapFree: CONFIG.SAVE_CAP_FREE },
    });
  } catch (e) {
    console.error("USAGE_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
});

// Unified user + limits payload for site/extension.
// Keeps /api/usage for backwards compatibility.



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


app.get("/api/me", requireAuth, (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const day = todayKeyUTC();

    // keep referral bonuses up to date (themes/packs unlocks)
    awardReferralBonus(handle);

    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const insertLimit = insertLimitForUser({ ...u, handle });
    const gmUsed = getDailyUsed(handle, day, "gm");
    const gnUsed = getDailyUsed(handle, day, "gn");

    const studioLimit = toolLimit(sub, 2, 999999);
    const studioUsed = getDailyUsed(handle, day, "tool_studio");

    const bulkMaxPerCall = toolLimit(sub, 10, 50);
    const bulkCallsLimit = toolLimit(sub, 3, 999999);
    const bulkCallsUsed = getDailyUsed(handle, day, "tool_bulk_calls");

    const historyLimit = toolLimit(sub, 20, 500);
    const favLimit = toolLimit(sub, 10, 200);

    res.json({
      ok: true,
      handle,
      sub,
      resetAt: nextResetUTC(),
      usage: {
        gm: { used: gmUsed, limit: insertLimit },
        gn: { used: gnUsed, limit: insertLimit },
      },
      tools: {
        studio: { used: studioUsed, limit: studioLimit },
        bulk: { callsUsed: bulkCallsUsed, callsLimit: bulkCallsLimit, maxPerCall: bulkMaxPerCall },
        history: { limit: historyLimit, searchEnabled: !!sub.active },
        favorites: { limit: favLimit },
      },
      limits: {
        freeDaily: CONFIG.FREE_DAILY_BASE,
        dailyBonus: u?.daily_bonus || 0,
        saveCapFree: CONFIG.SAVE_CAP_FREE,
      },
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
    saveRecent(handle, kind, reply);

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

    // Relax if still short: allow recent repeats, but never duplicates inside the batch
    while (list.length < count && tries < maxTries * 2) {
      tries++;
      const r = composeReply(kind, mode, lang, style);
      if (seen.has(r)) continue;
      seen.add(r);
      list.push(sanitizeSingle(r, mode, kind));
    }

    for (const r of list) saveRecent(handle, kind, r);

    res.json({ ok:true, handle, kind, mode, lang, count:list.length, list });
  } catch (e) {
    console.error("BULK_ERROR", e);
    sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
});



// ---------- CLOUD SYNC (Pro; server-side gated) ----------
function requirePro(req, res, next){
  const u = userByHandle(req.user.handle);
  const sub = subscriptionInfo({ ...u, handle: req.user.handle });
  if (sub?.active) return next();
  return res.status(402).json({ ok:false, error:"upgrade_required", feature:"cloud_sync" });
}

app.get("/api/cloud/lists", requireAuth, requirePro, (req, res) => {
  try{
    const handle = req.user?.handle || null;
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

app.post("/api/cloud/lists", requireAuth, requirePro, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok:false, error:"no_items" });

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

    let rows = [];
    safeDb(() => {
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

      rows = db.prepare(
        `SELECT kind, reply, created_at FROM recent_replies WHERE ${where} ORDER BY created_at DESC LIMIT ?`
      ).all(...params);
    });

    const nextBefore = rows.length ? rows[rows.length-1].created_at : "";
    res.json({ ok:true, handle, kind, q: q || "", limit, count: rows.length, nextBefore, rows });
  }catch(e){
    console.error("TOOLS_HISTORY_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

// Favorites: Free 10, Pro 200
app.get("/api/tools/favorites", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.query.kind || "all").toLowerCase();
    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });

    const limit = toolLimit(sub, 10, 200);

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

app.post("/api/tools/favorites/toggle", requireAuth, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.body?.kind || "").toLowerCase();
    const reply = String(req.body?.reply || "").trim();

    if (kind !== "gm" && kind !== "gn") return sendError(res, 400, "invalid_kind");
    if (!reply) return res.status(400).json({ ok:false, error:"invalid_reply" });

    const u = userByHandle(handle);
    const sub = subscriptionInfo({ ...u, handle });
    const max = toolLimit(sub, 10, 200);

    const h = sha256(reply).slice(0, 24);

    const existing = safeDb(() => db.prepare(
      "SELECT 1 AS x FROM favorites WHERE handle=? AND kind=? AND reply_hash=?"
    ).get(handle, kind, h));

    if (existing?.x){
      safeDb(() => db.prepare(
        "DELETE FROM favorites WHERE handle=? AND kind=? AND reply_hash=?"
      ).run(handle, kind, h));
      return res.json({ ok:true, action:"removed" });
    }

    // enforce max for free/pro
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
app.post("/api/consume", requireAuth, consumeLimiter, (req, res) => {
  try{
    const handle = req.user?.handle || null;
    const kind = String(req.body?.kind || req.query?.kind || '').toLowerCase();
    if (kind !== 'gm' && kind !== 'gn') return sendError(res, 400, 'invalid_kind');

    const day = todayKeyUTC();
    awardReferralBonus(handle);
    const u = userByHandle(handle);
    const limit = insertLimitForUser({ ...u, handle });

    const consume = consumeDailyAtomic(handle, day, kind, limit, 1);
    if (!consume.ok){
      return res.status(429).json({ ok:false, error:'limit_reached', used: consume.used, limit: consume.limit, resetAt: nextResetUTC() });
    }

    try{ logActivity(handle, 'consume', { kind }); }catch{}

    return res.json({
      ok:true,
      handle,
      kind,
      usage:{ used: consume.used, limit: consume.limit, remaining: (Number.isFinite(limit) && limit < 999999) ? Math.max(0, limit-consume.used) : null, resetAt: nextResetUTC() }
    });
  }catch(e){
    console.error('CONSUME_ERROR', e);
    return res.status(500).json({ ok:false, error:'server_error' });
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
    awardReferralBonus(handle);

    const u = userByHandle(handle);
    const limit = insertLimitForUser({ ...u, handle });
    const used = getDailyUsed(handle, day, kind);

    // consume quota atomically (prevents parallel overspend)
    const consume = consumeDailyAtomic(handle, day, kind, limit, 1);
    if (!consume.ok) {
      try{ logActivity(handle, 'limit_hit', { kind, used: consume.used, limit: consume.limit, resetAt: nextResetUTC() }); }catch{}
      return res.status(429).json({ ok:false, error:"limit_reached", used: consume.used, limit: consume.limit, resetAt: nextResetUTC() });
    }

    const reply = generateUnique(handle, kind, mode, lang, style, antiN);
    saveRecent(handle, kind, reply);
    logActivity(handle, 'gen', { kind, mode, lang, style, antiN });
    const newUsed = used + 1;

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

    const guard = await enforceGenGuard(req, res, 'bulk');
    if (!guard.ok) return res.status(guard.status).json(guard.body);

    const gotSlot = await GEN_SEMAPHORE.acquire(12000);
    if (!gotSlot){
      try{ logActivity(handle, 'busy_try_again', { kind, mode, lang, style, count }); }catch{}
      return res.status(503).json({ ok:false, error:'busy_try_again' });
    }


    const day = todayKeyUTC();
    awardReferralBonus(handle);

    const u = userByHandle(handle);
    const limit = insertLimitForUser({ ...u, handle });
    const used = getDailyUsed(handle, day, kind);

    const consume = consumeDailyAtomic(handle, day, kind, limit, count);
    if (!consume.ok) {
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

    for (const r of list) saveRecent(handle, kind, r);
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
  }
});


// Track referral link clicks (promoter analytics; no auth)
app.get("/api/referral/click", (req, res) => {
  try {
    const ref = String(req.query.ref || req.query.code || "").trim();
    if (!ref) return res.json({ ok:true });
    safeDb(() => {
      // only count clicks for valid codes
      const owner = db.prepare("SELECT handle FROM users WHERE ref_code=?").get(ref);
      if (!owner?.handle) return;
      const fp = referralFingerprint(req);
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
app.get("/api/referral/stats", requireAuth, (req, res) => {
  try {
    const handle = req.user?.handle || null;
    const origin = originFromReq(req);

    awardReferralBonus(handle);

    const u = userByHandle(handle);
    const refCode = u?.ref_code || "";
    const legacyReferrals = refCode
      ? safeDb(() =>
          db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCode)?.c || 0
        )
      : 0;

    const confirmedRefs = referralCountConfirmed(handle);
    const activeRefs = referralCountActive(handle);
    const eligibleRefs = Math.max(activeRefs, legacyReferrals);
    const promoterCount = Math.max(eligibleRefs, confirmedRefs);

    const bonusPer20 = bonusPer20ForCount(promoterCount);
    const bonusChunks = Math.floor(Number(eligibleRefs || 0) / 20);
    const nextBonusAt = (bonusChunks + 1) * 20;
    const promoter = Number(promoterCount || 0) >= 50;

    const clicks = refCode
      ? safeDb(() =>
          db.prepare("SELECT COUNT(*) AS c FROM ref_clicks WHERE code=?").get(refCode)?.c || 0
        )
      : 0;

    const dailyLimit = insertLimitForUser({ ...u, handle });

    const ownerActive = safeDb(() => (db
      .prepare("SELECT SUM(used) AS s FROM usage_daily WHERE handle=? AND used>0")
      .get(handle)?.s || 0)) > 0;

    res.json({
      ok: true,
      refCode,
      confirmedRefs,
      activeRefs,
      eligibleRefs,
      legacyReferrals,
      clicks,
      dailyLimit,
      freeDaily: CONFIG.FREE_DAILY_BASE,
      dailyBonus: u?.daily_bonus || 0,
      bonusCap: CONFIG.REF_BONUS_CAP,
      ownerActive,
      bonusPer20,
      bonusChunks,
      nextBonusAt,
      promoter,
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
app.get("/api/referral/list", requireAuth, (req, res) => {
  try{
    const inviter = req.user.handle;
    const days = Math.max(7, Math.min(90, Number(req.query.days || 30) || 30));
    const sinceIso = new Date(Date.now() - days*24*60*60*1000).toISOString();
    const sinceDay = sinceIso.slice(0,10);

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

    const list = rows.map((r)=>({
      handle: r.handle,
      joinedAt: r.joined_at,
      confirmedAt: r.confirmed_at,
      inserts: Number(r.used_total||0) || 0,          // usage in the selected window
      activeDays: Number(r.active_days||0) || 0,      // active days in the selected window
      lastInsertAt: r.last_day ? (String(r.last_day) + "T00:00:00Z") : null,
      lastSeen: r.last_seen || null,
      fraud: !!Number(r.fraud_flag||0),
      fraudReason: r.fraud_reason || null,
      eligible: (!!Number(r.ever_used||0)) && !Number(r.fraud_flag||0),  // ever used > 0, not fraud-flagged
    }));

    res.json({ ok:true, days, inviter, list });
  }catch(e){
    console.error("REFERRAL_LIST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
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

    // Garbage collect old intents.
    safeDb(() => {
      db.prepare("DELETE FROM billing_intents WHERE expires_at < ?").run(new Date(now.getTime() - 24*3600*1000).toISOString());
    });

    safeDb(() => {
      db.prepare(
        "INSERT INTO billing_intents(id, handle, plan, currency, mint, amount_base, sol_usd, created_at, expires_at, used_sig, status, payer, confirmed_at) VALUES(?,?,?,?,?,?,?,?,?,NULL,'created',NULL,NULL)"
      ).run(intentId, handle, plan.key, currency, mint, amountBase.toString(), solUsd || null, createdAt, expiresAt);
    });

    logActivity(handle, 'billing_intent_created', { intentId, plan: plan.key, currency });

    res.json({
      ok:true,
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

async function solanaGetTransaction(sig) {
  const rpc = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getTransaction",
    params: [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
  };
  const r = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j || j.error) return null;
  return j.result || null;
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
        "SELECT id, handle, plan, currency, mint, amount_base, expires_at, used_sig FROM billing_intents WHERE id=?"
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

    const plan = BILLING_PLANS.find((p) => p.key === String(intent.plan));
    if (!plan) return res.status(400).json({ ok:false, error:"invalid_plan" });

    const currency = String(intent.currency || "SOL").toUpperCase();
    const token = BILLING_TOKENS.find((t) => t.key === currency);
    if (!token) return res.status(400).json({ ok:false, error:"invalid_currency" });
    const expectedBase = BigInt(String(intent.amount_base || "0"));
    if (expectedBase <= 0n) return res.status(400).json({ ok:false, error:"invalid_amount" });

    let v = { ok:false, reason:"unknown" };
    if (token.kind === "native") {
      v = await verifySolPaymentLamports(sig, SOL_RECEIVER, expectedBase.toString(), payer);
    } else {
      const mint = String(intent.mint || token.mint || "").trim();
      if (!mint) return res.status(400).json({ ok:false, error:"mint_required" });
      v = await verifySplTokenPayment(sig, SOL_RECEIVER, mint, expectedBase.toString(), payer);
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

    const row = safeDb(() => db.prepare("SELECT code, tier, days FROM admin_codes WHERE code=?").get(code));
    if (!row) return res.status(404).json({ ok:false, error:"code_not_found" });

    const used = safeDb(() => db.prepare("SELECT 1 FROM code_redemptions WHERE code=?").get(code));
    if (used) return res.status(409).json({ ok:false, error:"code_already_redeemed" });

    safeDb(() => {
      db.prepare("INSERT INTO code_redemptions(code, handle, created_at) VALUES(?,?,?)")
        .run(code, handle, nowIso());
    });

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

    logActivity(handle, 'code_redeemed', { code, tier: row.tier, days: Number(row.days||0) });
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
    // First: allow admin session token without user auth (useful for local/dev admin panel).
    const at0 = getAdminToken(req);
    if (at0){
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

// ---- Admin: FAQ content ----
app.get("/api/admin/faq", requireAdmin, (req, res) => {
  try{
    const row = safeDb(() => db.prepare("SELECT json, updated_at FROM ext_faq WHERE id=1").get());
    const faq = row?.json ? JSON.parse(row.json) : { version: 1, items: [] };
    res.json({ ok:true, updated_at: row?.updated_at || null, faq });
  }catch(e){
    console.error("ADMIN_FAQ_GET_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/admin/faq", requireAdmin, (req, res) => {
  try{
    const faq = req.body?.faq ?? req.body?.json ?? req.body?.payload ?? req.body;
    if (!faq || typeof faq !== "object") return res.status(400).json({ ok:false, error:"invalid_faq" });
    const normalized = {
      version: Number(faq.version || 1),
      items: Array.isArray(faq.items) ? faq.items.slice(0, 80).map(x => ({
        q: String(x?.q || x?.question || "").trim().slice(0, 200),
        a: String(x?.a || x?.answer || "").trim().slice(0, 2000)
      })).filter(x => x.q && x.a) : []
    };
    if (!Number.isFinite(normalized.version) || normalized.version <= 0) normalized.version = 1;
    const ts = nowIso();
    safeDb(() => {
      db.prepare(
        `INSERT INTO ext_faq(id, json, updated_at)
         VALUES(1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at`
      ).run(JSON.stringify(normalized), ts);
    });
    res.json({ ok:true, updated_at: ts, faq: normalized });
  }catch(e){
    const msg = String(e?.message || "");
    if (/json/i.test(msg)) return res.status(400).json({ ok:false, error:"invalid_json" });
    console.error("ADMIN_FAQ_POST_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.post("/api/admin/codes", requireAdmin, (req, res) => {
  try {
    let n = Number(req.body?.n || 5);
    if (!Number.isFinite(n)) n = 5;
    n = Math.max(1, Math.min(50, Math.floor(n)));

    const note = String(req.body?.note || "promo").slice(0, 64);

    let days = Number(req.body?.days || 0);
    if (!Number.isFinite(days)) days = 0;
    days = Math.max(0, Math.min(3650, Math.floor(days)));

    const tier = days === 0 ? "unlimited" : "paid";

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
          "INSERT INTO admin_codes(code, note, tier, days, created_at) VALUES(?,?,?,?,?)"
        ).run(code, note, tier, days, nowIso());
        codes.push(code);
      }
    });

    res.json({ ok:true, codes, tier, days });
  } catch (e) {
    console.error("ADMIN_CODES_ERROR", e);
    res.status(500).json({ ok:false, error:"server_error" });
  }
});

app.get("/api/admin/codes", requireAdmin, (req, res) => {
  try {
    const rows = safeDb(() =>
      db
        .prepare("SELECT code, note, tier, days, created_at FROM admin_codes ORDER BY created_at DESC LIMIT 50")
        .all()
    );
    res.json({ ok:true, rows });
  } catch (e) {
    console.error("ADMIN_CODES_LIST_ERROR", e);
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

function adminCodeCreate({ note, tier, days }){
  const code = ("GMX" + crypto.randomBytes(5).toString("hex")).toUpperCase();
  safeDb(() => db.prepare(
    "INSERT INTO admin_codes(code, note, tier, days, created_at) VALUES(?,?,?,?,?)"
  ).run(code, note ? String(note) : null, String(tier||"paid"), Number(days||0)||0, nowIso()));
  return code;
}

function applyAdminCodeToHandle({ handle, code, days }){
  const u = userByHandle(handle);
  if (!u){
    // No user record yet. Create a minimal one (will become real on first init).
    safeDb(() => db.prepare(
      "INSERT OR IGNORE INTO users(handle, token, created_at, tier, paid_until, sub_status, sub_updated_at) VALUES(?,?,?,?,?,?,?)"
    ).run(handle, crypto.randomBytes(24).toString("hex"), nowIso(), "free", null, "inactive", nowIso()));
  }

  // Mark redemption (idempotent by primary key).
  safeDb(() => db.prepare(
    "INSERT OR IGNORE INTO code_redemptions(code, handle, created_at) VALUES(?,?,?)"
  ).run(code, handle, nowIso()));

  // Extend paid_until from now or current paid_until, whichever is later.
  safeDb(() => {
    const row = db.prepare("SELECT tier, paid_until FROM users WHERE handle=?").get(handle);
    const base = row?.paid_until ? new Date(row.paid_until) : new Date(0);
    const start = (base.getTime() > Date.now()) ? base : new Date();
    const next = new Date(start.getTime() + (Number(days||0)||0)*24*60*60*1000);
    db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?")
      .run(next.toISOString(), nowIso(), handle);
  });

  logActivity(handle, 'admin_award', { code, days: Number(days||0)||0 });
  const u2 = userByHandle(handle);
  return subscriptionInfo({ ...u2, handle });
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
    const handle = String(req.body?.handle || winner?.handle || "").trim();
    if (!validHandle(handle)) return res.status(400).json({ ok:false, error:"invalid_request", hint:"invalid_handle" });

    // Require handle match winner unless admin explicitly sets override=true.
    const override = !!req.body?.override;
    if (!override && winner && handle !== winner.handle){
      return res.status(409).json({ ok:false, error:"conflict", hint:"handle_not_current_winner", winner: winner.handle });
    }

    const today = new Date().toISOString().slice(0,10);
    const cycleKey = String(req.body?.cycleKey || `manual_${today}`).trim();
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
    const rows = safeDb(() =>
      db.prepare(`
        SELECT r.code, r.handle, r.created_at, c.tier, c.days, c.note
        FROM code_redemptions r
        LEFT JOIN admin_codes c ON c.code = r.code
        ORDER BY r.created_at DESC
        LIMIT 500
      `).all()
    );
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
    db: DB_PATH,
    startedAt: STARTED_AT
  });
});

// ---------- STATIC SITE ----------
const PUBLIC_DIR = path.join(__dirname, "public");
const APP_HTML = path.join(PUBLIC_DIR, "app.html");

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

app.use(
  express.static(PUBLIC_DIR, {
    maxAge: "1h",
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
  console.error("EXPRESS_ERROR", err);
  if (res.headersSent) return next(err);
  // Prefer JSON for API routes
  if (String(req.originalUrl || "").startsWith("/api")) {
    return sendError(res, 500, ERROR_CODES.SERVER_ERROR);
  }
  res.status(500).send("server_error");
});

app.use("/api", (req, res) => {
  sendError(res, 404, "not_found", { path: req.originalUrl });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server listening on", PORT);
  console.log("DB:", DB_PATH);
  console.log("Public dir:", PUBLIC_DIR);
  console.log("Site: /app");
  console.log("Health: /api/health");
  console.log("Version: /api/version");
  try{ startAutoAwardsLoop(); }catch(_e){}
});