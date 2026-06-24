/** Leaderboard rank + medal helpers — shared between site UI, server, and tests. */

export function leaderboardMedal(rank) {
  const r = Math.max(0, Number(rank || 0) || 0);
  if (r === 1) return { emoji: "🥇", cls: "lbMedalGold", rowCls: "lbRowTop1" };
  if (r === 2) return { emoji: "🥈", cls: "lbMedalSilver", rowCls: "lbRowTop2" };
  if (r === 3) return { emoji: "🥉", cls: "lbMedalBronze", rowCls: "lbRowTop3" };
  return { emoji: "", cls: "", rowCls: "" };
}

export function formatLbRank(rank, { unranked = "—" } = {}) {
  const n = Number(rank);
  if (!Number.isFinite(n) || n <= 0) return unranked;
  return `#${n}`;
}

export function resolveMeRank(top, me) {
  if (!me || typeof me !== "object") return 0;
  const fromApi = Number(me.rank);
  if (Number.isFinite(fromApi) && fromApi > 0) return fromApi;
  if (!me.handle || !Array.isArray(top)) return 0;
  const idx = top.findIndex((r) => String(r?.handle || "") === String(me.handle || ""));
  return idx >= 0 ? idx + 1 : 0;
}

export function leaderboardRankCellHtml(rank) {
  const medal = leaderboardMedal(rank);
  const n = Math.max(1, Number(rank) || 1);
  if (!medal.emoji) return String(n);
  return `<span class="lbMedal ${medal.cls}" aria-hidden="true">${medal.emoji}</span> ${n}`;
}
