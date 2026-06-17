(function (window) {
  if (window.__GMXRecoverFactory) return;

  window.__GMXRecoverFactory = function createGMXRecover(ctx) {
    ctx = ctx || {};
    const recoverKey = ctx.recoverKey || "gmx_autorecover_v1";
    const lsGet =
      typeof ctx.lsGet === "function"
        ? ctx.lsGet
        : (k, fb = "") => {
            try {
              const v = localStorage.getItem(k);
              return v === null || v === undefined ? fb : v;
            } catch {
              return fb;
            }
          };
    const lsSet =
      typeof ctx.lsSet === "function"
        ? ctx.lsSet
        : (k, v) => {
            try {
              localStorage.setItem(k, String(v));
            } catch {}
          };
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const setDegraded = typeof ctx.setDegraded === "function" ? ctx.setDegraded : () => {};
    const win = ctx.window || window;
    const reloadDelayMs = Number(ctx.reloadDelayMs) || 1200;
    const windowMs = Number(ctx.windowMs) || 10 * 60 * 1000;
    const maxReloads = Number(ctx.maxReloads) || 3;

    function isIgnoredMessage(msg) {
      const s = String(msg || "");
      return (
        s.includes("ResizeObserver") ||
        s.includes("Non-Error promise rejection") ||
        s === "Script error." ||
        s.includes("Loading chunk") ||
        s.includes("ChunkLoadError")
      );
    }

    function isNetworkMessage(msg) {
      const s = String(msg || "");
      return (
        s.includes("Failed to fetch") ||
        s.includes("NetworkError") ||
        s.includes("request_failed") ||
        s.includes("timeout") ||
        s.includes("not_connected")
      );
    }

    function readState() {
      try {
        return JSON.parse(lsGet(recoverKey, "{}") || "{}");
      } catch {
        return {};
      }
    }

    function writeState(v) {
      try {
        lsSet(recoverKey, JSON.stringify(v));
      } catch {}
    }

    function shouldReload() {
      const now = Date.now();
      const s = readState();
      const arr = Array.isArray(s.reloads) ? s.reloads : [];
      const fresh = arr.filter((ts) => now - ts < windowMs);
      if (fresh.length >= maxReloads) return false;
      fresh.push(now);
      s.reloads = fresh;
      writeState(s);
      return true;
    }

    function scheduleReload() {
      if (win.__gmxRecovering) return;
      if (!shouldReload()) return;
      win.__gmxRecovering = true;
      try {
        toast("warn", "Recovering... reloading", 2500);
      } catch {}
      setTimeout(() => {
        try {
          win.location.reload();
        } catch {}
      }, reloadDelayMs);
    }

    function handleRuntimeIssue(msg) {
      if (isIgnoredMessage(msg)) return;
      if (isNetworkMessage(msg)) {
        try {
          setDegraded(true, "API/network issue. You can still edit lists locally.");
        } catch {}
        return;
      }
      scheduleReload();
    }

    function wire() {
      win.addEventListener("error", (e) => {
        handleRuntimeIssue(e?.message || "");
      });
      win.addEventListener("unhandledrejection", (e) => {
        handleRuntimeIssue(e?.reason?.message || e?.reason || "");
      });
    }

    return { wire, shouldReload, scheduleReload, isNetworkMessage };
  };
})(window);
