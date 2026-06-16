(function (window) {
  if (window.__GMXExtWallpaperStoreFactory) return;

  const EXT_WALLPAPER_VIEWS = [
    ["all", "All views"],
    ["popup", "Popup"],
    ["quick", "Quick panel"],
  ];

  window.__GMXExtWallpaperStoreFactory = function createGMXExtWallpaperStore(ctx) {
    const keys = ctx.keys || {};
    const extWpKey = keys.extWp || "gmx_ext_wp";
    const extWpTargetKey = keys.extWpTarget || "gmx_ext_wp_target";
    const extWpViewPrefix = keys.extWpViewPrefix || "gmx_ext_wp_view_";
    const extLsSet = typeof ctx.extLsSet === "function" ? ctx.extLsSet : () => {};
    const lsGet = typeof ctx.lsGet === "function" ? ctx.lsGet : (k, d) => {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : v;
      } catch {
        return d;
      }
    };
    const lsSet = typeof ctx.lsSet === "function" ? ctx.lsSet : (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    };
    const lsRemove = typeof ctx.lsRemove === "function" ? ctx.lsRemove : (k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    };
    const normalizeExtWallpaperId =
      typeof ctx.normalizeExtWallpaperId === "function" ? ctx.normalizeExtWallpaperId : (id) => id;

    function normalizeExtWallpaperView(view) {
      const safe = String(view || "").trim().toLowerCase();
      return safe === "popup" || safe === "quick" ? safe : "all";
    }

    function extWallpaperKeyForView(view) {
      const safe = normalizeExtWallpaperView(view);
      return safe === "all" ? extWpKey : extWpViewPrefix + safe;
    }

    function getExtWallpaperForView(view) {
      try {
        return normalizeExtWallpaperId(lsGet(extWallpaperKeyForView(view), ""));
      } catch (_e) {
        return "";
      }
    }

    function setExtWallpaperForView(view, id) {
      try {
        const safeView = normalizeExtWallpaperView(view);
        const key = extWallpaperKeyForView(safeView);
        const safeId = normalizeExtWallpaperId(id);
        extLsSet(key, safeId || "");
      } catch (_e) {}
    }

    function syncExtWallpaperTargetUI(sel, preferred) {
      if (!sel) return "all";
      const current = normalizeExtWallpaperView(
        preferred || sel.value || lsGet(extWpTargetKey, "") || "all"
      );
      sel.innerHTML = "";
      for (const [value, label] of EXT_WALLPAPER_VIEWS) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        sel.appendChild(opt);
      }
      sel.value = current;
      try {
        lsSet(extWpTargetKey, current);
      } catch (_e) {}
      return current;
    }

    function currentExtWallpaperTarget() {
      return normalizeExtWallpaperView(lsGet(extWpTargetKey, "") || "all");
    }

    function extWallpaperLabel(view) {
      const safe = normalizeExtWallpaperView(view);
      return EXT_WALLPAPER_VIEWS.find((entry) => entry[0] === safe)?.[1] || "All views";
    }

    function normalizeStoredExtWallpaperSelections() {
      try {
        const safeGlobal = normalizeExtWallpaperId(lsGet(extWpKey, ""));
        if (safeGlobal) lsSet(extWpKey, safeGlobal);
        else lsRemove(extWpKey);
      } catch (_e) {}
      for (const [view] of EXT_WALLPAPER_VIEWS) {
        if (view === "all") continue;
        try {
          const key = extWallpaperKeyForView(view);
          const safeId = normalizeExtWallpaperId(lsGet(key, ""));
          if (safeId) lsSet(key, safeId);
          else lsRemove(key);
        } catch (_e) {}
      }
    }

    return {
      normalizeExtWallpaperView,
      extWallpaperKeyForView,
      getExtWallpaperForView,
      setExtWallpaperForView,
      syncExtWallpaperTargetUI,
      currentExtWallpaperTarget,
      extWallpaperLabel,
      normalizeStoredExtWallpaperSelections,
      EXT_WALLPAPER_VIEWS,
    };
  };
})(window);
