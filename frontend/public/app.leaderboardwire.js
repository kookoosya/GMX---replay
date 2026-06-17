(function (window) {
  if (window.__GMXLeaderboardWireFactory) return;

  window.__GMXLeaderboardWireFactory = function createGMXLeaderboardWire(ctx) {
    ctx = ctx || {};

    if (!window.__GMXLeaderboardFactory) throw new Error("GMX leaderboard factory missing");
    const __gmxLeaderboard = window.__GMXLeaderboardFactory({
      $: ctx.$,
      escapeHtml: ctx.escapeHtml,
      t: ctx.t,
      getToken: ctx.getToken,
      getHandle: ctx.getHandle,
    });

    async function loadLeaderboard(days) {
      const j = await __gmxLeaderboard.loadLeaderboard(days);
      ctx.setLbDays?.(__gmxLeaderboard.getLbDays());
      return j;
    }

    const bindLeaderboardUI = () => __gmxLeaderboard.bindLeaderboardUI();
    const getLbDays = () => __gmxLeaderboard.getLbDays();

    return { loadLeaderboard, bindLeaderboardUI, getLbDays };
  };
})(window);
