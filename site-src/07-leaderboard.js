// ----- Leaderboard -----
let LB_DAYS = 7;
if (!window.__GMXLeaderboardRunWireFactory) throw new Error("GMX leaderboardrunwire factory missing");
const __gmxLeaderboardWire = window.__GMXLeaderboardRunWireFactory({
  core: { $, escapeHtml, t },
  auth: { getToken, getHandle },
  lb: { setLbDays: (v) => { LB_DAYS = v; } },
}).run();
async function loadLeaderboard(days) {
  return __gmxLeaderboardWire.loadLeaderboard(days);
}
const bindLeaderboardUI = () => __gmxLeaderboardWire.bindLeaderboardUI();
