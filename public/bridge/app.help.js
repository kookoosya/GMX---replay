(function (window) {
  if (window.__GMXHelpFactory) return;

  window.__GMXHelpFactory = function createGMXHelp(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const getSaveCapFree = typeof ctx.getSaveCapFree === "function" ? ctx.getSaveCapFree : () => 50;
    const getLastUsage = typeof ctx.getLastUsage === "function" ? ctx.getLastUsage : () => ({});
    const getLastSaved = typeof ctx.getLastSaved === "function" ? ctx.getLastSaved : () => ({});
    const normLimitForUI = typeof ctx.normLimitForUI === "function" ? ctx.normLimitForUI : (n) => n;
    const onNavigateWallet = typeof ctx.onNavigateWallet === "function" ? ctx.onNavigateWallet : () => {};

    function isOpen() {
      const m = $("help_modal");
      return !!(m && !m.classList.contains("hidden"));
    }

    function renderHelpModal() {
      const lastSaved = getLastSaved();
      const lastUsage = getLastUsage();
      const gmSaved = Number(lastSaved.gm ?? 0) || 0;
      const gnSaved = Number(lastSaved.gn ?? 0) || 0;
      const gmUsed = Number(lastUsage?.gm?.used ?? 0) || 0;
      const gnUsed = Number(lastUsage?.gn?.used ?? 0) || 0;
      const gmLimit = normLimitForUI(lastUsage?.gm?.limit ?? 70);
      const gnLimit = normLimitForUI(lastUsage?.gn?.limit ?? 70);
      const saveCap = getSaveCapFree();

      const savedEl = $("help_saved");
      if (savedEl) {
        savedEl.textContent = isPro()
          ? `GM ${gmSaved}/unlimited • GN ${gnSaved}/unlimited`
          : `GM ${gmSaved}/${saveCap} • GN ${gnSaved}/${saveCap}`;
      }

      const dailyEl = $("help_daily");
      if (dailyEl) {
        dailyEl.textContent =
          isPro() || gmLimit === Infinity || gnLimit === Infinity
            ? `GM ${gmUsed}/unlimited • GN ${gnUsed}/unlimited`
            : `GM ${gmUsed}/${gmLimit} • GN ${gnUsed}/${gnLimit}`;
      }

      const savedFill = $("helpSavedFill");
      if (savedFill) {
        if (isPro()) savedFill.style.width = "100%";
        else {
          const used = gmSaved + gnSaved;
          const cap = saveCap * 2;
          savedFill.style.width = Math.min(100, Math.round((used / cap) * 100)) + "%";
        }
      }

      const dailyFill = $("helpDailyFill");
      if (dailyFill) {
        if (isPro() || gmLimit === Infinity || gnLimit === Infinity) dailyFill.style.width = "100%";
        else {
          const used = gmUsed + gnUsed;
          const cap = gmLimit + gnLimit || 140;
          dailyFill.style.width = Math.min(100, Math.round((used / cap) * 100)) + "%";
        }
      }
    }

    function openHelpModal() {
      const m = $("help_modal");
      if (!m) return;
      try {
        renderHelpModal();
      } catch {}
      m.classList.remove("hidden");
    }

    function closeHelpModal() {
      const m = $("help_modal");
      if (!m) return;
      m.classList.add("hidden");
    }

    function bindHelpModal() {
      const m = $("help_modal");
      if (!m) return;
      m.addEventListener("click", (e) => {
        if (e.target === m) closeHelpModal();
      });

      const closeBtn = $("help_close");
      if (closeBtn) closeBtn.onclick = () => closeHelpModal();

      const goWallet = $("help_go_wallet");
      if (goWallet) {
        goWallet.onclick = () => {
          closeHelpModal();
          onNavigateWallet();
        };
      }

      const openBtn = $("btnHelp");
      if (openBtn) openBtn.onclick = () => openHelpModal();

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen()) closeHelpModal();
        if (e.key === "?" && isOpen() === false) openHelpModal();
      });
    }

    function renderHelpIfOpen() {
      if (!isOpen()) return;
      try {
        renderHelpModal();
      } catch {}
    }

    return {
      isOpen,
      renderHelpModal,
      renderHelpIfOpen,
      openHelpModal,
      closeHelpModal,
      bindHelpModal,
    };
  };
})(window);
