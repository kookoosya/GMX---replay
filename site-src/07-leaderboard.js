// ----- Leaderboard -----
let LB_DAYS = 7;
if (!window.__GMXLeaderboardWireFactory) throw new Error("GMX leaderboardwire factory missing");
const __gmxLeaderboardWire = window.__GMXLeaderboardWireFactory({
  $,
  escapeHtml,
  t,
  getToken,
  getHandle,
  setLbDays: (v) => { LB_DAYS = v; },
});
async function loadLeaderboard(days) {
  return __gmxLeaderboardWire.loadLeaderboard(days);
}
const bindLeaderboardUI = () => __gmxLeaderboardWire.bindLeaderboardUI();
