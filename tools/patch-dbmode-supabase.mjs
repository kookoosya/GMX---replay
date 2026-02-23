import fs from "node:fs";

const file = "index.js";
let s = fs.readFileSync(file, "utf8");

function bail(msg) {
  console.error("PATCH FAILED:", msg);
  process.exit(1);
}

function backup() {
  const name = `index.js.bak_dbmode_supabase_${Date.now()}`;
  fs.writeFileSync(name, s, "utf8");
  return name;
}

function ensureSupabaseImport() {
  if (s.includes('from "@supabase/supabase-js"')) return;

  const dbImport = 'import Database from "better-sqlite3";';
  const supaImport = 'import { createClient } from "@supabase/supabase-js";';

  if (s.includes(dbImport)) {
    s = s.replace(dbImport, `${dbImport}\n${supaImport}`);
    return;
  }

  // fallback: insert after last import
  const imports = [...s.matchAll(/^import .*?;$/gm)];
  if (!imports.length) bail("No ES module imports found to insert supabase import.");
  const last = imports[imports.length - 1];
  const idx = last.index + last[0].length;
  s = s.slice(0, idx) + `\n${supaImport}` + s.slice(idx);
}

function ensureDbModeBlock() {
  // if already patched, skip
  if (s.includes("const DB_MODE") && s.includes("getSupabaseAdmin")) return;

  const reDbPath = /^const DB_PATH\s*=\s*process\.env\.DB_PATH\s*\|\|\s*path\.join\(__dirname,\s*["']data\.sqlite["']\);\s*$/m;
  const m = s.match(reDbPath);
  if (!m) bail('Could not find DB_PATH line: const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");');

  const block =
`const DB_MODE = (String(process.env.DB_MODE || "sqlite").trim().toLowerCase() === "supabase") ? "supabase" : "sqlite";
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

`;

  s = s.replace(reDbPath, block + m[0]);
}

function tryPatchHealth() {
  // Only patch inside the /api/health route block. If not found, we don't fail.
  const candidates = [
    'app.get("/api/health"',
    "app.get('/api/health'"
  ];

  let start = -1;
  for (const c of candidates) {
    start = s.indexOf(c);
    if (start >= 0) break;
  }
  if (start < 0) {
    console.warn("WARN: /api/health route not found; skipped adding dbMode fields.");
    return;
  }

  // find end of this route block by next "app." occurrence
  let end = s.indexOf("\napp.", start + 1);
  if (end < 0) end = s.length;

  const route = s.slice(start, end);
  if (route.includes("dbMode:") || route.includes("supabaseConfigured:")) return;

  const re = /res\.json\(\{\s*([\s\S]*?)\s*\}\s*\)/m;
  const mm = route.match(re);
  if (!mm) {
    console.warn("WARN: could not locate res.json({...}) inside /api/health; skipped.");
    return;
  }

  let inner = mm[1];
  // Ensure there's a comma before we append our fields
  const trimmed = inner.trimEnd();
  const needsComma = trimmed.length > 0 && !trimmed.endsWith(",");

  const injected =
`res.json({
${inner}${needsComma ? "," : ""}
  dbMode: DB_MODE,
  supabaseConfigured: SUPABASE_CONFIGURED
})`;

  const route2 = route.replace(re, injected);
  s = s.slice(0, start) + route2 + s.slice(end);
}

function tryPatchStartupLogs() {
  if (s.includes('console.log("DB_MODE:"')) return;

  const needle = 'console.log("DB:", DB_PATH);';
  if (!s.includes(needle)) return;

  const repl = 'console.log("DB_MODE:", DB_MODE);\nconsole.log("DB:", DB_PATH);\nconsole.log("Supabase configured:", SUPABASE_CONFIGURED);';
  s = s.replace(needle, repl);
}

const bak = backup();
ensureSupabaseImport();
ensureDbModeBlock();
tryPatchHealth();
tryPatchStartupLogs();

fs.writeFileSync(file, s, "utf8");
console.log("OK: patched index.js (DB_MODE + supabase wiring).");
console.log("Backup:", bak);