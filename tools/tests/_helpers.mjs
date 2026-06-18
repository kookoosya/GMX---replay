#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import { spawn, execSync } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";

export function fail(msg) {
  console.error(`TEST_FAIL: ${msg}`);
  process.exit(1);
}

export function ok(label) {
  console.log(`  ok ${label}`);
}

/** Unique @handle that survives normalizeHandle (max 15 alnum/underscore). */
export function freshSmokeHandle(prefix = "t") {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let user = String(prefix || "t").replace(/[^A-Za-z0-9_]/g, "").slice(0, 3);
  const need = Math.max(1, 14 - user.length);
  const buf = crypto.randomBytes(need + 4);
  for (let i = 0; i < need; i++) user += alphabet[buf[i] % alphabet.length];
  user = user.slice(0, 15);
  return `@${user}`;
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

export function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!/LISTENING/i.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = Number(parts[parts.length - 1]);
        if (Number.isFinite(pid) && pid > 0) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        } catch {}
      }
      return;
    }
    const out = execSync(`lsof -ti :${port} 2>/dev/null || true`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {}
    }
  } catch {}
}

export async function waitForHealth(base, ms = 20000) {
  const start = Date.now();
  let lastError = "";
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return;
      lastError = `status ${r.status}`;
    } catch (e) {
      lastError = e?.message || String(e);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  fail(`server not healthy at ${base}${lastError ? ` (${lastError})` : ""}`);
}

export async function spawnTestServer(port) {
  killPort(port);
  const dbPath = path.join(os.tmpdir(), `gmxreply-test-${port}-${process.pid}.sqlite`);
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  } catch {}
  let stderr = "";
  const child = spawn(process.execPath, ["index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: dbPath,
      NODE_ENV: "test",
      GMX_SOLANA_RPC_MOCK: "1",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "test-admin-local",
      ADMIN_SECRET: process.env.ADMIN_SECRET || "test-admin-secret-local",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr?.on("data", (chunk) => {
    stderr += String(chunk || "");
    if (stderr.length > 8000) stderr = stderr.slice(-8000);
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitForHealth(base);
  } catch (e) {
    child.kill("SIGTERM");
    const tail = stderr.trim();
    fail(tail ? `${e?.message || e}\n--- server stderr ---\n${tail}` : (e?.message || String(e)));
  }
  return { child, base, port, dbPath };
}
