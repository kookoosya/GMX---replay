(function (window) {
  if (window.__GMXPaywallFactory) return;

  window.__GMXPaywallFactory = function createGMXPaywall(ctx) {
    const $ = typeof ctx.$ === "function" ? ctx.$ : () => null;
    const modals = ctx && ctx.modals ? ctx.modals : null;
    const storage = ctx && ctx.storage ? ctx.storage : {};
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const siteTr = typeof ctx.siteTr === "function" ? ctx.siteTr : (_k, fb) => String(fb || "");
    const getSiteLocale =
      typeof ctx.getSiteLocale === "function"
        ? ctx.getSiteLocale
        : () => {
            try {
              return localStorage.getItem("gmx_site_lang") || "en";
            } catch {
              return "en";
            }
          };
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

    function normalizePayHandle(raw) {
      const h = String(raw || "").trim();
      if (!h) return "";
      return h.startsWith("@") ? h : `@${h.replace(/^@+/, "")}`;
    }

    function formatPaidUntil(iso) {
      const value = String(iso || "").trim();
      if (!value) return "";
      try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString(getSiteLocale(), {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return "";
      }
    }

    function setRowVisible(rowEl, visible) {
      if (!rowEl) return;
      if (rowEl.classList && typeof rowEl.classList.toggle === "function") {
        rowEl.classList.toggle("hidden", !visible);
      }
      const parts = String(rowEl.className || "")
        .split(/\s+/)
        .filter(Boolean)
        .filter((x) => x !== "hidden");
      rowEl.className = visible ? parts.join(" ") : `${parts.join(" ")} hidden`.trim();
    }

    function openPaySuccess(payload) {
      const data = payload && typeof payload === "object" ? payload : null;
      const sub = data?.sub || null;
      if (!sub?.active) return;

      const title = $("pay_success_title");
      const handleEl = $("pay_success_handle");
      const planLabelEl = $("pay_success_plan_label");
      const planEl = $("pay_success_plan");
      const planRow = $("pay_success_plan_row");
      const untilLabelEl = $("pay_success_until_label");
      const untilEl = $("pay_success_until");
      const untilRow = $("pay_success_until_row");
      const readyEl = $("pay_success_ready");

      if (title) title.textContent = siteTr("pay_success_title", "Pro activated");
      if (planLabelEl) planLabelEl.textContent = siteTr("pay_success_plan_label", "Plan");
      if (untilLabelEl) untilLabelEl.textContent = siteTr("pay_success_until_label", "Active until");
      if (readyEl) readyEl.textContent = siteTr("pay_success_ready", "Your Pro access is ready.");

      const handle = normalizePayHandle(data.handle || getHandle());
      if (handleEl) handleEl.textContent = handle;

      const planLabel = String(data.planLabel || "").trim();
      if (planEl) planEl.textContent = planLabel;
      setRowVisible(planRow, !!planLabel);

      if (sub.isUnlimited) {
        if (untilEl) untilEl.textContent = siteTr("pay_success_unlimited", "Unlimited");
        setRowVisible(untilRow, true);
      } else {
        const untilFormatted = formatPaidUntil(sub.paidUntil);
        if (untilEl) untilEl.textContent = untilFormatted;
        setRowVisible(untilRow, !!untilFormatted);
      }

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
      normalizePayHandle,
      formatPaidUntil,
    };
  };
})(window);
