(function (window) {
  if (window.__GMXPaywallFactory) return;

  window.__GMXPaywallFactory = function createGMXPaywall(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const modals = ctx && ctx.modals ? ctx.modals : null;
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const trackEvent = typeof ctx.trackEvent === "function" ? ctx.trackEvent : async () => {};
    const onNavigateWallet = typeof ctx.onNavigateWallet === "function" ? ctx.onNavigateWallet : () => {};

    function openModal(id) {
      if (modals && typeof modals.openModal === "function") modals.openModal(id);
      else {
        const m = $(id);
        if (m) m.classList.remove("hidden");
      }
    }

    function closeModal(id) {
      if (modals && typeof modals.closeModal === "function") modals.closeModal(id);
      else {
        const m = $(id);
        if (m) m.classList.add("hidden");
      }
    }

    function bindBackdrop(id, closeFn) {
      if (modals && typeof modals.bindBackdrop === "function") modals.bindBackdrop(id, closeFn);
      else {
        const m = $(id);
        if (m) m.addEventListener("click", (e) => { if (e.target === m) closeFn(); });
      }
    }

    function abVariant() {
      const h = getHandle() || "anon";
      const key = "gmx_ab_paywall_v1_" + h;
      const cached = storage.lsGet(key, "");
      if (cached === "A" || cached === "B") return cached;
      let x = 5381;
      for (let i = 0; i < h.length; i++) x = (x << 5) + x + h.charCodeAt(i);
      const v = Math.abs(x) % 2 === 0 ? "A" : "B";
      storage.lsSet(key, v);
      return v;
    }

    function openLimitModal(payload) {
      const m = $("limit_modal");
      if (!m) return;
      const v = abVariant();
      const desc = $("limit_modal_desc");
      const hint = $("limit_modal_hint");
      const kind = payload?.kind || "gm";
      const resetAt = payload?.resetAt || "";
      if (desc) {
        desc.textContent =
          v === "A"
            ? `You reached the free saved-line cap for ${kind.toUpperCase()}. Upgrade to Pro for unlimited saved lines + all cosmetics`
            : `Free saved-line cap reached for ${kind.toUpperCase()}. Pro removes caps and unlocks everything`;
      }
      if (hint) hint.textContent = resetAt ? `Next reset: ${resetAt}` : "";
      openModal("limit_modal");
      trackEvent("upgrade_modal_open", { v, kind, reason: payload?.reason || "limit" });
    }

    function closeLimitModal() {
      closeModal("limit_modal");
    }

    function bindLimitModal() {
      bindBackdrop("limit_modal", closeLimitModal);
      const close = $("limit_modal_close");
      const up = $("limit_modal_upgrade");
      if (close) close.onclick = () => closeLimitModal();
      if (up) {
        up.onclick = () => {
          closeLimitModal();
          onNavigateWallet();
          trackEvent("pay_click", { v: abVariant(), source: "paywall_modal" });
        };
      }
    }

    function setPayState(state, hint) {
      const box = $("pay_state_box");
      const s1 = $("pay_step_processing");
      const s2 = $("pay_step_confirming");
      const s3 = $("pay_step_verified");
      const h = $("pay_state_hint");
      if (!box || !s1 || !s2 || !s3) return;

      const reset = () => {
        [s1, s2, s3].forEach((x) => {
          x.style.opacity = "0.55";
          x.style.borderColor = "var(--border)";
        });
      };
      reset();
      box.classList.remove("hidden");

      const on = (el) => {
        el.style.opacity = "1";
        el.style.borderColor = "rgba(88,246,181,.45)";
      };

      if (state === "processing") on(s1);
      else if (state === "confirming") {
        on(s1);
        on(s2);
      } else if (state === "verified") {
        on(s1);
        on(s2);
        on(s3);
      } else if (state === "failed") {
        on(s1);
      }
      if (h) h.textContent = hint ? String(hint) : "";
    }

    function openPaySuccess() {
      openModal("pay_success_modal");
    }

    function closePaySuccess() {
      closeModal("pay_success_modal");
    }

    function bindPaySuccess() {
      bindBackdrop("pay_success_modal", closePaySuccess);
      const ok = $("pay_success_ok");
      if (ok) ok.onclick = () => closePaySuccess();
    }

    return {
      abVariant,
      openLimitModal,
      closeLimitModal,
      bindLimitModal,
      setPayState,
      openPaySuccess,
      closePaySuccess,
      bindPaySuccess,
    };
  };
})(window);
