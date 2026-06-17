#!/usr/bin/env node
/** Ensure route modules declare expected HTTP paths. */
import fs from "node:fs";
import path from "node:path";
import { fail, ok } from "./_helpers.mjs";

const root = path.join(process.cwd(), "server/routes");
const mustHave = {
  "generate.mjs": ["/api/generate", "/api/generate-bulk"],
  "random.mjs": ["/api/random", "/api/random-bulk"],
  "billing.mjs": ["/api/billing/plans", "/api/billing/tx-context", "/api/solana/latest-blockhash"],
  "user.mjs": ["/api/user/init"],
  "meta.mjs": ["/api/health", "/api/version", "/api/config"],
  "public.mjs": ["/api/public/random"],
  "ext.mjs": ["/api/ext/selectors", "/api/ext/event"],
  "cloud.mjs": ["/api/cloud/lists"],
  "admin.mjs": ["/api/admin/stats", "/api/admin/diag"],
  "static.mjs": ["/bridge", "/get-extension"],
  "errors.mjs": ["/api"],
};

for (const [file, paths] of Object.entries(mustHave)) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const p of paths) {
    if (!text.includes(`"${p}"`) && !text.includes(`'${p}'`)) {
      fail(`${file} missing route ${p}`);
    }
  }
  ok(file);
}

console.log("ROUTES_STATIC_OK");
