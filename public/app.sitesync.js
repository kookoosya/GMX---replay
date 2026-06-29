(function (window) {
  if (window.__GMXSiteSyncFactory) return;

  window.__GMXSiteSyncFactory = function createGMXSiteSync(ctx) {
    ctx = ctx || {};
    const setBestMode = typeof ctx.setBestMode === "function" ? ctx.setBestMode : () => {};
    const setCleanFillEnabled =
      typeof ctx.setCleanFillEnabled === "function" ? ctx.setCleanFillEnabled : () => {};
    const referralPending = ctx.referralPending || null;
    const fetchReferralClick =
      typeof ctx.fetchReferralClick === "function"
        ? ctx.fetchReferralClick
        : (ref) => {
            try {
              fetch("/api/referral/click?ref=" + encodeURIComponent(ref)).catch(() => {});
            } catch {}
          };
    const win = ctx.window || window;
    const loc = ctx.location || win.location;

    function wireReferralCapture() {
      if (!referralPending) {
        try {
          const ref = new URLSearchParams(loc.search).get("ref");
          if (ref) fetchReferralClick(ref);
        } catch {}
        return;
      }
      try {
        const decision = referralPending.captureFromCurrentUrl();
        if (decision?.sendClick && decision.record?.code) {
          fetchReferralClick(decision.record.code);
        }
        if (decision?.stripUrl) referralPending.stripRefFromUrl();
      } catch (_e) {}
    }

    function wireCrossFrameSync() {
      win.addEventListener("message", (e) => {
        try {
          if (!e || !e.data) return;
          if (e.data.type === "GMX_BEST_MODE_SYNC") {
            setBestMode(e.data.value === true, true);
            return;
          }
          if (e.data.type === "GMX_CLEAN_FILL_SYNC") {
            if (e.data.kind === "gm" || e.data.kind === "gn") {
              setCleanFillEnabled(e.data.kind, e.data.value === true, true);
            }
          }
        } catch {}
      });
    }

    function wire() {
      wireReferralCapture();
      wireCrossFrameSync();
    }

    return { wire, wireReferralCapture, wireCrossFrameSync };
  };
})(window);
