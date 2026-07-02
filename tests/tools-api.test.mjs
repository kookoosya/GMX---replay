/**
 * /api/tools/* — auth, limits, ownership, favorites contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { freePort, spawnTestServer, freshSmokeHandle } from "../tools/tests/_helpers.mjs";
import { initSession } from "./lib/referral-test-helpers.mjs";

function patchPro(dbPath, handle) {
  const db = new Database(dbPath);
  try {
    const until = new Date(Date.now() + 30 * 86400000).toISOString();
    db.prepare("UPDATE users SET tier='paid', paid_until=? WHERE handle=?").run(until, handle);
  } finally {
    db.close();
  }
}

async function toolsGet(base, path, token) {
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {}
  return { status: res.status, body, text };
}

async function toolsPost(base, path, token, payload) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {}
  return { status: res.status, body, text };
}

test("tools api: unauthenticated routes return 401", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    for (const path of [
      "/api/tools/preview?kind=gm",
      "/api/tools/bulk?kind=gm&count=1",
      "/api/tools/history",
      "/api/tools/favorites",
    ]) {
      const res = await toolsGet(base, path, "");
      assert.equal(res.status, 401, path);
      assert.equal(res.body.error, "unauthorized");
    }
  } finally {
    child.kill("SIGTERM");
  }
});

test("tools api: preview enforces free studio daily cap", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const handle = freshSmokeHandle("tp");
    const sess = await initSession(base, handle);
    for (let i = 0; i < 2; i++) {
      const ok = await toolsGet(base, "/api/tools/preview?kind=gm", sess.body.token);
      assert.equal(ok.status, 200, `preview ${i}`);
      assert.equal(ok.body.ok, true);
    }
    const blocked = await toolsGet(base, "/api/tools/preview?kind=gm", sess.body.token);
    assert.equal(blocked.status, 402);
    assert.equal(blocked.body.error, "upgrade_required");
    assert.equal(blocked.body.feature, "studio");
  } finally {
    child.kill("SIGTERM");
  }
});

test("tools api: favorites are scoped to authenticated handle", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const alice = freshSmokeHandle("fa");
    const bob = freshSmokeHandle("fb");
    const aliceSess = await initSession(base, alice);
    const bobSess = await initSession(base, bob);

    const add = await toolsPost(base, "/api/tools/favorites/toggle", aliceSess.body.token, {
      kind: "gm",
      reply: "alice favorite line",
    });
    assert.equal(add.status, 200);
    assert.equal(add.body.action, "added");

    const aliceList = await toolsGet(base, "/api/tools/favorites?kind=gm", aliceSess.body.token);
    assert.equal(aliceList.status, 200);
    assert.equal(aliceList.body.count, 1);
    assert.equal(aliceList.body.rows[0].reply, "alice favorite line");

    const bobList = await toolsGet(base, "/api/tools/favorites?kind=gm", bobSess.body.token);
    assert.equal(bobList.status, 200);
    assert.equal(bobList.body.count, 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("tools api: history search requires pro", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const handle = freshSmokeHandle("th");
    const sess = await initSession(base, handle);
    const free = await toolsGet(base, "/api/tools/history?q=hello", sess.body.token);
    assert.equal(free.status, 402);
    assert.equal(free.body.feature, "history_search");

    patchPro(dbPath, handle);
    const pro = await toolsGet(base, "/api/tools/history?q=hello", sess.body.token);
    assert.equal(pro.status, 200);
    assert.equal(pro.body.ok, true);
  } finally {
    child.kill("SIGTERM");
  }
});

test("tools api: bulk free size cap returns upgrade_required", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const handle = freshSmokeHandle("tb");
    const sess = await initSession(base, handle);
    const res = await toolsGet(base, "/api/tools/bulk?kind=gm&count=11", sess.body.token);
    assert.equal(res.status, 402);
    assert.equal(res.body.feature, "bulk_size");
  } finally {
    child.kill("SIGTERM");
  }
});

test("tools api: malformed favorites toggle is rejected safely", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const handle = freshSmokeHandle("tm");
    const sess = await initSession(base, handle);
    const badKind = await toolsPost(base, "/api/tools/favorites/toggle", sess.body.token, {
      kind: "bad",
      reply: "x",
    });
    assert.equal(badKind.status, 400);
    const empty = await toolsPost(base, "/api/tools/favorites/toggle", sess.body.token, {
      kind: "gm",
      reply: "",
    });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error, "invalid_reply");
    assert.ok(!badKind.text.match(/SQLITE|stack/i));
  } finally {
    child.kill("SIGTERM");
  }
});
