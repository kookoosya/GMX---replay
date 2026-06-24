#!/usr/bin/env node
/** Opt-in runner for archived VPS deploy (sets DEPLOY_VPS_ALLOW=1). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const child = spawnSync(process.execPath, [path.join(__dirname, "deploy-vps.mjs"), ...args], {
  stdio: "inherit",
  env: { ...process.env, DEPLOY_VPS_ALLOW: "1" },
});
process.exit(child.status ?? 1);
