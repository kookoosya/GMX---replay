import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  leaderboardMedal,
  formatLbRank,
  resolveMeRank,
  leaderboardRankCellHtml,
} from "../tools/lib/leaderboard-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("leaderboard medals map top 3 ranks", () => {
  assert.equal(leaderboardMedal(1).emoji, "🥇");
  assert.equal(leaderboardMedal(2).rowCls, "lbRowTop2");
  assert.equal(leaderboardMedal(3).cls, "lbMedalBronze");
  assert.equal(leaderboardMedal(4).emoji, "");
});

test("resolveMeRank prefers API rank outside top list", () => {
  const top = [{ handle: "alpha" }, { handle: "beta" }];
  assert.equal(resolveMeRank(top, { handle: "gamma", rank: 42 }), 42);
  assert.equal(resolveMeRank(top, { handle: "beta" }), 2);
  assert.equal(resolveMeRank(top, { handle: "gamma" }), 0);
});

test("formatLbRank shows hash or unranked dash", () => {
  assert.equal(formatLbRank(12), "#12");
  assert.equal(formatLbRank(0), "—");
});

test("rank cell html includes medal for podium", () => {
  assert.match(leaderboardRankCellHtml(1), /lbMedalGold/);
  assert.match(leaderboardRankCellHtml(4), /^4$/);
});

test("leaderboard tab exposes your-rank strip above table", () => {
  const html = fs.readFileSync(path.join(root, "public", "app.html"), "utf8");
  assert.match(html, /id="lb_you"/);
  assert.match(html, /class="lbYourRank/);
});

test("leaderboard module uses core medals and rank resolver", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.leaderboard.js"), "utf8");
  assert.match(src, /GMXLeaderboardCore/);
  assert.match(src, /medalFor/);
  assert.match(src, /renderYourRank/);
});

test("leaderboard css styles medals and your-rank strip", () => {
  const css = fs.readFileSync(path.join(root, "public", "app.css"), "utf8");
  assert.match(css, /\.lbYourRank/);
  assert.match(css, /\.lbRowTop1/);
  assert.match(css, /\.lbMedal/);
});

test("lazy tab pack loads leaderboard core", () => {
  const src = fs.readFileSync(path.join(root, "public", "app.lazytabs.js"), "utf8");
  assert.match(src, /lib\/leaderboard-core\.js/);
});

test("en locale defines your-rank copy", () => {
  const en = JSON.parse(fs.readFileSync(path.join(root, "shared", "i18n", "locales", "en.json"), "utf8"));
  assert.ok(en.lb_your_rank);
  assert.ok(en.lb_unranked);
});
