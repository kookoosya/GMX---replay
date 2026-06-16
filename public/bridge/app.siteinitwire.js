(function (window) {
  if (window.__GMXSiteInitWireFactory) return;

  window.__GMXSiteInitWireFactory = function createGMXSiteInitWire(ctx) {
    ctx = ctx || {};

    function buildSiteInitConfig() {
      const siteLangMenu = ctx.siteLangMenu || {};
      const styles = ctx.styles || {};
      const storage = ctx.storage || {};
      const gp = ctx.gp || {};
      const bankUi = ctx.bankUi || {};
      const tabState = ctx.tabState || {};
      const K = ctx.K || {};
      const I18N = ctx.I18N || {};
      const LS_SITE_LANG = ctx.LS_SITE_LANG;
      const LS_GM_REPLY_LANG = ctx.LS_GM_REPLY_LANG;
      const LS_GN_REPLY_LANG = ctx.LS_GN_REPLY_LANG;
      const LS_CUSTOM_BG_GLOBAL = ctx.LS_CUSTOM_BG_GLOBAL;
      const LS_WP_GLOBAL = ctx.LS_WP_GLOBAL;
      const LS_LAST_TAB = ctx.LS_LAST_TAB;
      const LS_EXT_VIEW = ctx.LS_EXT_VIEW;
      const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
      const lsGet = typeof ctx.lsGet === "function" ? ctx.lsGet : (k, d) => storage.lsGet?.(k, d) ?? d;
      const lsSet =
        typeof ctx.lsSet === "function"
          ? ctx.lsSet
          : (k, v) => {
              try {
                storage.lsSet?.(k, v);
              } catch (_e) {}
            };

      return {
        setBestMode: ctx.setBestMode,
        setCleanFillEnabled: ctx.setCleanFillEnabled,
        bootstrapSiteLangUi: () => siteLangMenu.bootstrapSiteLangUi?.(),
        applyLang: ctx.applyLang,
        syncBestModeUi: ctx.syncBestModeUi,
        syncCleanFillUi: ctx.syncCleanFillUi,
        pruneLegacyAdminPanels: ctx.pruneLegacyAdminPanels,
        wireI18nObserver: () => siteLangMenu.wireI18nObserver?.(),
        updateLangFlags: ctx.updateLangFlags,
        wireSiteLangSelectChange: (sel) => siteLangMenu.wireSiteLangSelectChange?.(sel),
        fillReplyLangSelects: () => siteLangMenu.fillReplyLangSelects?.(),
        fillStyles: ctx.fillStyles,
        wireStyleSelectors: () => styles.wireStyleSelectors?.(),
        fillPacks: ctx.fillPacks,
        applyTheme: ctx.applyTheme,
        renderThemes: ctx.renderThemes,
        applyUserBg: ctx.applyUserBg,
        initWallpapers: ctx.initWallpapers,
        renderLangChips: ctx.renderLangChips,
        getThemeKey: () => localStorage.getItem("gmx_theme") || "classic",
        getProToolsNote: () =>
          (I18N[localStorage.getItem(LS_SITE_LANG) || "en"]?.pro_tools_note) ||
          (I18N.en?.pro_tools_note) ||
          "Pro-only tools.",
        gmGnWireCtx: {
          $,
          requireConnected: ctx.requireConnected,
          setView: ctx.setView,
          generate: ctx.generate,
          trackEvent: ctx.trackEvent,
          getBestMode: ctx.getBestMode,
          setBestMode: ctx.setBestMode,
          getCleanFillEnabled: ctx.getCleanFillEnabled,
          setCleanFillEnabled: ctx.setCleanFillEnabled,
          doBestServer: ctx.doBestServer,
          doBest: ctx.doBest,
          commitNewLine: ctx.commitNewLine,
          oneClickCleanup: ctx.oneClickCleanup,
          clearView: ctx.clearView,
          clearAll: ctx.clearAll,
          addPasted: ctx.addPasted,
          copyAll: ctx.copyAll,
          exportAll: ctx.exportAll,
          renderList: ctx.renderList,
          saveDraft: ctx.saveDraft,
          getHandle: ctx.getHandle,
          getReplyLangs: () => ctx.REPLY_LANGS,
          lsGet,
          lsSet,
          lsGmReplyLang: LS_GM_REPLY_LANG,
          lsGnReplyLang: LS_GN_REPLY_LANG,
          persistStyle: (kind, style) => {
            try {
              gp.persistStyle?.(kind, style);
            } catch (_e) {}
          },
          lsKeyPack: (kind) => storage.lsKeyPack?.(kind),
          getGmView: () => bankUi.getGmView?.(),
          getGnView: () => bankUi.getGnView?.(),
          ensureIndexed: ctx.ensureIndexed,
          renderLangChips: ctx.renderLangChips,
          updateLangFlags: ctx.updateLangFlags,
        },
        wallpaperUploadCtx: {
          $,
          requireConnected: ctx.requireConnected,
          compressImageToJpegDataURL: ctx.compressImageToJpegDataURL,
          customUploadId: ctx.CUSTOM_UPLOAD_ID,
          lsSet,
          customBgGlobalKey: LS_CUSTOM_BG_GLOBAL,
          wpGlobalKey: LS_WP_GLOBAL,
          setWallpaperForTab: ctx.setWallpaperForTab,
          renderWallpaperUI: ctx.renderWallpaperUI,
          currentTabName: ctx.currentTabName,
          applyWallpaper: ctx.applyWallpaper,
          applyUserBg: ctx.applyUserBg,
          toast: ctx.toast,
          t: ctx.t,
        },
        proControlsCtx: {
          $,
          isPro: ctx.isPro,
          escapeHtml: ctx.escapeHtml,
          storage,
          packsForKind: ctx.packsForKind,
          unlockedPacksCountFor: ctx.unlockedPacksCountFor,
          applyPackDefaultsToUi: ctx.applyPackDefaultsToUi,
          logEvent: ctx.logEvent,
          readKey: ctx.readKey,
          writeKey: ctx.writeKey,
          getBankKey: ctx.getBankKey,
          allKeysForKind: ctx.allKeysForKind,
          allLegacyKeysForKind: ctx.allLegacyKeysForKind,
          getHandle: ctx.getHandle,
          dedupeLines: ctx.dedupeLines,
          normalizeLine: ctx.normalizeLine,
          cleanupKeyLines: ctx.cleanupKeyLines,
          setLangIndex: ctx.setLangIndex,
          getBankMigrationKey: ctx.getBankMigrationKey,
          trimKindToCap: ctx.trimKindToCap,
          themeKey: "gmx_theme",
          customBgKey: LS_CUSTOM_BG_GLOBAL,
          gmReplyLangKey: LS_GM_REPLY_LANG,
          gnReplyLangKey: LS_GN_REPLY_LANG,
          onAfterImport: () => {
            ctx.applyTheme?.(localStorage.getItem("gmx_theme") || "classic");
            ctx.applyUserBg?.();
            ctx.initWallpapers?.();
            ctx.renderThemes?.();
            ctx.fillStyles?.();
            try {
              styles.wireStyleSelectors?.();
            } catch (_e) {}
            ctx.fillPacks?.();
            ctx.renderLangChips?.("gm");
            ctx.renderLangChips?.("gn");
            ctx.renderList?.("gm");
            ctx.renderList?.("gn");
          },
        },
        siteModeCtx: {
          $,
          siteModeKey: K.SITE_MODE,
          lsGet,
          lsSet,
        },
        testHarness: {
          activeKey: ctx.activeKey,
          writeKey: ctx.writeKey,
          readKey: ctx.readKey,
          renderList: ctx.renderList,
          oneClickCleanup: ctx.oneClickCleanup,
          refillCleanFill: ctx.refillCleanFill,
          getHandle: ctx.getHandle,
          setCleanFillEnabled: ctx.setCleanFillEnabled,
          getCleanFillEnabled: ctx.getCleanFillEnabled,
          normalizeLine: ctx.normalizeLine,
          dedupeLines: ctx.dedupeLines,
        },
        siteBootCtx: {
          $,
          getHandle: ctx.getHandle,
          getToken: ctx.getToken,
          setAuthOk: ctx.setAuthOk,
          setInitDone: ctx.setInitDone,
          applyAdminVisibility: ctx.applyAdminVisibility,
          applyLang: ctx.applyLang,
          initThemeWallTabs: ctx.initThemeWallTabs,
          bindExtTabs: ctx.bindExtTabs,
          initExtWallpaperControls: ctx.initExtWallpaperControls,
          normalizeStoredExtWallpaperSelections: ctx.normalizeStoredExtWallpaperSelections,
          migrateLegacyWallpaperSelectionOnce: ctx.migrateLegacyWallpaperSelectionOnce,
          migrateLegacyExtWallpaperSelectionOnce: ctx.migrateLegacyExtWallpaperSelectionOnce,
          renderExtThemes: ctx.renderExtThemes,
          renderExtWallpapers: ctx.renderExtWallpapers,
          renderExtCustomBgUI: ctx.renderExtCustomBgUI,
          setExtView: ctx.setExtView,
          normalizeExtViewValue: ctx.normalizeExtViewValue,
          restoreDrafts: ctx.restoreDrafts,
          normalizeTopLevelTab: ctx.normalizeTopLevelTab,
          tab: ctx.tab,
          setCurrentTab: (n) => tabState.setCurrentTab?.(n),
          setBg: ctx.setBg,
          ping: ctx.ping,
          loadBuild: ctx.loadBuild,
          bindWalletTab: ctx.bindWalletTab,
          bindLimitModal: ctx.bindLimitModal,
          bindPaySuccess: ctx.bindPaySuccess,
          loadPlans: ctx.loadPlans,
          loadBillingProof: ctx.loadBillingProof,
          bindHelpModal: ctx.bindHelpModal,
          watchBuildUpdates: ctx.watchBuildUpdates,
          initSession: ctx.initSession,
          refreshUsage: ctx.refreshUsage,
          migrateLegacyBank: ctx.migrateLegacyBank,
          renderList: ctx.renderList,
          initProTabs: ctx.initProTabs,
          lsGet,
          lastTabKey: LS_LAST_TAB,
          extViewKey: LS_EXT_VIEW,
        },
        recoverCtx: {
          toast: ctx.toast,
          setDegraded: ctx.setDegraded,
          lsGet,
          lsSet,
        },
      };
    }

    async function run() {
      if (!window.__GMXSiteInitFactory) throw new Error("GMX siteinit factory missing");
      await window.__GMXSiteInitFactory(buildSiteInitConfig()).run();
    }

    return { run, buildSiteInitConfig };
  };
})(window);
