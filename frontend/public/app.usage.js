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
    const getCurrentTab =
      typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const renderHelpIfOpen =
      typeof ctx.renderHelpIfOpen === "function" ? ctx.renderHelpIfOpen : () => {};

    let lastRefEligibleScheduled = -1;

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
        if (j?.authenticated !== true) {
          setAuthOk(false);
          applyAdminVisibility();
          return;
        }
        setAuthOk(true);
        applyAdminVisibility();

        const fallbackFree = Number(j?.generation?.totalLimit ?? j?.limits?.freeGenTotal ?? j?.limits?.freeDaily ?? 50) || 50;
        const cap = Number(j?.limits?.saveCapFree ?? getSaveCapFree()) || getSaveCapFree();
        setSaveCapFree(Math.max(10, Math.min(1000, cap)));
        const gen = j.generation || {
          used: Number(j?.gm?.sharedUsed ?? j?.gm?.used ?? 0) || 0,
          totalLimit: fallbackFree,
          remaining: Math.max(0, fallbackFree - (Number(j?.gm?.sharedUsed ?? j?.gm?.used ?? 0) || 0)),
          baseLimit: Number(j?.limits?.freeGenBase ?? fallbackFree) || fallbackFree,
          bonusLimit: Number(j?.limits?.freeGenBonus ?? j?.limits?.dailyBonus ?? 0) || 0,
        };
        const gm = j.gm || { used: gen.used, limit: fallbackFree, sharedUsed: gen.used };
        const gn = j.gn || { used: gen.used, limit: fallbackFree, sharedUsed: gen.used };

        setLastUsage({ generation: gen, gm, gn, resetAt: j.resetAt || null });
        setSub(j.sub || null);
        renderWalletStatus(j.sub);
        const eligible = Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0;
        applyRefCountEligible(eligible, {
          renderUnlockUi: true,
        });

        const gmCapUI = normLimitForUI(gm.limit);
        const gnCapUI = normLimitForUI(gn.limit);
        const sharedUsed = Number(gen.used ?? gm.sharedUsed ?? gm.used ?? 0) || 0;
        const sharedLimit = normLimitForUI(gen.totalLimit ?? fallbackFree);
        const sharedRem = gen.remaining != null ? Number(gen.remaining) : Math.max(0, sharedLimit === Infinity ? Infinity : sharedLimit - sharedUsed);
        const up = $("usedPill");
        if (up) {
          if (isPro() || sharedLimit === Infinity) {
            up.textContent = `Free generations: unlimited (Pro)`;
          } else {
            const bonus = Number(gen.bonusLimit ?? j?.limits?.freeGenBonus ?? 0) || 0;
            const base = Number(gen.baseLimit ?? fallbackFree) || fallbackFree;
            up.textContent = bonus > 0
              ? `${sharedRem}/${sharedLimit} free (${base} base + ${bonus} bonus)`
              : `${sharedRem}/${sharedLimit} free generations (GM+GN shared)`;
          }
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

        setMeter("gmDailyVal", "gmDailyFill", Number(gm.used ?? 0) || 0, gmCapUI);
        setMeter("gnDailyVal", "gnDailyFill", Number(gn.used ?? 0) || 0, gnCapUI);

        const genVal = $("genCreditsVal");
        const genFill = $("genCreditsFill");
        if (genVal || genFill) {
          if (sharedLimit === Infinity) {
            if (genVal) genVal.textContent = `${sharedUsed}/unlimited`;
            if (genFill) genFill.style.width = "100%";
          } else {
            if (genVal) genVal.textContent = `${sharedUsed}/${sharedLimit}`;
            if (genFill) {
              const pct = sharedLimit ? Math.min(100, Math.round((sharedUsed / sharedLimit) * 100)) : 0;
              genFill.style.width = pct + "%";
            }
          }
        }

        const gmu = $("kGmUsed");
        if (gmu) gmu.textContent = String(gm.used);
        const gnu = $("kGnUsed");
        if (gnu) gnu.textContent = String(gn.used);

        const ra = $("kResetAt");
        if (ra) ra.textContent = j.resetAt ? j.resetAt : "No daily reset (lifetime free credits)";

        const cosmeticSig = usageCosmeticSignature(j);
        if (cosmeticSig !== getLastUsageCosmeticSig()) {
          setLastUsageCosmeticSig(cosmeticSig);
          onCosmeticRefresh();
        }

        const onReferralsTab = getCurrentTab() === "referrals";
        if (onReferralsTab || eligible !== lastRefEligibleScheduled) {
          lastRefEligibleScheduled = eligible;
          try {
            scheduleRefStatsRefresh(onReferralsTab ? 160 : 280);
          } catch {}
        }

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
