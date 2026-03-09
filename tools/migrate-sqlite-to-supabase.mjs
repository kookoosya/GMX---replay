import path from "node:path";
import fs from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

// Robust repo root resolution (Windows-safe): tools/* -> repoRoot
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

// Allow running the migrator with a local .env (recommended for stable dev).
// Does NOT override already-present environment variables.
dotenv.config({ path: path.join(repoRoot, ".env"), override: false });
const dbPath = (process.env.DB_PATH || "").trim() || path.join(repoRoot, "data.sqlite");

const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  console.error("Tip: run: powershell -ExecutionPolicy Bypass -File tools/env-sync.ps1 -Interactive");
  process.exit(1);
}

if (!fs.existsSync(dbPath)) {
  console.error("SQLite not found:", dbPath);
  process.exit(1);
}

const tablesArg = arg("--tables", "");
const tables = tablesArg
  ? tablesArg.split(",").map((x) => x.trim()).filter(Boolean)
  : ["users", "usage_daily", "referrals", "favorites", "cloud_lists"];

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function log(msg) {
  console.log("[migrate]", msg);
}

async function tableExistsSb(table) {
  // Try a lightweight select; if table doesn't exist, PostgREST returns error.
  const r = await sb.from(table).select("*").limit(1);
  if (r.error) return false;
  return true;
}

async function hasColumnSb(table, col) {
  const r = await sb.from(table).select(col).limit(1);
  return !r.error;
}

function tableExistsSqlite(db, table) {
  const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
  return Boolean(r?.name);
}

function nowIso() {
  return new Date().toISOString();
}

async function migrateUsers(db) {
  if (!tableExistsSqlite(db, "users")) return log("sqlite users missing, skip");
  if (!(await tableExistsSb("users"))) return log("supabase users table missing, skip");

  const cols = ["handle", "created_at", "last_seen", "access_token", "ref_code", "tier", "paid_until", "daily_bonus"];
  const present = [];
  for (const c of cols) {
    // handle should always exist
    if (c === "handle") { present.push(c); continue; }
    // only include if column exists in supabase
    // eslint-disable-next-line no-await-in-loop
    if (await hasColumnSb("users", c)) present.push(c);
  }

  const rows = db.prepare("SELECT handle, created_at, last_seen, access_token, ref_code, tier, paid_until, daily_bonus FROM users").all();
  log(`users: sqlite rows=${rows.length}, writing cols=${present.join(",")}`);

  const payload = rows.map((r) => {
    const o = {};
    for (const c of present) o[c] = r[c];
    return o;
  });

  // chunk upserts
  const chunk = 500;
  for (let i = 0; i < payload.length; i += chunk) {
    // eslint-disable-next-line no-await-in-loop
    const r = await sb.from("users").upsert(payload.slice(i, i + chunk), { onConflict: "handle" });
    if (r.error) throw r.error;
  }

  log("users: done");
}

async function migrateUsageDaily(db) {
  if (!tableExistsSqlite(db, "usage_daily")) return log("sqlite usage_daily missing, skip");
  if (!(await tableExistsSb("usage_daily"))) return log("supabase usage_daily table missing, skip");

  // sqlite schema: (handle, day, kind, used)
  const rows = db.prepare("SELECT handle, day, kind, used FROM usage_daily").all();
  log(`usage_daily: sqlite rows=${rows.length}`);

  const map = new Map(); // key = handle|day
  for (const r of rows) {
    const key = `${r.handle}|${r.day}`;
    const cur = map.get(key) || { handle: r.handle, day: r.day, gm_used: 0, gn_used: 0, plan: "free", gm_limit: 70, gn_limit: 70, updated_at: nowIso() };
    if (String(r.kind).toLowerCase() === "gn") cur.gn_used = Number(r.used) || 0;
    else if (String(r.kind).toLowerCase() === "gm") cur.gm_used = Number(r.used) || 0;
    map.set(key, cur);
  }

  const payload = [...map.values()];
  log(`usage_daily: upserting rows=${payload.length}`);

  const chunk = 500;
  for (let i = 0; i < payload.length; i += chunk) {
    // eslint-disable-next-line no-await-in-loop
    const r = await sb.from("usage_daily").upsert(payload.slice(i, i + chunk), { onConflict: "handle,day" });
    if (r.error) throw r.error;
  }

  log("usage_daily: done");
}

