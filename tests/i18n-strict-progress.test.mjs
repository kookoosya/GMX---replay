import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, "..", "shared", "i18n", "locales");

const STRICT_IGNORE_KEYS = new Set([
  "t_packs", "t_admin", "r_col_status", "r_col_handle", "r_lb_handle", "ui_plan", "ui_sync",
  "w_support_title", "w_status_list", "r_list", "h_guide", "ext_custom_slots_label",
  "t_gm", "t_gn", "arcade_doc_title", "arcade_page_title", "ui_tag_free", "ui_tag_unlocked",
  "ui_tag_refs", "ui_prediction_title", "ui_coming_soon", "t_prediction", "ref_reward_pro_trial",
  "pm_learn_polymarket", "pm_learn_kalshi", "pm_learn_manifold",
  "wallet_plan_compare_title", "plan_cmp_col_free", "plan_cmp_col_pro",
  "plan_modal_cmp_col_free", "plan_modal_cmp_col_pro",
]);

const CRITICAL_PATTERNS = [
  /^t_/, /^w_/, /^h_/, /^plan_/, /^themes_/, /^ref_/, /^r_/, /_title$/, /_label$/,
  /_placeholder$/, /_hint$/, /_desc$/, /^btn[A-Z]/, /^apply_/, /^wp_/, /^ui_/, /^pm_/,
];

function isStrictIgnoredKey(key) {
  if (STRICT_IGNORE_KEYS.has(key)) return true;
  if (/^ui_err_/.test(key)) return true;
  if (/^ui_degraded_/.test(key)) return true;
  if (/^ui_offline_/.test(key)) return true;
  return false;
}

function isCriticalKey(key) {
  return CRITICAL_PATTERNS.some((re) => re.test(key));
}

function countStrictOffenders(en, locale) {
  let count = 0;
  for (const key of Object.keys(en)) {
    if (!isCriticalKey(key)) continue;
    if (isStrictIgnoredKey(key)) continue;
    if (!(key in locale)) continue;
    if (en[key] === "" || en[key] == null) continue;
    if (JSON.stringify(locale[key]) === JSON.stringify(en[key])) count++;
  }
  return count;
}

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

test("priority locales have zero strict EN leftovers", () => {
  const cleanLocales = ["de", "fr", "es", "pt", "it", "nl", "tr", "pl", "id", "ru", "uk", "hi", "ja", "zh"];
  for (const code of cleanLocales) {
    const locale = JSON.parse(fs.readFileSync(path.join(localesDir, `${code}.json`), "utf8"));
    assert.equal(countStrictOffenders(en, locale), 0, `${code} still has strict EN leftovers`);
  }
});

test("total strict offender count does not regress above baseline", () => {
  const codes = fs
    .readdirSync(localesDir)
    .filter((name) => name.endsWith(".json") && name !== "en.json")
    .map((name) => name.slice(0, -5));

  let total = 0;
  for (const code of codes) {
    const locale = JSON.parse(fs.readFileSync(path.join(localesDir, `${code}.json`), "utf8"));
    total += countStrictOffenders(en, locale);
  }

  const BASELINE = 0;
  assert.ok(total <= BASELINE, `strict offenders regressed: ${total} > ${BASELINE}`);
});
