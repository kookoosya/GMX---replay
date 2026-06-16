// ----- Leaderboard -----
let LB_DAYS = 7;
if (!window.__GMXLeaderboardFactory) throw new Error("GMX leaderboard factory missing");
const __gmxLeaderboard = window.__GMXLeaderboardFactory({
  $,
  escapeHtml,
  t,
  getToken,
  getHandle,
});
async function loadLeaderboard(days){
  const j = await __gmxLeaderboard.loadLeaderboard(days);
  LB_DAYS = __gmxLeaderboard.getLbDays();
  return j;
}
const bindLeaderboardUI = () => __gmxLeaderboard.bindLeaderboardUI();
