/** Time + id helpers used across the backend. */
import crypto from "node:crypto";

export function nowIso() {
  return new Date().toISOString();
}

export function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function nextResetUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

export function randHex(n = 12) {
  return crypto.randomBytes(n).toString("hex");
}

export function sha256(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}
