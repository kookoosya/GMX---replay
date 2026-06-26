(function (window) {
  if (window.__GMXSiteBootFactory) return;

  window.__GMXSiteBootFactory = function createGMXSiteBoot(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const getToken = typeof ctx.getToken === "function" ? ctx.getToken : () => "";
    const setAuthOk = typeof ctx.setAuthOk === "function" ? ctx.setAuthOk : () => {};
    const setInitDone = typeof ctx.setInitDone === "function" ? ctx.setInitDone : () => {};
    const applyAdminVisibility =
      typeof ctx.applyAdminVisibility === "function" ? ctx.applyAdminVisibility : () => {};
    const initModeToggle = typeof ctx.initModeToggle === "function" ? ctx.initModeToggle : () => {};
    const applyLang = typeof ctx.applyLang === "function" ? ctx.applyLang : () => {};
    const initThemeWallTabs =
      typeof ctx.initThemeWallTabs === "function" ? ctx.initThemeWallTabs : () => {};
    const bindExtTabs = typeof ctx.bindExtTabs === "function" ? ctx.bindExtTabs : () => {};
    const initExtWallpaperControls =
      typeof ctx.initExtWallpaperControls === "function" ? ctx.initExtWallpaperControls : () => {};
    const normalizeStoredExtWallpaperSelections =
      typeof ctx.normalizeStoredExtWallpaperSelections === "function"
        ? ctx.normalizeStoredExtWallpaperSelections
        : () => {};
    const migrateLegacyWallpaperSelectionOnce =
      typeof ctx.migrateLegacyWallpaperSelectionOnce === "function"
        ? ctx.migrateLegacyWallpaperSelectionOnce
        : () => {};
    const migrateLegacyExtWallpaperSelectionOnce =
      typeof ctx.migrateLegacyExtWallpaperSelectionOnce === "function"
        ? ctx.migrateLegacyExtWallpaperSelectionOnce
        : () => {};
    const renderExtThemes = typeof ctx.renderExtThemes === "function" ? ctx.renderExtThemes : () => {};
    const renderExtWallpapers =
      typeof ctx.renderExtWallpapers === "function" ? ctx.renderExtWallpapers : () => {};
    const renderExtCustomBgUI =
      typeof ctx.renderExtCustomBgUI === "function" ? ctx.renderExtCustomBgUI : () => {};
    const setExtView = typeof ctx.setExtView === "function" ? ctx.setExtView : () => {};
    const normalizeExtViewValue =
      typeof ctx.normalizeExtViewValue === "function" ? ctx.normalizeExtViewValue : (v) => v;
    const restoreDrafts = typeof ctx.restoreDrafts === "function" ? ctx.restoreDrafts : () => {};
    const normalizeTopLevelTab =
      typeof ctx.normalizeTopLevelTab === "function" ? ctx.normalizeTopLevelTab : (v) => v;
    const tab = typeof ctx.tab === "function" ? ctx.tab : () => {};
    const setCurrentTab = typeof ctx.setCurrentTab === "function" ? ctx.setCurrentTab : () => {};
    const setBg = typeof ctx.setBg === "function" ? ctx.setBg : () => {};
    const ping = typeof ctx.ping === "function" ? ctx.ping : () => {};
    const loadBuild = typeof ctx.loadBuild === "function" ? ctx.loadBuild : () => {};
    const bindWalletTab = typeof ctx.bindWalletTab === "function" ? ctx.bindWalletTab : () => {};
    const bindLimitModal = typeof ctx.bindLimitModal === "function" ? ctx.bindLimitModal : () => {};
    const bindPaySuccess = typeof ctx.bindPaySuccess === "function" ? ctx.bindPaySuccess : () => {};
    const loadPlans = typeof ctx.loadPlans === "function" ? ctx.loadPlans : () => {};
    const loadBillingProof = typeof ctx.loadBillingProof === "function" ? ctx.loadBillingProof : () => {};
    const bindHelpModal = typeof ctx.bindHelpModal === "function" ? ctx.bindHelpModal : () => {};
    const watchBuildUpdates =
      typeof ctx.watchBuildUpdates === "function" ? ctx.watchBuildUpdates : () => {};
    const initSession = typeof ctx.initSession === "function" ? ctx.initSession : async () => null;
    const refreshUsage = typeof ctx.refreshUsage === "function" ? ctx.refreshUsage : async () => {};
    const migrateLegacyBank =
      typeof ctx.migrateLegacyBank === "function" ? ctx.migrateLegacyBank : () => {};
    const renderList = typeof ctx.renderList === "function" ? ctx.renderList : () => {};
    const initProTabs = typeof ctx.initProTabs === "function" ? ctx.initProTabs : () => {};
    const siteTr = typeof ctx.siteTr === "function" ? ctx.siteTr : (_k, fb) => fb || "";
    const getCurrentTab =
      typeof ctx.getCurrentTab === "function" ? ctx.getCurrentTab : () => "home";
    const lsGet =
      typeof ctx.lsGet === "function"
        ? ctx.lsGet
        : (k, fb = "") => {
            try {
              const v = localStorage.getItem(k);
              return v === null || v === undefined ? fb : v;
            } catch {
              return fb;
            }
          };
    const lastTabKey = ctx.lastTabKey || "gmx_last_tab";
    const extViewKey = ctx.extViewKey || "gmx_ext_view";

    function run() {
      setAuthOk(false);

      const handlePill = $("handlePill");
      if (handlePill) handlePill.textContent = getHandle() ? getHandle() : "not set";
      const xHandle = $("xHandle");
      if (xHandle) xHandle.value = getHandle() || "";

      applyAdminVisibility();
      try {
        initModeToggle();
      } catch {}
      applyLang();
      try {
        if (window.__GMXSeoMetaFactory) {
          window.__GMXSeoMetaFactory({ tr: siteTr }).applySeoMeta(getCurrentTab() || "home");
        }
      } catch {}
      try {
        if (window.__GMXBreadcrumbsFactory) {
          const crumbs = window.__GMXBreadcrumbsFactory({
            $,
            tr: siteTr,
            switchTab: (n) => {
              try {
                tab(n);
              } catch {}
            },
          });
          crumbs.bindBreadcrumbs();
          crumbs.applyBreadcrumbs(getCurrentTab() || "home");
        }
      } catch {}
      try {
        initThemeWallTabs();
      } catch {}
      try {
        bindExtTabs();
      } catch {}
      try {
        initExtWallpaperControls();
      } catch {}
      try {
        normalizeStoredExtWallpaperSelections();
      } catch {}
      try {
        migrateLegacyWallpaperSelectionOnce();
      } catch {}
      try {
        migrateLegacyExtWallpaperSelectionOnce();
      } catch {}
      try {
        renderExtThemes();
      } catch {}
      try {
        renderExtWallpapers();
      } catch {}
      try {
        renderExtCustomBgUI();
      } catch {}
      try {
        setExtView(normalizeExtViewValue(lsGet(extViewKey, "theme")), { force: true, silent: true });
      } catch {}
      restoreDrafts();

      let bootTab = "home";
      try {
        const params = new URLSearchParams(location.search);
        const qpTab = String(params.get("tab") || "").trim();
        if (qpTab) {
          bootTab = normalizeTopLevelTab(qpTab);
        } else {
          bootTab = normalizeTopLevelTab(String(lsGet(lastTabKey, "") || "").trim() || "home");
        }
      } catch {}
      tab(bootTab);
      setCurrentTab(bootTab);
      setBg(bootTab);

      ping();
      loadBuild();
      try {
        bindWalletTab();
      } catch {}
      try {
        bindLimitModal();
      } catch {}
      try {
        bindPaySuccess();
      } catch {}
      try {
        loadPlans();
      } catch {}
      try {
        loadBillingProof();
      } catch {}
      try {
        bindHelpModal();
      } catch {}
      try {
        watchBuildUpdates();
      } catch {}

      if (getHandle()) {
        initSession(false)
          .then(async (tok) => {
            if (!tok) return;
            try {
              await refreshUsage();
            } catch {}
          })
          .catch(() => {});
      }

      try {
        migrateLegacyBank("gm");
      } catch {}
      try {
        migrateLegacyBank("gn");
      } catch {}

      renderList("gm");
      renderList("gn");

      try {
        initProTabs();
      } catch {}

      try {
        if (window.__GMXHomeHeroFactory) {
          window.__GMXHomeHeroFactory({ $ }).bindHomeHero();
        }
      } catch {}

      try {
        if (window.__GMXHomeStatsFactory) {
          window.__GMXHomeStatsFactory({ $, tr: siteTr }).bindHomeStats();
        }
      } catch {}

      try {
        if (window.__GMXPwaInstallFactory) {
          window.__GMXPwaInstallFactory({
            $,
            siteTr: typeof ctx.siteTr === "function" ? ctx.siteTr : (_k, fb) => fb || "",
            lsGet,
          }).bindPwaInstall();
        }
      } catch {}

      try {
        if (window.__GMXMobileNavFactory) {
          window.__GMXMobileNavFactory({
            $,
            switchTab: tab,
            getCurrentTab,
            siteTr,
          }).bindMobileNav();
        }
      } catch {}

      try {
        if (window.__GMXArcadePreloadFactory) {
          window.__GMXArcadePreloadFactory({ $ }).bindArcadePreload();
        }
      } catch {}

      setInitDone(true);
    }

    return { run };
  };
})(window);
