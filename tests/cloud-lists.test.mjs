/**
 * Pro cloud list sync — auth, ownership, validation, concurrency.
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

async function cloudGet(base, token) {
  const res = await fetch(`${base}/api/cloud/lists`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {}
  return { status: res.status, body, text };
}

async function cloudPost(base, token, items) {
  const res = await fetch(`${base}/api/cloud/lists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });
  const text = await res.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {}
  return { status: res.status, body, text };
}

function rowCount(dbPath, handle) {
  const db = new Database(dbPath, { readonly: true });
  try {
    return (
      db.prepare("SELECT COUNT(1) AS c FROM cloud_lists WHERE handle=?").get(handle)?.c || 0
    );
  } finally {
    db.close();
  }
}

test("cloud lists: unauthenticated GET and POST are rejected", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    const getRes = await fetch(`${base}/api/cloud/lists`);
    const getBody = await getRes.json();
    assert.equal(getRes.status, 401);
    assert.equal(getBody.error, "unauthorized");

    const postRes = await fetch(`${base}/api/cloud/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ kind: "gm", scope: "global", lang: "*", content: "x" }] }),
    });
    const postBody = await postRes.json();
    assert.equal(postRes.status, 401);
    assert.equal(postBody.error, "unauthorized");
  } finally {
    child.kill("SIGTERM");
  }
});

test("cloud lists: authenticated free user receives upgrade_required", async () => {
  const port = await freePort();
  const { child, base } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const handle = freshSmokeHandle("cf");
    const sess = await initSession(base, handle);
    assert.equal(sess.status, 200);
    const get = await cloudGet(base, sess.body.token);
    assert.equal(get.status, 402);
    assert.equal(get.body.error, "upgrade_required");
    assert.equal(get.body.feature, "cloud_sync");
  } finally {
    child.kill("SIGTERM");
  }
});

test("cloud lists: pro owner can upsert and list own rows only", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    await initSession(base, freshSmokeHandle("z"));
    const alice = freshSmokeHandle("ca");
    const bob = freshSmokeHandle("cb");
    const aliceSess = await initSession(base, alice);
    const bobSess = await initSession(base, bob);
    patchPro(dbPath, alice);
    patchPro(dbPath, bob);

    const saved = await cloudPost(base, aliceSess.body.token, [
      { kind: "gm", scope: "global", lang: "*", content: "alice-gm-global" },
      { kind: "gn", scope: "lang", lang: "en", content: "alice-gn-en" },
    ]);
    assert.equal(saved.status, 200);
    assert.equal(saved.body.ok, true);
    assert.equal(saved.body.handle, alice);
    assert.equal(saved.body.saved, 2);

    const list = await cloudGet(base, aliceSess.body.token);
    assert.equal(list.status, 200);
    assert.equal(list.body.handle, alice);
    assert.equal(list.body.rows.length, 2);
    assert.ok(list.body.rows.some((r) => r.content === "alice-gm-global"));

    const bobList = await cloudGet(base, bobSess.body.token);
    assert.equal(bobList.status, 200);
    assert.equal(bobList.body.rows.length, 0);
    assert.equal(rowCount(dbPath, bob), 0);
  } finally {
    child.kill("SIGTERM");
  }
});

test("cloud lists: alice cannot modify bob data via authenticated POST", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const alice = freshSmokeHandle("ma");
    const bob = freshSmokeHandle("mb");
    const aliceSess = await initSession(base, alice);
    const bobSess = await initSession(base, bob);
    patchPro(dbPath, alice);
    patchPro(dbPath, bob);

    await cloudPost(base, bobSess.body.token, [
      { kind: "gm", scope: "global", lang: "*", content: "bob-secret" },
    ]);
    await cloudPost(base, aliceSess.body.token, [
      { kind: "gm", scope: "global", lang: "*", content: "alice-overwrite-attempt" },
    ]);

    const bobList = await cloudGet(base, bobSess.body.token);
    assert.equal(bobList.body.rows.length, 1);
    assert.equal(bobList.body.rows[0].content, "bob-secret");
    assert.equal(rowCount(dbPath, bob), 1);
    assert.equal(rowCount(dbPath, alice), 1);
  } finally {
    child.kill("SIGTERM");
  }
});

test("cloud lists: empty payload returns no_items", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("ce");
    const sess = await initSession(base, handle);
    patchPro(dbPath, handle);
    const res = await cloudPost(base, sess.body.token, []);
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "no_items");
  } finally {
    child.kill("SIGTERM");
  }
});

test("cloud lists: invalid items are skipped and saved count stays honest", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("ci");
    const sess = await initSession(base, handle);
    patchPro(dbPath, handle);
    const res = await cloudPost(base, sess.body.token, [
      { kind: "bad", scope: "global", lang: "*", content: "skip-me" },
      { kind: "gm", scope: "nope", lang: "*", content: "skip-me-too" },
    ]);
    assert.equal(res.status, 200);
    assert.equal(res.body.saved, 0);
    assert.equal(rowCount(dbPath, handle), 0);
    assert.ok(!res.text.match(/SQLITE|syntax error/i));
  } finally {
    child.kill("SIGTERM");
  }
});

test("cloud lists: oversized content is rejected and duplicate upsert is idempotent", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("co");
    const sess = await initSession(base, handle);
    patchPro(dbPath, handle);
    const huge = "x".repeat(200001);
    const first = await cloudPost(base, sess.body.token, [
      { kind: "gm", scope: "global", lang: "*", content: huge },
      { kind: "gm", scope: "global", lang: "*", content: "v1" },
    ]);
    assert.equal(first.status, 200);
    assert.equal(first.body.saved, 1);
    assert.equal(rowCount(dbPath, handle), 1);

    const second = await cloudPost(base, sess.body.token, [
      { kind: "gm", scope: "global", lang: "*", content: "v2" },
    ]);
    assert.equal(second.status, 200);
    assert.equal(second.body.saved, 1);
    const list = await cloudGet(base, sess.body.token);
    assert.equal(list.body.rows.length, 1);
    assert.equal(list.body.rows[0].content, "v2");
  } finally {
    child.kill("SIGTERM");
  }
});

test("cloud lists: concurrent pro upserts remain deterministic", async () => {
  const port = await freePort();
  const { child, base, dbPath } = await spawnTestServer(port);
  try {
    const handle = freshSmokeHandle("cc");
    const sess = await initSession(base, handle);
    patchPro(dbPath, handle);
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        cloudPost(base, sess.body.token, [
          { kind: "gm", scope: "global", lang: "*", content: `line-${i}` },
        ])
      )
    );
    assert.ok(results.every((r) => r.status === 200 && r.body.ok));
    const list = await cloudGet(base, sess.body.token);
    assert.equal(list.body.rows.length, 1);
    assert.match(String(list.body.rows[0].content), /^line-\d+$/);
    assert.equal(rowCount(dbPath, handle), 1);
  } finally {
    child.kill("SIGTERM");
  }
});
