// ----- Wallet / Billing -----
  let BILLING = { receiver:"", plans:[], solUsd:0, rpcPublic:"" };
  let selectedCurrency = "SOL"; // SOL | USDC | USDT
  let selectedPlanKey = "";
  let selectedPlan = null;

  if (!window.__GMXWalletHelpersFactory) throw new Error("GMX wallethelpers factory missing");
  const __gmxWh = window.__GMXWalletHelpersFactory();
  const WS_CHAIN = __gmxWh.WS_CHAIN;
  const LS_WALLET_CHOICE = K.WALLET_CHOICE;
  const b58encode = __gmxWh.b58encode;
  const shortPk = __gmxWh.shortPk;
  const walletNameKey = __gmxWh.walletNameKey;
  const safeIconSrc = __gmxWh.safeIconSrc;
  const defaultWalletIcon = __gmxWh.defaultWalletIcon;
  const listWalletChoices = () => __gmxWh.listWalletChoices();

  const WALLET = {
    connected: false,
    kind: null,            // "standard" | "legacy"
    name: "",
    icon: "",
    wallet: null,          // Wallet Standard wallet object
    account: null,         // Wallet Standard account
    provider: null,        // legacy injected provider
    publicKey: null        // solanaWeb3.PublicKey
  };

  async function walletSignMessageBytes(messageBytes){
    return __gmxWh.signMessageBytes(WALLET, messageBytes);
  }

  async function bindWalletToIntent(intent){
    const intentId = String(intent?.id || intent?.intentId || "").trim();
    const bindMessage = String(intent?.bindMessage || "").trim();
    const payer = String(WALLET.publicKey?.toString?.() || "").trim();
    if (!intentId || !bindMessage || !payer) throw new Error("wallet_bind_required");
    const nonceSig = await walletSignMessageBytes(new TextEncoder().encode(bindMessage));
    return api("/api/billing/bind", "POST", { intentId, wallet: payer, nonceSig });
  }

  function addIntentMemoInstruction(tx, intentId, web3){
    __gmxWh.addIntentMemoInstruction(tx, intentId, web3);
  }

  function readWalletChoice(){
    try{ return localStorage.getItem(LS_WALLET_CHOICE) || ""; }catch{ return ""; }
  }
  function saveWalletChoice(name){
    try{ localStorage.setItem(LS_WALLET_CHOICE, String(name||"")); }catch{}
  }

  function setWalletUi(){
    const addr = $("sf_addr");
    const label = $("sf_label");
    const btnConnect = $("sf_connect");
    const btnDisconnect = $("sf_disconnect");
    const payBtn = $("sf_pay");
    const hint = $("sf_hint");

    if (addr){
      addr.textContent = (!WALLET.connected || !WALLET.publicKey) ? "not connected" : shortPk(WALLET.publicKey);
    }
    if (label){
      label.textContent = WALLET.connected ? (WALLET.name || "Wallet") : "Wallet";
    }

    if (btnConnect) btnConnect.classList.toggle("hidden", !!WALLET.connected);
    if (btnDisconnect) btnDisconnect.classList.toggle("hidden", !WALLET.connected);

    const canPay = !!(selectedPlan && WALLET.connected && WALLET.publicKey);
    if (payBtn) payBtn.disabled = !canPay;

    if (hint){
      if (!selectedPlan) hint.innerHTML = `<span class="muted">Select a plan above to continue.</span>`;
      else if (!WALLET.connected) hint.innerHTML = `<span class="muted">Now connect a wallet to pay in ${escapeHtml(selectedCurrency)}.</span>`;
      else hint.innerHTML = `<span class="ok">Ready.</span>`;
    }
  }

  
  function openPlanModal(){
    __gmxModals.openModal("plan_modal");
  }
  function closePlanModal(){
    __gmxModals.closeModal("plan_modal");
  }

