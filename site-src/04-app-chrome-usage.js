function fillStyles(){
    const unlocked = unlockedStylesCount();
    const fill = (sel)=>{
      if (!sel) return;
      const prev = (sel.value || "classic");
      sel.innerHTML = "";
      STYLES.forEach(([v,label], idx)=>{
        const o = document.createElement("option");
        o.value = v;
        const locked = (!isPro() && idx >= unlocked);
        const need = reqRefsForUnlockIndex(idx, FREE_VISIBLE_STYLES);
        o.textContent = locked ? `${t("locked")||"LOCKED"} (${need} ref)` : label;
        o.disabled = locked;
        sel.appendChild(o);
      });
      // restore previous selection if possible (do NOT reset on every refresh)
      const prevIdx = STYLES.findIndex(x=>x[0]===prev);
      if (prevIdx !== -1 && (isPro() || prevIdx < unlocked)){
        sel.value = prev;
      } else {
        sel.value = STYLES[0][0];
      }
    };
    fill($("gmStyle"));
    fill($("gnStyle"));
    if ($("stylesUnlocked")) $("stylesUnlocked").textContent = `${unlocked}/${STYLES.length}`;
  }

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
      const theme = TAB_THEME[safeTab] || TAB_THEME.home;
      const bg = (typeof theme === "function") ? theme() : theme;
      document.documentElement.style.setProperty("--bg", bg);
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
  function getBestMode(){
    try{ return localStorage.getItem(LS_BEST_ENABLED) === "1"; }catch(_e){ return false; }
  }
  function setBestMode(next, silent){
    const on = !!next;
    try{ localStorage.setItem(LS_BEST_ENABLED, on ? "1" : "0"); }catch(_e){}
    try{ syncBestModeUi(); }catch(_e){}
    if (!silent){
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "best_mode_change" }, "*"); }catch(_e){}
    }
    return on;
  }
  function ensureFreshToggleDefaults(){
    try{
      if (localStorage.getItem(LS_TOGGLES_BOOTSTRAP_V2) === "1") return;
      localStorage.setItem(LS_BEST_ENABLED, "0");
      localStorage.setItem(LS_GM_CLEAN_FILL, "0");
      localStorage.setItem(LS_GN_CLEAN_FILL, "0");
      localStorage.setItem(LS_TOGGLES_BOOTSTRAP_V2, "1");
    }catch(_e){}
  }

  function bestCopyText(){
    return getBestMode()
      ? {
          btn: "Best: live",
          hint: "Best live pulls fresh options, keeps the strongest one, and saves it."
        }
      : {
          btn: "Best: saved",
          hint: "Best uses the strongest line from your saved list."
        };
  }
  function syncBestModeUi(){
    const copy = bestCopyText();
    ["gmBestModeToggle","gnBestModeToggle"].forEach((id)=>{ const el = $(id); if (el) el.textContent = copy.btn; });
    ["gmBestModeHint","gnBestModeHint"].forEach((id)=>{ const el = $(id); if (el) el.textContent = copy.hint; });
    ["gmBestBtn","gnBestBtn"].forEach((id)=>{ const el = $(id); if (el) el.textContent = getBestMode() ? "Best live" : "Best"; });
  }

  ensureFreshToggleDefaults();
  try{ syncBestModeUi(); }catch(_e){}
  try{ syncCleanFillUi(); }catch(_e){}

  // --- Lightweight analytics (no content) ---
  function abVariant(){
    const h = getHandle() || "anon";
    const key = "gmx_ab_paywall_v1_" + h;
    const cached = localStorage.getItem(key);
    if (cached === "A" || cached === "B") return cached;
    // stable hash (fast)
    let x = 5381;
    for (let i=0;i<h.length;i++) x = ((x<<5)+x) + h.charCodeAt(i);
    const v = (Math.abs(x) % 2 === 0) ? "A" : "B";
    localStorage.setItem(key, v);
    return v;
  }

  async function trackEvent(type, meta){
    if (!getToken()){ return; }
    try{
      if (!getHandle()) return;
      await api("/api/event", "POST", { type, meta: meta || {} });
    }catch(_e){}
  }

  // --- Soft paywall modal ---
  function openLimitModal(payload){
    const m = $("limit_modal");
    if (!m) return;
    const v = abVariant();
    const desc = $("limit_modal_desc");
    const hint = $("limit_modal_hint");
    const kind = payload?.kind || "gm";
    const resetAt = payload?.resetAt || "";
    if (desc){
      desc.textContent = (v === "A")
        ? `You reached the free saved-line cap for ${kind.toUpperCase()}. Upgrade to Pro for unlimited saved lines + all cosmetics`
        : `Free saved-line cap reached for ${kind.toUpperCase()}. Pro removes caps and unlocks everything`;
    }
    if (hint){
      hint.textContent = resetAt ? (`Next reset: ${resetAt}`) : "";
    }
    m.classList.remove("hidden");
    trackEvent("upgrade_modal_open", { v, kind, reason: payload?.reason || "limit" });
  }
  function closeLimitModal(){
    const m = $("limit_modal");
    if (m) m.classList.add("hidden");
  }

  function bindLimitModal(){
    const m = $("limit_modal");
    const close = $("limit_modal_close");
    const up = $("limit_modal_upgrade");
    if (m) m.addEventListener("click", (e)=>{ if (e.target === m) closeLimitModal(); });
    if (close) close.onclick = ()=>closeLimitModal();
    if (up) up.onclick = ()=>{
      closeLimitModal();
      // move user to Upgrade Pro tab
      try{ tab("wallet"); }catch{}
      trackEvent("pay_click", { v: abVariant(), source:"paywall_modal" });
    };
  }

  // --- Payment UX state machine ---
  function setPayState(state, hint){
    const box = $("pay_state_box");
    const s1 = $("pay_step_processing");
    const s2 = $("pay_step_confirming");
    const s3 = $("pay_step_verified");
    const h = $("pay_state_hint");
    if (!box || !s1 || !s2 || !s3) return;

    const reset = ()=>{
      [s1,s2,s3].forEach(x=>{
        x.style.opacity = "0.55";
        x.style.borderColor = "var(--border)";
      });
    };
    reset();
    box.classList.remove("hidden");

    const on = (el)=>{
      el.style.opacity = "1";
      el.style.borderColor = "rgba(0,0,0,0.25)";
    };

    if (state === "idle"){
      box.classList.add("hidden");
    } else if (state === "processing"){
      on(s1);
    } else if (state === "confirming"){
      on(s1); on(s2);
    } else if (state === "verified"){
      on(s1); on(s2); on(s3);
    } else if (state === "failed"){
      // show as processing but with hint
      on(s1);
    }
    if (h) h.textContent = hint ? String(hint) : "";
  }

  function openPaySuccess(){
    const m = $("pay_success_modal");
    if (!m) return;
    m.classList.remove("hidden");
  }
  function closePaySuccess(){
    const m = $("pay_success_modal");
    if (m) m.classList.add("hidden");
  }
  function bindPaySuccess(){
    const m = $("pay_success_modal");
    const ok = $("pay_success_ok");
    if (m) m.addEventListener("click", (e)=>{ if (e.target === m) closePaySuccess(); });
    if (ok) ok.onclick = ()=>closePaySuccess();
  }

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


  function normLimitForUI(limit){
    const n = Number(limit);
    if (!Number.isFinite(n)) return Infinity;
    // backend uses a huge number to represent "unlimited" for Pro
    if (n >= 999999) return Infinity;
    return n;
  }

  function setMeter(valId, fillId, used, limit){
    const v = $(valId);
    const f = $(fillId);
    const cap = normLimitForUI(limit);
    if (v) v.textContent = (cap === Infinity) ? `${used}/unlimited` : `${used}/${cap}`;
    if (f){
      const pct = (cap === Infinity) ? 100 : (cap ? Math.min(100, Math.round((used/cap)*100)) : 0);
      f.style.width = pct + "%";
    }
  }

