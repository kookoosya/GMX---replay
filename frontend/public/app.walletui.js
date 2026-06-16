(function (window) {
  if (window.__GMXWalletUiFactory) return;

  window.__GMXWalletUiFactory = function createGMXWalletUi(ctx) {
    ctx = ctx || {};
    const $ = typeof ctx.$ === "function" ? ctx.$ : (id) => document.getElementById(id);
    const escapeHtml = typeof ctx.escapeHtml === "function" ? ctx.escapeHtml : (s) => String(s || "");
    const api = typeof ctx.api === "function" ? ctx.api : async () => ({});
    const modals = ctx.modals || {};
    const toast = typeof ctx.toast === "function" ? ctx.toast : () => {};
    const trackEvent = typeof ctx.trackEvent === "function" ? ctx.trackEvent : () => {};
    const abVariant = typeof ctx.abVariant === "function" ? ctx.abVariant : () => "a";
    const friendlyUiErrorMessage =
      typeof ctx.friendlyUiErrorMessage === "function" ? ctx.friendlyUiErrorMessage : (m) => m;
    const setPayState = typeof ctx.setPayState === "function" ? ctx.setPayState : () => {};
    const openPaySuccess = typeof ctx.openPaySuccess === "function" ? ctx.openPaySuccess : () => {};
    const getHandle = typeof ctx.getHandle === "function" ? ctx.getHandle : () => "";
    const refreshUsage = typeof ctx.refreshUsage === "function" ? ctx.refreshUsage : async () => {};
    const walletChoiceKey = ctx.walletChoiceKey || "gmx_wallet_choice";
    const wsChain = ctx.wsChain || "solana:mainnet";
    const listWalletChoices =
      typeof ctx.listWalletChoices === "function" ? ctx.listWalletChoices : () => [];
    const walletNameKey =
      typeof ctx.walletNameKey === "function" ? ctx.walletNameKey : (n) => String(n || "").toLowerCase();
    const safeIconSrc = typeof ctx.safeIconSrc === "function" ? ctx.safeIconSrc : (i) => String(i || "");
    const defaultWalletIcon =
      typeof ctx.defaultWalletIcon === "function" ? ctx.defaultWalletIcon : () => "";
    const shortPk = typeof ctx.shortPk === "function" ? ctx.shortPk : (pk) => String(pk || "");
    const planPricePrimary =
      typeof ctx.planPricePrimary === "function" ? ctx.planPricePrimary : () => "";
    const planPriceSecondary =
      typeof ctx.planPriceSecondary === "function" ? ctx.planPriceSecondary : () => "";
    const getBilling = typeof ctx.getBilling === "function" ? ctx.getBilling : () => ({ plans: [] });
    const setBilling = typeof ctx.setBilling === "function" ? ctx.setBilling : () => {};
    const getSelectedCurrency = typeof ctx.getSelectedCurrency === "function" ? ctx.getSelectedCurrency : () => "SOL";
    const setSelectedCurrency =
      typeof ctx.setSelectedCurrency === "function" ? ctx.setSelectedCurrency : () => {};
    const getSelectedPlanKey = typeof ctx.getSelectedPlanKey === "function" ? ctx.getSelectedPlanKey : () => "";
    const setSelectedPlanKey = typeof ctx.setSelectedPlanKey === "function" ? ctx.setSelectedPlanKey : () => {};
    const getSelectedPlan = typeof ctx.getSelectedPlan === "function" ? ctx.getSelectedPlan : () => null;
    const setSelectedPlan = typeof ctx.setSelectedPlan === "function" ? ctx.setSelectedPlan : () => {};
    const getWallet = typeof ctx.getWallet === "function" ? ctx.getWallet : () => ({});
    const bindWalletToIntent =
      typeof ctx.bindWalletToIntent === "function" ? ctx.bindWalletToIntent : async () => ({});
    const buildPaymentTx =
      typeof ctx.buildPaymentTx === "function" ? ctx.buildPaymentTx : async () => ({});
    const walletSendTransaction =
      typeof ctx.walletSendTransaction === "function" ? ctx.walletSendTransaction : async () => "";
    const verifyIntentWithRetry =
      typeof ctx.verifyIntentWithRetry === "function" ? ctx.verifyIntentWithRetry : async () => ({});

    let payInflight = false;

    function readWalletChoice() {
      try {
        return localStorage.getItem(walletChoiceKey) || "";
      } catch {
        return "";
      }
    }

    function saveWalletChoice(name) {
      try {
        localStorage.setItem(walletChoiceKey, String(name || ""));
      } catch {}
    }

    function setWalletUi() {
      const WALLET = getWallet();
      const selectedPlan = getSelectedPlan();
      const selectedCurrency = getSelectedCurrency();
      const addr = $("sf_addr");
      const label = $("sf_label");
      const btnConnect = $("sf_connect");
      const btnDisconnect = $("sf_disconnect");
      const payBtn = $("sf_pay");
      const hint = $("sf_hint");

      if (addr) {
        addr.textContent =
          !WALLET.connected || !WALLET.publicKey ? "not connected" : shortPk(WALLET.publicKey);
      }
      if (label) label.textContent = WALLET.connected ? WALLET.name || "Wallet" : "Wallet";

      if (btnConnect) btnConnect.classList.toggle("hidden", !!WALLET.connected);
      if (btnDisconnect) btnDisconnect.classList.toggle("hidden", !WALLET.connected);

      const canPay = !!(selectedPlan && WALLET.connected && WALLET.publicKey);
      if (payBtn) payBtn.disabled = !canPay;

      if (hint) {
        if (!selectedPlan) hint.innerHTML = `<span class="muted">Select a plan above to continue.</span>`;
        else if (!WALLET.connected)
          hint.innerHTML = `<span class="muted">Now connect a wallet to pay in ${escapeHtml(selectedCurrency)}.</span>`;
        else hint.innerHTML = `<span class="ok">Ready.</span>`;
      }
    }

    function openPlanModal() {
      modals.openModal("plan_modal");
    }

    function closePlanModal() {
      modals.closeModal("plan_modal");
    }

    function openWalletModal() {
      modals.openModal("sf_modal", {
        onOpen: () => {
          renderWalletList();
          const r = $("sf_modal_receiver");
          const billing = getBilling();
          if (r) r.textContent = billing?.receiver ? shortPk(billing.receiver) : "—";
          const hm = $("sf_modal_msg");
          if (hm) hm.textContent = "";
        },
      });
    }

    function closeWalletModal() {
      modals.closeModal("sf_modal");
    }

    async function connectWalletByChoice(choice) {
      const WALLET = getWallet();
      if (!choice) throw new Error("wallet_not_selected");
      const web3 = window.solanaWeb3;
      if (!web3?.PublicKey) throw new Error("web3_unavailable");

      WALLET.connected = false;
      WALLET.kind = null;
      WALLET.name = "";
      WALLET.icon = "";
      WALLET.wallet = null;
      WALLET.account = null;
      WALLET.provider = null;
      WALLET.publicKey = null;

      if (choice.kind === "standard") {
        const w = choice.wallet;
        const connect = w?.features?.["standard:connect"]?.connect;
        if (typeof connect !== "function") throw new Error("wallet_connect_unavailable");
        const res = await connect();
        const accounts = res?.accounts || [];
        const acc =
          accounts.find((a) => (a?.chains || []).includes(wsChain)) ||
          accounts.find((a) => (a?.chains || []).some((c) => String(c || "").startsWith("solana:"))) ||
          accounts[0];
        if (!acc?.address) throw new Error("wallet_no_account");

        WALLET.connected = true;
        WALLET.kind = "standard";
        WALLET.name = choice.name;
        WALLET.icon = choice.icon;
        WALLET.wallet = w;
        WALLET.account = acc;
        WALLET.publicKey = new web3.PublicKey(acc.address);

        try {
          const ev = w?.features?.["standard:events"]?.on;
          if (typeof ev === "function") {
            ev("disconnect", () => {
              disconnectWallet();
              toast("warn", "Wallet disconnected.");
            });
            ev("change", ({ accounts: accs }) => {
              try {
                const list = accs || [];
                const next = list.find((a) => (a?.chains || []).includes(wsChain)) || list[0];
                if (!next?.address) {
                  disconnectWallet();
                  return;
                }
                WALLET.account = next;
                WALLET.publicKey = new web3.PublicKey(next.address);
                setWalletUi();
              } catch {}
            });
          }
        } catch {}
        return;
      }

      const p = choice.provider;
      if (!p?.connect) throw new Error("wallet_connect_unavailable");
      const r = await p.connect();
      const pk = p.publicKey || r?.publicKey;
      if (!pk) throw new Error("wallet_no_account");

      WALLET.connected = true;
      WALLET.kind = "legacy";
      WALLET.name = choice.name;
      WALLET.provider = p;
      WALLET.publicKey = pk?.toBase58 ? pk : new web3.PublicKey(String(pk));
    }

    async function disconnectWallet() {
      const WALLET = getWallet();
      try {
        if (WALLET.kind === "standard" && WALLET.wallet?.features?.["standard:disconnect"]?.disconnect) {
          await WALLET.wallet.features["standard:disconnect"].disconnect();
        } else if (WALLET.kind === "legacy" && WALLET.provider?.disconnect) {
          await WALLET.provider.disconnect();
        }
      } catch {}
      WALLET.connected = false;
      WALLET.kind = null;
      WALLET.name = "";
      WALLET.icon = "";
      WALLET.wallet = null;
      WALLET.account = null;
      WALLET.provider = null;
      WALLET.publicKey = null;
      setWalletUi();
    }

    function renderWalletList() {
      const listEl = $("walletPick");
      const hintEl = $("walletPickHint");
      const connectBtn = $("sf_modal_connect");
      if (!listEl) return;

      const choices = listWalletChoices();
      listEl.innerHTML = "";

      if (!choices.length) {
        if (hintEl)
          hintEl.innerHTML = `<span class="muted">No wallet detected. Install Solflare / Phantom / Backpack.</span>`;
        if (connectBtn) connectBtn.disabled = true;
        return;
      }

      if (hintEl) hintEl.innerHTML = `<span class="muted">Choose a wallet and click Connect.</span>`;

      const saved = readWalletChoice();
      let picked = choices.find((x) => walletNameKey(x.name) === walletNameKey(saved)) || choices[0];
      saveWalletChoice(picked.name);

      for (const c of choices) {
        const row = document.createElement("div");
        row.className = "walletItem";
        row.dataset.name = c.name;
        row.classList.toggle("active", walletNameKey(c.name) === walletNameKey(picked.name));

        const icon = document.createElement("div");
        icon.className = "walletIcon";
        const src = safeIconSrc(c.icon) || defaultWalletIcon(c.name);
        if (src) {
          const img = document.createElement("img");
          img.alt = c.name;
          img.src = src;
          icon.appendChild(img);
        } else {
          icon.textContent = (c.name || "W").slice(0, 1).toUpperCase();
        }

        const mid = document.createElement("div");
        mid.style.display = "flex";
        mid.style.flexDirection = "column";
        const nm = document.createElement("div");
        nm.className = "walletName";
        nm.textContent = c.name;
        const sub = document.createElement("div");
        sub.className = "walletSub";
        sub.textContent = c.kind === "standard" ? "Wallet Standard" : "";
        mid.appendChild(nm);
        mid.appendChild(sub);

        row.appendChild(icon);
        row.appendChild(mid);

        row.onclick = () => {
          picked = c;
          saveWalletChoice(picked.name);
          Array.from(listEl.children).forEach((ch) => {
            try {
              ch.classList.toggle("active", walletNameKey(ch.dataset.name) === walletNameKey(picked.name));
            } catch {}
          });
        };

        listEl.appendChild(row);
      }

      if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.onclick = async () => {
          const msg = $("sf_modal_msg");
          try {
            connectBtn.disabled = true;
            if (msg) msg.textContent = "Opening wallet...";
            await connectWalletByChoice(picked);
            closeWalletModal();
            const out = $("w_msg");
            if (out) out.innerHTML = `<span class="ok">Wallet connected.</span>`;
          } catch (e) {
            if (msg)
              msg.innerHTML = `<span class="bad">${escapeHtml(String(e?.message || "wallet_connect_failed"))}</span>`;
          } finally {
            connectBtn.disabled = false;
            setWalletUi();
          }
        };
      }
    }

    function renderPlanGrid() {
      const grid = $("planGrid");
      if (!grid) return;
      grid.innerHTML = "";

      const billing = getBilling();
      const selectedCurrency = getSelectedCurrency();
      const selectedPlanKey = getSelectedPlanKey();
      const plans = billing?.plans || [];

      for (const p of plans) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "planCard";
        btn.dataset.key = p.key;
        btn.classList.toggle("active", p.key === selectedPlanKey);

        const primary = planPricePrimary(p, selectedCurrency);
        const secondary = planPriceSecondary(p, selectedCurrency);

        p.badge = Number(p.days || 0) >= 365 ? "2 mo free" : Number(p.days || 0) >= 180 ? "Popular" : "";
        if (!p.badge) p.badge = "";

        btn.innerHTML = `
        <div class="planTop">
          <div>
            <div class="planName">${escapeHtml(p.label || p.key)}</div>
            ${p.badge ? `<div class="planBadge" style="margin-top:6px">${escapeHtml(p.badge)}</div>` : ``}
          </div>
          <div class="planPrice">${escapeHtml(primary)}</div>
        </div>
        <div class="planSub">${secondary ? escapeHtml(secondary) : ""}</div>
        <div class="planMeta">Unlock Pro for ${escapeHtml(String(p.days || 0))} days</div>
      `;

        btn.onclick = () => {
          setSelectedPlanKey(p.key);
          setSelectedPlan(p);
          try {
            $("walletActions")?.classList.remove("hidden");
          } catch {}
          renderPlanGrid();
          setWalletUi();
        };

        grid.appendChild(btn);
      }
    }

    function setCurrency(cur) {
      setSelectedCurrency(cur);
      ["SOL", "USDC", "USDT"].forEach((c) => {
        const el = $("token_" + c);
        if (el) el.classList.toggle("active", c === cur);
      });
      renderPlanGrid();
      setWalletUi();
    }

    async function loadPlans() {
      try {
        const j = await api("/api/billing/plans");
        setBilling(j || getBilling());
        const billing = getBilling();
        const plans = billing?.plans || [];
        let planKey = getSelectedPlanKey();
        if (planKey && !plans.some((p) => p.key === planKey)) {
          planKey = "";
          setSelectedPlanKey("");
          setSelectedPlan(null);
        }
        if (planKey) setSelectedPlan(plans.find((p) => p.key === planKey) || null);
        renderPlanGrid();
        setWalletUi();
      } catch (_e) {}
    }

    async function loadBillingProof() {
      const list = $("w_proof_list");
      const stats = $("w_proof_stats");
      if (!list || !stats) return;
      try {
        const j = await api("/api/billing/proof");
        const items = j?.recent || [];
        list.innerHTML = "";
        if (!items.length) {
          list.innerHTML = `<div class="muted">No receipts yet.</div>`;
          stats.textContent = "—";
          return;
        }
        stats.textContent = `${items.length} receipt${items.length === 1 ? "" : "s"}`;
        for (const it of items) {
          const row = document.createElement("div");
          row.className = "proofItem";
          const amt = `${it.amount} ${it.currency || "SOL"}`;
          const when = it.createdAt ? new Date(it.createdAt).toLocaleString() : "";
          row.innerHTML = `
          <div class="proofTop">
            <div class="proofLeft">
              <div class="proofPlan">${escapeHtml(String(it.plan || "Pro"))}</div>
              <div class="proofMeta">${when ? escapeHtml(when) : ""}</div>
            </div>
            <div class="proofAmt">${escapeHtml(amt)}</div>
          </div>
        `;
          list.appendChild(row);
        }
      } catch (_e) {
        list.innerHTML = `<div class="muted">Receipts unavailable.</div>`;
        stats.textContent = "—";
      }
    }

    async function loadActivity() {
      const list = $("w_activity_list");
      const msg = $("w_activity_msg");
      if (msg) msg.textContent = "";
      if (list) list.innerHTML = '<div class="muted">Loading...</div>';
      try {
        if (!getHandle()) {
          if (list) list.innerHTML = '<div class="muted">Sign in to see activity.</div>';
          return;
        }
        const j = await api("/api/activity?limit=50");
        const items = Array.isArray(j.items) ? j.items : [];
        if (!items.length) {
          if (list) list.innerHTML = '<div class="muted">No activity yet.</div>';
          return;
        }
        const label = (t) => {
          const x = String(t || "");
          if (x === "payment_verified") return "Payment verified";
          if (x === "billing_intent_created") return "Checkout started";
          if (x === "referral_confirmed") return "Referral confirmed";
          if (x === "referral_used") return "Referral used";
          if (x === "code_redeemed") return "Promo code redeemed";
          if (x === "feature_flag_set") return "Feature flag changed";
          return x.replace(/_/g, " ");
        };
        const rows = items
          .slice(0, 50)
          .map((it) => {
            const meta = it && typeof it.meta === "object" && it.meta ? it.meta : null;
            const metaTxt = meta ? escapeHtml(JSON.stringify(meta)) : "";
            const when = it.createdAt ? escapeHtml(String(it.createdAt)) : "";
            return (
              `<div class="pill" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>${escapeHtml(label(it.type))}</strong><span class="muted">${when}</span></div>` +
              (metaTxt
                ? `<div class="muted small" style="margin:-6px 0 10px 0">${metaTxt}</div>`
                : `<div style="height:8px"></div>`)
            );
          })
          .join("");
        if (list) list.innerHTML = rows;
      } catch (e) {
        if (list) list.innerHTML = "";
        if (msg)
          msg.innerHTML = `<span class="bad">${escapeHtml(friendlyUiErrorMessage(e.message || "failed"))}</span>`;
      }
    }

    function billingErrMsg(code) {
      const m = String(code || "");
      if (m.includes("rejected") || m.includes("Rejected") || m.includes("User rejected"))
        return "Transaction was cancelled in the wallet.";
      if (m === "spl_token_unavailable")
        return "USDC/USDT helper is unavailable in this build. Hard refresh the page once.";
      if (m === "insufficient_sol_funds")
        return "The connected wallet does not have enough SOL for this payment plus network fee.";
      if (m === "insufficient_token_funds")
        return "The connected wallet does not have enough token balance for this payment.";
      if (m === "payer_token_account_missing")
        return "The connected wallet does not have that token account. Switch token or fund the wallet first.";
      if (m === "web3_unavailable")
        return "Solana web3 library is not available. Refresh the page and try again.";
      if (m === "buffer_unavailable" || /buffer is not defined/i.test(m))
        return "Browser Buffer helper did not load. Refresh once and try again.";
      if (m === "wallet_no_send_feature")
        return "This wallet can't send transactions from the browser. Try Solflare/Phantom/Backpack.";
      if (m === "wallet_no_message_sign")
        return "This wallet can't sign the checkout message. Try Solflare/Phantom/Backpack.";
      if (m === "wallet_bind_required")
        return "Wallet binding is required before payment verify. Sign the wallet message and try again.";
      if (m === "invalid_nonce_sig")
        return "Wallet binding signature was invalid. Sign the wallet message again.";
      if (m === "rpc_unavailable") return "Solana RPC is unavailable right now. Try again in a moment.";
      if (/403|401|429|access forbidden|blockhash/i.test(m))
        return "RPC refused the payment request. Refresh once and try again.";
      if (m === "payment_not_verified")
        return "Payment not found or not confirmed yet. Wait a moment and it will auto-verify.";
      if (m === "invalid_sig") return "Invalid transaction signature.";
      if (m === "payment_intent_mismatch")
        return "This transaction does not match the current checkout intent.";
      if (m === "intent_expired") return "This checkout expired. Start a new payment.";
      if (m === "sig_already_used") return "This transaction signature was already used.";
      if (m === "invalid_plan") return "Invalid plan.";
      return m || "billing_failed";
    }

    async function payNow() {
      const WALLET = getWallet();
      const selectedPlan = getSelectedPlan();
      const selectedCurrency = getSelectedCurrency();
      const msg = $("w_msg");
      if (!selectedPlan) {
        if (msg) msg.innerHTML = `<span class="warn">Select a plan first.</span>`;
        return;
      }
      if (!WALLET.connected) {
        openWalletModal();
        if (msg) msg.innerHTML = `<span class="warn">Connect a wallet to continue.</span>`;
        return;
      }

      const payBtn = $("sf_pay");
      const cur = selectedCurrency;
      const v = abVariant();

      try {
        payInflight = true;
        if (payBtn) payBtn.disabled = true;

        setPayState("processing", "Creating checkout...");
        if (msg) msg.textContent = "Creating payment...";
        trackEvent("pay_click", { v, plan: selectedPlan.key, cur, source: "wallet_tab" });

        const intent = await api("/api/billing/intent", "POST", {
          planKey: selectedPlan.key,
          currency: cur,
        });

        setPayState("processing", "Binding wallet...");
        if (msg) msg.textContent = "Sign the wallet message to bind this checkout...";
        await bindWalletToIntent(intent);

        setPayState("processing", "Building transaction...");
        if (msg) msg.textContent = "Building transaction...";
        const built = await buildPaymentTx(intent);

        setPayState("processing", "Approve in wallet...");
        if (msg) msg.textContent = "Approve the transaction in your wallet...";
        const payer = String(WALLET.publicKey?.toString?.() || "");
        const sig = await walletSendTransaction(built.tx, built.connection);

        setPayState("confirming", "Confirming on-chain...");
        if (msg) msg.textContent = "Confirming & verifying on-chain...";
        const j = await verifyIntentWithRetry(intent.id, sig, payer);

        setPayState("verified", "Verified. Pro activated.");
        if (msg) msg.innerHTML = `<span class="ok">Paid & verified.</span>`;
        trackEvent("pay_success", { v, plan: selectedPlan.key, cur });

        try {
          await refreshUsage();
        } catch {}
        try {
          await loadBillingProof();
        } catch {}
        try {
          await loadActivity();
        } catch {}
        renderWalletStatus(j.sub);

        openPaySuccess();
      } catch (e) {
        const m = String(e?.message || "billing_failed");
        setPayState("failed", billingErrMsg(m));
        if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(billingErrMsg(m))}</span>`;
        trackEvent("pay_fail", { v, code: m, plan: selectedPlan?.key || "", cur: selectedCurrency });
      } finally {
        payInflight = false;
        if (payBtn) payBtn.disabled = !(selectedPlan && WALLET.connected) || payInflight;
        setWalletUi();
      }
    }

    function renderWalletStatus(sub) {
      const el = $("w_status_desc");
      if (!el) return;
      if (!sub) {
        el.innerHTML = `<span class="muted">Status unknown.</span>`;
        return;
      }
      if (sub.active) {
        const until = sub.paidUntil ? ` (until ${escapeHtml(String(sub.paidUntil))})` : "";
        el.innerHTML = `<span class="ok">Pro active</span>${until}`;
      } else {
        el.innerHTML = `<span class="muted">Free</span>`;
      }
    }

    function bindWalletTab() {
      const bSol = $("token_SOL");
      const bUsdc = $("token_USDC");
      const bUsdt = $("token_USDT");
      if (bSol) bSol.onclick = () => setCurrency("SOL");
      if (bUsdc) bUsdc.onclick = () => setCurrency("USDC");
      if (bUsdt) bUsdt.onclick = () => setCurrency("USDT");

      modals.bindBackdrop("sf_modal", closeWalletModal);
      const close = $("sf_modal_close");
      if (close) close.onclick = () => closeWalletModal();

      const pc = $("plan_compare_btn");
      const pmClose = $("plan_modal_close");
      if (pc) pc.onclick = () => openPlanModal();
      modals.bindBackdrop("plan_modal", closePlanModal);
      if (pmClose) pmClose.onclick = () => closePlanModal();

      const btnConnect = $("sf_connect");
      const btnDisconnect = $("sf_disconnect");
      if (btnConnect) btnConnect.onclick = () => openWalletModal();
      if (btnDisconnect) btnDisconnect.onclick = () => disconnectWallet();

      const payBtn = $("sf_pay");
      if (payBtn) payBtn.onclick = () => payNow();

      const actBtn = $("w_activity_refresh");
      if (actBtn) actBtn.onclick = () => loadActivity();

      setCurrency(getSelectedCurrency());
      setWalletUi();

      try {
        const check = () => {
          const WALLET = getWallet();
          if (WALLET.connected) {
            const choices = listWalletChoices();
            const stillThere = choices.some((x) => walletNameKey(x.name) === walletNameKey(WALLET.name));
            if (!stillThere) {
              disconnectWallet();
              toast("warn", "Wallet was updated/restarted. Please reconnect.");
            }
          }
        };
        window.addEventListener("focus", check);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
      } catch {}
    }

    return {
      setWalletUi,
      openWalletModal,
      closeWalletModal,
      connectWalletByChoice,
      disconnectWallet,
      renderPlanGrid,
      setCurrency,
      loadPlans,
      loadBillingProof,
      loadActivity,
      payNow,
      renderWalletStatus,
      bindWalletTab,
      billingErrMsg,
    };
  };
})(window);