async function migrateReferrals(db) {
  const hasInvites = tableExistsSqlite(db, "referral_invites");
  const hasLegacy = tableExistsSqlite(db, "referrals");
  const hasClicks = tableExistsSqlite(db, "ref_clicks");

  if (!hasInvites && !hasLegacy && !hasClicks) return log("sqlite referrals/ref_clicks missing, skip");
  if (!(await tableExistsSb("referrals"))) return log("supabase referrals table missing, skip");

  // New referrals schema (inviter_handle/invited_handle) expected.
  const newSchema = (await hasColumnSb("referrals", "inviter_handle")) && (await hasColumnSb("referrals", "invited_handle"));
  if (!newSchema) {
    log("supabase referrals table schema is not inviter_handle/invited_handle; skip (legacy migrator)");
    return;
  }

  // --- Migrate confirmed invites (referral_invites -> referrals, legacy=false) ---
  if (hasInvites) {
    const rows = db.prepare("SELECT inviter_handle, invited_handle, created_at, confirmed_at, status FROM referral_invites").all();
    const confirmed = rows.filter(r => String(r.status || "").toLowerCase() === "confirmed");
    log(`referrals(invites): sqlite rows=${confirmed.length}`);

    // Determine "first_use_at" based on sqlite usage_daily (if present).
    const usedMap = new Map(); // handle -> used_sum
    if (tableExistsSqlite(db, "usage_daily")) {
      const invited = [...new Set(confirmed.map(r => String(r.invited_handle || "")).filter(Boolean))];
      const chunkSize = 500;
      for (let i = 0; i < invited.length; i += chunkSize) {
        const chunk = invited.slice(i, i + chunkSize);
        const qs = chunk.map(() => "?").join(",");
        const q = `SELECT handle, SUM(used) AS s FROM usage_daily WHERE handle IN (${qs}) AND used > 0 GROUP BY handle`;
        const rr = db.prepare(q).all(...chunk);
        for (const x of rr) usedMap.set(String(x.handle), Number(x.s || 0) || 0);
      }
    }

    const payload = confirmed.map((r) => {
      const invited = String(r.invited_handle || "");
      const firstUse = (usedMap.get(invited) || 0) > 0 ? (r.confirmed_at || r.created_at || nowIso()) : null;
      return {
        inviter_handle: String(r.inviter_handle || ""),
        invited_handle: invited,
        created_at: r.created_at || nowIso(),
        confirmed_at: r.confirmed_at || r.created_at || nowIso(),
        first_use_at: firstUse,
        legacy: false,
        clicks: 0,
      };
    }).filter(r => r.inviter_handle && r.invited_handle);

    const chunk = 500;
    for (let i = 0; i < payload.length; i += chunk) {
      // eslint-disable-next-line no-await-in-loop
      const r = await sb.from("referrals").upsert(payload.slice(i, i + chunk), { onConflict: "inviter_handle,invited_handle" });
      if (r.error) throw r.error;
    }
    log("referrals(invites): done");
  }

  // --- Migrate legacy fingerprint referrals (referrals -> referrals, legacy=true) ---
  if (hasLegacy) {
    const rows = db.prepare("SELECT owner_handle, fingerprint, created_at FROM referrals").all();
    log(`referrals(legacy): sqlite rows=${rows.length}`);

    const payload = rows.map((r) => ({
      inviter_handle: String(r.owner_handle || ""),
      invited_handle: `legacy:${String(r.fingerprint || "").slice(0, 64)}`,
      created_at: r.created_at || nowIso(),
      confirmed_at: null,
      first_use_at: null,
      legacy: true,
      clicks: 0,
    })).filter(r => r.inviter_handle && r.invited_handle);

    const chunk = 500;
    for (let i = 0; i < payload.length; i += chunk) {
      // eslint-disable-next-line no-await-in-loop
      const r = await sb.from("referrals").upsert(payload.slice(i, i + chunk), { onConflict: "inviter_handle,invited_handle" });
      if (r.error) throw r.error;
    }
    log("referrals(legacy): done");
  }

  // --- Migrate click audit (ref_clicks -> ref_clicks) ---
  if (hasClicks) {
    if (!(await tableExistsSb("ref_clicks"))) {
      log("supabase ref_clicks table missing, skip");
    } else {
      const rows = db.prepare("SELECT code, fingerprint, created_at FROM ref_clicks").all();
      log(`ref_clicks: sqlite rows=${rows.length}`);

      const payload = rows.map((r) => ({
        code: String(r.code || ""),
        fingerprint: String(r.fingerprint || ""),
        created_at: r.created_at || nowIso(),
      })).filter(r => r.code && r.fingerprint);

      const chunk = 1000;
      for (let i = 0; i < payload.length; i += chunk) {
        // eslint-disable-next-line no-await-in-loop
        const r = await sb.from("ref_clicks").upsert(payload.slice(i, i + chunk), { onConflict: "code,fingerprint" });
        if (r.error) throw r.error;
      }
      log("ref_clicks: done");
    }
  }
}


