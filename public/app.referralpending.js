(function (window) {
  if (window.__GMXReferralPendingFactory) return;

  window.__GMXReferralPendingFactory = function createGMXReferralPending(ctx) {
    ctx = ctx || {};
    const core = globalThis.GMXReferralPendingCore;
    if (!core) throw new Error("GMX referral pending core missing");

    const storageKey = ctx.storageKey || core.REF_PENDING_STORAGE_KEY;
    const lsGet = typeof ctx.lsGet === "function" ? ctx.lsGet : () => "";
    const lsSet = typeof ctx.lsSet === "function" ? ctx.lsSet : () => {};
    const lsRemove = typeof ctx.lsRemove === "function" ? ctx.lsRemove : () => {};
    const loc = ctx.location || window.location;
    const hist = ctx.history || window.history;

    function readRaw() {
      return lsGet(storageKey, "");
    }

    function readPending(now) {
      return core.parsePendingRecord(readRaw(), now);
    }

    function writePending(record) {
      if (!record) {
        lsRemove(storageKey);
        return;
      }
      lsSet(storageKey, core.serializePending(record));
    }

    function clearPending() {
      lsRemove(storageKey);
    }

    function purgeExpired(now) {
      const pending = readPending(now);
      if (!pending && readRaw()) clearPending();
      return pending;
    }

    function captureFromSearch(search, now) {
      const params = new URLSearchParams(String(search || ""));
      const existing = purgeExpired(now);
      const decision = core.resolvePendingCapture(existing, params.get("ref"), now);
      if (decision.action === "create" && decision.record) writePending(decision.record);
      else if (!decision.record && readRaw()) clearPending();
      return decision;
    }

    function captureFromCurrentUrl(now) {
      return captureFromSearch(loc.search, now);
    }

    function resolveRefForInit(search, now) {
      const params = new URLSearchParams(String(search || loc.search || ""));
      const pending = purgeExpired(now);
      return core.resolveRefForInit(pending, params.get("ref"), now);
    }

    function stripRefFromUrl() {
      try {
        const u = new URL(loc.href);
        if (!u.searchParams.has("ref")) return;
        u.searchParams.delete("ref");
        const qs = u.searchParams.toString();
        const next = u.pathname + (qs ? `?${qs}` : "") + u.hash;
        hist.replaceState(hist.state, "", next);
      } catch (_e) {}
    }

    function onInitSuccess(sentRef) {
      if (sentRef) clearPending();
    }

    function onStorageSync(cb) {
      if (typeof cb !== "function") return () => {};
      const handler = (e) => {
        try {
          if (e && e.key === storageKey) cb();
        } catch (_e) {}
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }

    return {
      storageKey,
      readPending,
      writePending,
      clearPending,
      purgeExpired,
      captureFromSearch,
      captureFromCurrentUrl,
      resolveRefForInit,
      stripRefFromUrl,
      onInitSuccess,
      onStorageSync,
    };
  };
})(window);
