  // ----- Connect -----
  const connectBtn = $("btnConnect");
  if (connectBtn) connectBtn.onclick = async ()=>{
    const cm = $("connectMsg");
    if (cm) cm.textContent = "";
    const xh = $("xHandle");
    const handle = normalizeHandle(xh?.value);
    if (!handle){
      if (cm) cm.innerHTML = '<span class="bad">Enter a valid @handle</span>';
      return;
    }

    const params = new URLSearchParams(location.search);
    const ref = params.get("ref") || "";

    try{
      const j = await api("/api/user/init", "POST", { handle, ref });
      localStorage.setItem(LS_HANDLE, j.handle);
      localStorage.setItem(LS_TOKEN, j.token);
      try{ localStorage.setItem(LS_IS_ADMIN, j.isAdmin ? "1" : "0"); }catch{}
      try{ localStorage.setItem(LS_ADMIN_CLAIMABLE, j.adminClaimable ? "1" : "0"); }catch{}

      const hp = $("handlePill");
      if (hp) hp.textContent = j.handle;
      const rl = $("refLink");
      if (rl) rl.value = j.refLink || "";
      if (cm) cm.innerHTML = '';
      try{ localStorage.removeItem(LS_FORCE_LOGOUT); }catch{}
      try{ localStorage.removeItem(LS_FORCE_LOGOUT_V2); }catch{}
      try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_connect" }, "*"); }catch(_e){}
      AUTH_OK = true;
      try{ ping(); }catch{}

      applyAdminVisibility();
      await refreshUsage();
      await loadPlans();

      const code = params.get("code");
      if (code){
        const rc = $("redeemCode");
        if (rc) rc.value = code;
      }
    }catch(e){
      if (cm) cm.innerHTML = '<span class="bad">Connect error: ' + escapeHtml(friendlyUiErrorMessage(e.message || "request_failed", { scope:"connect" })) + '</span>';
    }
  };

  const resetBtn = $("btnReset");
  if (resetBtn) resetBtn.onclick = async ()=>{
    const xh = $("xHandle");
    try{ localStorage.removeItem(LS_HANDLE); }catch{}
    try{ localStorage.removeItem(LS_TOKEN); }catch{}
    try{ localStorage.removeItem(LS_IS_ADMIN); }catch{}
    try{ localStorage.removeItem(LS_ADMIN_CLAIMABLE); }catch{}
    try{ localStorage.removeItem("gmx_ui_tmp"); }catch{}

    const hp = $("handlePill");
    if (hp) hp.textContent = "not set";
    const cm = $("connectMsg");
    if (cm) cm.innerHTML = '<span class="ok">Session cleared.</span>';
    AUTH_OK = false;
    try{ localStorage.setItem(LS_FORCE_LOGOUT, String(Date.now())); }catch{}
    try{ localStorage.setItem(LS_FORCE_LOGOUT_V2, String(Date.now())); }catch{}
    try{ window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_reset" }, "*"); }catch(_e){}
    try{ ping(); }catch{}
    applyAdminVisibility();
    try{ refreshUsage(); }catch{}
    try{ loadPlans(); }catch{}
    if (xh){
      try{ xh.focus(); }catch{}
    }
  };

})();
