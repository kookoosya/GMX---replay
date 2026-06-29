import Database from "better-sqlite3";
import assert from "node:assert/strict";
import { CONFIG } from "../../server/config.mjs";

export async function initSession(base, handle, ref = "", headers = {}, opts = {}) {
  const fp = String(opts.fp || "").trim();
  const useGet = opts.method === "GET" || !!fp;
  const url = useGet
    ? `${base}/api/user/init?${new URLSearchParams({
        handle,
        ...(ref ? { ref } : {}),
        ...(fp ? { fingerprint: fp } : {}),
      })}`
    : `${base}/api/user/init`;
  const res = await fetch(url, {
    method: useGet ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: useGet ? undefined : JSON.stringify({ handle, ref: ref || undefined }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

export async function authGet(base, path, token) {
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

export function recordUsage(dbPath, handle, kind = "gm", used = 1) {
  const db = new Database(dbPath);
  const day = new Date().toISOString().slice(0, 10);
  const h = String(handle || "").trim();
  const k = String(kind || "gm").toLowerCase() === "gn" ? "gn" : "gm";
  db.prepare(
    `INSERT INTO usage_daily(handle, day, kind, used) VALUES(?,?,?,?)
     ON CONFLICT(handle, day, kind) DO UPDATE SET used = used + excluded.used`
  ).run(h, day, k, used);
  db.close();
}

export function inviteRowCount(dbPath, inviter, invited) {
  const db = new Database(dbPath, { readonly: true });
  const row = db
    .prepare(
      "SELECT COUNT(1) AS c FROM referral_invites WHERE inviter_handle=? AND invited_handle=?"
    )
    .get(inviter, invited);
  db.close();
  return Number(row?.c || 0) || 0;
}

export function assertUsageBonus(body, expectedBonus) {
  const gen = body?.generation || body?.usage?.generation || {};
  if (gen.baseLimit != null) {
    assert.equal(gen.baseLimit, CONFIG.FREE_DAILY_BASE);
    assert.equal(gen.bonusLimit, expectedBonus);
    assert.equal(gen.totalLimit, CONFIG.FREE_DAILY_BASE + expectedBonus);
    return;
  }
  const limits = body?.limits || {};
  assert.equal(Number(limits.freeGenBase ?? CONFIG.FREE_DAILY_BASE), CONFIG.FREE_DAILY_BASE);
  assert.equal(Number(limits.freeGenBonus ?? limits.dailyBonus ?? 0), expectedBonus);
  assert.equal(
    Number(limits.freeGenTotal ?? CONFIG.FREE_DAILY_BASE + expectedBonus),
    CONFIG.FREE_DAILY_BASE + expectedBonus
  );
}
