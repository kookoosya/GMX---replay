#!/usr/bin/env node
/**
 * Rotate local ADMIN_PASSWORD from GMX_ADMIN_NEW_PASSWORD (never logs plaintext).
 * Production: update the same env var in Render Dashboard (no API access required).
 *
 * Usage (PowerShell):
 *   $env:GMX_ADMIN_NEW_PASSWORD='<new>'
 *   node tools/rotate-admin-password.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

function fail(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function escapeEnvValue(value) {
  const s = String(value);
  if (/^[A-Za-z0-9._-]+$/.test(s)) return s;
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const newPassword = String(process.env.GMX_ADMIN_NEW_PASSWORD || "").trim();
if (!newPassword) {
  fail("GMX_ADMIN_NEW_PASSWORD is not set. Set it in PowerShell before running this script.");
}
if (newPassword.length < 8) {
  fail("GMX_ADMIN_NEW_PASSWORD must be at least 8 characters.");
}

let content = "";
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, "utf8");
} else {
  content = "# GMXReply local env (never commit)\n";
}

const line = `ADMIN_PASSWORD=${escapeEnvValue(newPassword)}`;
if (/^ADMIN_PASSWORD=/m.test(content)) {
  content = content.replace(/^ADMIN_PASSWORD=.*$/m, line);
} else {
  if (content.length && !content.endsWith("\n")) content += "\n";
  content += `${line}\n`;
}

fs.writeFileSync(envPath, content, { encoding: "utf8", mode: 0o600 });
console.log("LOCAL: ADMIN_PASSWORD updated in .env (value not logged).");
console.log("RENDER: Dashboard → your GMXReply web service → Environment → ADMIN_PASSWORD → paste new value → Save Changes.");
console.log("RENDER: Wait for deploy to finish, then run: npm run verify:admin-rotation");
