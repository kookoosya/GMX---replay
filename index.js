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

import {
  CONFIG,
  PLANS,
  ERROR_CODES,
  sendError,
  BILLING_PLANS,
  BILLING_TOKENS,
  REF_MIN_ACTIVE_DAYS,
  REF_MIN_ACTIVE_USES,
  USDC_MINT,
  USDT_MINT,
  SOL_RECEIVER,
  SOL_USD_FALLBACK,
  EXTENSION_STORE_URL,
} from "./server/config.mjs";
import { nowIso, todayKeyUTC, nextResetUTC, randHex, sha256 } from "./server/time.mjs";

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
const IS_RENDER = Boolean(process.env.RENDER || process.env.RENDER_GIT_COMMIT || process.env.RENDER_SERVICE_ID);
const IS_PRODUCTION_DEPLOY =
  IS_RENDER || String(process.env.NODE_ENV || "").toLowerCase() === "production";
const RAW_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
const RAW_ADMIN_SECRET = String(process.env.ADMIN_SECRET || "").trim();

if (IS_RENDER) {
  if (!RAW_ADMIN_PASSWORD) {
    console.warn("WARN: ADMIN_PASSWORD is not set on Render — admin UI login is disabled.");
  }
  if (!RAW_ADMIN_SECRET || RAW_ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
    console.warn("WARN: ADMIN_SECRET is not set on Render — admin API routes are disabled until configured.");
  }
} else if (IS_PRODUCTION_DEPLOY && !IS_RENDER) {
  if (!RAW_ADMIN_PASSWORD) {
    console.error("FATAL: ADMIN_PASSWORD is required in production.");
    process.exit(1);
  }
  if (!RAW_ADMIN_SECRET || RAW_ADMIN_SECRET === "CHANGE_ME_ADMIN_SECRET") {
    console.error("FATAL: ADMIN_SECRET must be set to a non-default value in production.");
    process.exit(1);
  }
}

const ADMIN_SECRET = RAW_ADMIN_SECRET || (DEV_MODE ? "CHANGE_ME_ADMIN_SECRET" : "");
// Admin password strategy:
// - Render (public) MUST set ADMIN_PASSWORD explicitly (enforced above).
// - Local/dev/test may use fallback for admin UI smoke tests.
const ADMIN_PASSWORD = RAW_ADMIN_PASSWORD || (DEV_MODE && !IS_PRODUCTION_DEPLOY
  ? ((RAW_ADMIN_SECRET && RAW_ADMIN_SECRET !== "CHANGE_ME_ADMIN_SECRET") ? RAW_ADMIN_SECRET : "admin")
  : "");
const ADMIN_SESSION_HOURS = Math.max(1, Math.min(168, Number(process.env.ADMIN_SESSION_HOURS || "24") || 24));


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
import { createDb } from "./server/db.mjs";

const {
  DB_MODE,
  SUPABASE_CONFIGURED,
  getSupabaseAdmin,
  supabaseActive,
  sbEnsureUser,
  sbCloudListsGet,
  sbCloudListsUpsert,
  sbFavoritesGet,
  sbFavoritesCount,
  sbFavoritesHas,
  sbFavoritesDelete,
  sbFavoritesUpsert,
  sbGetDailyUsed,
  sbConsumeDailyAtomic,
  DB_PATH,
  db,
} = createDb({
  createClient,
  path,
  dirname: __dirname,
  Database,
  nowIso,
  mirrorSupabaseUsageToSqlite,
  sbReferralsMarkFirstUse,
});

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
import { createAuth } from "./server/auth.mjs";

const {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SEC,
  getAuthToken,
  setAuthCookie,
  getBearer,
  userByHandle,
  userByToken,
  requireAuth,
  maybeAuth,
  ensureUser,
  rotateToken,
  referralFingerprint,
  getReferralPromoterSummary,
  awardReferralBonus,
  getDailyLimit,
  referralRewardTotal,
  hasReferralReward,
  grantReferralReward,
  maybeAwardStarterReward,
  mapReferralNotCountedReason,
  classifyReferralEntry,
  computeReferralUnlocks,
  subscriptionInfo,
  insertLimitForUser,
} = createAuth({
  safeDb,
  db,
  nowIso,
  sendError,
  ERROR_CODES,
  normalizeHandle,
  validHandle,
  randHex,
  ADMIN_HANDLE_ENV,
  setAdminHandleCache: (value) => { ADMIN_HANDLE_CACHE = value; },
  CONFIG,
  supabaseActive,
  sbReferralsCount,
  sbRefClicksCount,
  referralCountConfirmed,
  referralCountActive,
  REF_MIN_ACTIVE_DAYS,
  REF_MIN_ACTIVE_USES,
  clientIp,
  sha256,
  isAdminHandle,
});

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

