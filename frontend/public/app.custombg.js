(function (window) {
  if (window.__GMXCustomBgFactory) return;

  const TABS = [
    ["all", "wp_apply_all"],
    ["home", "wp_apply_home"],
    ["gm", "wp_apply_gm"],
    ["gn", "wp_apply_gn"],
    ["prediction", "wp_apply_prediction"],
    ["referrals", "wp_apply_referrals"],
    ["leaderboard", "wp_apply_leaderboard"],
    ["themes", "wp_apply_themes"],
    ["extthemes", "wp_apply_extthemes"],
    ["wallet", "wp_apply_wallet"],
  ];

  window.__GMXCustomBgFactory = function createGMXCustomBg(ctx) {
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const keys = storage.keys || {};
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (total) => total;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;

    function migrateLegacy() {
      try {
        const legacy = storage.lsGet(keys.CUSTOM_BG, "");
        if (legacy && !storage.lsGet(keys.CUSTOM_BG_GLOBAL, "")) {
          storage.lsSet(keys.CUSTOM_BG_GLOBAL, legacy);
        }
        if (legacy) storage.lsRemove(keys.CUSTOM_BG);
      } catch {}
    }

    function customBgKeyForTab(tab) {
      if (!tab || tab === "all") return keys.CUSTOM_BG_GLOBAL || "gmx_custom_bg_global";
      return (keys.CUSTOM_BG_TAB_PREFIX || "gmx_custom_bg_tab_") + tab;
    }

    function getCustomBgForTab(tab) {
      const direct = storage.lsGet(customBgKeyForTab(tab), "");
      if (direct) return direct;
      return storage.lsGet(keys.CUSTOM_BG_GLOBAL, "");
    }

    function clearCustomBgForTab(tab) {
      if (!tab) return;
      if (tab === "all") {
        storage.lsRemove(keys.CUSTOM_BG_GLOBAL);
        return;
      }
      storage.lsRemove(customBgKeyForTab(tab));
    }

    function setCustomBgForTab(tab, dataUrl) {
      const k = customBgKeyForTab(tab);
      if (!dataUrl) storage.lsRemove(k);
      else storage.lsSet(k, String(dataUrl));
    }

    function listCustomBgUsedTabs() {
      const used = [];
      try {
        for (const [k] of TABS) {
          if (k === "all") continue;
          if (storage.lsGet(customBgKeyForTab(k), "")) used.push(k);
        }
      } catch {}
      return used;
    }

    function customBgUnlockedTabCount() {
      const tabsOnly = TABS.filter((t) => t[0] !== "all");
      if (isPro()) return tabsOnly.length;
      return unlockedCountByRefs(tabsOnly.length, 3);
    }

    function canSetCustomBgOnTab(tab) {
      if (tab === "all") return true;
      if (isPro()) return true;
      const used = listCustomBgUsedTabs();
      if (used.includes(tab)) return true;
      if (used.length < 3) return true;
      const tabsOnly = TABS.filter((t) => t[0] !== "all").map((t) => t[0]);
      const idx = tabsOnly.indexOf(tab);
      if (idx < 0) return false;
      return idx < customBgUnlockedTabCount();
    }

    function requiredRefsForCustomBgTab(tab) {
      if (tab === "all") return 0;
      const tabsOnly = TABS.filter((t) => t[0] !== "all").map((t) => t[0]);
      const idx = tabsOnly.indexOf(tab);
      if (idx < 0) return 0;
      return reqRefsForUnlockIndex(idx, 3);
    }

    function readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = () => reject(r.error || new Error("read failed"));
        r.readAsDataURL(file);
      });
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("image load failed"));
        img.src = src;
      });
    }

    async function compressImageToJpegDataURL(file, options) {
      const src = await readFileAsDataURL(file);
      const img = await loadImage(src);
      const opts = options || {};
      const profile = String(opts.profile || "generic").toLowerCase();
      const MAX = profile === "site" ? 2560 : profile === "ext" ? 1600 : 2200;
      const targetRatio = profile === "site" ? 16 / 9 : profile === "ext" ? 9 / 16 : 0;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (!w || !h) return src;
      let sx = 0;
      let sy = 0;
      let sw = w;
      let sh = h;
      if (targetRatio > 0) {
        const srcRatio = w / h;
        if (srcRatio > targetRatio) {
          sw = Math.max(1, Math.round(h * targetRatio));
          sx = Math.max(0, Math.round((w - sw) / 2));
        } else if (srcRatio < targetRatio) {
          sh = Math.max(1, Math.round(w / targetRatio));
          sy = Math.max(0, Math.round((h - sh) / 2));
        }
      }
      const scale = Math.min(1, MAX / Math.max(sw, sh));
      const tw = Math.max(1, Math.round(sw * scale));
      const th = Math.max(1, Math.round(sh * scale));
      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx2d = canvas.getContext("2d");
      ctx2d.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
      return canvas.toDataURL("image/jpeg", 0.88);
    }

    async function fitImageToCoverDataUrl(file, maxW = 2560, maxH = 1440, quality = 0.88) {
      const src = await readFileAsDataURL(file);
      const img = await loadImage(src);
      const iw = img.naturalWidth || img.width || 1;
      const ih = img.naturalHeight || img.height || 1;
      const targetW = Math.min(maxW, iw);
      const targetH = Math.min(maxH, ih);
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx2d = canvas.getContext("2d", { alpha: false });
      const scale = Math.max(targetW / iw, targetH / ih);
      const sw = targetW / scale;
      const sh = targetH / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      ctx2d.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      return canvas.toDataURL("image/jpeg", quality);
    }

    const getCurrentTab =
      typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const hasWallBg = typeof ctx.hasWallBg === "function" ? ctx.hasWallBg : () => false;
    const hasActiveUnlockedWallpaper =
      typeof ctx.hasActiveUnlockedWallpaper === "function"
        ? ctx.hasActiveUnlockedWallpaper
        : () => false;

    function applyUserBg(tab) {
      const target = tab || getCurrentTab();

      if (hasWallBg()) {
        document.documentElement.style.setProperty("--bg_user", "none");
        document.body.classList.remove("hasUserBg");
        return;
      }

      let data = storage.lsGet(customBgKeyForTab(target), "");

      if (!data && !hasActiveUnlockedWallpaper(target)) {
        data = storage.lsGet(keys.CUSTOM_BG_GLOBAL, "");
      }

      const on = !!data;
      if (on) {
        document.documentElement.style.setProperty("--bg_user", `url("${data}")`);
      } else {
        document.documentElement.style.setProperty("--bg_user", "none");
      }
      document.body.classList.toggle("hasUserBg", on);
    }

    return {
      TABS,
      TABS_PUBLIC: TABS,
      migrateLegacy,
      customBgKeyForTab,
      getCustomBgForTab,
      clearCustomBgForTab,
      setCustomBgForTab,
      listCustomBgUsedTabs,
      customBgUnlockedTabCount,
      canSetCustomBgOnTab,
      requiredRefsForCustomBgTab,
      readFileAsDataURL,
      loadImage,
      compressImageToJpegDataURL,
      fitImageToCoverDataUrl,
      applyUserBg,
    };
  };
})(window);
