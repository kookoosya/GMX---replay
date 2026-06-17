(function (window) {
  if (window.__GMXLeaderboardRunWireFactory) return;

  window.__GMXLeaderboardRunWireFactory = function createGMXLeaderboardRunWire(ctx) {
    ctx = ctx || {};
    const core = ctx.core || {};
    const auth = ctx.auth || {};
    const lb = ctx.lb || {};

    function buildWireCtx() {
      return {
        $: core.$,
        escapeHtml: core.escapeHtml,
        t: core.t,
        getToken: auth.getToken,
        getHandle: auth.getHandle,
        setLbDays: lb.setLbDays,
      };
    }

    function run() {
      if (!window.__GMXLeaderboardWireFactory) throw new Error("GMX leaderboardwire factory missing");
      return window.__GMXLeaderboardWireFactory(buildWireCtx());
    }

    return { run, buildWireCtx };
  };
})(window);
