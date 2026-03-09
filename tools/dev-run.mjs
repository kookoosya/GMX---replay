import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// One-command DEV runner (Windows-friendly):
// - Starts backend (node index.js) and keeps it alive (auto-restart on crash)
// - Starts Vite via node (no npm/cmd quirks)
// - Avoids backend restarts on SQLite writes (no --watch)
// - Uses safe fallback ports when defaults are already occupied
// - Verifies backend readiness with a per-run token so an old hidden process
//   on the same port cannot be mistaken for the freshly spawned backend

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const frontendDir = path.join(repoRoot, "frontend");
const lockFile = path.join(repoRoot, ".gmx-dev-run.lock.json");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isWin() {
  return process.platform === "win32";
}

function safeJsonParse(raw, fallback = null) {
  try {
    return JSON.parse(String(raw || ""));
  } catch {
    return fallback;
  }
}

function listPortPids(port) {
  try {
    if (isWin()) {
      const out = spawnSync("cmd", ["/c", "netstat -ano -p tcp"], {
        encoding: "utf8",
      }).stdout;

      const pids = new Set();
      for (const raw of String(out || "").split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        const parts = line.split(/\s+/);
        if (parts.length < 5) continue;
        const proto = String(parts[0] || "").toUpperCase();
        const localAddr = String(parts[1] || "");
        const state = String(parts[3] || "").toUpperCase();
        const pid = Number(parts[4]);
        if (proto !== "TCP") continue;
        if (state !== "LISTENING") continue;
        if (!localAddr.endsWith(`:${port}`)) continue;
        if (Number.isFinite(pid) && pid > 0) pids.add(pid);
      }
      return [...pids];
    }

    const out = spawnSync(
      "sh",
      ["-lc", `command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:${port} -sTCP:LISTEN -t || true`],
      { encoding: "utf8" }
    ).stdout;

    return [...new Set(
      String(out || "")
        .split(/\s+/)
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
    )];
  } catch {
    return [];
  }
}

async function canBindPort(host, port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, host);
  });
}

async function isPortFree(host, port) {
  if (listPortPids(port).length > 0) return false;
  return canBindPort(host, port);
}

async function findFreePort(host, start, end) {
  for (let p = start; p <= end; p++) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(host, p)) return p;
  }
  return null;
}

const HOST = "127.0.0.1";
const BACKEND_BIND_HOST = "0.0.0.0";
const FRONTEND_BIND_HOST = HOST;

const PREF_BACKEND_PORT = Number(process.env.PORT || "10000") || 10000;
const PREF_FRONTEND_PORT = Number(process.env.GMX_FRONTEND_PORT || "5173") || 5173;
const FORCE_REUSE_BUSY_DEFAULT_PORTS = String(process.env.GMX_DEV_FORCE_REUSE_PORTS || "").trim() === "1";

let BACKEND_PORT = PREF_BACKEND_PORT;
let chosenFrontendPort = PREF_FRONTEND_PORT;
let PROBE_URL = `http://${HOST}:${BACKEND_PORT}/api/version`;

let shuttingDown = false;
let backend = null;
let frontend = null;
let currentBackendToken = "";

function writeLock() {
  const payload = {
    pid: process.pid,
    repoRoot,
    startedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(lockFile, JSON.stringify(payload, null, 2));
  } catch {}
}

function clearLock() {
  try {
    const data = safeJsonParse(fs.readFileSync(lockFile, "utf8"), null);
    if (!data || Number(data.pid) === process.pid) {
      fs.unlinkSync(lockFile);
    }
  } catch {}
}

