#!/usr/bin/env node
/**
 * Simulate Render boot (RENDER=true, no admin secrets) — must not exit before /api/health.
 */
import { spawn } from "node:child_process";
import net from "node:net";

const root = process.cwd();
const timeoutMs = 25_000;

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForHealth(port) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      if (Date.now() > deadline) {
        reject(new Error("render-start-check: /api/health timeout"));
        return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (res.ok) {
          resolve(await res.json());
          return;
        }
      } catch {
        /* server still starting */
      }
      setTimeout(tick, 200);
    };
    tick();
  });
}

const port = await freePort();
const child = spawn(process.execPath, ["index.js"], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: "production",
    RENDER: "true",
    PORT: String(port),
    DB_PATH: ":memory:",
    ALLOW_DEV_ADMIN_SESSION: "0",
    TRUST_PROXY: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr?.on("data", (b) => {
  stderr += b.toString();
});
child.stdout?.on("data", (b) => {
  const s = b.toString();
  if (/FATAL:/i.test(s)) stderr += s;
});

let exitCode = null;
child.on("exit", (code) => {
  exitCode = code;
});

try {
  const health = await waitForHealth(port);
  if (!health || typeof health !== "object") {
    throw new Error("render-start-check: invalid health payload");
  }
  console.log(`render-start-check OK (build=${health.build || "?"})`);
} catch (err) {
  if (exitCode !== null && exitCode !== 0) {
    console.error(stderr.trim() || `(exit ${exitCode})`);
  }
  console.error(String(err.message || err));
  process.exit(1);
} finally {
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 1500).unref?.();
}
