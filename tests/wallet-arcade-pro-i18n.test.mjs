import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const en = JSON.parse(fs.readFileSync(path.join(root, "shared/i18n/locales/en.json"), "utf8"));

for (const key of ["wallet_desc", "plan_modal_desc", "arcade_locked_premium_note"]) {
  assert.match(en[key], /Arcade/i, `${key} should mention Arcade`);
}

const proBullet = en.w_right_list.find((line) => /<b>Pro:/i.test(line));
assert(proBullet, "w_right_list should include a Pro bullet");
assert.match(proBullet, /Arcade/i, "Pro bullet should mention Arcade");

console.log("wallet-arcade-pro-i18n: ok");