import { registerGenerateRoutes } from "./server/routes/generate.mjs";
import { registerProToolsRoutes } from "./server/routes/pro-tools.mjs";
import { registerPublicRoutes } from "./server/routes/public.mjs";

// ---------- GENERATOR (see server/generation.mjs) ----------
let normLang, generateRankedCandidates, generateUnique, saveRecent;
let composeReply, sanitizeSingle, getRecentSet;
function initGenerator() {
  const gen = createGenerator({ safeDb, db, nowIso, safeOptionalHistoryDb, sha256 });
  normLang = gen.normLang;
  generateRankedCandidates = gen.generateRankedCandidates;
  generateUnique = gen.generateUnique;
  saveRecent = gen.saveRecent;
  composeReply = gen.composeReply;
  sanitizeSingle = gen.sanitizeSingle;
  getRecentSet = gen.getRecentSet;
  registerGenerateRoutes({
    app,
    requireAuth,
    sendError,
    ERROR_CODES,
    parseAntiLastN,
    normLang,
    generateUnique,
    generateRankedCandidates,
    saveRecent,
  });
  registerProToolsRoutes({
    app,
    requireAuth,
    sendError,
    ERROR_CODES,
    parseAntiLastN,
    rateLimit,
    normLang,
    generateUnique,
    saveRecent,
    composeReply,
    sanitizeSingle,
    getRecentSet,
    todayKeyUTC,
    userByHandle,
    subscriptionInfo,
    getDailyUsed,
    incDaily,
    safeOptionalHistoryDb,
    safeDb,
    db,
    getSupabaseAdmin,
    sbFavoritesGet,
    sbFavoritesHas,
    sbFavoritesDelete,
    sbFavoritesCount,
    sbFavoritesUpsert,
    sha256,
    nowIso,
    consumeLimiter,
    genBurstLimiter,
    bulkBurstLimiter,
    enforceGenGuard,
    GEN_SEMAPHORE,
    awardReferralBonus,
    maybeAwardStarterReward,
    insertLimitForUser,
    supabaseActive,
    sbConsumeDailyAtomic,
    consumeDailyAtomic,
    nextResetUTC,
    logActivity,
    referralFingerprint,
    originFromReq,
    sbBackfillInvitesFromSqlite,
    sbReferralsCount,
    sbRefClicksCount,
    sbUsageEverUsed,
    referralCountConfirmed,
    referralCountActive,
    getReferralPromoterSummary,
    referralRewardTotal,
    computeReferralUnlocks,
    CONFIG,
    classifyReferralEntry,
    REF_MIN_ACTIVE_DAYS,
    REF_MIN_ACTIVE_USES,
    getBearer,
    userByToken,
    validHandle,
    isAdminHandle,
    setFeatureFlag,
    sbRefClicksUpsert,
  });
  registerPublicRoutes({
    app,
    sendError,
    normLang,
    generateRankedCandidates,
    composeReply,
    sanitizeSingle,
  });
}

import { registerMetaRoutes } from "./server/routes/meta.mjs";

registerMetaRoutes({
  app,
  getHealthSnapshot,
  BUILD_ID,
  STARTED_AT,
  DEV_RUN_TOKEN,
  nowIso,
  CONFIG,
  PLANS,
  SOL_RECEIVER,
  BILLING_TOKENS,
  BILLING_PLANS,
  EXTENSION_STORE_URL,
});

import { registerUserRoutes } from "./server/routes/user.mjs";
import { createExtSelectors } from "./server/ext-selectors.mjs";
import { registerExtRoutes } from "./server/routes/ext.mjs";

const extSelectors = createExtSelectors({ safeDb, db, nowIso, sha256, randHex });

registerExtRoutes({
  app,
  BUILD_ID,
  safeDb,
  db,
  nowIso,
  sha256,
  referralFingerprint,
  getEffectiveExtSelectorsForClient: extSelectors.getEffectiveExtSelectorsForClient,
});

