(function (global) {
  if (global.__GMXAuthFactory) return;
  global.__GMXAuthFactory = function createGMXAuth(ctx) {
    const {
      API,
      LS_HANDLE,
      LS_TOKEN,
      LS_IS_ADMIN,
      LS_ADMIN_CLAIMABLE,
      isLocalDevHost,
      getAdminToken,
      setAuthOk,
      $,
      t,
      toast,
      escapeHtml,
      applyAdminVisibility,
      ping,
      setDegraded
    } = ctx;

    function normalizeHandle(input){
        let t = String(input||"").trim();
        if (!t) return "";
        t = t.replace(/^https?:\/\/(www\.)?x\.com\//i, "");
        t = t.replace(/^https?:\/\/(www\.)?twitter\.com\//i, "");
        t = t.replace(/^@+/, "");
        t = t.replace(/[^a-zA-Z0-9_]/g, "");
        t = t.slice(0, 15);
        return t ? "@" + t : "";
      }

    function getHandle(){ return localStorage.getItem(LS_HANDLE) || ""; }

    function getToken(){ return localStorage.getItem(LS_TOKEN) || ""; }

    function isConnected(){
        // "Always online" = handle is bound. Token may refresh silently.
        return !!getHandle();
      }

    function requireConnected(target){
        if (isConnected()) return true;
        const cm = $("connectMsg");
        const warnHtml = t("connect_warn_html") || '<span class="warn">Connect your @handle to continue.</span>';
        if (cm) cm.innerHTML = warnHtml;
    
        const tpl = t("connect_toast_html") || 'Connect your @handle first to use <b>{feature}</b>.';
        const feat = escapeHtml(target || (t("this_feature") || "this feature"));
        toast("warn", tpl.replace("{feature}", feat));
    
        const hi = $("xHandle");
        if (hi){
          hi.focus();
          try{ hi.scrollIntoView({ block:"center", behavior:"smooth" }); }catch{}
        }
        return false;
      }

    function isPublicApi(path){
        return (
          path.startsWith("/api/health") ||
          path.startsWith("/api/version") ||
          path.startsWith("/api/user/init") ||
          path.startsWith("/api/billing/plans") ||
          path.startsWith("/api/billing/proof") ||
          path.startsWith("/api/config") ||
          path.startsWith("/api/event") ||
          path.startsWith("/api/public/")
        );
      }

    async function initSession(force=false){
        const handle = getHandle();
        if (!handle) return null;
        if (!force && getToken()) {
        setAuthOk(true);
        try{ applyAdminVisibility(); }catch{}
        return getToken();
      }
        try{
          const params = new URLSearchParams(location.search);
          const ref = params.get("ref") || "";
          const r = await fetch(API + "/api/user/init", {
            method: "POST",
            headers: { "Content-Type":"application/json" },
            body: JSON.stringify({ handle, ref, devReset: (force && isLocalDevHost()) ? 1 : 0 })
          });
          const j = await r.json().catch(()=>({}));
          if (!r.ok || !j.token) throw new Error(j.error_code || j.error || "init_failed");
          try{ localStorage.setItem(LS_HANDLE, j.handle || handle); }catch{}
          try{ localStorage.setItem(LS_TOKEN, j.token); }catch{}
          try{ $("handlePill").textContent = j.handle || handle; }catch{}
          try{ localStorage.setItem(LS_IS_ADMIN, j.isAdmin ? "1" : "0"); }catch{}
          try{ localStorage.setItem(LS_ADMIN_CLAIMABLE, j.adminClaimable ? "1" : "0"); }catch{}
          setAuthOk(true);
          try{ applyAdminVisibility(); }catch{}
          try{ ping(); }catch{}
          return j.token;
        }catch(e){
          setAuthOk(false);
          try{ applyAdminVisibility(); }catch{}
          try{ ping(); }catch{}
          return null;
        }
      }

    async function api(path, method="GET", body, opts={}){
        // STRICT MODE: never call protected endpoints until @handle is connected.
        if (!getHandle() && path.startsWith("/api/") && !isPublicApi(path)){
          throw new Error("not_connected");
        }
    
        const timeoutMs = Number(opts.timeoutMs || 20000);
    
        let lastErr = null;
    
        for (let attempt = 0; attempt < 2; attempt++){
          const headers = { "Content-Type":"application/json" };
          const tok = getToken();
          if (tok) headers["Authorization"] = "Bearer " + tok;
          // Allow caller-specified extra headers
          if (opts.headers && typeof opts.headers === "object"){
            try{
              for (const k of Object.keys(opts.headers)){
                const v = opts.headers[k];
                if (v != null) headers[k] = String(v);
              }
            }catch(_e){}
          }
    
          // Admin API: pass session token via header
          if (path.startsWith("/api/admin/")){
            const at = getAdminToken();
            if (at) headers["X-Admin-Token"] = at;
          }
    
          const controller = new AbortController();
          const timer = setTimeout(()=>controller.abort("timeout"), timeoutMs);
    
          // Allow caller to pass an external signal (for cancel on tab change/clear)
          if (opts.signal){
            try{
              if (opts.signal.aborted) controller.abort("aborted");
              else opts.signal.addEventListener("abort", ()=>controller.abort("aborted"), { once:true });
            }catch{}
          }
    
          try{
            const r = await fetch(API + path, {
              method,
              headers,
              body: body ? JSON.stringify(body) : null,
              signal: controller.signal
            });
    
            const ct = (r.headers.get("content-type")||"").toLowerCase();
    
            if (ct.includes("application/json")){
              const j = await r.json().catch(()=>({}));
              if (!r.ok){
                const is401 = (r.status === 401 || j.error === "unauthorized");
                // One silent refresh + retry (only when handle exists and endpoint is not init)
                if (is401 && attempt === 0 && tok && getHandle() && !path.startsWith("/api/user/init") && !path.startsWith("/api/admin/")){
                  try{ localStorage.removeItem(LS_TOKEN); }catch{}
                  setAuthOk(false);
                  try{ applyAdminVisibility(); }catch{}
                  await initSession(true);
                  continue;
                }
                if (is401 && tok && !path.startsWith("/api/admin/")){
                  try{ localStorage.removeItem(LS_TOKEN); }catch{}
                  setAuthOk(false);
                  try{ applyAdminVisibility(); }catch{}
                }
                throw new Error(j.error || "request_failed");
              }
              try{ setDegraded(false); }catch{}
              return j;
            } else {
              const rawText = await r.text().catch(()=> "");
              if (!r.ok) throw new Error(rawText || ("http_"+r.status));
              try{ setDegraded(false); }catch{}
              return { ok:true, text: rawText };
            }
          } catch (e){
            if (String(e?.name||"") === "AbortError" || String(e) === "timeout" || String(e) === "aborted"){
              lastErr = new Error("timeout");
            } else {
              lastErr = e;
            }
    
            // Network-style failures -> enter degraded mode (UI stays usable).
            try{
              const msg = String(lastErr?.message || lastErr || "");
              const net = (msg === "timeout") || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("fetch") || msg.includes("ECONN");
              if (net) setDegraded(true, msg === "timeout" ? "API timeout. You can still edit lists locally." : "API is unreachable. You can still edit lists locally.");
            }catch{}
          } finally {
            clearTimeout(timer);
          }
    
          if (lastErr && lastErr.message === "timeout") throw lastErr;
        }
    
        throw lastErr || new Error("request_failed");
      }

    return {
      normalizeHandle,
      getHandle,
      getToken,
      isConnected,
      requireConnected,
      isPublicApi,
      initSession,
      api,
    };
  };
})(window);
