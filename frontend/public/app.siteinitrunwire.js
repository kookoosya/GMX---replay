(function (window) {
  if (window.__GMXSiteInitRunWireFactory) return;

  window.__GMXSiteInitRunWireFactory = function createGMXSiteInitRunWire(ctx) {
    ctx = ctx || {};
    const mod = ctx.mod || {};
    const keys = ctx.keys || {};
    const toggles = ctx.toggles || {};
    const lang = ctx.lang || {};
    const chrome = ctx.chrome || {};
    const gmGn = ctx.gmGn || {};
    const wp = ctx.wp || {};
    const pro = ctx.pro || {};
    const boot = ctx.boot || {};
    const session = ctx.session || {};

    function flattenCtx() {
      return {
        setBestMode: toggles.setBestMode,
        setCleanFillEnabled: toggles.setCleanFillEnabled,
        siteLangMenu: mod.siteLangMenu,
        styles: mod.styles,
        storage: mod.storage,
        gp: mod.gp,
        bankUi: mod.bankUi,
        tabState: mod.tabState,
        K: keys.K,
        I18N: keys.I18N,
        LS_SITE_LANG: keys.LS_SITE_LANG,
        LS_GM_REPLY_LANG: keys.LS_GM_REPLY_LANG,
        LS_GN_REPLY_LANG: keys.LS_GN_REPLY_LANG,
        LS_CUSTOM_BG_GLOBAL: keys.LS_CUSTOM_BG_GLOBAL,
        LS_WP_GLOBAL: keys.LS_WP_GLOBAL,
        LS_LAST_TAB: keys.LS_LAST_TAB,
        LS_EXT_VIEW: keys.LS_EXT_VIEW,
        applyLang: lang.applyLang,
        syncBestModeUi: toggles.syncBestModeUi,
        syncCleanFillUi: toggles.syncCleanFillUi,
        pruneLegacyAdminPanels: lang.pruneLegacyAdminPanels,
        updateLangFlags: lang.updateLangFlags,
        fillStyles: chrome.fillStyles,
        fillPacks: chrome.fillPacks,
        applyTheme: chrome.applyTheme,
        renderThemes: chrome.renderThemes,
        applyUserBg: chrome.applyUserBg,
        initWallpapers: chrome.initWallpapers,
        renderLangChips: lang.renderLangChips,
        $: gmGn.$,
        requireConnected: gmGn.requireConnected,
        setView: gmGn.setView,
        generate: gmGn.generate,
        trackEvent: gmGn.trackEvent,
        getBestMode: toggles.getBestMode,
        getCleanFillEnabled: toggles.getCleanFillEnabled,
        doBestServer: gmGn.doBestServer,
        doBest: gmGn.doBest,
        commitNewLine: gmGn.commitNewLine,
        oneClickCleanup: gmGn.oneClickCleanup,
        clearView: gmGn.clearView,
        clearAll: gmGn.clearAll,
        addPasted: gmGn.addPasted,
        copyAll: gmGn.copyAll,
        exportAll: gmGn.exportAll,
        renderList: gmGn.renderList,
        saveDraft: gmGn.saveDraft,
        getHandle: gmGn.getHandle,
        REPLY_LANGS: keys.REPLY_LANGS,
        ensureIndexed: gmGn.ensureIndexed,
        compressImageToJpegDataURL: wp.compressImageToJpegDataURL,
        CUSTOM_UPLOAD_ID: wp.CUSTOM_UPLOAD_ID,
        setWallpaperForTab: wp.setWallpaperForTab,
        renderWallpaperUI: wp.renderWallpaperUI,
        currentTabName: wp.currentTabName,
        applyWallpaper: wp.applyWallpaper,
        toast: wp.toast,
        t: wp.t,
        isPro: pro.isPro,
        escapeHtml: pro.escapeHtml,
        packsForKind: pro.packsForKind,
        unlockedPacksCountFor: pro.unlockedPacksCountFor,
        applyPackDefaultsToUi: pro.applyPackDefaultsToUi,
        logEvent: pro.logEvent,
        readKey: pro.readKey,
        writeKey: pro.writeKey,
        getBankKey: pro.getBankKey,
        allKeysForKind: pro.allKeysForKind,
        allLegacyKeysForKind: pro.allLegacyKeysForKind,
        dedupeLines: pro.dedupeLines,
        normalizeLine: pro.normalizeLine,
        cleanupKeyLines: pro.cleanupKeyLines,
        setLangIndex: pro.setLangIndex,
        getBankMigrationKey: pro.getBankMigrationKey,
        trimKindToCap: pro.trimKindToCap,
        activeKey: pro.activeKey,
        refillCleanFill: pro.refillCleanFill,
        getToken: pro.getToken,
        setAuthOk: session.setAuthOk,
        setInitDone: session.setInitDone,
        applyAdminVisibility: boot.applyAdminVisibility,
        initThemeWallTabs: boot.initThemeWallTabs,
        bindExtTabs: boot.bindExtTabs,
        initExtWallpaperControls: boot.initExtWallpaperControls,
        normalizeStoredExtWallpaperSelections: boot.normalizeStoredExtWallpaperSelections,
        migrateLegacyWallpaperSelectionOnce: boot.migrateLegacyWallpaperSelectionOnce,
        migrateLegacyExtWallpaperSelectionOnce: boot.migrateLegacyExtWallpaperSelectionOnce,
        renderExtThemes: boot.renderExtThemes,
        renderExtWallpapers: boot.renderExtWallpapers,
        renderExtCustomBgUI: boot.renderExtCustomBgUI,
        setExtView: boot.setExtView,
        normalizeExtViewValue: boot.normalizeExtViewValue,
        restoreDrafts: boot.restoreDrafts,
        normalizeTopLevelTab: boot.normalizeTopLevelTab,
        tab: boot.tab,
        setBg: boot.setBg,
        ping: boot.ping,
        loadBuild: boot.loadBuild,
        bindWalletTab: boot.bindWalletTab,
        bindLimitModal: boot.bindLimitModal,
        bindPaySuccess: boot.bindPaySuccess,
        loadPlans: boot.loadPlans,
        loadBillingProof: boot.loadBillingProof,
        bindHelpModal: boot.bindHelpModal,
        watchBuildUpdates: boot.watchBuildUpdates,
        initSession: boot.initSession,
        refreshUsage: boot.refreshUsage,
        migrateLegacyBank: pro.migrateLegacyBank,
        initProTabs: boot.initProTabs,
        setDegraded: boot.setDegraded,
      };
    }

    async function run() {
      if (!window.__GMXSiteInitWireFactory) throw new Error("GMX siteinitwire factory missing");
      await window.__GMXSiteInitWireFactory(flattenCtx()).run();
    }

    return { run, flattenCtx };
  };
})(window);
