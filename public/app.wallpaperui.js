(function (window) {
  if (window.__GMXWallpaperUiFactory) return;

  window.__GMXWallpaperUiFactory = function createGMXWallpaperUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;
    const trWp = typeof ctx.trWp === "function" ? ctx.trWp : (k) => k;
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const keys = ctx.keys || {};
    const wpGlobalKey = keys.wpGlobal || "gmx_wp_all";
    const themewallViewKey = keys.themewallView || "gmx_themewall_view";
    const wpFilterKey = keys.wpFilter || "gmx_wp_filter";
    const wpSyncExtKey = keys.wpSyncExt || "gmx_wp_sync_ext";

    const wpCore = () => window.GMXWallpaperCore || {};
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

    function wallpaperRenderSignature(targetTab, activeId, allWps, unlocked, unlockedAll, nextReq, filterId) {
      return [
        targetTab,
        activeId,
        allWps.length,
        unlocked,
        unlockedAll ? 1 : 0,
        nextReq,
        isPro() ? 1 : 0,
        filterId || "featured",
      ].join("|");
    }

    function syncWallpaperFilterSelect(sel, opts) {
      if (!sel) return "featured";
      const core = wpCore();
      const options = core.WALLPAPER_FILTER_OPTIONS || [];
      const unlockedAll = !!(opts && opts.unlockedAll);
      const fallback = unlockedAll ? "all" : "featured";
      const saved = storage.lsGet(wpFilterKey, "");
      sel.innerHTML = "";
      for (const opt of options) {
        const o = document.createElement("option");
        o.value = opt.id;
        o.textContent = t(opt.labelKey) || opt.id;
        sel.appendChild(o);
      }
      const ok = saved && Array.from(sel.options).some((o) => o.value === saved);
      sel.value = ok ? saved : fallback;
      return sel.value;
    }

    function buildWpCard({ wp, idx, mainIdx, isUnlocked }, ctx) {
      const {
        targetTab,
        activeId,
        effectiveCustomLen,
      } = ctx;
      const card = document.createElement("button");
      card.type = "button";
      card.dataset.wpId = wp.id;
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
      card.appendChild(tag);

      if (!isUnlocked) {
        const ov = document.createElement("div");
        ov.className = "mysteryOverlay";
        ov.textContent = t("locked") || "LOCKED";
        card.appendChild(ov);
      }

      card.addEventListener("click", () => {
        if (!isUnlocked) {
          const reqIdx = wp.tier === "custom" ? idx : idx - effectiveCustomLen;
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
        const applyPreview = () => {
          applyWallpaper(previewTab, { force: true });
          applyUserBg(previewTab);
        };
        if (full) prefetchImage(full).finally(applyPreview);
        else applyPreview();

        try {
          const syncExt = $("wpSyncExt")?.checked;
          if (syncExt && wp.tier !== "custom") {
            window.__gmxApplyPairedExtWallpaper?.(wp.id);
          }
        } catch {}
      });

      return card;
    }

    function renderGroupedWallpapers(grid, groups, cardCtx) {
      grid.innerHTML = "";
      grid.classList.add("wpGridRoot");
      for (const group of groups) {
        if (!group.items.length) continue;
        const section = document.createElement("section");
        section.className = "wpGroupSection";
        section.dataset.group = group.id;

        const head = document.createElement("div");
        head.className = "wpGroupHead";
        head.textContent = t(group.labelKey) || group.id;
        section.appendChild(head);

        const subgrid = document.createElement("div");
        subgrid.className = "wpGrid wpGroupGrid";
        section.appendChild(subgrid);
        grid.appendChild(section);

        chunkedRender(
          subgrid,
          group.items,
          (entry) => buildWpCard(entry, cardCtx),
          { key: `wpGrid-${group.id}`, chunk: 12 }
        );
      }
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
      const filterId = syncWallpaperFilterSelect($("wpFilter"), { unlockedAll });
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
        nextReq,
        filterId
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

      const core = wpCore();
      const entries = allWps.map((wp, idx) => {
        const isUnlocked = wallpaperUnlocked(wp, idx, effectiveCustom.length);
        const mainIdx = wp.tier === "custom" ? -1 : idx - effectiveCustom.length;
        const bucket =
          typeof core.bucketWallpaperEntry === "function"
            ? core.bucketWallpaperEntry(wp, idx, effectiveCustom.length, {
                freeVisible: freeVisibleWallpapers,
                isUnlocked: () => isUnlocked,
              })
            : "locked";
        return { wp, idx, bucket, mainIdx, isUnlocked };
      });
      const filtered =
        typeof core.filterWallpaperEntries === "function"
          ? core.filterWallpaperEntries(entries, filterId, (wp) => core.packIndexFromSiteId?.(wp.id))
          : entries;
      const groups =
        typeof core.groupWallpaperEntries === "function"
          ? core.groupWallpaperEntries(filtered)
          : [{ id: "all", labelKey: "wp_filter_all", items: filtered }];

      renderGroupedWallpapers(grid, groups, {
        targetTab,
        activeId,
        effectiveCustomLen: effectiveCustom.length,
      });
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

      const tabThemes = document.getElementById("tab-themes");
      if (tabThemes) tabThemes.classList.toggle("themesWallFocus", wallOn);

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
      const filterSel = $("wpFilter");
      const clearBtn = $("wpClear");
      const syncExt = $("wpSyncExt");
      if (filterSel) {
        filterSel.addEventListener("change", () => {
          storage.lsSet(wpFilterKey, filterSel.value || "featured");
          lastWpRenderSig = "";
          renderWallpaperUI();
        });
      }
      if (syncExt) {
        try {
          syncExt.checked = storage.lsGet(wpSyncExtKey, "1") !== "0";
        } catch {}
        syncExt.addEventListener("change", () => {
          storage.lsSet(wpSyncExtKey, syncExt.checked ? "1" : "0");
        });
      }
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
