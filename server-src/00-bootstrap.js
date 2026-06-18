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
    console.error("FATAL: ADMIN_SECRET must be set to a non-default value on Render.");
    process.exit(1);
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

