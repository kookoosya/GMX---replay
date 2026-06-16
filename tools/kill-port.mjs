#!/usr/bin/env node
/**
 * Kill process using the given port.
 * Usage: node tools/kill-port.mjs [port]
 * Default port: 10000
 */
import { execSync } from "node:child_process";
import { platform } from "node:os";

const port = Number(process.argv[2]) || 10000;

function killWin(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const lines = out.trim().split("\n").filter((l) => l.includes("LISTENING"));
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
        console.log("Killed PID", pid);
      } catch (e) {}
    }
    if (pids.size === 0) console.log("No process found on port", port);
  } catch (e) {
    console.log("Port", port, "is free (or netstat failed)");
  }
}

function killUnix(port) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: "inherit" });
  } catch (e) {
    console.log("Port", port, "is free");
  }
}

if (platform() === "win32") killWin(port);
else killUnix(port);
