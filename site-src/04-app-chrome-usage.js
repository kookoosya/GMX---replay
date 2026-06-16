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

    function setBg(tab){
    const safeTab = String(tab || "home");
    const hasWall = document.body.classList.contains("hasWallBg");
    if (hasWall){
      document.documentElement.style.setProperty("--bg", "linear-gradient(180deg, rgba(5,7,15,.12) 0%, rgba(5,7,15,.32) 100%)");
    } else {
      document.documentElement.style.setProperty("--bg", __gmxTabTheme.getTabBg(safeTab));
    }
    applyWallpaper(safeTab);
    applyUserBg(safeTab);
  }

  function ensurePredictionTabVisible(){
    try{
      const tabs = document.querySelector(".tabs");
      if (!tabs) return;
      let btn = document.getElementById("t_prediction");
      if (!btn){
        btn = document.createElement("button");
        btn.className = "tab";
        btn.id = "t_prediction";
        btn.dataset.tab = "prediction";
        btn.textContent = "Prediction Market";
        const before = document.getElementById("t_wallet");
        if (before && before.parentNode === tabs) tabs.insertBefore(btn, before);
        else tabs.appendChild(btn);
      }
      btn.classList.remove("hidden");
      let pane = document.getElementById("tab-prediction");
      if (!pane){
        pane = document.createElement("div");
        pane.id = "tab-prediction";
        pane.className = "hidden";
        pane.innerHTML = `<div class="card"><div class="title">Prediction Market</div><div class="note">Coming soon.</div></div>`;
        tabs.insertAdjacentElement("afterend", pane);
      }
      pane.classList.add("hidden");
    }catch{}
  }

    function showTab(name){
    name = normalizeTopLevelTab(name);
    CURRENT_TAB = name;
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
    TOP_LEVEL_TABS.forEach(k=>{
      const el = document.getElementById("tab-"+k);
      if (el) el.classList.toggle("hidden", k!==name);
    });
    setBg(name);
    try{ localStorage.setItem(LS_LAST_TAB, name); }catch(_e){}
  
    try{ applyLang(); }catch(e){}
    try{ updateLangFlags(); }catch(e){}
    try{ renderWallpaperUI(); }catch(e){}
  
    if (name === "referrals"){
      try{ if (getHandle()) $("refLoad")?.click(); }catch(e){}
    }
    if (name === "leaderboard"){
      try{ bindLeaderboardUI(); }catch(e){}
      try{ loadLeaderboard(LB_DAYS||7); }catch(e){}
    }
    if (name === "prediction"){
      try{ loadPredictionSignals({ force:true }); }catch(e){}
    }
    if (name === "extthemes") {
      try{ renderExtThemes(); }catch(e){}
      try{ renderExtWallpapers(); }catch(e){}
      try{ renderExtCustomBgUI(); }catch(e){}
      try{ setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true }); }catch(e){}
    }
    if (name === "admin"){
      try{ syncAdminUi(); }catch(e){}
    }
    if (name === "wallet"){
      try{ loadPlans(); }catch(e){}
      try{ loadBillingProof(); }catch(e){}
      try{ setSfUi(); }catch(e){}
    }
}

