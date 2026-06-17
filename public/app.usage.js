(function (window) {
  if (window.__GMXUsageFactory) return;

  window.__GMXUsageFactory = function createGMXUsage(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const getToken = typeof ctx.getToken === "function" ? ctx.getToken : () => "";
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const getSaveCapFree = typeof ctx.getSaveCapFree === "function" ? ctx.getSaveCapFree : () => 50;
    const setSaveCapFree = typeof ctx.setSaveCapFree === "function" ? ctx.setSaveCapFree : () => {};
    const setAuthOk = typeof ctx.setAuthOk === "function" ? ctx.setAuthOk : () => {};
    const applyAdminVisibility =
      typeof ctx.applyAdminVisibility === "function" ? ctx.applyAdminVisibility : () => {};
    const setLastUsage = typeof ctx.setLastUsage === "function" ? ctx.setLastUsage : () => {};
    const getLastUsage = typeof ctx.getLastUsage === "function" ? ctx.getLastUsage : () => ({});
    const setSub = typeof ctx.setSub === "function" ? ctx.setSub : () => {};
    const renderWalletStatus =
      typeof ctx.renderWalletStatus === "function" ? ctx.renderWalletStatus : () => {};
    const applyRefCountEligible =
      typeof ctx.applyRefCountEligible === "function" ? ctx.applyRefCountEligible : () => false;
    const getLastUsageCosmeticSig =
      typeof ctx.getLastUsageCosmeticSig === "function" ? ctx.getLastUsageCosmeticSig : () => "";
    const setLastUsageCosmeticSig =
      typeof ctx.setLastUsageCosmeticSig === "function" ? ctx.setLastUsageCosmeticSig : () => {};
    const onCosmeticRefresh =
      typeof ctx.onCosmeticRefresh === "function" ? ctx.onCosmeticRefresh : () => {};
    const scheduleRefStatsRefresh =
      typeof ctx.scheduleRefStatsRefresh === "function" ? ctx.scheduleRefStatsRefresh : () => {};
    const renderHelpIfOpen =
      typeof ctx.renderHelpIfOpen === "function" ? ctx.renderHelpIfOpen : () => {};

    function normLimitForUI(limit) {
      const n = Number(limit);
      if (!Number.isFinite(n)) return Infinity;
      if (n >= 999999) return Infinity;
      return n;
    }

    function setMeter(valId, fillId, used, limit) {
      const v = $(valId);
      const f = $(fillId);
      const cap = normLimitForUI(limit);
      if (v) v.textContent = cap === Infinity ? `${used}/unlimited` : `${used}/${cap}`;
      if (f) {
        const pct = cap === Infinity ? 100 : cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
        f.style.width = pct + "%";
      }
    }

    function usageCosmeticSignature(j) {
      const eligible = Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0;
      const tier = String(j?.sub?.tier || j?.sub?.plan || "");
      const active = j?.sub?.active ? "1" : "0";
      const saveCap = getSaveCapFree();
      return `${active}|${tier}|${eligible}|${saveCap}`;
    }

    async function refreshUsage() {
      if (!getToken()) return;
      const h = getHandle();
      if (!h) return;
      try {
        const j = await api("/api/usage");
        setAuthOk(true);
        applyAdminVisibility();

        const fallbackFree = Number(j?.limits?.freeDaily ?? 70) || 70;
        const cap = Number(j?.limits?.saveCapFree ?? getSaveCapFree()) || getSaveCapFree();
        setSaveCapFree(Math.max(10, Math.min(1000, cap)));
        const gm = j.gm || { used: 0, limit: fallbackFree };
        const gn = j.gn || { used: 0, limit: fallbackFree };

        setLastUsage({ gm, gn, resetAt: j.resetAt || null });
        setSub(j.sub || null);
        renderWalletStatus(j.sub);
        applyRefCountEligible(Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0, {
          renderUnlockUi: true,
        });

        const gmCapUI = normLimitForUI(gm.limit);
        const gnCapUI = normLimitForUI(gn.limit);
        const up = $("usedPill");
        if (up) {
          up.textContent =
            isPro() || gmCapUI === Infinity || gnCapUI === Infinity
              ? `GM ${gm.used}/unlimited • GN ${gn.used}/unlimited`
              : `GM ${gm.used}/${gmCapUI} • GN ${gn.used}/${gnCapUI}`;
        }

        try {
          const pp = $("planPill");
          if (pp) pp.textContent = isPro() ? "Pro" : "Free";
          const sp = $("syncPill");
          if (sp) {
            const d = new Date();
            sp.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }
        } catch {}

        setMeter("gmDailyVal", "gmDailyFill", gm.used, gm.limit);
        setMeter("gnDailyVal", "gnDailyFill", gn.used, gn.limit);

        const gmu = $("kGmUsed");
        if (gmu) gmu.textContent = String(gm.used);
        const gnu = $("kGnUsed");
        if (gnu) gnu.textContent = String(gn.used);

        const ra = $("kResetAt");
        if (ra) ra.textContent = j.resetAt || "-";

        const cosmeticSig = usageCosmeticSignature(j);
        if (cosmeticSig !== getLastUsageCosmeticSig()) {
          setLastUsageCosmeticSig(cosmeticSig);
          onCosmeticRefresh();
        }

        try {
          scheduleRefStatsRefresh(280);
        } catch {}

        try {
          renderHelpIfOpen();
        } catch {}
      } catch {
        // Transient usage fetch failure should not flip auth off.
      }
    }

    return { normLimitForUI, setMeter, usageCosmeticSignature, refreshUsage };
  };
})(window);
