(function (window) {
  if (window.__GMXExtThemesUiFactory) return;

  window.__GMXExtThemesUiFactory = function createGMXExtThemesUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const getExtThemes = typeof ctx.getExtThemes === "function" ? ctx.getExtThemes : () => [];
    const getExtWallpapers =
      typeof ctx.getExtWallpapers === "function" ? ctx.getExtWallpapers : () => [];
    const getChosenExtTheme =
      typeof ctx.getChosenExtTheme === "function" ? ctx.getChosenExtTheme : () => "classic";
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (n) => n;
    const freeVisibleExtThemes = Number(ctx.freeVisibleExtThemes) || 4;
    const freeVisibleExtWallpapers = Number(ctx.freeVisibleExtWallpapers) || 4;
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;
    const unlockTagText =
      typeof ctx.unlockTagText === "function" ? ctx.unlockTagText : () => "LOCKED";
    const formatUnlockMeter =
      typeof ctx.formatUnlockMeter === "function" ? ctx.formatUnlockMeter : (a, b) => `${a}/${b}`;
    const chunkedRender =
      typeof ctx.chunkedRender === "function" ? ctx.chunkedRender : () => {};
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const applyExtTheme =
      typeof ctx.applyExtTheme === "function" ? ctx.applyExtTheme : () => {};

    function themePreviewBg(th) {
      const a = th?.a || "rgba(124,92,255,1)";
      const b = th?.b || "rgba(0,229,255,1)";
      return `linear-gradient(135deg, ${a}, ${b})`;
    }

    function renderExtThemes() {
      const grid = $("extThemeGrid");
      const st = $("extThemeStatus");
      if (!grid || !st) return;

      const extThemes = getExtThemes();
      const extWallpapers = getExtWallpapers();
      const total = extThemes.length;
      const unlocked = unlockedCountByRefs(total, freeVisibleExtThemes);
      const chosen = getChosenExtTheme();

      const el = $("extThemesUnlocked");
      if (el) el.textContent = formatUnlockMeter(Math.min(unlocked, total), total);
      const wEl = $("extWpUnlocked");
      if (wEl) {
        wEl.textContent = formatUnlockMeter(
          Math.min(unlockedCountByRefs(extWallpapers.length, freeVisibleExtWallpapers), extWallpapers.length),
          extWallpapers.length
        );
      }

      const items = extThemes.map((th, idx) => ({ th, idx }));
      chunkedRender(
        grid,
        items,
        ({ th, idx }) => {
          const isUnlocked = isPro() || idx < unlocked;
          const card = document.createElement("button");
          card.type = "button";
          card.className =
            "themeCard" + (th.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

          const sw = document.createElement("div");
          sw.className = "swatch";
          sw.style.background = themePreviewBg(th);

          const nm = document.createElement("div");
          nm.className = "tname";
          nm.textContent = th.name || th.id;

          const tag = document.createElement("div");
          tag.className = "lockTag";
          tag.textContent = unlockTagText(idx, isUnlocked, freeVisibleExtThemes);

          card.appendChild(sw);
          card.appendChild(nm);
          card.appendChild(tag);

          if (!isUnlocked) {
            const ov = document.createElement("div");
            ov.className = "mysteryOverlay";
            ov.textContent = t("locked") || "LOCKED";
            card.appendChild(ov);
          }

          card.addEventListener("click", () => {
            if (!requireConnected("Extension themes")) return;
            if (!isUnlocked) {
              const need = reqRefsForUnlockIndex(idx, freeVisibleExtThemes);
              toast(
                "warn",
                (t("locked_unlock_at") ||
                  "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace(
                  "{n}",
                  String(need)
                )
              );
              return;
            }
            applyExtTheme(th.id);
          });

          return card;
        },
        { key: "extThemeGrid", chunk: 12 }
      );

      const chosenName = extThemes.find((x) => x.id === chosen)?.name || chosen;
      st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)}.`;
    }

    return { renderExtThemes };
  };
})(window);