function openWalletModal(){
    __gmxModals.openModal("sf_modal", {
      onOpen: () => {
        renderWalletList();
        const r = $("sf_modal_receiver");
        if (r) r.textContent = BILLING?.receiver ? shortPk(BILLING.receiver) : "—";
        const hm = $("sf_modal_msg");
        if (hm) hm.textContent = "";
      },
    });
  }
  function closeWalletModal(){
    __gmxModals.closeModal("sf_modal");
  }

  function renderWalletList(){
    const listEl = $("walletPick");
    const hintEl = $("walletPickHint");
    const connectBtn = $("sf_modal_connect");
    if (!listEl) return;

    const choices = listWalletChoices();
    listEl.innerHTML = "";

    if (!choices.length){
      if (hintEl) hintEl.innerHTML = `<span class="muted">No wallet detected. Install Solflare / Phantom / Backpack.</span>`;
      if (connectBtn) connectBtn.disabled = true;
      return;
    }

    if (hintEl) hintEl.innerHTML = `<span class="muted">Choose a wallet and click Connect.</span>`;

    const saved = readWalletChoice();
    let picked = choices.find(x => walletNameKey(x.name) === walletNameKey(saved)) || choices[0];
    saveWalletChoice(picked.name);

    for (const c of choices){
      const row = document.createElement("div");
      row.className = "walletItem";
      row.dataset.name = c.name;
      row.classList.toggle("active", walletNameKey(c.name) === walletNameKey(picked.name));

      const icon = document.createElement("div");
      icon.className = "walletIcon";
      const src = safeIconSrc(c.icon) || defaultWalletIcon(c.name);
if (src){
  const img = document.createElement("img");
  img.alt = c.name;
  img.src = src;
  icon.appendChild(img);
} else {
  icon.textContent = (c.name || "W").slice(0,1).toUpperCase();
}

      const mid = document.createElement("div");
      mid.style.display = "flex";
      mid.style.flexDirection = "column";
      const nm = document.createElement("div");
      nm.className = "walletName";
      nm.textContent = c.name;
      const sub = document.createElement("div");
      sub.className = "walletSub";
      sub.textContent = (c.kind === "standard") ? "Wallet Standard" : "";
      mid.appendChild(nm);
      mid.appendChild(sub);

      row.appendChild(icon);
      row.appendChild(mid);

      row.onclick = ()=>{
        picked = c;
        saveWalletChoice(picked.name);
        Array.from(listEl.children).forEach(ch=>{
          try{ ch.classList.toggle("active", walletNameKey(ch.dataset.name) === walletNameKey(picked.name)); }catch{}
        });
      };

      listEl.appendChild(row);
    }

    if (connectBtn){
      connectBtn.disabled = false;
      connectBtn.onclick = async ()=>{
        const msg = $("sf_modal_msg");
        try{
          connectBtn.disabled = true;
          if (msg) msg.textContent = "Opening wallet...";
          await connectWalletByChoice(picked);
          closeWalletModal();
          const out = $("w_msg");
          if (out) out.innerHTML = `<span class="ok">Wallet connected.</span>`;
        }catch(e){
          if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(String(e?.message || "wallet_connect_failed"))}</span>`;
        }finally{
          connectBtn.disabled = false;
          setWalletUi();
        }
      };
    }
  }

  async function connectWalletByChoice(choice){
    if (!choice) throw new Error("wallet_not_selected");
    const web3 = window.solanaWeb3;
    if (!web3?.PublicKey) throw new Error("web3_unavailable");

    // reset
    WALLET.connected = false;
    WALLET.kind = null;
    WALLET.name = "";
    WALLET.icon = "";
    WALLET.wallet = null;
    WALLET.account = null;
    WALLET.provider = null;
    WALLET.publicKey = null;

    if (choice.kind === "standard"){
      const w = choice.wallet;
      const connect = w?.features?.["standard:connect"]?.connect;
      if (typeof connect !== "function") throw new Error("wallet_connect_unavailable");
      const res = await connect();
      const accounts = res?.accounts || [];
      const acc = accounts.find(a => (a?.chains || []).includes(WS_CHAIN)) || accounts.find(a => (a?.chains || []).some(c=>String(c||"").startsWith("solana:"))) || accounts[0];
      if (!acc?.address) throw new Error("wallet_no_account");

      WALLET.connected = true;
      WALLET.kind = "standard";
      WALLET.name = choice.name;
      WALLET.icon = choice.icon;
      WALLET.wallet = w;
      WALLET.account = acc;
      WALLET.publicKey = new web3.PublicKey(acc.address);

      // auto-update on changes
      try{
        const ev = w?.features?.["standard:events"]?.on;
        if (typeof ev === "function"){
          ev("disconnect", ()=>{
            disconnectWallet();
            toast("warn", "Wallet disconnected.");
          });
          ev("change", ({ accounts })=>{
            try{
              const accs = accounts || [];
              const next = accs.find(a => (a?.chains || []).includes(WS_CHAIN)) || accs[0];
              if (!next?.address){ disconnectWallet(); return; }
              WALLET.account = next;
              WALLET.publicKey = new web3.PublicKey(next.address);
              setWalletUi();
            }catch{}
          });
        }
      }catch{}
      return;
    }

    // legacy
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

  async function disconnectWallet(){
    try{
      if (WALLET.kind === "standard" && WALLET.wallet?.features?.["standard:disconnect"]?.disconnect){
        await WALLET.wallet.features["standard:disconnect"].disconnect();
      } else if (WALLET.kind === "legacy" && WALLET.provider?.disconnect){
        await WALLET.provider.disconnect();
      }
    }catch{}
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

  function getRpcUrl(){ return __gmxWh.getRpcUrl(BILLING); }
  function rpcCandidates(){ return __gmxWh.rpcCandidates(BILLING); }
  function shouldRetryRpc(err){ return __gmxWh.shouldRetryRpc(err); }

  async function getServerTxContext(){
    try{
      const j = await api("/api/billing/tx-context");
      if (j?.ok && j?.blockhash) return j;
      const alt = await api("/api/solana/latest-blockhash");
      if (alt?.ok && alt?.blockhash) return alt;
      const v = alt?.value;
      if (alt?.ok && v?.blockhash) {
        return {
          ok: true,
          blockhash: String(v.blockhash),
          lastValidBlockHeight: Number(v.lastValidBlockHeight || 0) || undefined,
        };
      }
    }catch(_e){}
    return null;
  }

  async function getConnectionWithBlockhash(web3){
    const preferred = rpcCandidates()[0] || getRpcUrl();
    const connection = new web3.Connection(preferred, "confirmed");
    const serverCtx = await getServerTxContext();
    if (serverCtx?.blockhash){
      return {
        connection,
        latest: {
          blockhash: String(serverCtx.blockhash || ""),
          lastValidBlockHeight: Number(serverCtx.lastValidBlockHeight || 0) || undefined,
        },
        rpcUrl: preferred,
        serverBacked: true,
      };
    }
    let lastErr = null;
    for (const url of rpcCandidates()){
      try{
        const liveConnection = new web3.Connection(url, "confirmed");
        const latest = await liveConnection.getLatestBlockhash("confirmed");
        return { connection: liveConnection, latest, rpcUrl: url };
      }catch(err){
        lastErr = err;
        if (!shouldRetryRpc(err)) break;
      }
    }
    throw lastErr || new Error("rpc_unavailable");
  }

  const fmtSol = __gmxWh.fmtSol;
  const planPricePrimary = __gmxWh.planPricePrimary;
  const planPriceSecondary = __gmxWh.planPriceSecondary;

  function renderPlanGrid(){
    const grid = $("planGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const plans = BILLING?.plans || [];
    for (const p of plans){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "planCard";
      btn.dataset.key = p.key;
      btn.classList.toggle("active", p.key === selectedPlanKey);

      const primary = planPricePrimary(p, selectedCurrency);
      const secondary = planPriceSecondary(p, selectedCurrency);

      // simple badges
      p.badge = (Number(p.days||0) >= 365) ? "2 mo free" : (Number(p.days||0) >= 180 ? "Popular" : "");
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
        <div class="planMeta">Unlock Pro for ${escapeHtml(String(p.days||0))} days</div>
      `;

      btn.onclick = ()=>{
        selectedPlanKey = p.key;
        selectedPlan = p;
        try{ $("walletActions")?.classList.remove("hidden"); }catch{}
        renderPlanGrid();
        setWalletUi();
      };

      grid.appendChild(btn);
    }
  }

  function setCurrency(cur){
    selectedCurrency = cur;
    // buttons
    ["SOL","USDC","USDT"].forEach(c=>{
      const el = $("token_" + c);
      if (el) el.classList.toggle("active", c === selectedCurrency);
    });
    renderPlanGrid();
    setWalletUi();
  }

  async function loadPlans(){
    try{
      const j = await api("/api/billing/plans");
      BILLING = j || BILLING;
      const plans = BILLING?.plans || [];
      if (selectedPlanKey && !plans.some(p=>p.key === selectedPlanKey)){
        selectedPlanKey = "";
        selectedPlan = null;
      }
      if (selectedPlanKey){
        selectedPlan = plans.find(p=>p.key === selectedPlanKey) || null;
      }
      renderPlanGrid();
      setWalletUi();
    }catch(e){
      // silent
    }
  }

  async function loadBillingProof(){
    const list = $("w_proof_list");
    const stats = $("w_proof_stats");
    if (!list || !stats) return;
    try{
      const j = await api("/api/billing/proof");
      const items = j?.recent || [];
      list.innerHTML = "";
      if (!items.length){
        list.innerHTML = `<div class="muted">No receipts yet.</div>`;
        stats.textContent = "—";
        return;
      }
      stats.textContent = `${items.length} receipt${items.length===1?"":"s"}`;
      for (const it of items){
        const row = document.createElement("div");
        row.className = "proofItem";
        const amt = `${it.amount} ${it.currency || "SOL"}`;
        const when = it.createdAt ? new Date(it.createdAt).toLocaleString() : "";
        row.innerHTML = `
          <div class="proofTop">
            <div class="proofLeft">
              <div class="proofPlan">${escapeHtml(String(it.plan||"Pro"))}</div>
              <div class="proofMeta">${when ? escapeHtml(when) : ""}</div>
            </div>
            <div class="proofAmt">${escapeHtml(amt)}</div>
          </div>
        `;
        list.appendChild(row);
      }
    }catch(e){
      list.innerHTML = `<div class="muted">Receipts unavailable.</div>`;
      stats.textContent = "—";
    }
  }

  let BUFFER_READY = null;

  async function ensureBrowserBuffer(){
    const existing = (typeof globalThis !== "undefined" && globalThis.Buffer) ? globalThis.Buffer : null;
    if (existing && typeof existing.from === "function" && typeof existing.alloc === "function") return existing;
    const web3Buffer = window.solanaWeb3?.Buffer || window.solanaWeb3?.utils?.Buffer || null;
    if (web3Buffer && typeof web3Buffer.from === "function") {
      try { window.Buffer = web3Buffer; } catch (_e) {}
      try { globalThis.Buffer = web3Buffer; } catch (_e) {}
      return web3Buffer;
    }
    if (!BUFFER_READY) {
      class MiniBuffer extends Uint8Array {
        static from(input, encoding){
          if (typeof input === "string") {
            if (encoding === "hex") {
              const clean = input.replace(/[^0-9a-f]/gi, "");
              const out = new MiniBuffer(Math.ceil(clean.length / 2));
              for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2) || "00", 16);
              return out;
            }
            if (encoding === "base64") {
              const raw = atob(input);
              const out = new MiniBuffer(raw.length);
              for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
              return out;
            }
            return new TextEncoder().encode(input);
          }
          if (typeof input === "number") return new MiniBuffer(input);
          if (input instanceof ArrayBuffer) return new MiniBuffer(input);
          if (ArrayBuffer.isView(input)) return new MiniBuffer(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
          if (Array.isArray(input)) return new MiniBuffer(input);
          return new MiniBuffer(0);
        }
        static alloc(size){ return new MiniBuffer(Number(size) || 0); }
        static allocUnsafe(size){ return new MiniBuffer(Number(size) || 0); }
        static concat(list){
          const arr = Array.isArray(list) ? list : [];
          const total = arr.reduce((n, item) => n + (item?.length || 0), 0);
          const out = new MiniBuffer(total);
          let off = 0;
          for (const item of arr) { const chunk = MiniBuffer.from(item); out.set(chunk, off); off += chunk.length; }
          return out;
        }
        static isBuffer(value){ return value instanceof Uint8Array; }
        toString(encoding="utf8"){
          if (encoding === "hex") return Array.from(this).map((b)=>b.toString(16).padStart(2,"0")).join("");
          if (encoding === "base64") { let s = ""; for (const b of this) s += String.fromCharCode(b); return btoa(s); }
          return new TextDecoder().decode(this);
        }
      }
      BUFFER_READY = Promise.resolve(MiniBuffer).then((B)=>{
        try { window.Buffer = B; } catch (_e) {}
        try { globalThis.Buffer = B; } catch (_e) {}
        return B;
      });
    }
    return BUFFER_READY;
  }

  async function ensureSplToken(){
    if (window.__splTokenMod) return window.__splTokenMod;
    await ensureBrowserBuffer();
    const web3 = window.solanaWeb3;
    if (!web3?.PublicKey || !web3?.TransactionInstruction) throw new Error("web3_unavailable");
    const TOKEN_PROGRAM_ID = new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const ASSOCIATED_TOKEN_PROGRAM_ID = new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    const toPkBytes = (pk) => {
      if (pk?.toBytes) return Uint8Array.from(pk.toBytes());
      if (pk?.toBuffer) return Uint8Array.from(pk.toBuffer());
      return Uint8Array.from([]);
    };
    const getAssociatedTokenAddress = async (mint, owner, _allowOwnerOffCurve=false, tokenProgramId=TOKEN_PROGRAM_ID, associatedTokenProgramId=ASSOCIATED_TOKEN_PROGRAM_ID) => {
      const out = web3.PublicKey.findProgramAddressSync([
        toPkBytes(owner),
        toPkBytes(tokenProgramId),
        toPkBytes(mint),
      ], associatedTokenProgramId);
      return out[0];
    };
    const createAssociatedTokenAccountInstruction = (payer, ata, owner, mint, tokenProgramId=TOKEN_PROGRAM_ID, associatedTokenProgramId=ASSOCIATED_TOKEN_PROGRAM_ID) => {
      return new web3.TransactionInstruction({
        programId: associatedTokenProgramId,
        keys: [
          { pubkey: payer, isSigner: true, isWritable: true },
          { pubkey: ata, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: false, isWritable: false },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: tokenProgramId, isSigner: false, isWritable: false },
          { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Uint8Array([]),
      });
    };
    const createTransferInstruction = (source, destination, owner, amountBase, _multiSigners=[], tokenProgramId=TOKEN_PROGRAM_ID) => {
      let n = BigInt(String(amountBase || "0"));
      if (n < 0n) throw new Error("invalid_amount");
      const data = new Uint8Array(9);
      data[0] = 3;
      for (let i = 0; i < 8; i++) {
        data[i + 1] = Number(n & 0xffn);
        n >>= 8n;
      }
      return new web3.TransactionInstruction({
        programId: tokenProgramId,
        keys: [
          { pubkey: source, isSigner: false, isWritable: true },
          { pubkey: destination, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: true, isWritable: false },
        ],
        data,
      });
    };
    const mod = {
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      getAssociatedTokenAddress,
      createAssociatedTokenAccountInstruction,
      createTransferInstruction,
    };
    window.__splTokenMod = mod;
    return mod;
  }

  async function buildPaymentTx(intent){
    await ensureBrowserBuffer();
    const web3 = window.solanaWeb3;
    if (!web3?.Transaction || !web3?.SystemProgram) throw new Error("web3_unavailable");
    if (!WALLET.publicKey) throw new Error("wallet_not_connected");

    const payer = WALLET.publicKey;
    const receiver = new web3.PublicKey(String(intent.receiver || BILLING.receiver || ""));
    if (!receiver) throw new Error("receiver_missing");

    const { connection, latest } = await getConnectionWithBlockhash(web3);
    const tx = new web3.Transaction();
    tx.feePayer = payer;
    tx.recentBlockhash = latest.blockhash;

    const amountBase = BigInt(String(intent.amountBase || intent.amount_base || "0"));
    if (amountBase <= 0n) throw new Error("invalid_amount");

    addIntentMemoInstruction(tx, intent?.id || intent?.intentId || "", web3);

    if (String(intent.currency || selectedCurrency) === "SOL"){
      const payerLamports = BigInt(String(await connection.getBalance(payer).catch(() => 0)));
      const feeSlack = 10000n;
      if (payerLamports < (amountBase + feeSlack)) throw new Error("insufficient_sol_funds");
      tx.add(web3.SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: receiver,
        lamports: Number(amountBase)
      }));
      return { tx, connection };
    }

    const spl = await ensureSplToken();
    const mint = new web3.PublicKey(String(intent.mint || ""));
    if (!mint) throw new Error("mint_missing");

    const payerAta = await spl.getAssociatedTokenAddress(mint, payer, false, spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);
    const receiverAta = await spl.getAssociatedTokenAddress(mint, receiver, false, spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);

    const payerInfo = await connection.getAccountInfo(payerAta);
    if (!payerInfo) throw new Error("payer_token_account_missing");
    const payerBal = await connection.getTokenAccountBalance(payerAta).catch(() => null);
    const payerAmount = BigInt(String(payerBal?.value?.amount || "0"));
    if (payerAmount < amountBase) throw new Error("insufficient_token_funds");

    const recvInfo = await connection.getAccountInfo(receiverAta);
    let neededLamports = 10000n;
    if (!recvInfo && typeof connection.getMinimumBalanceForRentExemption === "function") {
      try { neededLamports += BigInt(String(await connection.getMinimumBalanceForRentExemption(165))); } catch (_e) {}
    }
    const payerLamports = BigInt(String(await connection.getBalance(payer).catch(() => 0)));
    if (payerLamports < neededLamports) throw new Error("insufficient_sol_funds");

    if (!recvInfo){
      tx.add(spl.createAssociatedTokenAccountInstruction(
        payer, receiverAta, receiver, mint, spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID
      ));
    }

    tx.add(spl.createTransferInstruction(
      payerAta, receiverAta, payer, amountBase, [], spl.TOKEN_PROGRAM_ID
    ));

    return { tx, connection };
  }

  async function walletSendTransaction(tx, connection){
    if (!tx) throw new Error("tx_missing");

    if (WALLET.kind === "standard"){
      const w = WALLET.wallet;
      const acc = WALLET.account;
      const featSend = w?.features?.["solana:signAndSendTransaction"]?.signAndSendTransaction;
      if (typeof featSend === "function"){
        const out = await featSend({ transaction: tx, account: acc, chain: WS_CHAIN });
        const sig = out?.signature;
        const s = (typeof sig === "string") ? sig : b58encode(sig);
        if (!s) throw new Error("send_failed");
        return s;
      }
      const featSign = w?.features?.["solana:signTransaction"]?.signTransaction;
      if (typeof featSign === "function"){
        const out = await featSign({ transaction: tx, account: acc, chain: WS_CHAIN });
        const signed = out?.transaction || out?.signedTransaction || out;
        const raw = signed?.serialize ? signed.serialize() : (signed instanceof Uint8Array ? signed : null);
        if (!raw) throw new Error("sign_failed");
        const sig = await connection.sendRawTransaction(raw, { skipPreflight:false, preflightCommitment:"confirmed" });
        return sig;
      }
      throw new Error("wallet_no_send_feature");
    }

    // legacy
    const p = WALLET.provider;
    if (p?.signAndSendTransaction){
      const out = await p.signAndSendTransaction(tx, { preflightCommitment:"confirmed" });
      const sig = out?.signature || out;
      return (typeof sig === "string") ? sig : b58encode(sig);
    }
    if (p?.signTransaction){
      const signed = await p.signTransaction(tx);
      const raw = signed?.serialize ? signed.serialize() : null;
      if (!raw) throw new Error("sign_failed");
      const sig = await connection.sendRawTransaction(raw, { skipPreflight:false, preflightCommitment:"confirmed" });
      return sig;
    }
    throw new Error("wallet_no_send_feature");
  }

  async function verifyIntentWithRetry(intentId, sig, payer){
    let last = null;
    for (let i=0; i<10; i++){
      try{
        return await api("/api/billing/verify", "POST", { intentId, sig, payer });
      }catch(e){
        last = e;
        const m = String(e?.message || "");
        if (m === "payment_not_verified" || m === "request_failed" || m === "timeout" || m === "server_error"){
          await new Promise(r=>setTimeout(r, 1500));
          continue;
        }
        throw e;
      }
    }
    throw last || new Error("verify_failed");
  }

  

  async function loadActivity(){
    const list = $("w_activity_list");
    const msg = $("w_activity_msg");
    if (msg) msg.textContent = "";
    if (list) list.innerHTML = '<div class="muted">Loading...</div>';
    try{
      if (!getHandle()){
        if (list) list.innerHTML = '<div class="muted">Sign in to see activity.</div>';
        return;
      }
      const j = await api('/api/activity?limit=50');
      const items = Array.isArray(j.items) ? j.items : [];
      if (!items.length){
        if (list) list.innerHTML = '<div class="muted">No activity yet.</div>';
        return;
      }
      const label = (t)=>{
        const x = String(t||'');
        if (x === 'payment_verified') return 'Payment verified';
        if (x === 'billing_intent_created') return 'Checkout started';
        if (x === 'referral_confirmed') return 'Referral confirmed';
        if (x === 'referral_used') return 'Referral used';
        if (x === 'code_redeemed') return 'Promo code redeemed';
        if (x === 'feature_flag_set') return 'Feature flag changed';
        return x.replace(/_/g,' ');
      };
      const rows = items.slice(0, 50).map(it=>{
        const meta = it && typeof it.meta === 'object' && it.meta ? it.meta : null;
        const metaTxt = meta ? escapeHtml(JSON.stringify(meta)) : '';
        const when = it.createdAt ? escapeHtml(String(it.createdAt)) : '';
        return `<div class="pill" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>${escapeHtml(label(it.type))}</strong><span class="muted">${when}</span></div>` +
               (metaTxt ? `<div class="muted small" style="margin:-6px 0 10px 0">${metaTxt}</div>` : `<div style="height:8px"></div>`);
      }).join('');
      if (list) list.innerHTML = rows;
    }catch(e){
      if (list) list.innerHTML = "";
      if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(friendlyUiErrorMessage(e.message||'failed'))}</span>`;
    }
  }

function billingErrMsg(code){
    const m = String(code || "");
    if (m.includes("rejected") || m.includes("Rejected") || m.includes("User rejected")) return "Transaction was cancelled in the wallet.";
    if (m === "spl_token_unavailable") return "USDC/USDT helper is unavailable in this build. Hard refresh the page once.";
    if (m === "insufficient_sol_funds") return "The connected wallet does not have enough SOL for this payment plus network fee.";
    if (m === "insufficient_token_funds") return "The connected wallet does not have enough token balance for this payment.";
    if (m === "payer_token_account_missing") return "The connected wallet does not have that token account. Switch token or fund the wallet first.";
    if (m === "web3_unavailable") return "Solana web3 library is not available. Refresh the page and try again.";
    if (m === "buffer_unavailable" || /buffer is not defined/i.test(m)) return "Browser Buffer helper did not load. Refresh once and try again.";
    if (m === "wallet_no_send_feature") return "This wallet can't send transactions from the browser. Try Solflare/Phantom/Backpack.";
    if (m === "wallet_no_message_sign") return "This wallet can't sign the checkout message. Try Solflare/Phantom/Backpack.";
    if (m === "wallet_bind_required") return "Wallet binding is required before payment verify. Sign the wallet message and try again.";
    if (m === "invalid_nonce_sig") return "Wallet binding signature was invalid. Sign the wallet message again.";
    if (m === "rpc_unavailable") return "Solana RPC is unavailable right now. Try again in a moment.";
    if (/403|401|429|access forbidden|blockhash/i.test(m)) return "RPC refused the payment request. Refresh once and try again.";
    if (m === "payment_not_verified") return "Payment not found or not confirmed yet. Wait a moment and it will auto-verify.";
    if (m === "invalid_sig") return "Invalid transaction signature.";
    if (m === "payment_intent_mismatch") return "This transaction does not match the current checkout intent.";
    if (m === "intent_expired") return "This checkout expired. Start a new payment.";
    if (m === "sig_already_used") return "This transaction signature was already used.";
    if (m === "invalid_plan") return "Invalid plan.";
    return m || "billing_failed";
  }

    let PAY_INFLIGHT = false;

async function payNow(){
    const msg = $("w_msg");
    if (!selectedPlan){
      if (msg) msg.innerHTML = `<span class="warn">Select a plan first.</span>`;
      return;
    }
    if (!WALLET.connected){
      openWalletModal();
      if (msg) msg.innerHTML = `<span class="warn">Connect a wallet to continue.</span>`;
      return;
    }

    const payBtn = $("sf_pay");
    const cur = selectedCurrency;
    const v = abVariant();

    try{
      PAY_INFLIGHT = true;
      if (payBtn) payBtn.disabled = true;

      setPayState("processing", "Creating checkout...");
      if (msg) msg.textContent = "Creating payment...";
      trackEvent("pay_click", { v, plan: selectedPlan.key, cur, source:"wallet_tab" });

      const intent = await api("/api/billing/intent", "POST", { planKey: selectedPlan.key, currency: cur });

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

      try{ await refreshUsage(); }catch{}
      try{ await loadBillingProof(); }catch{}
      try{ await loadActivity(); }catch{}
      renderWalletStatus(j.sub);

      openPaySuccess();
    }catch(e){
      const m = String(e?.message || "billing_failed");
      setPayState("failed", billingErrMsg(m));
      if (msg) msg.innerHTML = `<span class="bad">${escapeHtml(billingErrMsg(m))}</span>`;
      trackEvent("pay_fail", { v, code: m, plan: selectedPlan?.key || "", cur: selectedCurrency });
    }finally{
      PAY_INFLIGHT = false;
      if (payBtn) payBtn.disabled = !(selectedPlan && WALLET.connected) || PAY_INFLIGHT;
      setWalletUi();
    }
  }

  function renderWalletStatus(sub){
    const el = $("w_status_desc");
    if (!el) return;
    if (!sub){
      el.innerHTML = `<span class="muted">Status unknown.</span>`;
      return;
    }
    if (sub.active){
      const until = sub.paidUntil ? ` (until ${escapeHtml(String(sub.paidUntil))})` : "";
      el.innerHTML = `<span class="ok">Pro active</span>${until}`;
    } else {
      el.innerHTML = `<span class="muted">Free</span>`;
    }
  }

  function bindWalletTab(){
    // currency buttons
    const bSol = $("token_SOL");
    const bUsdc = $("token_USDC");
    const bUsdt = $("token_USDT");
    if (bSol) bSol.onclick = ()=>setCurrency("SOL");
    if (bUsdc) bUsdc.onclick = ()=>setCurrency("USDC");
    if (bUsdt) bUsdt.onclick = ()=>setCurrency("USDT");

    // modal
    __gmxModals.bindBackdrop("sf_modal", closeWalletModal);
    const close = $("sf_modal_close");
    if (close) close.onclick = ()=>closeWalletModal();


    // plan compare modal
    const pc = $("plan_compare_btn");
    const pmClose = $("plan_modal_close");
    if (pc) pc.onclick = ()=>openPlanModal();
    __gmxModals.bindBackdrop("plan_modal", closePlanModal);
    if (pmClose) pmClose.onclick = ()=>closePlanModal();

    // connect/disconnect
    const btnConnect = $("sf_connect");
    const btnDisconnect = $("sf_disconnect");
    if (btnConnect) btnConnect.onclick = ()=>openWalletModal();
    if (btnDisconnect) btnDisconnect.onclick = ()=>disconnectWallet();

    // pay
    const payBtn = $("sf_pay");
    if (payBtn) payBtn.onclick = ()=>payNow();


    // activity
    const actBtn = $("w_activity_refresh");
    if (actBtn) actBtn.onclick = ()=>loadActivity();

    // initial
    setCurrency(selectedCurrency);
    setWalletUi();

    // refresh wallet list on focus (wallet extensions sometimes restart)
    try{
      const check = ()=>{
        if (WALLET.connected){
          const choices = listWalletChoices();
          const stillThere = choices.some(x => walletNameKey(x.name) === walletNameKey(WALLET.name));
          if (!stillThere){
            disconnectWallet();
            toast("warn", "Wallet was updated/restarted. Please reconnect.");
          }
        }
      };
      window.addEventListener("focus", check);
      document.addEventListener("visibilitychange", ()=>{ if (document.visibilityState === "visible") check(); });
    }catch{}
  }


function requireAdminSignedIn(){
  if (!isAdminSignedIn()){
    const m = $("adminMsg");
    if (m) m.innerHTML = '<span class="bad">Sign in first.</span>';
    return false;
  }
  return true;
}
