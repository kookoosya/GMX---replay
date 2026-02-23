import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// One-command DEV runner (Windows-friendly):
// - Starts backend (node index.js) and keeps it alive (auto-restart on crash)
// - Starts Vite via node (no npm/cmd quirks)
// - Avoids backend restarts on SQLite writes (no --watch)
// - Optional health watchdog: if /api/health stops responding, restart backend

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const frontendDir = path.join(repoRoot, "frontend");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isPortFree(host, port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, host);
  });
}

async function findFreePort(host, start, end) {
  for (let p = start; p <= end; p++) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(host, p)) return p;
  }
  return null;
}

const HOST = "127.0.0.1";

// Preferred ports.
const PREF_BACKEND_PORT = Number(process.env.PORT || "10000") || 10000;
const PREF_FRONTEND_PORT = Number(process.env.GMX_FRONTEND_PORT || "5173") || 5173;

let BACKEND_PORT = PREF_BACKEND_PORT;
let chosenFrontendPort = PREF_FRONTEND_PORT;

let HEALTH_URL = `http://${HOST}:${BACKEND_PORT}/api/health`;

let shuttingDown = false;

let backend = null;
let frontend = null;

function banner(frontPort) {
  const site = `http://${HOST}:${frontPort}/app`;
  const bridge = `http://${HOST}:${frontPort}/`;
  console.log("\n[dev] running:");
  console.log(`  backend:  http://${HOST}:${BACKEND_PORT}`);
  console.log(`  site:    ${site}`);
  console.log(`  bridge:  ${bridge}`);
  console.log("\n[dev] tip: if you want ONLY the site, bookmark /app\n");
}

function isWin() {
  return process.platform === "win32";
}

function killTree(pid) {
  if (!pid) return false;
  try {
    if (isWin()) {
      // /T = kill child processes too
      spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
      return true;
    }
    process.kill(pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

function killPort(port) {
  // Best-effort. If we can't kill, caller should fallback to another port.
  try {
    if (isWin()) {
      const out = spawnSync("cmd", ["/c", `netstat -ano -p tcp | findstr :${port}`], {
        encoding: "utf8",
      }).stdout;

      const pids = new Set();
      for (const line of String(out || "").split(/\r?\n/)) {
        // Example: TCP    127.0.0.1:5173   0.0.0.0:0   LISTENING   12345
        const m = line.trim().match(/\sLISTENING\s+(\d+)$/i);
        if (m) pids.add(Number(m[1]));
      }

      let killed = false;
      for (const pid of pids) {
        killed = killTree(pid) || killed;
      }
      return killed;
    }

    // macOS/Linux: prefer lsof if available.
    const out = spawnSync("sh", ["-lc", `command -v lsof >/dev/null 2>&1 && lsof -ti tcp:${port} || true`], {
      encoding: "utf8",
    }).stdout;

    const pids = String(out || "")
      .split(/\s+/)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0);

    let killed = false;
    for (const pid of new Set(pids)) {
      killed = killTree(pid) || killed;
    }
    return killed;
  } catch {
    return false;
  }
}

function spawnBackend() {
  if (shuttingDown) return;
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "development",
    // Keep PORT stable unless user overrides it.
    PORT: String(BACKEND_PORT),
    // Useful for absolute links in API responses during dev.
    SITE_URL: process.env.SITE_URL || `http://${HOST}:${chosenFrontendPort}`,
  };

  backend = spawn(process.execPath, ["index.js"], {
    cwd: repoRoot,
    stdio: "inherit",
    env,
  });

  backend.on("exit", async (code, signal) => {
    if (shuttingDown) return;
    console.log(`\n[dev] backend exited (code=${code ?? "?"}, signal=${signal ?? "?"}). restarting...`);
    await sleep(800);
    spawnBackend();
  });
}

function spawnFrontend(port) {
  if (shuttingDown) return;

  const viteBin = path.join(frontendDir, "node_modules", "vite", "bin", "vite.js");
  if (!exists(viteBin)) {
    console.error("\n[dev] Vite not found. Run: npm --prefix frontend install\n");
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
      // Let vite.config.ts pick this up for proxy target if needed.
      GMX_BACKEND_URL: `http://${HOST}:${BACKEND_PORT}`,
    },
  });

  frontend.on("exit", async (code, signal) => {
    if (shuttingDown) return;
    console.log(`\n[dev] frontend exited (code=${code ?? "?"}, signal=${signal ?? "?"}). restarting...`);
    await sleep(800);
    spawnFrontend(port);
  });
}

async function healthWatchdog() {
  // If backend becomes unreachable for several checks in a row, restart it.
  let fails = 0;
  while (!shuttingDown) {
    await sleep(2500);
    if (shuttingDown) break;
    try {
      const res = await fetch(HEALTH_URL, { method: "GET" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      fails = 0;
    } catch {
      fails++;
      if (fails >= 3) {
        fails = 0;
        try {
          console.log("\n[dev] health check failed 3x. restarting backend...\n");
          if (backend?.pid) killTree(backend.pid);
          else backend?.kill();
        } catch {}
      }
    }
  }
}

async function waitForBackendReady() {
  // Wait up to ~10 seconds for backend to respond.
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    if (shuttingDown) return false;
    try {
      const res = await fetch(HEALTH_URL, { method: "GET" });
      if (res.ok) return true;
    } catch {}
  }
  return false;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  try { if (backend?.pid) killTree(backend.pid); else backend?.kill(); } catch {}
  try { if (frontend?.pid) killTree(frontend.pid); else frontend?.kill(); } catch {}
  setTimeout(() => process.exit(code), 250);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// Main
(async () => {
  // 1) Make sure backend port is free (prefer 10000).
  if (!(await isPortFree(HOST, BACKEND_PORT))) {
    console.log(`\n[dev] backend port ${BACKEND_PORT} is busy. trying to close the old process...\n`);
    killPort(BACKEND_PORT);
    await sleep(500);
    if (!(await isPortFree(HOST, BACKEND_PORT))) {
      const picked = await findFreePort(HOST, BACKEND_PORT + 1, BACKEND_PORT + 20);
      if (!picked) {
        console.error(`\n[dev] Can't free backend port ${BACKEND_PORT} and no fallback port found.\n`);
        console.error(`[dev] Close whatever is using it and run again.\n`);
        shutdown(1);
        return;
      }
      console.log(`\n[dev] still busy. using backend port ${picked} instead.\n`);
      BACKEND_PORT = picked;
      HEALTH_URL = `http://${HOST}:${BACKEND_PORT}/api/health`;
    }
  }

  // 2) Make sure frontend port is free (prefer 5173).
  let port = chosenFrontendPort;
  if (!(await isPortFree(HOST, port))) {
    console.log(`\n[dev] frontend port ${port} is busy. trying to close the old process...\n`);
    killPort(port);
    await sleep(500);
    if (!(await isPortFree(HOST, port))) {
      const picked = await findFreePort(HOST, port + 1, port + 20);
      if (!picked) {
        console.error(`\n[dev] Can't free frontend port ${port} and no fallback port found.\n`);
        console.error(`[dev] Close whatever is using it and run again.\n`);
        shutdown(1);
        return;
      }
      console.log(`\n[dev] still busy. using frontend port ${picked} instead.\n`);
      port = picked;
    }
  }

  chosenFrontendPort = port;

  // 3) Start backend first.
  spawnBackend();
  await waitForBackendReady();

  // 4) Start Vite.
  spawnFrontend(port);
  banner(port);

  // Start watchdog (best-effort).
  healthWatchdog();
})();
