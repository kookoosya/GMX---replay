(function (window) {
  if (window.__GMXAccountUiFactory) return;

  window.__GMXAccountUiFactory = function createGMXAccountUi(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const refEligibleCacheKey = ctx.refEligibleCacheKey || "gmx_ref_eligible_cache";
    const getRefCount = typeof ctx.getRefCount === "function" ? ctx.getRefCount : () => 0;
    const setRefCount = typeof ctx.setRefCount === "function" ? ctx.setRefCount : () => {};
    const getAuthOk = typeof ctx.getAuthOk === "function" ? ctx.getAuthOk : () => false;
    const getIsAdminFlag =
      typeof ctx.getIsAdminFlag === "function" ? ctx.getIsAdminFlag : () => false;
    const onUnlockUiRefresh =
      typeof ctx.onUnlockUiRefresh === "function" ? ctx.onUnlockUiRefresh : () => {};

    function applyRefCountEligible(eligible, { renderUnlockUi = false } = {}) {
      const num = Math.max(0, Number(eligible || 0) || 0);
      const changed = getRefCount() !== num;
      setRefCount(num);
      try {
        storage.lsSet(refEligibleCacheKey, String(num));
      } catch {}
      if ($("refCountPill")) $("refCountPill").textContent = String(num);
      if ($("refCountRight")) $("refCountRight").textContent = String(num);
      if ($("refCountInline")) $("refCountInline").textContent = String(num);
      if ($("refEligibleInline")) $("refEligibleInline").textContent = String(num);
      if (!renderUnlockUi || !changed) return changed;
      try {
        onUnlockUiRefresh();
      } catch {}
      return changed;
    }

    function applyAdminVisibility() {
      const isAdmin = getAuthOk() && getIsAdminFlag();
      const ta = $("t_admin");
      if (ta) ta.classList.toggle("hidden", !isAdmin);
      if (!isAdmin) document.getElementById("tab-admin")?.classList.add("hidden");
    }

    return { applyRefCountEligible, applyAdminVisibility };
  };
})(window);
