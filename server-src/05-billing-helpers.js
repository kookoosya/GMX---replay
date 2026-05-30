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

