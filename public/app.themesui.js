(function (window) {
  if (window.__GMXThemesUiFactory) return;

  window.__GMXThemesUiFactory = function createGMXThemesUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const getThemes = typeof ctx.getThemes === "function" ? ctx.getThemes : () => [];
    const getWallpapers = typeof ctx.getWallpapers === "function" ? ctx.getWallpapers : () => [];
    const getChosenTheme =
      typeof ctx.getChosenTheme === "function" ? ctx.getChosenTheme : () => "classic";
    const unlockedThemesCount =
      typeof ctx.unlockedThemesCount === "function" ? ctx.unlockedThemesCount : () => 0;
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (n) => n;
    const freeVisibleThemes = Number(ctx.freeVisibleThemes) || 8;
    const freeVisibleWallpapers = Number(ctx.freeVisibleWallpapers) || 8;
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;
    const formatUnlockMeter =
      typeof ctx.formatUnlockMeter === "function" ? ctx.formatUnlockMeter : (a, b) => `${a}/${b}`;
    const setMeter = typeof ctx.setMeter === "function" ? ctx.setMeter : () => {};
    const chunkedRender =
      typeof ctx.chunkedRender === "function" ? ctx.chunkedRender : () => {};
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const applyTheme = typeof ctx.applyTheme === "function" ? ctx.applyTheme : () => {};

    const groupCore = window.GMXThemeGroupCore || {};
    const groupThemeItems =
      typeof groupCore.groupThemeItems === "function"
        ? groupCore.groupThemeItems
        : (items) => [{ id: "colorful", items }];
    const groupLabel = (id) => {
      if (id === "dark") return t("themes_group_dark") || "Dark";
      if (id === "light") return t("themes_group_light") || "Light";
      return t("themes_group_colorful") || "Colorful";
    };

    let previewRestoreId = null;
    let lastThemeRenderSig = "";

    function themeRenderSignature(chosen, unlocked, total, curWps, wpTotal) {
      return [chosen, unlocked, total, curWps, wpTotal, isPro() ? 1 : 0].join("|");
    }

    function themePreviewBg(th) {
      const a = th?.a || "rgba(124,92,255,1)";
      const b = th?.b || "rgba(0,229,255,1)";
      return `linear-gradient(135deg, ${a}, ${b})`;
    }

    function startThemePreview(themeId) {
      if (!previewRestoreId) previewRestoreId = getChosenTheme();
      applyTheme(themeId);
    }

    function endThemePreview() {
      if (!previewRestoreId) return;
      applyTheme(previewRestoreId);
      previewRestoreId = null;
    }

    function unlockTagText(idx, unlocked, freeCount) {
      if (idx < freeCount) return "FREE";
      if (unlocked) return "UNLOCKED";
      const need = reqRefsForUnlockIndex(idx, freeCount);
      return `${need} ref`;
    }

    function syncThemesUnlockMeters(curThemes, totalThemes, curWps, totalWps) {
      const label = formatUnlockMeter(curThemes, totalThemes);
      const wpLabel = formatUnlockMeter(curWps, totalWps);
      for (const id of ["themesUnlocked", "themesUnlockedVal"]) {
        const el = $(id);
        if (el) el.textContent = label;
      }
      for (const id of ["wpUnlocked", "wpUnlockedVal"]) {
        const el = $(id);
        if (el) el.textContent = wpLabel;
      }
      try {
        setMeter("themesUnlockedVal", "themesUnlockedFill", curThemes, totalThemes);
      } catch {}
      try {
        setMeter("wpUnlockedVal", "wpUnlockedFill", curWps, totalWps);
      } catch {}
      const refKpi = $("themes_k_ref")?.closest?.(".kpi");
      if (refKpi) refKpi.style.display = isPro() ? "none" : "";
      const freeTip = $("themes_free_tip");
      if (freeTip) {
        freeTip.textContent = isPro()
          ? t("themes_pro_tip") || "Pro unlocks the full theme and wallpaper library."
          : t("themes_free_tip") ||
              "On Free, referrals increase your cosmetic room. On Pro, the full set is already open.";
      }
    }

    function buildThemeCard({ th, idx }, chosen, unlocked) {
      const isUnlocked = isPro() || idx < unlocked;
      const card = document.createElement("button");
      card.type = "button";
      card.dataset.themeId = th.id;
      card.className =
        "themeCard" + (th.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

      const sw = document.createElement("div");
      sw.className = "swatch";
      sw.style.background = themePreviewBg(th);

      const nm = document.createElement("div");
      nm.className = "tname";
      nm.textContent = th.name || th.id;

      const note = document.createElement("div");
      note.className = "tnote";
      note.textContent = th.note || "";

      const tag = document.createElement("div");
      tag.className = "lockTag";
      tag.textContent = unlockTagText(idx, isUnlocked, freeVisibleThemes);

      card.appendChild(sw);
      card.appendChild(nm);
      card.appendChild(note);
      card.appendChild(tag);

      if (!isUnlocked) {
        const ov = document.createElement("div");
        ov.className = "mysteryOverlay";
        ov.textContent = t("locked") || "LOCKED";
        card.appendChild(ov);
        if (!isPro()) {
          const proHint = document.createElement("div");
          proHint.className = "themeProHint";
          proHint.textContent = t("themes_pro_unlocks_all") || "Pro unlocks all";
          card.appendChild(proHint);
        }
      }

      card.addEventListener("mouseenter", () => {
        card.classList.add("previewing");
        startThemePreview(th.id);
      });
      card.addEventListener("mouseleave", (e) => {
        card.classList.remove("previewing");
        const root = $("themeGrid");
        if (root?.contains(e.relatedTarget)) return;
        endThemePreview();
      });
      card.addEventListener("focus", () => {
        card.classList.add("previewing");
        startThemePreview(th.id);
      });
      card.addEventListener("blur", (e) => {
        card.classList.remove("previewing");
        const root = $("themeGrid");
        if (root?.contains(e.relatedTarget)) return;
        endThemePreview();
      });

      card.addEventListener("click", () => {
        previewRestoreId = null;
        if (!requireConnected("Themes")) return;
        if (!isUnlocked) {
          const need = reqRefsForUnlockIndex(idx, freeVisibleThemes);
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
        applyTheme(th.id);
        renderThemes();
      });

      return card;
    }

    function renderThemes() {
      const grid = $("themeGrid");
      if (!grid) return;

      endThemePreview();
      grid.innerHTML = "";
      grid.classList.add("themeGridRoot");

      const themes = getThemes();
      const wallpapers = getWallpapers();
      const total = themes.length;
      const unlocked = unlockedThemesCount();
      const chosen = getChosenTheme();

      const curThemes = Math.min(unlocked, total);
      const curWps = Math.min(
        unlockedCountByRefs(wallpapers.length, freeVisibleWallpapers),
        wallpapers.length
      );

      syncThemesUnlockMeters(curThemes, total, curWps, wallpapers.length);

      const renderSig = themeRenderSignature(chosen, unlocked, total, curWps, wallpapers.length);
      if (renderSig === lastThemeRenderSig) return;
      lastThemeRenderSig = renderSig;

      const items = themes.map((th, idx) => ({ th, idx }));
      const groups = groupThemeItems(items);

      for (const group of groups) {
        const section = document.createElement("section");
        section.className = "themeGroupSection";
        section.dataset.group = group.id;

        const head = document.createElement("div");
        head.className = "themeGroupHead";
        head.textContent = groupLabel(group.id);
        section.appendChild(head);

        const subgrid = document.createElement("div");
        subgrid.className = "themeGrid themeGroupGrid";
        section.appendChild(subgrid);

        grid.appendChild(section);

        chunkedRender(
          subgrid,
          group.items,
          (item) => buildThemeCard(item, chosen, unlocked),
          { key: `themeGrid-${group.id}`, chunk: 24 }
        );
      }
    }

    return { renderThemes, syncThemesUnlockMeters, unlockTagText };
  };
})(window);