registerUserRoutes({
  app,
  rateLimit,
  initLimiter,
  requireAuth,
  maybeAuth,
  sendError,
  ERROR_CODES,
  CONFIG,
  DEV_MODE,
  BUILD_ID,
  STARTED_AT,
  nowIso,
  todayKeyUTC,
  nextResetUTC,
  sha256,
  getAuthToken,
  setAuthCookie,
  canUseDevSessionReset,
  normalizeHandle,
  validHandle,
  userByHandle,
  userByToken,
  ensureUser,
  rotateToken,
  safeDb,
  db,
  supabaseActive,
  sbGetDailyUsed,
  sbReferralsUpsertInvite,
  getDailyUsed,
  subscriptionInfo,
  insertLimitForUser,
  awardReferralBonus,
  maybeAwardStarterReward,
  getReferralPromoterSummary,
  referralRewardTotal,
  computeReferralUnlocks,
  referralFingerprint,
  clientIp,
  originFromReq,
  isAdminHandle,
  logActivity,
});

// Expose for admin routes (server/routes/admin.mjs)
var __GMX_EXT_SELECTORS = extSelectors;

import { registerCloudRoutes } from "./server/routes/cloud.mjs";

registerCloudRoutes({
  app,
  requireAuth,
  userByHandle,
  subscriptionInfo,
  getSupabaseAdmin,
  sbCloudListsGet,
  sbCloudListsUpsert,
  safeDb,
  db,
  nowIso,
});


// ---------- PRO TOOLS (see server/routes/pro-tools.mjs; registered in initGenerator) ----------
// ---------- ADMIN AUTH (see server/routes/admin-auth.mjs; registered in static-site) ----------

// Billing


import { createAdminSessionHelpers } from "./server/admin/session.mjs";

// ---------- ADMIN (session helpers; auth routes in server/routes/admin-auth.mjs) ----------
const {
  getAdminKey,
  getAdminToken,
  safeEq,
  adminSessionCleanup,
  adminSessionCreate,
  adminSessionGet,
  adminSessionDelete,
} = createAdminSessionHelpers({ db, crypto, adminSessionHours: ADMIN_SESSION_HOURS });

import { createAdminGrants } from "./server/admin/grants.mjs";
import { registerAdminRoutes } from "./server/routes/admin.mjs";

const adminGrants = createAdminGrants({
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
});

var startAutoAwardsLoop;
({ startAutoAwardsLoop } = registerAdminRoutes({
  app,
  crypto,
  path,
  DB_PATH,
  BUILD_ID,
  STARTED_AT,
  ADMIN_SECRET,
  safeDb,
  db,
  nowIso,
  todayKeyUTC,
  randHex,
  getBearer,
  getAdminKey,
  getAdminToken,
  canUseDevAdminSession,
  adminSessionGet,
  userByToken,
  userByHandle,
  isAdminHandle,
  normalizeHandle,
  validHandle,
  ensureUser,
  subscriptionInfo,
  grantReferralReward,
  logActivity,
  ext: __GMX_EXT_SELECTORS,
  grants: adminGrants,
}));

import { registerStaticRoutes } from "./server/routes/static.mjs";

const PUBLIC_DIR = path.join(__dirname, "public");

registerStaticRoutes({
  app,
  express,
  fs,
  PUBLIC_DIR,
  EXTENSION_STORE_URL,
});

import { registerAdminAuthRoutes } from "./server/routes/admin-auth.mjs";

registerAdminAuthRoutes({
  app,
  requireAuth,
  rateLimit,
  getAdminKey,
  getAdminToken,
  safeEq,
  adminSessionCreate,
  adminSessionDelete,
  ADMIN_SECRET,
  ADMIN_PASSWORD,
  getAdminHandle,
  setSetting,
  isAdminHandle,
});

import { registerBillingRoutes } from "./server/routes/billing.mjs";

registerBillingRoutes({
  app,
  requireAuth,
  sendError,
  ERROR_CODES,
  BILLING_PLANS,
  BILLING_TOKENS,
  SOL_RECEIVER,
  isSolanaPubkey,
  getSolUsd,
  quoteSolLamportsFromUsd,
  safeDb,
  db,
  nowIso,
  randHex,
  userByHandle,
  subscriptionInfo,
  logActivity,
  grantReferralReward,
  referralCountActive,
  referralRewardTotal,
  computeReferralUnlocks,
  PUBLIC_DIR,
  ASSETS_DIR,
  path,
  fs,
  crypto,
  fetch,
});

initGenerator();

import { registerErrorRoutes } from "./server/routes/errors.mjs";

registerErrorRoutes({ app, writeLog, sendError, ERROR_CODES });

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
    publicDir: path.join(__dirname, "public"),
    health: "/api/health",
    version: "/api/version",
  });
  try {
    startAutoAwardsLoop();
  } catch (_e) {
    writeLog("ERROR", "AUTO_AWARDS_LOOP_FAILED", { error: _e?.message || String(_e) });
  }
});
