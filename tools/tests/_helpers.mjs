#!/usr/bin/env node
import crypto from "node:crypto";
import { spawn, execSync } from "node:child_process";
import net from "node:net";

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
    if (process.platform === "win32") return;
    const out = execSync(`lsof -ti :${port} 2>/dev/null || true`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {}
    }
  } catch {}
}

export async function waitForHealth(base, ms = 12000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  fail(`server not healthy at ${base}`);
}

export async function spawnTestServer(port) {
  killPort(port);
  const child = spawn(process.execPath, ["index.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const base = `http://127.0.0.1:${port}`;
  await waitForHealth(base);
  return { child, base, port };
}
