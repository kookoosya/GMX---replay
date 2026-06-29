/**
 * Referral pending capture security and malformed storage.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeReferralCode,
  parsePendingRecord,
  pendingRecordHasSecrets,
  REF_PENDING_SCHEMA_VERSION,
} from "../tools/lib/referral-pending-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("referral security: script-like ref is rejected", () => {
  assert.equal(normalizeReferralCode("<script>alert(1)</script>"), "");
  assert.equal(normalizeReferralCode("abc123<img>"), "");
});

test("referral security: overlong code rejected", () => {
  assert.equal(normalizeReferralCode("a".repeat(33)), "");
});

test("referral security: malformed JSON does not throw", () => {
  assert.equal(parsePendingRecord("{not json", Date.now()), null);
  assert.equal(parsePendingRecord("null", Date.now()), null);
});

test("referral security: unsupported version rejected", () => {
  const raw = JSON.stringify({
    version: 99,
    code: "abc123def456",
    capturedAt: Date.now(),
    expiresAt: Date.now() + 10000,
    source: "ref_query",
  });
  assert.equal(parsePendingRecord(raw, Date.now()), null);
});

test("referral security: pending record schema has no secrets", () => {
  const sample = {
    version: REF_PENDING_SCHEMA_VERSION,
    code: "abc123def456",
    capturedAt: 1,
    expiresAt: 2,
    source: "ref_query",
  };
  assert.equal(pendingRecordHasSecrets(sample), false);
});

test("referral security: connect uses pending resolver not URL-only", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.connect.js"), "utf8");
  assert.match(src, /referralPending\.resolveRefForInit/);
  assert.match(src, /onInitSuccess/);
});

test("referral security: sitesync dedupes click on capture", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.sitesync.js"), "utf8");
  assert.match(src, /decision\?\.sendClick/);
  assert.match(src, /captureFromCurrentUrl/);
});

test("referral security: client storage key is versioned", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.storage.js"), "utf8");
  assert.match(src, /REF_PENDING:\s*"gmx_ref_pending_v1"/);
});
