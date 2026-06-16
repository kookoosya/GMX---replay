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

  __gmxChrome.wireFatalBar({
    onGoHome: () => { try { hideFatal(); tab("home"); } catch { location.href = "/"; } },
  });

  window.addEventListener("error", (e)=>{
    try{
      const msg = (e?.message || "Unexpected error");
      const net = String(msg).includes("Failed to fetch") || String(msg).includes("NetworkError") || String(msg).includes("request_failed") || String(msg).includes("timeout");
      if (net){ setDegraded(true, "Network/API error. You can still edit lists locally."); return; }
      toast("bad", `<b>Error:</b> ${esc(msg)} <span class="muted small">(try Reload)</span>`);
      if (!INIT_DONE) showFatal(msg);
    }catch{}
  });

  window.addEventListener("unhandledrejection", (e)=>{
    try{
      const msg = (e?.reason && (e.reason.message || String(e.reason))) || "Unhandled promise rejection";
      const net = String(msg).includes("Failed to fetch") || String(msg).includes("NetworkError") || String(msg).includes("request_failed") || String(msg).includes("timeout") || String(msg).includes("not_connected");
      if (net){ setDegraded(true, "Network/API error. You can still edit lists locally."); return; }
      toast("bad", `<b>Error:</b> ${esc(msg)} <span class="muted small">(try Reload)</span>`);
      if (!INIT_DONE) showFatal(msg);
    }catch{}
  });

    function setBg(tab){ return __gmxSetBg.setBg(tab); }

  function ensurePredictionTabVisible(){ return __gmxNav.ensurePredictionTabVisible(); }

  function showTab(name){ return __gmxNav.showTab(name); }

// Simple info modal (no dependencies)
  function showInfoModal(title, html){
    return __gmxChrome.showInfoModal(title, html);
  }


  function tab(name){
    const nextTab = (name === "_force_home") ? "home" : normalizeTopLevelTab(name);
    // Browsing is always allowed. Actions are gated via requireConnected().
    showTab(nextTab);
    try{ trackEvent("tab_open", { tab: String(nextTab||"") }); }catch(_e){}
  }
  try{ globalThis.__gmxShowTab = tab; }catch(_e){}
  try{ globalThis.switchTab = tab; }catch(_e){}
  ensurePredictionTabVisible();
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click", ()=>tab(b.dataset.tab)));

  function normalizeHandle(input){ return __getGMXAuth().normalizeHandle(input); }

  function getHandle(){ return __getGMXAuth().getHandle(); }

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

  function getToken(){ return __getGMXAuth().getToken(); }

  function isConnected(){ return __getGMXAuth().isConnected(); }
  function requireConnected(target){ return __getGMXAuth().requireConnected(target); }

  
  function isPublicApi(path){ return __getGMXAuth().isPublicApi(path); }

  async function initSession(force=false){ return await __getGMXAuth().initSession(force); }

  async function api(path, method="GET", body, opts={}){ return await __getGMXAuth().api(path, method, body, opts); }

  var __gmxAuthInstance;

  function __getGMXAuth(){
    if (__gmxAuthInstance) return __gmxAuthInstance;
    if (!window.__GMXAuthFactory) throw new Error("GMX auth factory missing");
    __gmxAuthInstance = window.__GMXAuthFactory({
      API,
      LS_HANDLE,
      LS_TOKEN,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
      isLocalDevHost,
      getAdminToken,
      setAuthOk: (v)=>{ AUTH_OK = !!v; },
      $,
      t,
      toast,
      escapeHtml,
      applyAdminVisibility,
      ping,
      setDegraded
    });
    return __gmxAuthInstance;
  }



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


