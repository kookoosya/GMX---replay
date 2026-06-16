(function (window) {
  if (window.__GMXShellErrorsFactory) return;

  window.__GMXShellErrorsFactory = function createGMXShellErrors(ctx) {
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const setDegraded = typeof ctx.setDegraded === "function" ? ctx.setDegraded : () => {};
    const showFatal = typeof ctx.showFatal === "function" ? ctx.showFatal : () => {};
    const escapeHtml =
      typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s ?? "");
    const isInitDone =
      typeof ctx.isInitDone === "function" ? ctx.isInitDone : () => true;

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

    function wireGlobalErrors() {
      window.addEventListener("error", (e) => {
        try {
          const msg = e?.message || "Unexpected error";
          if (isNetworkMessage(msg)) {
            setDegraded(true, "Network/API error. You can still edit lists locally.");
            return;
          }
          toast("bad", `<b>Error:</b> ${escapeHtml(msg)} <span class="muted small">(try Reload)</span>`);
          if (!isInitDone()) showFatal(msg);
        } catch (_e) {}
      });

      window.addEventListener("unhandledrejection", (e) => {
        try {
          const msg =
            (e?.reason && (e.reason.message || String(e.reason))) || "Unhandled promise rejection";
          if (isNetworkMessage(msg)) {
            setDegraded(true, "Network/API error. You can still edit lists locally.");
            return;
          }
          toast("bad", `<b>Error:</b> ${escapeHtml(msg)} <span class="muted small">(try Reload)</span>`);
          if (!isInitDone()) showFatal(msg);
        } catch (_e) {}
      });
    }

    return { wireGlobalErrors, isNetworkMessage };
  };
})(window);
