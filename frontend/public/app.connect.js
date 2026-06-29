(function (window) {
  if (window.__GMXConnectFactory) return;

  window.__GMXConnectFactory = function createGMXConnect(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const friendlyUiErrorMessage =
      typeof ctx.friendlyUiErrorMessage === "function" ? ctx.friendlyUiErrorMessage : (m) => m;
    const normalizeHandle =
      typeof ctx.normalizeHandle === "function" ? ctx.normalizeHandle : (v) => String(v || "").trim();
    const setAuthOk = typeof ctx.setAuthOk === "function" ? ctx.setAuthOk : () => {};
    const applyAdminVisibility =
      typeof ctx.applyAdminVisibility === "function" ? ctx.applyAdminVisibility : () => {};
    const refreshUsage = typeof ctx.refreshUsage === "function" ? ctx.refreshUsage : async () => {};
    const loadPlans = typeof ctx.loadPlans === "function" ? ctx.loadPlans : async () => {};
    const ping = typeof ctx.ping === "function" ? ctx.ping : () => {};
    const invalidatePendingSessionInit =
      typeof ctx.invalidatePendingSessionInit === "function"
        ? ctx.invalidatePendingSessionInit
        : () => {};
    const referralPending = ctx.referralPending || null;
    const tr = typeof ctx.tr === "function" ? ctx.tr : (key) => String(key || "");
    let connectFallbackGeneration = 0;
    const beginSessionGeneration =
      typeof ctx.beginSessionGeneration === "function"
        ? ctx.beginSessionGeneration
        : () => {
            connectFallbackGeneration += 1;
            return connectFallbackGeneration;
          };
    const isSessionGenerationCurrent =
      typeof ctx.isSessionGenerationCurrent === "function"
        ? ctx.isSessionGenerationCurrent
        : () => true;
    const keys = ctx.keys || {};

    let tryInflight = false;
    let tryLastText = "";

    function showConnectMsg(cm, kind, key) {
      if (!cm) return;
      const cls = kind === "ok" ? "ok" : kind === "bad" ? "bad" : "muted";
      cm.innerHTML = `<span class="${cls}">${escapeHtml(tr(key))}</span>`;
    }

    function renderPendingConnectHint() {
      if (!referralPending) return;
      const pending = referralPending.readPending();
      if (!pending) return;
      showConnectMsg($("connectMsg"), "muted", "ref_capture_pending");
    }

    async function runHomeTry(kind) {
      if (tryInflight) return;
      const safeKind = kind === "gn" ? "gn" : "gm";
      const out = $("homeTryOut");
      const copyBtn = $("home_try_copy");
      tryInflight = true;
      if (out) out.textContent = tr("home_try_loading");
      try {
        const j = await api(`/api/public/random-bulk?kind=${safeKind}&mode=mid&count=3`);
        const lines = Array.isArray(j && j.list) ? j.list.map((x) => String(x || "").trim()).filter(Boolean) : [];
        tryLastText = lines.join("\n");
        if (out) out.textContent = tryLastText || tr("home_try_empty");
        if (copyBtn) copyBtn.classList.toggle("hidden", !tryLastText);
      } catch (e) {
        tryLastText = "";
        if (out) {
          out.textContent = friendlyUiErrorMessage(e.message || "request_failed", { scope: "connect" });
        }
        if (copyBtn) copyBtn.classList.add("hidden");
      } finally {
        tryInflight = false;
      }
    }

    async function copyHomeTry() {
      if (!tryLastText) return;
      try {
        await navigator.clipboard.writeText(tryLastText);
        const cm = $("connectMsg");
        if (cm) cm.innerHTML = `<span class="ok">${escapeHtml(tr("toast_copied"))}</span>`;
      } catch {
        const cm = $("connectMsg");
        if (cm) cm.innerHTML = `<span class="bad">${escapeHtml(tr("toast_copy_failed"))}</span>`;
      }
    }

    function bindConnect() {
      if (referralPending) {
        referralPending.onStorageSync(() => {
          try {
            renderPendingConnectHint();
          } catch (_e) {}
        });
        renderPendingConnectHint();
      }

      const connectBtn = $("btnConnect");
      if (connectBtn) {
        connectBtn.onclick = async () => {
          const cm = $("connectMsg");
          if (cm) cm.textContent = "";

          const xh = $("xHandle");
          const handle = normalizeHandle(xh?.value);
          if (!handle) {
            if (cm) cm.innerHTML = '<span class="bad">Enter a valid @handle</span>';
            return;
          }

          const ref = referralPending
            ? referralPending.resolveRefForInit(location.search)
            : new URLSearchParams(location.search).get("ref") || "";

          const connectGeneration = beginSessionGeneration();

          try {
            const j = await api("/api/user/init", "POST", { handle, ref: ref || undefined });
            if (!isSessionGenerationCurrent(connectGeneration)) return;

            localStorage.setItem(keys.handle || "gmx_handle", j.handle);
            localStorage.setItem(keys.token || "gmx_token", j.token);
            try {
              localStorage.setItem(keys.isAdmin || "gmx_is_admin", j.isAdmin ? "1" : "0");
            } catch (_e) {}
            try {
              localStorage.setItem(keys.adminClaimable || "gmx_admin_claimable", j.adminClaimable ? "1" : "0");
            } catch (_e) {}

            const hp = $("handlePill");
            if (hp) hp.textContent = j.handle;
            const rl = $("refLink");
            if (rl) rl.value = j.refLink || "";
            if (cm) cm.innerHTML = "";
            if (referralPending && ref) referralPending.onInitSuccess(ref);

            try {
              localStorage.removeItem(keys.forceLogout || "gmx_force_logout");
            } catch (_e) {}
            try {
              localStorage.removeItem(keys.forceLogoutV2 || "gmx_force_logout_v2");
            } catch (_e) {}
            try {
              window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_connect" }, "*");
            } catch (_e) {}
            setAuthOk(true);
            try {
              ping();
            } catch (_e) {}

            applyAdminVisibility();
            await refreshUsage();
            await loadPlans();

            const params = new URLSearchParams(location.search);
            const code = params.get("code");
            if (code) {
              const rc = $("redeemCode");
              if (rc) rc.value = code;
            }
          } catch (e) {
            if (!isSessionGenerationCurrent(connectGeneration)) return;
            if (referralPending && ref) {
              showConnectMsg(cm, "bad", "ref_connect_retry");
            } else if (cm) {
              cm.innerHTML =
                '<span class="bad">Connect error: ' +
                escapeHtml(
                  friendlyUiErrorMessage(e.message || "request_failed", { scope: "connect" })
                ) +
                "</span>";
            }
          }
        };
      }

      const btnTryGm = $("homeTryGm");
      const btnTryGn = $("homeTryGn");
      const btnTryCopy = $("home_try_copy");
      if (btnTryGm) btnTryGm.onclick = () => void runHomeTry("gm");
      if (btnTryGn) btnTryGn.onclick = () => void runHomeTry("gn");
      if (btnTryCopy) btnTryCopy.onclick = () => void copyHomeTry();

      const resetBtn = $("btnReset");
      if (resetBtn) {
        resetBtn.onclick = async () => {
          invalidatePendingSessionInit();
          const xh = $("xHandle");
          try {
            localStorage.removeItem(keys.handle || "gmx_handle");
          } catch (_e) {}
          try {
            localStorage.removeItem(keys.token || "gmx_token");
          } catch (_e) {}
          try {
            localStorage.removeItem(keys.isAdmin || "gmx_is_admin");
          } catch (_e) {}
          try {
            localStorage.removeItem(keys.adminClaimable || "gmx_admin_claimable");
          } catch (_e) {}
          try {
            localStorage.removeItem("gmx_ui_tmp");
          } catch (_e) {}

          const hp = $("handlePill");
          if (hp) hp.textContent = "not set";
          const cm = $("connectMsg");
          if (cm) cm.innerHTML = '<span class="ok">Session cleared.</span>';
          setAuthOk(false);
          try {
            localStorage.setItem(keys.forceLogout || "gmx_force_logout", String(Date.now()));
          } catch (_e) {}
          try {
            localStorage.setItem(keys.forceLogoutV2 || "gmx_force_logout_v2", String(Date.now()));
          } catch (_e) {}
          try {
            window.postMessage({ type: "GMX_SYNC_NOW", reason: "site_reset" }, "*");
          } catch (_e) {}
          try {
            await api("/api/user/logout", "POST", null, { timeoutMs: 3000 });
          } catch (_e) {}
          try {
            ping();
          } catch (_e) {}
          applyAdminVisibility();
          try {
            refreshUsage();
          } catch (_e) {}
          try {
            loadPlans();
          } catch (_e) {}
          try {
            renderPendingConnectHint();
          } catch (_e) {}
          if (xh) {
            try {
              xh.focus();
            } catch (_e) {}
          }
        };
      }
    }

    return { bindConnect, renderPendingConnectHint };
  };
})(window);
