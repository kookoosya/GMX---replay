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

  if (!window.__GMXWalletUiFactory) throw new Error("GMX walletui factory missing");
  const __gmxWalletUi = window.__GMXWalletUiFactory({
    $,
    escapeHtml,
    api,
    modals: __gmxModals,
    toast,
    trackEvent,
    abVariant,
    friendlyUiErrorMessage,
    setPayState,
    openPaySuccess,
    getHandle,
    refreshUsage,
    walletChoiceKey: LS_WALLET_CHOICE,
    wsChain: WS_CHAIN,
    listWalletChoices,
    walletNameKey,
    safeIconSrc,
    defaultWalletIcon,
    shortPk,
    planPricePrimary,
    planPriceSecondary,
    getBilling: () => BILLING,
    setBilling: (v) => { BILLING = v; },
    getSelectedCurrency: () => selectedCurrency,
    setSelectedCurrency: (v) => { selectedCurrency = v; },
    getSelectedPlanKey: () => selectedPlanKey,
    setSelectedPlanKey: (v) => { selectedPlanKey = v; },
    getSelectedPlan: () => selectedPlan,
    setSelectedPlan: (v) => { selectedPlan = v; },
    getWallet: () => WALLET,
    bindWalletToIntent,
    buildPaymentTx,
    walletSendTransaction,
    verifyIntentWithRetry,
  });

  const setWalletUi = () => __gmxWalletUi.setWalletUi();
  const loadPlans = () => __gmxWalletUi.loadPlans();
  const loadBillingProof = () => __gmxWalletUi.loadBillingProof();
  const loadActivity = () => __gmxWalletUi.loadActivity();
  const renderWalletStatus = (sub) => __gmxWalletUi.renderWalletStatus(sub);
  const bindWalletTab = () => __gmxWalletUi.bindWalletTab();

function requireAdminSignedIn(){
  if (!isAdminSignedIn()){
    const m = $("adminMsg");
    if (m) m.innerHTML = '<span class="bad">Sign in first.</span>';
    return false;
  }
  return true;
}
