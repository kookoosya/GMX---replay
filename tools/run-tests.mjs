#!/usr/bin/env node
/**
 * Full automated test battery for GMXReply.
 * Run: npm run test:suite
 */
import { spawnSync } from "node:child_process";

const steps = [
  ["syntax-all", "node", ["tools/tests/syntax-all.mjs"]],
  ["manifest-integrity", "node", ["tools/tests/manifest-integrity.mjs"]],
  ["routes-static", "node", ["tools/tests/routes-static.mjs"]],
  ["generation-unit", "node", ["tools/tests/generation-unit.mjs"]],
  ["client-invariants", "node", ["tools/tests/client-invariants.mjs"]],
  ["api-contract", "node", ["tools/tests/api-contract.mjs"]],
];

let failed = 0;
for (const [name, cmd, args] of steps) {
  console.log(`\n== ${name} ==`);
  const r = spawnSync(cmd, args, { stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) {
    failed++;
    console.error(`== ${name} FAILED ==`);
  }
}

if (failed) {
  console.error(`\nTEST_SUITE_FAIL: ${failed} step(s) failed`);
  process.exit(1);
}
console.log("\nTEST_SUITE_OK");
