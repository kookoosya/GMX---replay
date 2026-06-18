(function (window) {
  if (window.__GMXRefStatsFactory) return;

  window.__GMXRefStatsFactory = function createGMXRefStats(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const siteLangKey = ctx.siteLangKey || "gmx_site_lang";
    const refPromoOpenKey = ctx.refPromoOpenKey || "gmx_ref_promo_open";
    const renderReferralRightCopy =
      typeof ctx.renderReferralRightCopy === "function" ? ctx.renderReferralRightCopy : () => {};
    const renderGuideRightCopy =
      typeof ctx.renderGuideRightCopy === "function" ? ctx.renderGuideRightCopy : () => {};
    const applyRefCountEligible =
      typeof ctx.applyRefCountEligible === "function" ? ctx.applyRefCountEligible : () => {};
    const nextReferralUnlockAt =
      typeof ctx.nextReferralUnlockAt === "function" ? ctx.nextReferralUnlockAt : () => 0;
    const renderReferralPromoNote =
      typeof ctx.renderReferralPromoNote === "function" ? ctx.renderReferralPromoNote : () => {};

    let cache = null;
    let lastAt = 0;
    let promise = null;
    let timer = null;
    let scheduledAt = 0;

    function revealReferralLinkUi() {
      try {
        $("refTopRow")?.classList.remove("link-hidden");
      } catch (_e) {}
      try {
        $("refLinkCol")?.classList.remove("is-hidden");
      } catch (_e) {}
    }

    function scheduleRefStatsRefresh(delay = 180) {
      const now = Date.now();
      if (promise) return;
      if (cache && now - lastAt < 8000) return;
      if (timer && now - scheduledAt < 900) return;
      try {
        if (timer) clearTimeout(timer);
      } catch (_e) {}
      scheduledAt = now;
      timer = setTimeout(() => {
        timer = null;
        Promise.resolve()
          .then(() => refreshRefStats())
          .catch(() => {});
      }, Math.max(160, Number(delay) || 220));
    }

    async function refreshRefStats(force = false) {
      if (!getHandle()) return null;
      const now = Date.now();
      if (!force) {
        if (promise) return promise;
        if (cache && now - lastAt < 8000) return cache;
      }
      promise = (async () => {
        try {
          const j = await api("/api/referral/stats");
          const confirmed = Number(j.confirmedRefs ?? 0) || 0;
          const active = Number(j.activeRefs ?? 0) || 0;
          const eligible = Number(j.eligibleRefs ?? j.referrals ?? j.count ?? 0) || 0;
          const legacy = Number(j.legacyReferrals ?? 0) || 0;
          const lang = localStorage.getItem(siteLangKey) || "en";
          try {
            renderReferralRightCopy(lang);
          } catch (_e) {}
          try {
            renderGuideRightCopy(lang);
          } catch (_e) {}

          applyRefCountEligible(eligible, { renderUnlockUi: true });

          if ($("refConfirmedInline")) $("refConfirmedInline").textContent = String(confirmed);
          if ($("refActiveInline")) $("refActiveInline").textContent = String(active);
          const link = $("refLink");
          if (link) link.value = j.refLink || "";
          revealReferralLinkUi();

          const clicks = Number(j.clicks ?? 0) || 0;
          if ($("promoConfirmed")) $("promoConfirmed").textContent = String(confirmed);
          if ($("promoActive")) $("promoActive").textContent = String(active);
          if ($("promoEligible")) $("promoEligible").textContent = String(eligible);
          if ($("promoLegacy")) $("promoLegacy").textContent = String(legacy);
          if ($("promoClicks")) $("promoClicks").textContent = String(clicks);
          if ($("promoDailyLimit"))
            $("promoDailyLimit").textContent = String(
              Number(j.dailyLimit ?? Number(j.freeDaily || 0) + Number(j.dailyBonus || 0)) || 0
            );
          if ($("promoBonusPer20")) $("promoBonusPer20").textContent = String(Number(j.bonusPer20 || 10) || 10);
          if ($("promoNextAt")) $("promoNextAt").textContent = String(Number(j.nextBonusAt || 20) || 20);

          const promoNote = $("refPromoNote");
          if (promoNote) {
            try {
              renderReferralPromoNote(j, confirmed, active, eligible);
            } catch (_e) {}
          }
          const nextStep = nextReferralUnlockAt(eligible);
          const wrap = $("refProgressWrap");
          const nextEl = $("refProgressNext");
          const fillEl = $("refProgressFill");
          if (wrap && nextEl && fillEl) {
            if (nextStep > 0) {
              wrap.classList.remove("hidden");
              nextEl.textContent = String(nextStep);
              const pct = Math.min(100, Math.round((eligible / nextStep) * 100));
              fillEl.style.width = pct + "%";
            } else {
              wrap.classList.add("hidden");
            }
          }

          const promoDetails = $("promoDetails");
          if (promoDetails) {
            try {
              const saved = localStorage.getItem(refPromoOpenKey);
              if (saved === "1") promoDetails.open = true;
              else if (saved === "0") promoDetails.open = false;
            } catch (_e) {}
          }

          cache = j;
          lastAt = Date.now();
          return j;
        } catch (_e) {
          return cache || null;
        } finally {
          promise = null;
        }
      })();
      return promise;
    }

    return { revealReferralLinkUi, scheduleRefStatsRefresh, refreshRefStats };
  };
})(window);
