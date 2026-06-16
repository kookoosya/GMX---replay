(function (window) {
  if (window.__GMXExtWallpaperUiFactory) return;

  window.__GMXExtWallpaperUiFactory = function createGMXExtWallpaperUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const t = typeof ctx.t === "function" ? ctx.t : (k) => k;
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");

    const extSyncNow = typeof ctx.extSyncNow === "function" ? ctx.extSyncNow : () => {};
    const extLsSet = typeof ctx.extLsSet === "function" ? ctx.extLsSet : () => {};
    const keys = ctx.keys || {};
    const extCustomBgGlobalKey = keys.extCustomBgGlobal || "gmx_ext_custom_bg_global";
    const extWpTargetKey = keys.extWpTarget || "gmx_ext_wp_target";
    const customUploadId = String(ctx.customUploadId || "custom_upload");
    const compressImageToJpegDataURL =
      typeof ctx.compressImageToJpegDataURL === "function"
        ? ctx.compressImageToJpegDataURL
        : async () => "";
    const setExtWallpaperForView =
      typeof ctx.setExtWallpaperForView === "function" ? ctx.setExtWallpaperForView : () => {};
    const normalizeExtWallpaperView =
      typeof ctx.normalizeExtWallpaperView === "function" ? ctx.normalizeExtWallpaperView : (v) => v;
    const loadCustomWallpapers =
      typeof ctx.loadCustomWallpapers === "function" ? ctx.loadCustomWallpapers : async () => false;
    const getEffectiveExtCustomWallpapers =
      typeof ctx.getEffectiveExtCustomWallpapers === "function"
        ? ctx.getEffectiveExtCustomWallpapers
        : () => [];
    const getExtWallpapers =
      typeof ctx.getExtWallpapers === "function" ? ctx.getExtWallpapers : () => [];
    const syncExtWallpaperTargetUI =
      typeof ctx.syncExtWallpaperTargetUI === "function" ? ctx.syncExtWallpaperTargetUI : () => "all";
    const getExtWallpaperForView =
      typeof ctx.getExtWallpaperForView === "function" ? ctx.getExtWallpaperForView : () => "";
    const currentExtWallpaperTarget =
      typeof ctx.currentExtWallpaperTarget === "function" ? ctx.currentExtWallpaperTarget : () => "all";
    const extWallpaperLabel =
      typeof ctx.extWallpaperLabel === "function" ? ctx.extWallpaperLabel : () => "All views";
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : (n) => n;
    const freeVisibleExtWallpapers = Number(ctx.freeVisibleExtWallpapers) || 4;
    const customWpFreeCount = Number(ctx.customWpFreeCount) || 5;
    const isPro = typeof ctx.isPro === "function" ? ctx.isPro : () => false;
    const reqRefsForUnlockIndex =
      typeof ctx.reqRefsForUnlockIndex === "function" ? ctx.reqRefsForUnlockIndex : () => 0;
    const extWallpaperThumbUrl =
      typeof ctx.extWallpaperThumbUrl === "function" ? ctx.extWallpaperThumbUrl : () => "";
    const extWallpaperFullUrl =
      typeof ctx.extWallpaperFullUrl === "function" ? ctx.extWallpaperFullUrl : () => "";
    const chunkedRender =
      typeof ctx.chunkedRender === "function" ? ctx.chunkedRender : () => {};
    const observeLazyBg = typeof ctx.observeLazyBg === "function" ? ctx.observeLazyBg : () => {};
    const prefetchImage =
      typeof ctx.prefetchImage === "function" ? ctx.prefetchImage : () => Promise.resolve();
    const requireConnected =
      typeof ctx.requireConnected === "function" ? ctx.requireConnected : () => true;
    const applyExtWallpaper =
      typeof ctx.applyExtWallpaper === "function" ? ctx.applyExtWallpaper : () => {};
    const unlockTagText =
      typeof ctx.unlockTagText === "function" ? ctx.unlockTagText : () => "LOCKED";
    const formatUnlockMeter =
      typeof ctx.formatUnlockMeter === "function" ? ctx.formatUnlockMeter : (a, b) => `${a}/${b}`;

    function initExtWallpaperControls() {
      if (initExtWallpaperControls._done) return;
      initExtWallpaperControls._done = true;
      const sel = $("extWpTarget");
      const clearBtn = $("extWpClear");
      const addBtn = $("extWpAddCustom");
      const addFile = $("extWpAddFile");
      if (addBtn && addFile) {
        addBtn.onclick = () => {
          if (requireConnected("Extension themes")) addFile.click();
        };
      }
      if (addFile) {
        addFile.addEventListener("change", async () => {
          try {
            if (!requireConnected("Extension themes")) {
              addFile.value = "";
              return;
            }
            const f = addFile.files && addFile.files[0];
            if (!f) return;
            const data = await compressImageToJpegDataURL(f, { profile: "ext" });
            extLsSet(extCustomBgGlobalKey, data);
            const target = $("extWpTarget")?.value || "all";
            setExtWallpaperForView(normalizeExtWallpaperView(target), customUploadId);
            extSyncNow("ext_wallpaper");
            try {
              renderExtWallpapers();
            } catch {}
            toast("ok", t("toast_custom_bg_saved") || "Custom wallpaper saved.");
          } catch (_e) {
            toast("warn", t("err_custom_wp_save") || "Could not save image.");
          } finally {
            addFile.value = "";
          }
        });
      }
      if (sel) {
        syncExtWallpaperTargetUI(sel);
        sel.addEventListener("change", () => {
          const target = syncExtWallpaperTargetUI(sel, sel.value || "all");
          try {
            localStorage.setItem(extWpTargetKey, target);
          } catch (_e) {}
          renderExtWallpapers();
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          const selNow = $("extWpTarget");
          const target = normalizeExtWallpaperView(selNow?.value || currentExtWallpaperTarget());
          setExtWallpaperForView(target, "");
          renderExtWallpapers();
          extSyncNow("ext_wallpaper");
          toast("ok", t("toast_wallpaper_cleared") || "Wallpaper cleared.");
        });
      }
    }

    function renderExtWallpapers() {
      const grid = $("extWpGrid");
      const st = $("extWpStatus");
      const targetSel = $("extWpTarget");
      if (!grid || !st) return;

      initExtWallpaperControls();
      loadCustomWallpapers().then((loaded) => {
        if (loaded && document.contains(grid)) renderExtWallpapers();
      });

      const effectiveExtCustom = getEffectiveExtCustomWallpapers();
      const extWallpapers = getExtWallpapers();
      const allExtWps = [...extWallpapers, ...effectiveExtCustom];
      const selectedTarget = syncExtWallpaperTargetUI(
        targetSel,
        targetSel?.value || currentExtWallpaperTarget()
      );
      const total = allExtWps.length;
      const mainUnlockedExt = unlockedCountByRefs(
        extWallpapers.length,
        freeVisibleExtWallpapers
      );
      const customUnlockedExt = Math.min(
        effectiveExtCustom.length,
        isPro() ? effectiveExtCustom.length : customWpFreeCount
      );
      const unlocked = mainUnlockedExt + customUnlockedExt;
      const chosenDirect = getExtWallpaperForView(selectedTarget);
      const fallbackGlobal = selectedTarget === "all" ? "" : getExtWallpaperForView("all");
      const chosen = chosenDirect || fallbackGlobal || "";
      const wEl = $("extWpUnlocked");
      if (wEl) wEl.textContent = formatUnlockMeter(Math.min(unlocked, total), total);

      const items = allExtWps.map((wp, idx) => ({ wp, idx }));
      chunkedRender(
        grid,
        items,
        ({ wp, idx }) => {
          const isUnlocked =
            wp.tier === "custom"
              ? idx - extWallpapers.length < customWpFreeCount || isPro()
              : isPro() || idx < mainUnlockedExt;
          const card = document.createElement("button");
          card.type = "button";
          card.dataset.wpId = wp.id;
          card.dataset.tier = wp.tier || (idx < freeVisibleExtWallpapers ? "free" : "premium");
          card.className =
            "wpCard" + (wp.id === chosen ? " active" : "") + (!isUnlocked ? " mystery" : "");

          const thumb = document.createElement("div");
          thumb.className = "wpThumb";
          const thumbUrl = extWallpaperThumbUrl(wp.id);
          const fullUrl = extWallpaperFullUrl(wp.id);
          if (thumbUrl) {
            thumb.setAttribute("data-bg", thumbUrl);
            observeLazyBg(thumb);
          }
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
          name.textContent = wp.name || wp.id;

          const meta = document.createElement("div");
          meta.className = "wpMeta";
          meta.textContent = wp.tier === "custom" ? "Custom" : wp.tier || "";

          const tag = document.createElement("div");
          tag.className = "wpTag";
          tag.textContent =
            wp.tier === "custom"
              ? "CUSTOM"
              : unlockTagText(idx, isUnlocked, freeVisibleExtWallpapers);

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
            if (!requireConnected("Extension themes")) return;
            if (!isUnlocked) {
              const need = reqRefsForUnlockIndex(idx, freeVisibleExtWallpapers);
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
            applyExtWallpaper(wp.id, selectedTarget);
          });

          return card;
        },
        { key: "extWpGrid", chunk: 12 }
      );

      if (!chosen) {
        st.innerHTML = `<span class="muted">None.</span> Pick a wallpaper for <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
        return;
      }
      const chosenName =
        extWallpapers.find((x) => x.id === chosen)?.name ||
        effectiveExtCustom.find((x) => x.id === chosen)?.name ||
        chosen;
      if (chosenDirect) {
        st.innerHTML = `<span class="ok">Selected.</span> ${escapeHtml(chosenName)} for <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
      } else {
        st.innerHTML = `<span class="ok">Using global.</span> ${escapeHtml(chosenName)} from <b>${escapeHtml(extWallpaperLabel("all"))}</b> is currently filling <b>${escapeHtml(extWallpaperLabel(selectedTarget))}</b>.`;
      }
    }

    return { renderExtWallpapers, initExtWallpaperControls };
  };
})(window);
