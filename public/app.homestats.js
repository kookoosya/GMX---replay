(function (window) {
  if (window.__GMXHomeStatsFactory) return;

  window.__GMXHomeStatsFactory = function createGMXHomeStats(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const tr = typeof ctx.tr === "function" ? ctx.tr : (_k, fb) => fb || "";

    function formatLabel(n) {
      const tpl = tr("h_connected_today", "{n} people connected today");
      return String(tpl).replace(/\{n\}/g, String(Math.max(0, Number(n) || 0)));
    }

    async function refreshHomeConnectedToday() {
      const wrap = $("home_connected_wrap");
      const el = $("home_connected_counter");
      if (!wrap || !el) return;
      try {
        const res = await fetch("/api/public/stats", { credentials: "include", cache: "no-store" });
        if (!res.ok) throw new Error("stats_failed");
        const j = await res.json();
        const n = Number(j?.connectedToday ?? 0);
        if (!j?.ok || !Number.isFinite(n) || n <= 0) {
          wrap.classList.add("hidden");
          return;
        }
        el.textContent = formatLabel(n);
        wrap.classList.remove("hidden");
      } catch {
        wrap.classList.add("hidden");
      }
    }

    function bindHomeStats() {
      void refreshHomeConnectedToday();
    }

    return { bindHomeStats, refreshHomeConnectedToday };
  };
})(window);
