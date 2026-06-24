import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACHIEVEMENT_DEFS,
  emptyProgress,
  recordPlay,
  evaluateAchievements,
  summarizeProgress,
} from "../tools/lib/arcade-achievements-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("achievement core defines six badges", () => {
  assert.equal(ACHIEVEMENT_DEFS.length, 6);
});

test("recordPlay unlocks first launch and gotd", () => {
  let p = emptyProgress();
  p = recordPlay(p, { id: "agario", category: "io", access: "free" }, { gotdId: "agario", todayKey: "2026-06-17" });
  const items = evaluateAchievements(p);
  assert.ok(items.find((a) => a.id === "first_launch")?.unlocked);
  assert.ok(items.find((a) => a.id === "gotd_player")?.unlocked);
});

test("explorer needs three unique games", () => {
  let p = emptyProgress();
  for (const [id, category] of [
    ["a", "action"],
    ["b", "racing"],
    ["c", "puzzle"],
  ]) {
    p = recordPlay(p, { id, category, access: "free" }, {});
  }
  assert.equal(summarizeProgress(p).playedCount, 3);
  assert.ok(evaluateAchievements(p).find((a) => a.id === "explorer")?.unlocked);
  assert.ok(evaluateAchievements(p).find((a) => a.id === "category_hopper")?.unlocked);
});

test("pro achievement tracks pro access launches", () => {
  const p = recordPlay(emptyProgress(), { id: "kour-io", category: "shooter", access: "pro" }, {});
  assert.ok(evaluateAchievements(p).find((a) => a.id === "pro_title")?.unlocked);
});

test("arcade page loads achievements core and panel", () => {
  const html = fs.readFileSync(path.join(root, "public", "arcade.html"), "utf8");
  assert.match(html, /arcade-achievements-core\.js/);
  const arcade = fs.readFileSync(path.join(root, "public", "arcade.js"), "utf8");
  assert.match(arcade, /achievementsPanel/);
  assert.match(arcade, /onGameLaunched/);
  assert.match(arcade, /GMXArcadeAchievementsCore/);
});

test("browser achievements core global exists", () => {
  const src = fs.readFileSync(path.join(root, "public", "lib", "arcade-achievements-core.js"), "utf8");
  assert.match(src, /GMXArcadeAchievementsCore/);
  assert.match(src, /recordPlay/);
});

test("en locale defines achievement keys", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  for (const key of ["arcade_section_achievements", "arcade_ach_first_title", "arcade_ach_pro_desc"]) {
    assert.ok(en[key], `missing ${key}`);
  }
});
