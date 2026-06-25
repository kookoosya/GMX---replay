(function (window) {
  if (window.__GMXWallpaperUiFactory) return;

  window.__GMXWallpaperUiFactory = function createGMXWallpaperUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;
    const trWp = typeof ctx.trWp === "function" ? ctx.trWp : (k) => k;
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const keys = ctx.keys || {};
    const wpGlobalKey = keys.wpGlobal || "gmx_wp_global";
    const themewallViewKey = keys.themewallView || "gmx_themewall_view";

    const getWallpaperTabs =
      typeof ctx.getWallpaperTabs === "function" ? ctx.getWallpaperTabs : () => [];
    const wallpaperKeyForTab =
      typeof ctx.wallpaperKeyForTab === "function" ? ctx.wallpaperKeyForTab : () => "";
    const setWallpaperForTab =
      typeof ctx.setWallpaperForTab === "function" ? ctx.setWallpaperForTab : () => {};
    const getEffectiveCustomWallpapers =
      typeof ctx.getEffectiveCustomWallpapers === "function"
        ? ctx.getEffectiveCustomWallpapers
        : () => [];
    const getWallpapers =
      typeof ctx.getWallpapers === "function" ? ctx.getWallpapers : () => [];
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (n) => n;
    const freeVisibleWallpapers = Number(ctx.freeVisibleWallpapers) || 10;
    const customWpFreeCount = Number(ctx.customWpFreeCount) || 5;
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;
    const wallpaperUnlocked =
      typeof ctx.wallpaperUnlocked === "function" ? ctx.wallpaperUnlocked : () => false;
    const wallpaperThumbUrl =
      typeof ctx.wallpaperThumbUrl === "function" ? ctx.wallpaperThumbUrl : () => "";
    const wallpaperFullUrl =
      typeof ctx.wallpaperFullUrl === "function" ? ctx.wallpaperFullUrl : () => "";
    const loadCustomWallpapers =
      typeof ctx.loadCustomWallpapers === "function" ? ctx.loadCustomWallpapers : async () => false;
    const chunkedRender =
      typeof ctx.chunkedRender === "function" ? ctx.chunkedRender : (el, items, fn) => {
        if (!el) return;
        el.replaceChildren();
        for (const item of items) el.appendChild(fn(item));
      };
    const observeLazyBg =
      typeof ctx.observeLazyBg === "function" ? ctx.observeLazyBg : () => {};
    const prefetchImage =
      typeof ctx.prefetchImage === "function" ? ctx.prefetchImage : () => Promise.resolve();
    const getCurrentTab =
      typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const applyUserBg = typeof ctx.applyUserBg === "function" ? ctx.applyUserBg : () => {};
    const applyWallpaper =
      typeof ctx.applyWallpaper === "function" ? ctx.applyWallpaper : () => {};

    let initDone = false;
    let wpRenderGen = 0;
    let lastCustomWpCount = -1;
    let lastWpRenderSig = "";

    function wallpaperRenderSignature(targetTab, activeId, allWps, unlocked, unlockedAll, nextReq) {
      return [
        targetTab,
        activeId,
        allWps.length,
        unlocked,
        unlockedAll ? 1 : 0,
        nextReq,
        isPro() ? 1 : 0,
      ].join("|");
    }

    function markWallpaperSelection(activeId) {
      try {
        const grid = $("wpGrid");
        if (!grid) return;
        const chosen = String(activeId || "").trim();
        const cards = grid.querySelectorAll(".wpCard[data-wp-id]");
        cards.forEach((card) => {
          card.classList.toggle("active", card.getAttribute("data-wp-id") === chosen);
        });
      } catch {}
    }

    function renderWallpaperUI() {
      const tabSel = $("wpTab");
      const grid = $("wpGrid");
      const st = $("wpStatus");
      if (!tabSel || !grid || !st) return;

      const renderGen = ++wpRenderGen;

      const wallpaperTabs = getWallpaperTabs();
      const prev = tabSel.value || "all";
      tabSel.innerHTML = "";
      for (const [v, l] of wallpaperTabs) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = trWp(l);
        tabSel.appendChild(o);
      }
      try {
        const ok = Array.from(tabSel.options).some((o) => o.value === prev);
        tabSel.value = ok ? prev : "all";
      } catch {}

      const targetTab = tabSel.value || "all";
      const activeId =
        targetTab === "all"
          ? storage.lsGet(wpGlobalKey, "")
          : storage.lsGet(wallpaperKeyForTab(targetTab), "");

      const effectiveCustom = getEffectiveCustomWallpapers();
      const customCountBefore = effectiveCustom.length;
      const wallpapers = getWallpapers();
      const allWps = [...effectiveCustom, ...wallpapers];
      const mainUnlocked = unlockedCountByRefs(wallpapers.length, freeVisibleWallpapers);
      const customUnlocked = Math.min(
        effectiveCustom.length,
        isPro() ? effectiveCustom.length : customWpFreeCount
      );
      const unlocked = mainUnlocked + customUnlocked;
      const unlockedAll = isPro() || unlocked >= allWps.length;
      const nextReq = reqRefsForUnlockIndex(
        unlockedCountByRefs(wallpapers.length, freeVisibleWallpapers),
        freeVisibleWallpapers
      );
      st.innerHTML = unlockedAll
        ? `<span class="ok">Unlocked.</span> All wallpapers available. First ${customWpFreeCount} custom free, rest Pro.`
        : `<span class="warn">Locked.</span> First ${freeVisibleWallpapers} main + ${customWpFreeCount} custom free. Next unlock at <b>${nextReq} ref</b>.`;

      const renderSig = wallpaperRenderSignature(
        targetTab,
        activeId,
        allWps,
        unlocked,
        unlockedAll,
        nextReq
      );
      if (renderSig === lastWpRenderSig) {
        markWallpaperSelection(activeId);
        return;
      }
      lastWpRenderSig = renderSig;

      loadCustomWallpapers().then((loaded) => {
        if (!loaded || !document.contains(grid) || renderGen !== wpRenderGen) return;
        const customCountAfter = getEffectiveCustomWallpapers().length;
        if (customCountAfter <= customCountBefore && customCountAfter === lastCustomWpCount) return;
        lastCustomWpCount = customCountAfter;
        lastWpRenderSig = "";
        renderWallpaperUI();
      });

      const items = allWps.map((wp, idx) => ({ wp, idx }));
      chunkedRender(
        grid,
        items,
        ({ wp, idx }) => {
          const isUnlocked = wallpaperUnlocked(wp, idx, effectiveCustom.length);
          const card = document.createElement("button");
          card.type = "button";
          card.dataset.wpId = wp.id;
          const mainIdx = wp.tier === "custom" ? -1 : idx - effectiveCustom.length;
          card.dataset.tier =
            wp.tier || (mainIdx >= 0 && mainIdx < freeVisibleWallpapers ? "free" : "premium");
          card.className =
            "wpCard" + (isUnlocked ? "" : " mystery") + (wp.id === activeId ? " active" : "");

          const thumb = document.createElement("div");
          thumb.className = "wpThumb";
          const thumbUrl = wallpaperThumbUrl(wp.id);
          const fullUrl = wallpaperFullUrl(wp.id);
          if (thumbUrl) thumb.setAttribute("data-bg", thumbUrl);
          observeLazyBg(thumb);
          if (isUnlocked && fullUrl) {
            card.addEventListener(
              "pointerenter",
              () => {
                try {
                  prefetchImage(fullUrl);
                } catch {}
              },
              { passive: true }
            );
          }

          const name = document.createElement("div");
          name.className = "wpName";
          name.textContent = wp.name;

          const meta = document.createElement("div");
          meta.className = "wpMeta";
          meta.textContent =
            wp.tier === "custom"
              ? "Custom"
              : mainIdx >= 0 && mainIdx < freeVisibleWallpapers
                ? "Free"
                : isPro()
                  ? "Pro"
                  : "Locked";

          const tag = document.createElement("div");
          tag.className = "wpTag";
          tag.textContent =
            wp.tier === "custom"
              ? "CUSTOM"
              : mainIdx >= 0 && mainIdx < freeVisibleWallpapers
                ? "FREE"
                : isUnlocked
                  ? "UNLOCKED"
                  : reqRefsForUnlockIndex(mainIdx, freeVisibleWallpapers) + " ref";

          card.appendChild(thumb);
          card.appendChild(name);
          card.appendChild(meta);
          card.appendChild(tag);

          if (!isUnlocked) {
            const ov = document.createElement("div");
            ov.className = "mysteryOverlay";
            ov.textContent = t("locked") || "LOCKED";
            card.appendChild(ov);
          }

          card.addEventListener("click", () => {
            if (!isUnlocked) {
              const reqIdx = wp.tier === "custom" ? idx : idx - effectiveCustom.length;
              toast(
                "warn",
                (t("locked_unlock_at") ||
                  "Locked. Unlock at {n} referrals (+1 every 3 refs at first, then +1 every 4) or Pro.").replace(
                  "{n}",
                  String(reqRefsForUnlockIndex(reqIdx, freeVisibleWallpapers))
                )
              );
              return;
            }

            if (targetTab === "all") {
              storage.lsSet(wpGlobalKey, wp.id);
            } else {
              setWallpaperForTab(targetTab, wp.id);
            }

            const newActive =
              targetTab === "all"
                ? storage.lsGet(wpGlobalKey, "")
                : storage.lsGet(wallpaperKeyForTab(targetTab), "");
            markWallpaperSelection(newActive);

            const previewTab = targetTab === "all" ? getCurrentTab() : targetTab;
            const full = wallpaperFullUrl(wp.id);
            if (full) {
              prefetchImage(full).finally(() => {
                applyUserBg(previewTab);
                applyWallpaper(previewTab);
              });
            } else {
              applyUserBg(previewTab);
              applyWallpaper(previewTab);
            }
          });

          return card;
        },
        { key: "wpGrid", chunk: 12 }
      );
    }

    function setThemeWallView(view) {
      const themeBtn = $("tabTheme");
      const wallBtn = $("tabWall");
      const themePane = $("themePane");
      const wallPane = $("wallPane");
      const wpNote = $("wp_note");
      if (!themeBtn || !wallBtn || !themePane || !wallPane) return;

      const v = view === "wall" ? "wall" : "theme";
      storage.lsSet(themewallViewKey, v);

      const themeOn = v === "theme";
      const wallOn = v === "wall";

      themeBtn.classList.toggle("active", themeOn);
      wallBtn.classList.toggle("active", wallOn);
      themeBtn.setAttribute("aria-selected", themeOn ? "true" : "false");
      wallBtn.setAttribute("aria-selected", wallOn ? "true" : "false");
      themePane.classList.toggle("hidden", !themeOn);
      wallPane.classList.toggle("hidden", !wallOn);
      if (wpNote) wpNote.classList.toggle("hidden", !wallOn);

      if (wallOn) {
        try {
          renderWallpaperUI();
        } catch {}
      }
    }

    function initThemeWallTabs() {
      const themeBtn = $("tabTheme");
      const wallBtn = $("tabWall");
      if (themeBtn) themeBtn.addEventListener("click", () => setThemeWallView("theme"));
      if (wallBtn) wallBtn.addEventListener("click", () => setThemeWallView("wall"));

      const saved = storage.lsGet(themewallViewKey, "theme");
      setThemeWallView(saved === "custom" ? "wall" : saved);
    }

    function initWallpapers() {
      if (initDone) return;
      initDone = true;
      const tabSel = $("wpTab");
      const clearBtn = $("wpClear");
      if (tabSel) {
        tabSel.addEventListener("change", () => {
          renderWallpaperUI();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          const targetTab = $("wpTab")?.value || "all";
          if (targetTab === "all") storage.lsRemove(wpGlobalKey);
          else setWallpaperForTab(targetTab, "");
          renderWallpaperUI();
          const previewTab = targetTab === "all" ? getCurrentTab() : targetTab;
          applyUserBg(previewTab);
          applyWallpaper(previewTab);
          toast("ok", t("toast_wallpaper_cleared") || "Wallpaper cleared.");
        });
      }
      renderWallpaperUI();
    }

    return {
      markWallpaperSelection,
      renderWallpaperUI,
      setThemeWallView,
      initThemeWallTabs,
      initWallpapers,
    };
  };
})(window);