// Simple info modal (no dependencies)
  function showInfoModal(title, html){
    try{
      const old = document.getElementById("gmxInfoModal");
      if (old) old.remove();
      const wrap = document.createElement("div");
      wrap.id = "gmxInfoModal";
      wrap.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;";
      wrap.innerHTML = `
        <div style="max-width:520px;width:100%;background:rgba(20,20,24,.98);border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.5);padding:16px 16px 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <div style="font-weight:800;font-size:15px;line-height:1.2;">${escapeHtml(title||"Info")}</div>
            <button id="gmxInfoClose" type="button" style="border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer;">OK</button>
          </div>
          <div style="font-size:13px;line-height:1.45;color:rgba(255,255,255,.88);">${html||""}</div>
        </div>
      `;
      wrap.addEventListener("click", (e)=>{ if (e.target===wrap) wrap.remove(); });
      document.body.appendChild(wrap);
      const btn = document.getElementById("gmxInfoClose");
      if (btn) btn.onclick = ()=>wrap.remove();
    }catch(e){}
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



  function setApiPillState(state){
    const d = $("apiDot");
    const tEl = $("apiText");
    const active = state === "active";
    if (d) d.classList.toggle("ok", active);
    if (tEl) tEl.textContent = active ? "active" : (state === "offline" ? "offline" : "inactive");
  }

  async function ping(){
    const sessionLive = !!(getHandle() && getToken() && AUTH_OK);
    if (!sessionLive){
      setApiPillState("inactive");
      return;
    }
    try{
      const j = await api("/api/health");
      setApiPillState(j && j.ok ? "active" : "offline");
    }catch{
      setApiPillState("offline");
    }
  }

  // Expose a retry hook for the degraded bar (wired earlier).
  window.__gmxRetryNow = async ()=>{
    try{ await ping(); }catch{}
    // If user already set a handle, try to refresh token silently.
    try{ if (getHandle()) await initSession(true); }catch{}
    // Refresh public panels when possible.
    try{ if (CURRENT_TAB === "wallet"){ await loadPlans(); await loadBillingProof(); } }catch{}
    try{ if (CURRENT_TAB === "referrals"){ scheduleRefStatsRefresh(120); } }catch{}
    try{ if (getHandle()) await refreshUsage(); }catch{}
  };

  window.addEventListener("online", ()=>{ try{ setDegraded(false); window.__gmxRetryNow?.(); }catch{} });

  let BUILD_ID = "";

  async function loadBuild(){
    try{
      const j = await api("/api/version?x=1");
      BUILD_ID = String(j.build || "");
      const b = $("ui_build");
      if (b) b.textContent = BUILD_ID ? ("build " + BUILD_ID) : "";
      const link = document.querySelector('link[rel="stylesheet"]');
      if (link && link.href.includes("BUILD")){
        link.href = "/app.css?v=" + encodeURIComponent(j.build);
      }
    }catch{
      AUTH_OK = false;
      try{ applyAdminVisibility(); }catch{}
    }
  }

  function watchBuildUpdates(){
    // Helps when the wallet/extension updates and the page needs a clean reload.
    let last = BUILD_ID;
    let busy = false;
    setInterval(async ()=>{
      if (busy) return;
      busy = true;
      try{
        const j = await api("/api/version?x=1");
        const now = String(j.build || "");
        if (last && now && now !== last){
          toast("ok", "Update installed. Reloading...");
          setTimeout(()=>{ try{ location.reload(); }catch{} }, 700);
        }
        if (now) last = now;
      }catch(e){}
      busy = false;
    }, 5 * 60 * 1000);
  }


  function normLimitForUI(limit){ return __gmxUsage.normLimitForUI(limit); }
  function setMeter(valId, fillId, used, limit){ return __gmxUsage.setMeter(valId, fillId, used, limit); }

  function renderHelpModal(){ return __gmxHelp.renderHelpModal(); }
  function openHelpModal(){ return __gmxHelp.openHelpModal(); }
  function closeHelpModal(){ return __gmxHelp.closeHelpModal(); }
  function bindHelpModal(){ return __gmxHelp.bindHelpModal(); }

  function applyRefCountEligible(eligible, { renderUnlockUi = false } = {}){
    const num = Math.max(0, Number(eligible || 0) || 0);
    const changed = REF_COUNT !== num;
    REF_COUNT = num;
    try{ localStorage.setItem(LS_REF_ELIGIBLE_CACHE, String(num)); }catch(_e){}
    if ($("refCountPill")) $("refCountPill").textContent = String(num);
    if ($("refCountRight")) $("refCountRight").textContent = String(num);
    if ($("refCountInline")) $("refCountInline").textContent = String(num);
    if ($("refEligibleInline")) $("refEligibleInline").textContent = String(num);
    if (!renderUnlockUi || !changed) return changed;
    try{ renderThemes(); }catch(_e){}
    try{ renderExtThemes(); }catch(_e){}
    try{ fillStyles(); }catch(_e){}
    try{ fillPacks(); }catch(_e){}
    return changed;
  }

  function usageCosmeticSignature(j){ return __gmxUsage.usageCosmeticSignature(j); }

  async function refreshUsage(){ return __gmxUsage.refreshUsage(); }

  function applyAdminVisibility(){
    const h = getHandle();
    const tok = localStorage.getItem(LS_TOKEN) || "";
    // show Admin only after we validated the session in this page load
    const isAdmin = AUTH_OK && (localStorage.getItem(LS_IS_ADMIN) === "1");
    const ta = $("t_admin");
    if (ta) ta.classList.toggle("hidden", !isAdmin);
    if (!isAdmin) document.getElementById("tab-admin")?.classList.add("hidden");
  }


