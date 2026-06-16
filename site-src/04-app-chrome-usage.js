function fillStyles(){ return __gmxStyles.fillStyles(); }

const $ = __gmxChrome.$;

  function toast(type, html, ms=4500){ return __gmxChrome.toast(type, html, ms); }
  function setDegraded(on, msg){ return __gmxChrome.setDegraded(on, msg); }
  function showFatal(msg){ return __gmxChrome.showFatal(msg); }
  function hideFatal(){ return __gmxChrome.hideFatal(); }
  function setBusy(kind, on, label){ return __gmxChrome.setBusy(kind, on, label); }

  __gmxChrome.wireDegradedBar();

  let INIT_DONE = false;
  const esc = (s)=>__gmxFmt.escapeHtml(s);

  if (!window.__GMXShellErrorsFactory) throw new Error("GMX shellerrors factory missing");
  const __gmxShellErrors = window.__GMXShellErrorsFactory({
    toast,
    setDegraded,
    showFatal,
    escapeHtml: esc,
    isInitDone: () => INIT_DONE,
  });
  __gmxShellErrors.wireGlobalErrors();

  function setBg(tab){ return __gmxSetBg.setBg(tab); }

  function ensurePredictionTabVisible(){ return __gmxNav.ensurePredictionTabVisible(); }

  function showTab(name){ return __gmxNav.showTab(name); }

// Simple info modal (shared shell layer)
  function showInfoModal(title, html){
    return __gmxModals.showInfoModal(title, html);
  }

  if (!window.__GMXTabWireFactory) throw new Error("GMX tabwire factory missing");
  const __gmxTabWire = window.__GMXTabWireFactory({
    normalizeTopLevelTab: (n) => normalizeTopLevelTab(n),
    showTab: (n) => showTab(n),
    trackEvent: (type, meta) => { try { trackEvent(type, meta); } catch {} },
    ensurePredictionTabVisible: () => ensurePredictionTabVisible(),
  });
  function tab(name){ return __gmxTabWire.tab(name); }
  __gmxTabWire.wireTabButtons();

  __gmxChrome.wireFatalBar({
    onGoHome: () => { try { hideFatal(); tab("home"); } catch { location.href = "/"; } },
  });

  if (!window.__GMXAuthWireFactory) throw new Error("GMX authwire factory missing");
  const __gmxAuthWire = window.__GMXAuthWireFactory({
    buildAuthConfig: () => ({
      API,
      LS_HANDLE,
      LS_TOKEN,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
      isLocalDevHost,
      getAdminToken,
      setAuthOk: (v) => { AUTH_OK = !!v; },
      $,
      t,
      toast,
      escapeHtml: esc,
      applyAdminVisibility,
      ping,
      setDegraded,
    }),
  });
  function __getGMXAuth(){ return __gmxAuthWire.getAuth(); }
  function normalizeHandle(input){ return __gmxAuthWire.normalizeHandle(input); }
  function getHandle(){ return __gmxAuthWire.getHandle(); }

  function siteLang(){
    try{ return String(localStorage.getItem(LS_SITE_LANG) || "en").toLowerCase(); }catch(_e){ return "en"; }
  }
  function getBestMode(){ return __gmxToggles.getBestMode(); }
  function setBestMode(next, silent){ return __gmxToggles.setBestMode(next, silent); }
  function syncBestModeUi(){ return __gmxToggles.syncBestModeUi(); }

  function abVariant(){ return __gmxPaywall.abVariant(); }
  async function trackEvent(type, meta){
    if (!getToken()){ return; }
    try{
      if (!getHandle()) return;
      await api("/api/event", "POST", { type, meta: meta || {} });
    }catch(_e){}
  }
  function openLimitModal(payload){ return __gmxPaywall.openLimitModal(payload); }
  function closeLimitModal(){ return __gmxPaywall.closeLimitModal(); }
  function bindLimitModal(){ return __gmxPaywall.bindLimitModal(); }
  function setPayState(state, hint){ return __gmxPaywall.setPayState(state, hint); }
  function openPaySuccess(){ return __gmxPaywall.openPaySuccess(); }
  function closePaySuccess(){ return __gmxPaywall.closePaySuccess(); }
  function bindPaySuccess(){ return __gmxPaywall.bindPaySuccess(); }

  function getToken(){ return __gmxAuthWire.getToken(); }
  function isConnected(){ return __gmxAuthWire.isConnected(); }
  function requireConnected(target){ return __gmxAuthWire.requireConnected(target); }
  function isPublicApi(path){ return __gmxAuthWire.isPublicApi(path); }
  async function initSession(force=false){ return await __gmxAuthWire.initSession(force); }
  async function api(path, method="GET", body, opts={}){ return await __gmxAuthWire.api(path, method, body, opts); }

  function setApiPillState(state){ return __gmxHealth.setApiPillState(state); }

  async function ping(){ return __gmxHealth.ping(); }

  async function loadBuild(){ return __gmxHealth.loadBuild(); }

  function watchBuildUpdates(){ return __gmxHealth.watchBuildUpdates(); }

  function normLimitForUI(limit){ return __gmxUsage.normLimitForUI(limit); }
  function setMeter(valId, fillId, used, limit){ return __gmxUsage.setMeter(valId, fillId, used, limit); }

  function renderHelpModal(){ return __gmxHelp.renderHelpModal(); }
  function openHelpModal(){ return __gmxHelp.openHelpModal(); }
  function closeHelpModal(){ return __gmxHelp.closeHelpModal(); }
  function bindHelpModal(){ return __gmxHelp.bindHelpModal(); }

  function applyRefCountEligible(eligible, opts){ return __gmxAccount.applyRefCountEligible(eligible, opts); }

  function usageCosmeticSignature(j){ return __gmxUsage.usageCosmeticSignature(j); }

  async function refreshUsage(){ return __gmxUsage.refreshUsage(); }

  function applyAdminVisibility(){ return __gmxAccount.applyAdminVisibility(); }


