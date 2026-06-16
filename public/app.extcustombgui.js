(function (window) {
  if (window.__GMXExtCustomBgUiFactory) return;

  const EXT_POPUP_TABS = [
    ["all", "wp_apply_all"],
    ["home", "wp_apply_home"],
    ["gm", "wp_apply_gm"],
    ["gn", "wp_apply_gn"],
    ["referrals", "wp_apply_referrals"],
    ["themes", "wp_apply_themes"],
    ["wallet", "wp_apply_wallet"],
  ];

  window.__GMXExtCustomBgUiFactory = function createGMXExtCustomBgUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const bindExtTabs = typeof ctx.bindExtTabs === "function" ? ctx.bindExtTabs : () => {};
    const extSyncNow = typeof ctx.extSyncNow === "function" ? ctx.extSyncNow : () => {};
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const compressImageToJpegDataURL =
      typeof ctx.compressImageToJpegDataURL === "function"
        ? ctx.compressImageToJpegDataURL
        : async () => "";
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (n) => n;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const lsGet = typeof ctx.lsGet === "function" ? ctx.lsGet : (k, d) => d;
    const lsSet = typeof ctx.lsSet === "function" ? ctx.lsSet : () => {};
    const lsRemove = typeof ctx.lsRemove === "function" ? ctx.lsRemove : () => {};
    const keys = ctx.keys || {};
    const extCustomBgGlobal = keys.extCustomBgGlobal || "gmx_ext_custom_bg_global";
    const extCustomBgTabPrefix = keys.extCustomBgTabPrefix || "gmx_ext_custom_bg_tab_";
    const extCustomBgTarget = keys.extCustomBgTarget || "gmx_ext_custom_bg_target";
    const extCustomBgLegacy = keys.extCustomBgLegacy || "gmx_ext_custom_bg_legacy";

    let __legacyMigrated = false;

    function extCustomBgKeyForTab(tab) {
      return tab === "all" ? extCustomBgGlobal : extCustomBgTabPrefix + tab;
    }

    function migrateExtCustomBgLegacy() {
      if (__legacyMigrated) return;
      __legacyMigrated = true;
      try {
        const legacy = lsGet(extCustomBgLegacy, "");
        if (legacy && !lsGet(extCustomBgGlobal, "")) {
          lsSet(extCustomBgGlobal, legacy);
        }
        if (legacy) lsRemove(extCustomBgLegacy);
      } catch (_e) {}
    }

    function listExtCustomBgUsedTabs() {
      const used = [];
      try {
        for (const [k] of EXT_POPUP_TABS) {
          if (k === "all") continue;
          if (lsGet(extCustomBgTabPrefix + k, "")) used.push(k);
        }
        if (lsGet(extCustomBgGlobal, "")) used.push("all");
      } catch (_e) {}
      return used;
    }

    function canSetExtCustomBgOnTab(tab) {
      if (tab === "all") return true;
      if (isPro()) return true;

      const used = listExtCustomBgUsedTabs();
      if (used.includes(tab)) return true;

      if (used.filter((x) => x !== "all").length < 3) return true;

      const tabsOnly = EXT_POPUP_TABS.filter((entry) => entry[0] !== "all").map((entry) => entry[0]);
      const idx = tabsOnly.indexOf(tab);
      if (idx < 0) return false;
      const unlocked = unlockedCountByRefs(tabsOnly.length, 3);
      return idx < unlocked;
    }

    function requiredRefsForExtCustomBgTab(tab) {
      if (tab === "all") return 0;
      const tabsOnly = EXT_POPUP_TABS.filter((entry) => entry[0] !== "all").map((entry) => entry[0]);
      const idx = tabsOnly.indexOf(tab);
      if (idx < 0) return 0;
      return reqRefsForUnlockIndex(idx, 3);
    }

    function renderExtCustomBgUI() {
      bindExtTabs();
      migrateExtCustomBgLegacy();

      const tabSel = $("extCustomBgTab");
      const st = $("extCustomBgStatus");
      const nm = $("extCustomBgName");
      const btnClear = $("extCustomBgClear");
      const btnPick = $("extCustomBgPick");
      const inp = $("extCustomBgFile");
      const btnRemove = $("extCustomBgRemove");

      if (!tabSel || !st || !btnPick || !inp || !btnRemove || !btnClear) return;

      const prev = lsGet(extCustomBgTarget, "") || tabSel.value || "all";

      tabSel.innerHTML = "";
      for (const [k, labelKey] of EXT_POPUP_TABS) {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = t(labelKey);
        tabSel.appendChild(o);
      }
      if ([...tabSel.options].some((o) => o.value === prev)) tabSel.value = prev;
      lsSet(extCustomBgTarget, tabSel.value);

      const target = tabSel.value || "all";
      const key = extCustomBgKeyForTab(target);
      const cur = lsGet(key, "");
      const used = listExtCustomBgUsedTabs();
      const usedCount = used.filter((x) => x !== "all").length;
      const slots = Math.min(EXT_POPUP_TABS.length - 1, unlockedCountByRefs(EXT_POPUP_TABS.length - 1, 3));
      const isAllowed = canSetExtCustomBgOnTab(target);
      const needRefs = requiredRefsForExtCustomBgTab(target);

      if (nm) nm.textContent = cur ? "saved" : "";

      let msg = cur
        ? `<span class="ok">Active.</span> Custom background is set for <b>${escapeHtml(t(EXT_POPUP_TABS.find((x) => x[0] === target)?.[1] || "wp_apply_all"))}</b>.`
        : `<span class="muted">None.</span> Upload an image to set a custom background.`;

      if (!isPro()) {
        msg += ` <span class="muted">Slots:</span> ${Math.min(usedCount, slots)}/${slots}.`;
      }
      if (!isAllowed) {
        msg += ` <span class="warn">Locked:</span> need ${needRefs} referrals for this tab (or upgrade to Pro).`;
      }
      st.innerHTML = msg;

      tabSel.onchange = () => {
        lsSet(extCustomBgTarget, tabSel.value);
        renderExtCustomBgUI();
      };

      btnClear.onclick = () => {
        if (!requireConnected("Extension themes")) return;
        try {
          lsRemove(extCustomBgGlobal);
          for (const [k] of EXT_POPUP_TABS) {
            if (k === "all") continue;
            lsRemove(extCustomBgTabPrefix + k);
          }
        } catch (_e) {}
        renderExtCustomBgUI();
        toast("ok", t("toast_cleared") || "Cleared.");
      };

      btnPick.onclick = () => {
        if (!requireConnected("Extension themes")) return;
        if (!canSetExtCustomBgOnTab(target)) {
          renderExtCustomBgUI();
          return;
        }
        inp.click();
      };

      if (!inp._bound) {
        inp._bound = true;
        inp.addEventListener("change", async () => {
          try {
            if (!requireConnected("Extension themes")) {
              inp.value = "";
              return;
            }
            const tab = tabSel.value || "all";
            if (!canSetExtCustomBgOnTab(tab)) {
              inp.value = "";
              renderExtCustomBgUI();
              return;
            }
            const file = inp.files && inp.files[0];
            if (!file) return;
            if (nm) nm.textContent = file.name || "";

            const dataUrl = await compressImageToJpegDataURL(file, { profile: "ext" });
            lsSet(extCustomBgKeyForTab(tab), dataUrl);
            extSyncNow();

            renderExtCustomBgUI();
            if (st) st.innerHTML = `<span class="ok">Saved.</span> Auto-fitted for extension popup ratio.`;
            toast("ok", t("toast_custom_bg_saved") || "Custom background saved.");
          } catch (_e) {
            st.innerHTML = `<span class="bad">Error.</span> Could not save background.`;
          } finally {
            inp.value = "";
          }
        });
      }

      btnRemove.onclick = () => {
        if (!requireConnected("Extension themes")) return;
        const tab = tabSel.value || "all";
        lsRemove(extCustomBgKeyForTab(tab));
        extSyncNow();
        renderExtCustomBgUI();
        toast("ok", t("toast_removed") || "Removed.");
      };
    }

    return { renderExtCustomBgUI };
  };
})(window);
