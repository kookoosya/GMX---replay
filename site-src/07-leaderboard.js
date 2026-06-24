// ----- Leaderboard -----
let LB_DAYS = 7;
let __gmxLeaderboardWire = null;

function initLeaderboardTab() {
  if (__gmxLeaderboardWire) return __gmxLeaderboardWire;
  if (!window.__GMXLeaderboardWireFactory) throw new Error("GMX leaderboardrunwire factory missing");
  __gmxLeaderboardWire = window.__GMXLeaderboardWireFactory({
    core: { $, escapeHtml, t },
    auth: { getToken, getHandle },
    lb: { setLbDays: (v) => { LB_DAYS = v; } },
  });
  return __gmxLeaderboardWire;
}

window.__gmxLazyTabHooks = window.__gmxLazyTabHooks || {};
window.__gmxLazyTabHooks.leaderboard = () => { initLeaderboardTab(); };

async function loadLeaderboard(days) {
  await window.__gmxEnsureTabPack("leaderboard");
  return initLeaderboardTab().loadLeaderboard(days);
}

function bindLeaderboardUI() {
  window.__gmxEnsureTabPack("leaderboard")
    .then(() => { try { initLeaderboardTab().bindLeaderboardUI(); } catch {} })
    .catch(() => {});
}
