(function (window) {
  if (window.__GMXBreadcrumbsFactory) return;

  const TAB_LABEL_KEYS = {
    gm: "t_gm",
    gn: "t_gn",
    prediction: "t_prediction",
    wallet: "t_wallet",
    referrals: "t_ref",
    leaderboard: "t_lb",
    themes: "t_themes",
    extthemes: "t_extthemes",
    admin: "t_admin",
  };

  window.__GMXBreadcrumbsFactory = function createGMXBreadcrumbs(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const tr = typeof ctx.tr === "function" ? ctx.tr : (_k, fb) => fb || "";
    const switchTab = typeof ctx.switchTab === "function" ? ctx.switchTab : () => {};

    function sectionKey(tab) {
      const key = String(tab || "").trim().toLowerCase();
      return TAB_LABEL_KEYS[key] || null;
    }

    function applyBreadcrumbs(tab) {
      const wrap = $("app_breadcrumbs");
      const homeEl = $("app_breadcrumb_home");
      const currentEl = $("app_breadcrumb_current");
      if (!wrap || !homeEl || !currentEl) return;

      const labelKey = sectionKey(tab);
      if (!labelKey) {
        wrap.classList.add("hidden");
        return;
      }

      homeEl.textContent = tr("t_home", "Home");
      currentEl.textContent = tr(labelKey, labelKey);
      wrap.classList.remove("hidden");
      wrap.setAttribute(
        "aria-label",
        tr("ui_breadcrumb_nav_label", "Breadcrumb")
      );
    }

    function bindBreadcrumbs() {
      const homeBtn = $("app_breadcrumb_home");
      if (homeBtn && !homeBtn.dataset.bound) {
        homeBtn.dataset.bound = "1";
        homeBtn.addEventListener("click", () => switchTab("home"));
      }
    }

    return { applyBreadcrumbs, bindBreadcrumbs };
  };
})(window);