function renderHelpModal(){
  const gmSaved = Number(LAST_SAVED.gm ?? 0) || 0;
  const gnSaved = Number(LAST_SAVED.gn ?? 0) || 0;
  const gmUsed = Number(LAST_USAGE?.gm?.used ?? 0) || 0;
  const gnUsed = Number(LAST_USAGE?.gn?.used ?? 0) || 0;
  const gmLimit = normLimitForUI(LAST_USAGE?.gm?.limit ?? 70);
  const gnLimit = normLimitForUI(LAST_USAGE?.gn?.limit ?? 70);

  const savedEl = $("help_saved");
  if (savedEl) savedEl.textContent = isPro() ? `GM ${gmSaved}/unlimited • GN ${gnSaved}/unlimited` : `GM ${gmSaved}/${SAVE_CAP_FREE} • GN ${gnSaved}/${SAVE_CAP_FREE}`;

  const dailyEl = $("help_daily");
  if (dailyEl) dailyEl.textContent = (isPro() || gmLimit===Infinity || gnLimit===Infinity)
    ? `GM ${gmUsed}/unlimited • GN ${gnUsed}/unlimited`
    : `GM ${gmUsed}/${gmLimit} • GN ${gnUsed}/${gnLimit}`;

  // aggregate bars
  const savedFill = $("helpSavedFill");
  if (savedFill){
    if (isPro()) savedFill.style.width = "100%";
    else{
      const used = gmSaved + gnSaved;
      const cap = SAVE_CAP_FREE * 2;
      savedFill.style.width = Math.min(100, Math.round((used/cap)*100)) + "%";
    }
  }
  const dailyFill = $("helpDailyFill");
  if (dailyFill){
    if (isPro() || gmLimit===Infinity || gnLimit===Infinity) dailyFill.style.width = "100%";
    else{
      const used = gmUsed + gnUsed;
      const cap = (gmLimit + gnLimit) || 140;
      dailyFill.style.width = Math.min(100, Math.round((used/cap)*100)) + "%";
    }
  }
}

function openHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  try{ renderHelpModal(); }catch{}
  m.classList.remove("hidden");
}
function closeHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  m.classList.add("hidden");
}

function bindHelpModal(){
  const m = $("help_modal");
  if (!m) return;
  m.addEventListener("click", (e)=>{ if (e.target === m) closeHelpModal(); });

  const closeBtn = $("help_close");
  if (closeBtn) closeBtn.onclick = ()=>closeHelpModal();

  const goWallet = $("help_go_wallet");
  if (goWallet) goWallet.onclick = ()=>{ closeHelpModal(); tab("wallet"); };

  const openBtn = $("btnHelp");
  if (openBtn) openBtn.onclick = ()=>openHelpModal();

  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && !$("help_modal")?.classList.contains("hidden")) closeHelpModal();
    if (e.key === "?" && ($("help_modal")?.classList.contains("hidden"))) openHelpModal();
  });
}

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

  function usageCosmeticSignature(j){
    const eligible = Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0;
    const tier = String(j?.sub?.tier || j?.sub?.plan || "");
    const active = j?.sub?.active ? "1" : "0";
    return `${active}|${tier}|${eligible}|${SAVE_CAP_FREE}`;
  }

async function refreshUsage(){
    if (!getToken()){ return; }
    const h = getHandle();
    if (!h) return;
    try{
      const j = await api("/api/usage");
      AUTH_OK = true;
      applyAdminVisibility();

      const fallbackFree = Number(j?.limits?.freeDaily ?? 70) || 70;
      // Keep Free saved-lines cap in sync with backend config (no UI hardcodes)
      const cap = Number(j?.limits?.saveCapFree ?? SAVE_CAP_FREE) || SAVE_CAP_FREE;
      SAVE_CAP_FREE = Math.max(10, Math.min(1000, cap));
      const gm = j.gm || { used:0, limit:fallbackFree };
            const gn = j.gn || { used:0, limit:fallbackFree };

      LAST_USAGE = { gm, gn, resetAt: j.resetAt || null };

      SUB = j.sub || null;
      renderWalletStatus(j.sub);

      applyRefCountEligible(Number(j?.limits?.referralUnlocks?.eligible ?? 0) || 0, { renderUnlockUi: true });

      const gmCapUI = normLimitForUI(gm.limit);
      const gnCapUI = normLimitForUI(gn.limit);
      const up = $("usedPill");
      if (up) up.textContent = (isPro() || gmCapUI===Infinity || gnCapUI===Infinity)
        ? `GM ${gm.used}/unlimited • GN ${gn.used}/unlimited`
        : `GM ${gm.used}/${gmCapUI} • GN ${gn.used}/${gnCapUI}`;

      // Header status pills
      try{
        const pp = $("planPill");
        if (pp) pp.textContent = isPro() ? "Pro" : "Free";
        const sp = $("syncPill");
        if (sp) {
          const d = new Date();
          sp.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
      }catch(_e){}

      // meters (optional)
      setMeter("gmDailyVal","gmDailyFill", gm.used, gm.limit);
      setMeter("gnDailyVal","gnDailyFill", gn.used, gn.limit);

      const gmu = $("kGmUsed");
      if (gmu) gmu.textContent = String(gm.used);
      const gnu = $("kGnUsed");
      if (gnu) gnu.textContent = String(gn.used);

      const ra = $("kResetAt");
      if (ra) ra.textContent = j.resetAt || "-";

      const cosmeticSig = usageCosmeticSignature(j);
      if (cosmeticSig !== LAST_USAGE_COSMETIC_SIG){
        LAST_USAGE_COSMETIC_SIG = cosmeticSig;
        fillStyles();
        fillPacks();
        try{ window.__syncProControls && window.__syncProControls(); }catch(e){}
        applyUserBg();
        initWallpapers();
        renderThemes();
        initExtWallpaperControls();
        normalizeStoredExtWallpaperSelections();
        renderExtThemes();
        renderExtWallpapers();
        renderExtCustomBgUI();
        setExtView(normalizeExtViewValue(localStorage.getItem(LS_EXT_VIEW)||"theme"), { force:true, silent:true });
      }

      try{ scheduleRefStatsRefresh(120); }catch(e){}

      try{ if (!$("help_modal")?.classList.contains("hidden")) renderHelpModal(); }catch(_e){}
    }catch(e){
      AUTH_OK = false;
      try{ applyAdminVisibility(); }catch(_e){}
    }
  }

  function applyAdminVisibility(){
    const h = getHandle();
    const tok = localStorage.getItem(LS_TOKEN) || "";
    // show Admin only after we validated the session in this page load
    const isAdmin = AUTH_OK && (localStorage.getItem(LS_IS_ADMIN) === "1");
    const ta = $("t_admin");
    if (ta) ta.classList.toggle("hidden", !isAdmin);
    if (!isAdmin) document.getElementById("tab-admin")?.classList.add("hidden");
  }