async function migrateFavorites(db) {
  if (!tableExistsSqlite(db, "favorites")) return log("sqlite favorites missing, skip");
  if (!(await tableExistsSb("favorites"))) return log("supabase favorites table missing, skip");

  const rows = db.prepare("SELECT handle, kind, reply_hash, reply, created_at FROM favorites").all();
  log(`favorites: sqlite rows=${rows.length}`);

  const payload = rows.map((r) => ({
    handle: r.handle,
    kind: r.kind,
    reply_hash: r.reply_hash,
    reply: r.reply,
    created_at: r.created_at || nowIso(),
  }));

  const chunk = 500;
  for (let i = 0; i < payload.length; i += chunk) {
    // eslint-disable-next-line no-await-in-loop
    const r = await sb.from("favorites").upsert(payload.slice(i, i + chunk), { onConflict: "handle,kind,reply_hash" });
    if (r.error) throw r.error;
  }

  log("favorites: done");
}

async function migrateCloudLists(db) {
  if (!tableExistsSqlite(db, "cloud_lists")) return log("sqlite cloud_lists missing, skip");
  if (!(await tableExistsSb("cloud_lists"))) return log("supabase cloud_lists table missing, skip");

  const rows = db.prepare("SELECT handle, kind, scope, lang, content, updated_at FROM cloud_lists").all();
  log(`cloud_lists: sqlite rows=${rows.length}`);

  const payload = rows.map((r) => ({
    handle: r.handle,
    kind: r.kind,
    scope: r.scope,
    lang: r.lang,
    content: r.content,
    updated_at: r.updated_at || nowIso(),
  }));

  const chunk = 500;
  for (let i = 0; i < payload.length; i += chunk) {
    // eslint-disable-next-line no-await-in-loop
    const r = await sb.from("cloud_lists").upsert(payload.slice(i, i + chunk), { onConflict: "handle,kind,scope,lang" });
    if (r.error) throw r.error;
  }

  log("cloud_lists: done");
}

async function main() {
  const db = new Database(dbPath, { readonly: true });
  try {
    log("sqlite: " + dbPath);
    log("tables: " + tables.join(", "));

    for (const t of tables) {
      // eslint-disable-next-line no-await-in-loop
      if (t === "users") await migrateUsers(db);
      else if (t === "usage_daily") await migrateUsageDaily(db);
      else if (t === "referrals") await migrateReferrals(db);
      else if (t === "favorites") await migrateFavorites(db);
      else if (t === "cloud_lists") await migrateCloudLists(db);
      else log(`unknown table '${t}', skip`);
    }

    log("DONE");
  } finally {
    db.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