function isPidAlive(pid) {
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function killTree(pid) {
  if (!pid) return false;
  try {
    if (isWin()) {
      spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
      return true;
    }
    process.kill(pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

async function stopPreviousLockedRunner() {
  try {
    if (!exists(lockFile)) return;
    const data = safeJsonParse(fs.readFileSync(lockFile, "utf8"), null);
    const oldPid = Number(data?.pid || 0);
    if (!Number.isFinite(oldPid) || oldPid <= 0 || oldPid === process.pid) {
      clearLock();
      return;
    }
    if (!isPidAlive(oldPid)) {
      clearLock();
      return;
    }
    console.log(`\n[dev] previous dev-run detected (pid ${oldPid}). stopping it first...\n`);
    killTree(oldPid);
    await sleep(1500);
    clearLock();
  } catch {}
}

function banner(frontPort) {
  const site = `http://${HOST}:${frontPort}/app`;
  const bridge = `http://${HOST}:${frontPort}/`;
  console.log("\n[dev] running:");
  console.log(`  backend:  http://${HOST}:${BACKEND_PORT}`);
  console.log(`  site:    ${site}`);
  console.log(`  bridge:  ${bridge}`);
  if (BACKEND_PORT !== PREF_BACKEND_PORT || frontPort !== PREF_FRONTEND_PORT) {
    console.log("\n[dev] note: default dev ports were busy, so fallback ports were used for this run.");
  }
  console.log("\n[dev] tip: if you want ONLY the site, bookmark the current /app URL above\n");
}

async function choosePort(label, host, preferredPort, maxOffset = 20) {
  if (await isPortFree(host, preferredPort)) {
    return preferredPort;
  }

  console.log(`\n[dev] ${label} port ${preferredPort} is already busy.\n`);

  if (FORCE_REUSE_BUSY_DEFAULT_PORTS) {
    console.log(`[dev] GMX_DEV_FORCE_REUSE_PORTS=1 set, so trying to reclaim ${preferredPort}...\n`);
    for (const pid of listPortPids(preferredPort)) {
      killTree(pid);
    }
    await sleep(1200);
    if (await isPortFree(host, preferredPort)) {
      return preferredPort;
    }
    console.log(`[dev] ${label} port ${preferredPort} is still busy after reclaim attempt.\n`);
  }

  const picked = await findFreePort(host, preferredPort + 1, preferredPort + maxOffset);
  if (picked) {
    console.log(`[dev] using ${label} port ${picked} instead to avoid restart loops.\n`);
    return picked;
  }

  if (!FORCE_REUSE_BUSY_DEFAULT_PORTS) {
    console.log(`[dev] no fallback ${label} port found near ${preferredPort}. trying to reclaim it as a last resort...\n`);
    for (const pid of listPortPids(preferredPort)) {
      killTree(pid);
    }
    await sleep(1200);
    if (await isPortFree(host, preferredPort)) {
      return preferredPort;
    }
  }

  console.error(`\n[dev] Can't get a working ${label} port starting from ${preferredPort}.\n`);
  console.error("[dev] Close old node/vite terminals or free the port range and run again.\n");
  shutdown(1);
  return null;
}

async function ensureBackendPort() {
  const port = await choosePort("backend", BACKEND_BIND_HOST, BACKEND_PORT);
  if (!port) return null;
  BACKEND_PORT = port;
  PROBE_URL = `http://${HOST}:${BACKEND_PORT}/api/version`;
  return port;
}

async function ensureFrontendPort() {
  const port = await choosePort("frontend", FRONTEND_BIND_HOST, chosenFrontendPort);
  if (!port) return null;
  chosenFrontendPort = port;
  return port;
}

function spawnBackend() {
  if (shuttingDown) return;

  currentBackendToken = crypto.randomBytes(12).toString("hex");

  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: String(BACKEND_PORT),
    SITE_URL: process.env.SITE_URL || `http://${HOST}:${chosenFrontendPort}`,
    GMX_DEV_RUN_TOKEN: currentBackendToken,
  };

  const envFile = exists(path.join(repoRoot, ".env")) ? ["--env-file=.env"] : [];

  backend = spawn(process.execPath, [...envFile, "index.js"], {
    cwd: repoRoot,
    stdio: "inherit",
    env,
  });

  backend.on("exit", async (code, signal) => {
    backend = null;
    if (shuttingDown) return;
    console.log(`\n[dev] backend exited (code=${code ?? "?"}, signal=${signal ?? "?"}). restarting...`);
    await sleep(800);
    const prevPort = BACKEND_PORT;
    const nextPort = await ensureBackendPort();
    if (!nextPort || shuttingDown) return;
    if (frontend?.pid && nextPort !== prevPort) {
      killTree(frontend.pid);
    }
    spawnBackend();
  });
}

function spawnFrontend(port = chosenFrontendPort) {
  if (shuttingDown) return;

  const viteBin = path.join(frontendDir, "node_modules", "vite", "bin", "vite.js");
  if (!exists(viteBin)) {
    console.error("\n[dev] Vite not found. Run: npm --prefix frontend install\n");
    shutdown(1);
    return;
  }

  const args = [viteBin, "--host", HOST, "--port", String(port), "--strictPort"];
  frontend = spawn(process.execPath, args, {
    cwd: frontendDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "development",
      GMX_FRONTEND_PORT: String(port),
      GMX_BACKEND_URL: `http://${HOST}:${BACKEND_PORT}`,
    },
  });

  frontend.on("exit", async (code, signal) => {
    frontend = null;
    if (shuttingDown) return;
    console.log(`\n[dev] frontend exited (code=${code ?? "?"}, signal=${signal ?? "?"}). restarting...`);
    await sleep(800);
    const nextPort = await ensureFrontendPort();
    if (!nextPort || shuttingDown) return;
    spawnFrontend(nextPort);
    if (nextPort !== port) {
      banner(nextPort);
    }
  });
}

async function fetchHealth() {
  try {
    const res = await fetch(PROBE_URL, { method: "GET" });
    const text = await res.text();
    const data = safeJsonParse(text, null);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

function healthMatchesCurrentBackend(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!currentBackendToken) return true;
  return String(payload.devRunToken || "") === currentBackendToken;
}

async function healthWatchdog() {
  let fails = 0;
  while (!shuttingDown) {
    await sleep(2500);
    if (shuttingDown) break;
    const probe = await fetchHealth();
    if (probe.ok && healthMatchesCurrentBackend(probe.data)) {
      fails = 0;
      continue;
    }
    fails += 1;
    if (fails >= 3) {
      fails = 0;
      try {
        console.log("\n[dev] health check failed 3x for the current backend instance. restarting backend...\n");
        if (backend?.pid) killTree(backend.pid);
        else backend?.kill();
      } catch {}
    }
  }
}

async function waitForBackendReady() {
  for (let i = 0; i < 48; i++) {
    await sleep(250);
    if (shuttingDown) return false;
    if (backend && backend.exitCode != null) return false;
    const probe = await fetchHealth();
    if (probe.ok && healthMatchesCurrentBackend(probe.data)) {
      return true;
    }
  }
  return false;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = code;
  clearLock();
  try { if (backend?.pid) killTree(backend.pid); else backend?.kill(); } catch {}
  try { if (frontend?.pid) killTree(frontend.pid); else frontend?.kill(); } catch {}
  setTimeout(() => process.exit(code), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("exit", () => clearLock());

(async () => {
  await stopPreviousLockedRunner();
  writeLock();

  const backendPort = await ensureBackendPort();
  if (!backendPort) return;

  const frontPort = await ensureFrontendPort();
  if (!frontPort) return;

  spawnBackend();
  const ready = await waitForBackendReady();
  if (!ready) {
    console.error(`\n[dev] backend did not become reachable as the current instance on http://${HOST}:${BACKEND_PORT}. frontend was not started.\n`);
    console.error("[dev] This usually means another old dev runner is still alive on the default ports.\n");
    shutdown(1);
    return;
  }

  spawnFrontend(frontPort);
  banner(frontPort);
  healthWatchdog();
})();
