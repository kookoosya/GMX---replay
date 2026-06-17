(function (window) {
  if (window.__GMXThemesWireFactory) return;

  window.__GMXThemesWireFactory = function createGMXThemesWire(ctx) {
    ctx = ctx || {};
    const themeApply = ctx.themeApply || {};
    const extWpStore = ctx.extWpStore || {};
    const extView = ctx.extView || {};
    const wpUi = ctx.wpUi || {};
    const themesUi = ctx.themesUi || {};
    const extApply = ctx.extApply || {};
    const extCbgUi = ctx.extCbgUi || {};
    const extThemesUi = ctx.extThemesUi || {};
    const extWpUi = ctx.extWpUi || {};
    const unlockedCountByRefs =
      typeof ctx.unlockedCountByRefs === "function" ? ctx.unlockedCountByRefs : () => 0;
    const extThemesLength = Number(ctx.extThemesLength) || 0;
    const freeVisibleExtThemes = Number(ctx.freeVisibleExtThemes) || 0;

    const LS_EXT_VIEW = ctx.extViewKey;

    function applyTheme(id) {
      return themeApply.applyTheme?.(id);
    }
    function normalizeExtWallpaperView(view) {
      return extWpStore.normalizeExtWallpaperView?.(view);
    }
    function extWallpaperKeyForView(view) {
      return extWpStore.extWallpaperKeyForView?.(view);
    }
    function getExtWallpaperForView(view) {
      return extWpStore.getExtWallpaperForView?.(view);
    }
    function setExtWallpaperForView(view, id) {
      return extWpStore.setExtWallpaperForView?.(view, id);
    }
    function syncExtWallpaperTargetUI(sel, preferred) {
      return extWpStore.syncExtWallpaperTargetUI?.(sel, preferred);
    }
    function currentExtWallpaperTarget() {
      return extWpStore.currentExtWallpaperTarget?.();
    }
    function extWallpaperLabel(view) {
      return extWpStore.extWallpaperLabel?.(view);
    }
    function normalizeStoredExtWallpaperSelections() {
      return extWpStore.normalizeStoredExtWallpaperSelections?.();
    }
    function normalizeExtViewValue(view) {
      return extView.normalizeExtViewValue?.(view);
    }
    function setExtView(view, opts) {
      return extView.setExtView?.(view, opts);
    }
    function extSyncNow(reason) {
      return extView.extSyncNow?.(reason);
    }
    function markWallpaperSelection(activeId) {
      return wpUi.markWallpaperSelection?.(activeId);
    }
    function unlockedExtThemesCount() {
      return unlockedCountByRefs(extThemesLength, freeVisibleExtThemes);
    }
    function unlockTagText(idx, unlocked, freeCount) {
      return themesUi.unlockTagText?.(idx, unlocked, freeCount);
    }
    function applyExtTheme(id) {
      return extApply.applyExtTheme?.(id);
    }
    function applyExtWallpaper(id, targetView) {
      return extApply.applyExtWallpaper?.(id, targetView);
    }
    function renderThemes() {
      return themesUi.renderThemes?.();
    }
    function renderExtCustomBgUI() {
      return extCbgUi.renderExtCustomBgUI?.();
    }
    function renderExtThemes() {
      return extThemesUi.renderExtThemes?.();
    }
    function renderExtWallpapers() {
      return extWpUi.renderExtWallpapers?.();
    }
    function bindExtTabs() {
      return extView.bindExtTabs?.();
    }
    function initExtWallpaperControls() {
      return extWpUi.initExtWallpaperControls?.();
    }

    return {
      LS_EXT_VIEW,
      applyTheme,
      normalizeExtWallpaperView,
      extWallpaperKeyForView,
      getExtWallpaperForView,
      setExtWallpaperForView,
      syncExtWallpaperTargetUI,
      currentExtWallpaperTarget,
      extWallpaperLabel,
      normalizeStoredExtWallpaperSelections,
      normalizeExtViewValue,
      setExtView,
      extSyncNow,
      markWallpaperSelection,
      unlockedExtThemesCount,
      unlockTagText,
      applyExtTheme,
      applyExtWallpaper,
      renderThemes,
      renderExtCustomBgUI,
      renderExtThemes,
      renderExtWallpapers,
      bindExtTabs,
      initExtWallpaperControls,
    };
  };
})(window);
