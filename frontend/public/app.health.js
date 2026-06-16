(function (window) {
  if (window.__GMXHealthFactory) return;

  window.__GMXHealthFactory = function createGMXHealth(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const getToken = typeof ctx.getToken === "function" ? ctx.getToken : () => "";
    const getAuthOk = typeof ctx.getAuthOk === "function" ? ctx.getAuthOk : () => false;
    const setAuthOk = typeof ctx.setAuthOk === "function" ? ctx.setAuthOk : () => {};
    const applyAdminVisibility =
      typeof ctx.applyAdminVisibility === "function" ? ctx.applyAdminVisibility : () => {};
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const setDegraded = typeof ctx.setDegraded === "function" ? ctx.setDegraded : () => {};
    const onRetrySession =
      typeof ctx.onRetrySession === "function" ? ctx.onRetrySession : async () => {};
    const onRetryWallet =
      typeof ctx.onRetryWallet === "function" ? ctx.onRetryWallet : async () => {};
    const onRetryReferrals =
      typeof ctx.onRetryReferrals === "function" ? ctx.onRetryReferrals : () => {};
    const onRetryUsage =
      typeof ctx.onRetryUsage === "function" ? ctx.onRetryUsage : async () => {};

    let BUILD_ID = "";

    function setApiPillState(state) {
      const d = $("apiDot");
      const tEl = $("apiText");
      const active = state === "active";
      if (d) d.classList.toggle("ok", active);
      if (tEl) {
        tEl.textContent = active ? "active" : state === "offline" ? "offline" : "inactive";
      }
    }

    async function ping() {
      const sessionLive = !!(getHandle() && getToken() && getAuthOk());
      if (!sessionLive) {
        setApiPillState("inactive");
        return;
      }
      try {
        const j = await api("/api/health");
        setApiPillState(j && j.ok ? "active" : "offline");
      } catch {
        setApiPillState("offline");
      }
    }

    async function loadBuild() {
      try {
        const j = await api("/api/version?x=1");
        BUILD_ID = String(j.build || "");
        const b = $("ui_build");
        if (b) b.textContent = BUILD_ID ? "build " + BUILD_ID : "";
        const link = document.querySelector('link[rel="stylesheet"]');
        if (link && link.href.includes("BUILD")) {
          link.href = "/app.css?v=" + encodeURIComponent(j.build);
        }
      } catch {
        setAuthOk(false);
        try {
          applyAdminVisibility();
        } catch {}
      }
    }

    function watchBuildUpdates() {
      let last = BUILD_ID;
      let busy = false;
      setInterval(async () => {
        if (busy) return;
        busy = true;
        try {
          const j = await api("/api/version?x=1");
          const now = String(j.build || "");
          if (last && now && now !== last) {
            toast("ok", "Update installed. Reloading...");
            setTimeout(() => {
              try {
                location.reload();
              } catch {}
            }, 700);
          }
          if (now) last = now;
        } catch {}
        busy = false;
      }, 5 * 60 * 1000);
    }

    function wireRetryNow() {
      window.__gmxRetryNow = async () => {
        try {
          await ping();
        } catch {}
        try {
          await onRetrySession();
        } catch {}
        try {
          await onRetryWallet();
        } catch {}
        try {
          onRetryReferrals();
        } catch {}
        try {
          await onRetryUsage();
        } catch {}
      };
    }

    function wireOnlineRetry() {
      window.addEventListener("online", () => {
        try {
          setDegraded(false);
          window.__gmxRetryNow?.();
        } catch {}
      });
    }

    return {
      setApiPillState,
      ping,
      loadBuild,
      watchBuildUpdates,
      wireRetryNow,
      wireOnlineRetry,
      getBuildId: () => BUILD_ID,
    };
  };
})(window);
