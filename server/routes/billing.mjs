/** Billing, Solana payments, custom wallpapers, arcade cover, redeem. */

export function registerBillingRoutes({
  app,
  requireAuth,
  sendError,
  ERROR_CODES,
  BILLING_PLANS,
  BILLING_TOKENS,
  SOL_RECEIVER,
  isSolanaPubkey,
  getSolUsd,
  quoteSolLamportsFromUsd,
  safeDb,
  db,
  nowIso,
  randHex,
  userByHandle,
  subscriptionInfo,
  logActivity,
  grantReferralReward,
  referralCountActive,
  referralRewardTotal,
  computeReferralUnlocks,
  PUBLIC_DIR,
  ASSETS_DIR,
  path,
  fs,
  crypto,
  fetch,
}) {
  app.get("/api/billing/plans", async (req, res) => {
    // Public RPC for client-side transaction submission.
    // Can be a load-balanced endpoint (Helius/QuickNode/etc.).
    const rpcPublic =
      process.env.SOLANA_RPC_PUBLIC ||
      process.env.SOLANA_RPC ||
      "https://api.mainnet-beta.solana.com";
    let solUsd = 0;
    try { solUsd = await getSolUsd(); } catch { solUsd = 0; }

    const plans = BILLING_PLANS.map((p) => {
      const lamports = solUsd > 0 ? quoteSolLamportsFromUsd(p.usd, solUsd) : 0n;
      const solApprox = lamports > 0n ? Number(lamports) / 1_000_000_000 : 0;
      return { ...p, solApprox, currencyBase: "USD" };
    });

    if (!isSolanaPubkey(SOL_RECEIVER)) {
      return res.status(503).json({
        ok: false,
        error: "billing_receiver_not_configured",
        message: "Set SOL_RECEIVER in server environment to enable payments.",
        plans: [],
        tokens: BILLING_TOKENS,
        solUsd,
        rpcPublic,
      });
    }

    res.json({ ok: true, receiver: SOL_RECEIVER, plans, tokens: BILLING_TOKENS, solUsd, rpcPublic, receiverOk: true });
  });


  function arcadeCoverAllowedSource(src) {
    const value = String(src || "").trim();
    if (!value) return false;
    try {
      const url = new URL(value);
      const host = String(url.hostname || "").toLowerCase();
      return host === "images.crazygames.com" || host === "imgs.crazygames.com" || host === "images.unsplash.com";
    } catch {
      return false;
    }
  }

  const CUSTOM_WALLPAPERS_SITE = path.join(ASSETS_DIR, "wallpapers", "custom");
  const CUSTOM_WALLPAPERS_EXT = path.join(ASSETS_DIR, "extbg", "custom");
  const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;
  function listCustomWallpapers(dir) {
    try {
      if (!fs.existsSync(dir)) return [];
      const files = fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).sort();
      return files.map((f, i) => ({
        id: "custom_" + f,
        name: "Custom #" + (i + 1),
        file: f,
      }));
    } catch {
      return [];
    }
  }
  app.get("/api/wallpapers/custom", (req, res) => {
    try {
      const site = listCustomWallpapers(CUSTOM_WALLPAPERS_SITE);
      const ext = listCustomWallpapers(CUSTOM_WALLPAPERS_EXT);
      res.json({ ok: true, site, ext });
    } catch (e) {
      console.error("WALLPAPERS_CUSTOM_ERROR", e);
      res.status(500).json({ ok: false, error: "list_failed" });
    }
  });

  app.get("/api/arcade/cover", async (req, res) => {
    try {
      const src = String(req.query?.src || "").trim();
      if (!arcadeCoverAllowedSource(src)) return res.status(400).json({ ok:false, error:"invalid_src" });
      const upstream = await fetch(src, {
        headers: {
          "User-Agent": "GMXReply/arcade-cover-proxy",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Referer": "https://www.gmxreply.com/arcade.html",
        }
      });
      if (!upstream.ok) return res.status(502).json({ ok:false, error:"cover_fetch_failed" });
      const contentType = String(upstream.headers.get("content-type") || "image/png");
      const cacheControl = String(upstream.headers.get("cache-control") || "public, max-age=21600");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", cacheControl.includes("max-age") ? cacheControl : "public, max-age=21600");
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    } catch (e) {
      console.error("ARCADE_COVER_PROXY_ERROR", e);
      res.status(502).json({ ok:false, error:"cover_fetch_failed" });
    }
  });

  function toTxContext(result) {
    if (!result) return null;
    const v = result.value != null ? result.value : result;
    const blockhash = String(v.blockhash || "");
    if (!blockhash) return null;
    return {
      ok: true,
      blockhash,
      lastValidBlockHeight: Number(v.lastValidBlockHeight || 0) || undefined,
    };
  }

  async function latestBlockhashHandler(_req, res) {
    try {
      const result = await solanaRpcRequest("getLatestBlockhash", [{ commitment: "finalized" }]);
      const ctx = toTxContext(result);
      if (!ctx) return res.status(503).json({ ok: false, error: "solana_rpc_unavailable" });
      res.json(ctx);
    } catch (e) {
      console.error("SOLANA_BLOCKHASH_ERROR", e);
      res.status(503).json({ ok: false, error: "solana_rpc_unavailable" });
    }
  }

  app.get("/api/solana/latest-blockhash", requireAuth, latestBlockhashHandler);
  app.get("/api/billing/tx-context", requireAuth, latestBlockhashHandler);

  app.post("/api/solana/send-raw", requireAuth, async (req, res) => {
    try {
      let raw = req.body?.raw;
      if (Array.isArray(raw)) raw = Buffer.from(raw).toString("base64");
      raw = String(raw || "").trim();
      if (!raw) return res.status(400).json({ ok:false, error:"raw_required" });

      const opts = {
        encoding: "base64",
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      };
      const sig = await solanaRpcRequest("sendTransaction", [raw, opts]);
      res.json({ ok:true, sig });
    } catch (e) {
      console.error("SOLANA_SEND_RAW_ERROR", e);
      res.status(503).json({ ok:false, error:"solana_rpc_unavailable" });
    }
  });

  app.post("/api/billing/intent", requireAuth, async (req, res) => {
    try {
      if (!isSolanaPubkey(SOL_RECEIVER)) {
        return res.status(503).json({ ok: false, error: "billing_receiver_not_configured" });
      }
      const handle = req.user?.handle || null;
      const planKey = String(req.body?.planKey || "").trim();
      const currency = String(req.body?.currency || "SOL").trim().toUpperCase();

      const plan = BILLING_PLANS.find((p) => p.key === planKey);
      if (!plan) return res.status(400).json({ ok:false, error:"invalid_plan" });

      const token = BILLING_TOKENS.find((t) => t.key === currency);
      if (!token) return res.status(400).json({ ok:false, error:"invalid_currency" });

      const now = new Date();
      const createdAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

      let amountBase = 0n;
      let amountUi = "0";
      let solUsd = 0;
      let mint = null;

      if (token.kind === "native") {
        solUsd = await getSolUsd();
        amountBase = quoteSolLamportsFromUsd(plan.usd, solUsd);
        if (amountBase <= 0n) {
          return res.status(503).json({ ok:false, error:"price_unavailable" });
        }
        amountUi = uiFromBaseUnits(amountBase.toString(), 9);
      } else {
        mint = String(token.mint || "").trim();
        const base = BigInt(Math.round(Number(plan.usd) * 1e6));
        amountBase = base;
        amountUi = String(plan.usd);
      }

      const intentId = randHex(12);
      const nonce = randHex(16);
      const bindMessage = buildBillingBindMessage(handle, intentId, nonce);

      // Garbage collect old intents.
      safeDb(() => {
        db.prepare("DELETE FROM billing_intents WHERE expires_at < ?").run(new Date(now.getTime() - 24*3600*1000).toISOString());
      });

      safeDb(() => {
        db.prepare(
          "INSERT INTO billing_intents(id, handle, plan, currency, mint, amount_base, sol_usd, created_at, expires_at, used_sig, nonce, nonce_sig, status, payer, confirmed_at) VALUES(?,?,?,?,?,?,?,?,?,NULL,?,NULL,'created',NULL,NULL)"
        ).run(intentId, handle, plan.key, currency, mint, amountBase.toString(), solUsd || null, createdAt, expiresAt, nonce);
      });

      logActivity(handle, 'billing_intent_created', { intentId, plan: plan.key, currency });

      res.json({
        ok:true,
        id: intentId,
        intentId,
        receiver: SOL_RECEIVER,
        plan: { ...plan },
        currency,
        mint,
        decimals: Number(token.decimals || 0),
        amountBase: amountBase.toString(),
        amountUi,
        solUsd: solUsd || 0,
        createdAt,
        expiresAt,
        nonce,
        bindMessage,
        bindRequired: true,
      });
    } catch (e) {
      console.error("BILLING_INTENT_ERROR", e);
      res.status(500).json({ ok:false, error:"server_error" });
    }
  });


  function maskHandleForProof(h) {
    const t = String(h || "").trim();
    if (!t) return "";
    // Keep just a little bit for social proof without doxxing.
    if (t.length <= 4) return t.slice(0, 1) + "…" + t.slice(-1);
    return t.slice(0, 2) + "…" + t.slice(-2);
  }
  function shortSigForProof(sig) {
    const s = String(sig || "").trim();
    if (!s) return "";
    if (s.length <= 12) return s;
    return s.slice(0, 6) + "…" + s.slice(-6);
  }

  app.get("/api/billing/proof", (req, res) => {
    try {
      let limit = Number(req.query?.limit ?? 8);
      if (!Number.isFinite(limit)) limit = 8;
      limit = Math.max(1, Math.min(20, Math.floor(limit)));

      const totalPayments =
        safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM payments").get()?.c || 0);

      const totalPayers =
        safeDb(() => db.prepare("SELECT COUNT(DISTINCT handle) AS c FROM payments").get()?.c || 0);

      const recent = safeDb(() =>
        db.prepare(
          "SELECT sig, handle, plan, currency, amount, created_at FROM payments ORDER BY created_at DESC LIMIT ?"
        ).all(limit)
      ) || [];

      res.json({
        ok: true,
        receiver: SOL_RECEIVER,
        totalPayments,
        totalPayers,
        recent: recent.map(r => ({
          handle: maskHandleForProof(r.handle),
          plan: r.plan,
          currency: r.currency || "SOL",
          amount: r.amount,
          createdAt: r.created_at,
          tx: shortSigForProof(r.sig)
        })),
      });
    } catch (e) {
      console.error("BILLING_PROOF_ERROR", e);
      res.status(500).json({ ok:false, error:"server_error" });
    }
  });


  function extractSig(input) {
    const s = String(input || "").trim();
    if (!s) return "";
    const m = s.match(/([A-Za-z0-9]{40,})/g);
    if (!m) return "";
    return m.sort((a,b)=>b.length-a.length)[0];
  }

  function solanaRpcUrls() {
    const seen = new Set();
    const out = [];
    const push = (raw) => {
      const value = String(raw || "").trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      out.push(value);
    };
    push(process.env.SOLANA_RPC);
    push(process.env.SOLANA_RPC_PUBLIC);
    // Hard fallback: if a custom RPC returns 403 / rate-limit / bad gateway,
    // keep checkout alive with the canonical public endpoint.
    push("https://api.mainnet-beta.solana.com");
    return out;
  }

  async function solanaRpcRequest(method, params) {
    if (String(process.env.GMX_SOLANA_RPC_MOCK || "").trim() === "1") {
      if (method === "getLatestBlockhash") {
        return {
          value: {
            blockhash: "MockBlockhashForTests111111111111111111111111111",
            lastValidBlockHeight: 999_999_999,
          },
        };
      }
      if (method === "sendTransaction") return "MockTransactionSignatureForTests1111111111";
      if (method === "getTransaction") return null;
    }
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method,
      params: Array.isArray(params) ? params : [],
    };
    let lastErr = null;
    for (const rpc of solanaRpcUrls()) {
      try {
        const r = await fetch(rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || j.error) {
          const err = new Error("solana_rpc_unavailable");
          err.status = r.status;
          err.detail = j?.error || null;
          err.rpc = rpc;
          lastErr = err;
          continue;
        }
        return j.result;
      } catch (e) {
        const err = (e instanceof Error) ? e : new Error("solana_rpc_unavailable");
        err.rpc = rpc;
        lastErr = err;
      }
    }
    throw lastErr || new Error("solana_rpc_unavailable");
  }

  async function solanaGetTransaction(sig) {
    try {
      return await solanaRpcRequest("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
    } catch {
      return null;
    }
  }

  function lamportsToSol(lamports) {
    return Number(lamports) / 1_000_000_000;
  }

  function collectParsedTransferLamports(ix, receiver, payer) {
    // Works for jsonParsed instructions (system transfer)
    try {
      if (ix?.parsed?.type !== "transfer") return 0;
      const info = ix.parsed.info || {};
      const dest = info.destination;
      const src = info.source;
      const lamports = Number(info.lamports || 0);
      if (dest !== receiver) return 0;
      if (payer && src !== payer) return 0;
      if (lamports > 0) return lamports;
    } catch {}
    return 0;
  }

  async function verifySolPayment(sig, receiver, minSol, payer) {
    const tx = await solanaGetTransaction(sig);
    if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };

    // Must be a successful transaction
    if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

    const msg = tx.transaction.message;
    const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

    // Inner instructions (CPI) can contain the actual transfer; include them.
    const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
    const innerInst = [];
    for (const g of inner) {
      const arr = Array.isArray(g?.instructions) ? g.instructions : [];
      for (const ix of arr) innerInst.push(ix);
    }

    let paidLamports = 0;
    for (const ix of topInst) paidLamports += collectParsedTransferLamports(ix, receiver, payer);
    for (const ix of innerInst) paidLamports += collectParsedTransferLamports(ix, receiver, payer);

    if (payer && paidLamports <= 0) return { ok:false, reason:"payer_mismatch" };

    const paidSol = lamportsToSol(paidLamports);
    if (paidSol + 1e-9 < minSol) return { ok:false, reason:"amount_too_low", paidSol };

    return { ok:true, paidSol };
  }

  function txHasSigner(tx, signer) {
    const want = String(signer || "").trim();
    if (!want) return false;
    const keys = tx?.transaction?.message?.accountKeys || [];
    for (const k of keys) {
      if (typeof k === "string") {
        if (k === want) return true;
      } else {
        const pk = String(k?.pubkey || "");
        const isSigner = !!k?.signer;
        if (pk === want && isSigner) return true;
      }
    }
    return false;
  }

  const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

  function b58DecodeToBuf(str){
    try{
      const ALPH = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const MAP = new Map(ALPH.split("").map((c,i)=>[c,i]));
      let bytes = [0];
      for (const ch of String(str||"")){
        const val = MAP.get(ch);
        if (val == null) return null;
        let carry = val;
        for (let i=0;i<bytes.length;i++){
          carry += bytes[i] * 58;
          bytes[i] = carry & 0xff;
          carry >>= 8;
        }
        while (carry > 0){
          bytes.push(carry & 0xff);
          carry >>= 8;
        }
      }
      // deal with leading zeros
      let zeros = 0;
      for (const ch of String(str||"")){
        if (ch === "1") zeros++;
        else break;
      }
      while (zeros-- > 0) bytes.push(0);
      bytes.reverse();
      return Buffer.from(bytes);
    }catch{
      return null;
    }
  }

  function txExtractMemoStrings(tx){
    const out = [];
    const add = (ix)=>{
      try{
        const program = String(ix?.program || "");
        const pid = String(ix?.programId || "");
        const isMemo = (program === "spl-memo") || (pid === MEMO_PROGRAM_ID);
        if (!isMemo) return;

        const p = ix?.parsed;
        if (typeof p === "string" && p) out.push(p);
        if (p && typeof p === "object"){
          if (typeof p.memo === "string" && p.memo) out.push(p.memo);
          if (p.info && typeof p.info.memo === "string" && p.info.memo) out.push(p.info.memo);
        }

        // Fallback: raw data (base58) to utf8
        const data = ix?.data;
        if (typeof data === "string" && data){
          const buf = b58DecodeToBuf(data);
          if (buf){
            const s = buf.toString("utf8").replace(/\0/g, "").trim();
            if (s) out.push(s);
          }
        }
      }catch{}
    };

    const topInst = Array.isArray(tx?.transaction?.message?.instructions) ? tx.transaction.message.instructions : [];
    for (const ix of topInst) add(ix);

    const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
    for (const g of inner){
      const arr = Array.isArray(g?.instructions) ? g.instructions : [];
      for (const ix of arr) add(ix);
    }
    return out;
  }

  function txHasIntentMemo(tx, intentId){
    const want = `GMXReply|${String(intentId||"").trim()}`;
    if (!want || want.endsWith("|")) return false;
    const memos = txExtractMemoStrings(tx);
    return memos.some(m => String(m||"").includes(want));
  }

  function buildBillingBindMessage(handle, intentId, nonce){
    const h = String(handle || "").trim();
    const id = String(intentId || "").trim();
    const n = String(nonce || "").trim();
    if (!h || !id || !n) return "";
    return `GMXReply|bind|${id}|${n}|${h}`;
  }

  function verifySolanaMessageSignature(message, wallet, sig58){
    try{
      const pub = b58DecodeToBuf(wallet);
      const sig = b58DecodeToBuf(sig58);
      if (!pub || pub.length !== 32) return false;
      if (!sig || sig.length !== 64) return false;
      const spki = Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        pub,
      ]);
      const key = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
      const msg = Buffer.from(String(message || ""), "utf8");
      return crypto.verify(null, msg, key, sig);
    }catch{
      return false;
    }
  }

  function verifySolPaymentLamportsTx(tx, receiver, minLamports, payer){
    try{
      if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
      if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

      const msg = tx.transaction.message;
      const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

      const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
      const innerInst = [];
      for (const g of inner){
        const arr = Array.isArray(g?.instructions) ? g.instructions : [];
        for (const ix of arr) innerInst.push(ix);
      }

      const need = BigInt(String(minLamports || "0"));
      let paid = 0n;

      const add = (ix) => {
        try{
          if (ix?.parsed?.type !== "transfer") return;
          const info = ix.parsed.info || {};
          const dest = String(info.destination || "");
          const src = String(info.source || "");
          if (dest !== receiver) return;
          if (payer && src !== payer) return;
          const lamports = BigInt(String(info.lamports || "0"));
          if (lamports > 0n) paid += lamports;
        }catch{}
      };

      for (const ix of topInst) add(ix);
      for (const ix of innerInst) add(ix);

      if (payer && paid <= 0n) return { ok:false, reason:"payer_mismatch" };
      if (paid < need) return { ok:false, reason:"amount_too_low", paidLamports: paid.toString() };
      return { ok:true, paidLamports: paid.toString() };
    }catch(e){
      return { ok:false, reason:"verify_failed" };
    }
  }

  function verifySplTokenPaymentTx(tx, receiverOwner, mint, minBase, payer){
    try{
      if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
      if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };
      if (payer && !txHasSigner(tx, payer)) return { ok:false, reason:"payer_mismatch" };

      const pre = sumTokenBalancesByOwnerMint(tx?.meta?.preTokenBalances, receiverOwner, mint);
      const post = sumTokenBalancesByOwnerMint(tx?.meta?.postTokenBalances, receiverOwner, mint);
      const delta = post - pre;
      const need = BigInt(String(minBase || "0"));
      if (delta < need) return { ok:false, reason:"amount_too_low", paidBase: delta.toString() };
      return { ok:true, paidBase: delta.toString() };
    }catch(e){
      return { ok:false, reason:"verify_failed" };
    }
  }

  function sumTokenBalancesByOwnerMint(arr, owner, mint) {
    let sum = 0n;
    const ow = String(owner || "").trim();
    const mi = String(mint || "").trim();
    if (!ow || !mi) return 0n;
    for (const b of Array.isArray(arr) ? arr : []) {
      if (String(b?.owner || "") !== ow) continue;
      if (String(b?.mint || "") !== mi) continue;
      const a = b?.uiTokenAmount?.amount;
      if (a == null) continue;
      try { sum += BigInt(String(a)); } catch {}
    }
    return sum;
  }

  async function verifySplTokenPayment(sig, receiverOwner, mint, minBase, payer) {
    const tx = await solanaGetTransaction(sig);
    if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
    if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };
    if (payer && !txHasSigner(tx, payer)) return { ok:false, reason:"payer_mismatch" };

    const pre = sumTokenBalancesByOwnerMint(tx?.meta?.preTokenBalances, receiverOwner, mint);
    const post = sumTokenBalancesByOwnerMint(tx?.meta?.postTokenBalances, receiverOwner, mint);
    const delta = post - pre;
    const need = BigInt(String(minBase || "0"));
    if (delta < need) {
      return { ok:false, reason:"amount_too_low", paidBase: delta.toString() };
    }
    return { ok:true, paidBase: delta.toString() };
  }

  async function verifySolPaymentLamports(sig, receiver, minLamports, payer) {
    const tx = await solanaGetTransaction(sig);
    if (!tx?.transaction?.message) return { ok:false, reason:"tx_not_found" };
    if (tx?.meta?.err) return { ok:false, reason:"tx_failed", err: tx.meta.err };

    const msg = tx.transaction.message;
    const topInst = Array.isArray(msg.instructions) ? msg.instructions : [];

    const inner = Array.isArray(tx?.meta?.innerInstructions) ? tx.meta.innerInstructions : [];
    const innerInst = [];
    for (const g of inner) {
      const arr = Array.isArray(g?.instructions) ? g.instructions : [];
      for (const ix of arr) innerInst.push(ix);
    }

    const need = BigInt(String(minLamports || "0"));
    let paid = 0n;

    const add = (ix) => {
      try {
        if (ix?.parsed?.type !== "transfer") return;
        const info = ix.parsed.info || {};
        const dest = String(info.destination || "");
        const src = String(info.source || "");
        if (dest !== receiver) return;
        if (payer && src !== payer) return;
        const lamports = BigInt(String(info.lamports || "0"));
        if (lamports > 0n) paid += lamports;
      } catch {}
    };

    for (const ix of topInst) add(ix);
    for (const ix of innerInst) add(ix);

    if (payer && paid <= 0n) return { ok:false, reason:"payer_mismatch" };
    if (paid < need) return { ok:false, reason:"amount_too_low", paidLamports: paid.toString() };
    return { ok:true, paidLamports: paid.toString() };
  }

  app.post("/api/billing/bind", requireAuth, async (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const intentId = String(req.body?.intentId || "").trim();
      const wallet = String(req.body?.wallet || "").trim();
      const nonceSig = String(req.body?.nonceSig || "").trim();

      if (!intentId) return res.status(400).json({ ok:false, error:"intent_required" });
      if (!wallet) return res.status(400).json({ ok:false, error:"payer_required" });
      if (!isSolanaPubkey(wallet)) return res.status(400).json({ ok:false, error:"invalid_payer" });
      if (!nonceSig) return res.status(400).json({ ok:false, error:"invalid_nonce_sig" });

      const intent = safeDb(() =>
        db.prepare(
          "SELECT id, handle, expires_at, used_sig, payer, status, nonce, nonce_sig FROM billing_intents WHERE id=?"
        ).get(intentId)
      );
      if (!intent) return res.status(404).json({ ok:false, error:"invalid_intent" });
      if (String(intent.handle).toLowerCase() !== String(handle).toLowerCase()) {
        return res.status(403).json({ ok:false, error:"intent_handle_mismatch" });
      }
      if (intent.used_sig) return res.status(409).json({ ok:false, error:"intent_already_used" });
      if (intent.expires_at && new Date(intent.expires_at) < new Date()) {
        return res.status(410).json({ ok:false, error:"intent_expired" });
      }

      const existingWallet = String(intent.payer || "").trim();
      const existingSig = String(intent.nonce_sig || "").trim();
      if (String(intent.status || "") === "bound" && existingWallet) {
        if (existingWallet === wallet && existingSig && existingSig === nonceSig) {
          return res.json({ ok:true, bound:true, wallet, reused:true });
        }
        if (existingWallet !== wallet) {
          return res.status(409).json({ ok:false, error:"intent_already_bound" });
        }
      }

      const msg = buildBillingBindMessage(intent.handle, intent.id, intent.nonce);
      if (!msg) return res.status(409).json({ ok:false, error:"wallet_bind_required" });
      if (!verifySolanaMessageSignature(msg, wallet, nonceSig)) {
        return res.status(400).json({ ok:false, error:"invalid_nonce_sig" });
      }

      safeDb(() => {
        db.prepare("UPDATE billing_intents SET payer=?, nonce_sig=?, status='bound' WHERE id=?")
          .run(wallet, nonceSig, intentId);
      });

      logActivity(handle, 'billing_wallet_bound', { intentId, wallet: `${wallet.slice(0,4)}…${wallet.slice(-4)}` });

      res.json({ ok:true, bound:true, wallet });
    } catch (e) {
      console.error("BILLING_BIND_ERROR", e);
      res.status(500).json({ ok:false, error:"server_error" });
    }
  });

  app.post("/api/billing/verify", requireAuth, async (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const intentId = String(req.body?.intentId || "").trim();
      const sig = extractSig(req.body?.sig);
      const payer = String(req.body?.payer || "").trim();

      if (!intentId) return res.status(400).json({ ok:false, error:"intent_required" });
      if (!sig) return res.status(400).json({ ok:false, error:"invalid_sig" });
      if (!payer) return res.status(400).json({ ok:false, error:"payer_required" });
      if (!isSolanaPubkey(payer)) return res.status(400).json({ ok:false, error:"invalid_payer" });

      const exists = safeDb(() => db.prepare("SELECT 1 FROM payments WHERE sig=?").get(sig));
      if (exists) return res.status(409).json({ ok:false, error:"sig_already_used" });

      const intent = safeDb(() =>
        db.prepare(
          "SELECT id, handle, plan, currency, mint, amount_base, expires_at, used_sig, status, payer, nonce, nonce_sig FROM billing_intents WHERE id=?"
        ).get(intentId)
      );
      if (!intent) return res.status(404).json({ ok:false, error:"invalid_intent" });
      if (String(intent.handle).toLowerCase() !== String(handle).toLowerCase()) {
        return res.status(403).json({ ok:false, error:"intent_handle_mismatch" });
      }
      if (intent.used_sig) return res.status(409).json({ ok:false, error:"intent_already_used" });
      const now = new Date();
      if (intent.expires_at && new Date(intent.expires_at) < now) {
        return res.status(410).json({ ok:false, error:"intent_expired" });
      }

      const boundWallet = String(intent.payer || "").trim();
      if (String(intent.status || "") !== "bound" || !boundWallet || !String(intent.nonce_sig || "").trim() || !String(intent.nonce || "").trim()) {
        return res.status(409).json({ ok:false, error:"wallet_bind_required" });
      }
      if (boundWallet !== payer) {
        return res.status(400).json({ ok:false, error:"payment_intent_mismatch" });
      }

      const plan = BILLING_PLANS.find((p) => p.key === String(intent.plan));
      if (!plan) return res.status(400).json({ ok:false, error:"invalid_plan" });

      const currency = String(intent.currency || "SOL").toUpperCase();
      const token = BILLING_TOKENS.find((t) => t.key === currency);
      if (!token) return res.status(400).json({ ok:false, error:"invalid_currency" });
      const expectedBase = BigInt(String(intent.amount_base || "0"));
      if (expectedBase <= 0n) return res.status(400).json({ ok:false, error:"invalid_amount" });

      // Fetch transaction once (prevents race-claim) + require Memo binding to intent
      const tx = await solanaGetTransaction(sig);
      if (!tx?.transaction?.message) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:{ ok:false, reason:"tx_not_found" } });
      if (tx?.meta?.err) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:{ ok:false, reason:"tx_failed", err: tx.meta.err } });

      // Anti-claim theft: tx must include Memo "GMXReply|<intentId>"
      if (!txHasIntentMemo(tx, intentId)) {
        return res.status(400).json({ ok:false, error:"payment_intent_mismatch" });
      }

      let v = { ok:false, reason:"unknown" };
      if (token.kind === "native") {
        v = verifySolPaymentLamportsTx(tx, SOL_RECEIVER, expectedBase.toString(), payer);
      } else {
        const mint = String(intent.mint || token.mint || "").trim();
        if (!mint) return res.status(400).json({ ok:false, error:"mint_required" });
        v = verifySplTokenPaymentTx(tx, SOL_RECEIVER, mint, expectedBase.toString(), payer);
      }
      if (!v.ok) return res.status(400).json({ ok:false, error:"payment_not_verified", detail:v });

      const amountUi = token.kind === "native"
        ? uiFromBaseUnits(expectedBase.toString(), 9)
        : uiFromBaseUnits(expectedBase.toString(), 6);
      const amountNum = Number(amountUi || "0") || 0;

      safeDb(() => {
        db.prepare(
          "INSERT INTO payments(sig, handle, plan, currency, mint, amount, amount_base, payer, created_at) VALUES(?,?,?,?,?,?,?,?,?)"
        ).run(sig, handle, plan.key, currency, token.kind === "native" ? null : String(intent.mint || token.mint), amountNum, expectedBase.toString(), payer, nowIso());
      });
      safeDb(() => {
        db.prepare("UPDATE billing_intents SET used_sig=?, status='confirmed', payer=?, confirmed_at=? WHERE id=?").run(sig, payer, nowIso(), intentId);
      });

      logActivity(handle, 'payment_verified', { plan: plan.key, currency, amountUi });

      safeDb(() => {
        const u = userByHandle(handle);
        const now = new Date();
        const cur = u?.paid_until ? new Date(u.paid_until) : null;
        const base = cur && cur > now ? cur : now;
        const next = new Date(base.getTime() + plan.days * 24*3600*1000);

        db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?")
          .run(next.toISOString(), nowIso(), handle);
      });

      const u2 = userByHandle(handle);
      res.json({
        ok:true,
        sub: subscriptionInfo({ ...u2, handle }),
        paid: {
          currency,
          amountUi,
          amountBase: expectedBase.toString(),
          verified: v,
        }
      });
    } catch (e) {
      console.error("BILLING_VERIFY_ERROR", e);
      res.status(500).json({ ok:false, error:"server_error" });
    }
  });

  app.post("/api/billing/redeem", requireAuth, (req, res) => {
    try {
      const handle = req.user?.handle || null;
      const code = String(req.body?.code || "").trim();
      if (!code || code.length < 6) return res.status(400).json({ ok:false, error:"invalid_code" });

      const row = safeDb(() => db.prepare("SELECT code, tier, days, grant_type, grant_value FROM admin_codes WHERE code=?").get(code));
      if (!row) return res.status(404).json({ ok:false, error:"code_not_found" });

      const used = safeDb(() => db.prepare("SELECT 1 FROM code_redemptions WHERE code=?").get(code));
      if (used) return res.status(409).json({ ok:false, error:"code_already_redeemed" });

      safeDb(() => {
        db.prepare("INSERT INTO code_redemptions(code, handle, created_at) VALUES(?,?,?)")
          .run(code, handle, nowIso());
      });

      const grantType = String(row.grant_type || 'subscription').trim();

      if (grantType === 'eligible_credit') {
        const grantValue = Math.max(0, Number(row.grant_value || 0) || 0);
        grantReferralReward(handle, 'eligible_credit', grantValue, 'admin_code', code, { code, grantType, grantValue });
        logActivity(handle, 'code_redeemed', { code, grantType, grantValue });
        const starterBgSlots = referralRewardTotal(handle, 'starter_bg_slot');
        const uNow = userByHandle(handle) || { handle };
        const refCodeNow = String(uNow?.ref_code || '').trim();
        const legacyEligibleNow = refCodeNow ? (safeDb(() => db.prepare("SELECT COUNT(*) AS c FROM referrals WHERE code=?").get(refCodeNow)?.c || 0) || 0) : 0;
        const earnedEligibleNow = Math.max(referralCountActive(handle), legacyEligibleNow);
        const totalEligibleNow = earnedEligibleNow + referralRewardTotal(handle, 'eligible_credit');
        const unlocks = computeReferralUnlocks(totalEligibleNow, starterBgSlots);
        return res.json({ ok:true, sub: subscriptionInfo({ ...(uNow||{}), handle }), grant: { grantType, grantValue }, unlocks });
      }

      safeDb(() => {
        const days = Number(row.days || 0);
        if (row.tier === "unlimited" || days === 0) {
          db.prepare("UPDATE users SET tier='unlimited', paid_until=NULL, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?").run(nowIso(), handle);
          return;
        }
        const u = userByHandle(handle);
        const now = new Date();
        const cur = u?.paid_until ? new Date(u.paid_until) : null;
        const base = cur && cur > now ? cur : now;
        const next = new Date(base.getTime() + days * 24*3600*1000);
        db.prepare("UPDATE users SET tier='paid', paid_until=?, sub_status='active', grace_until=NULL, blocked_reason=NULL, sub_updated_at=? WHERE handle=?").run(next.toISOString(), nowIso(), handle);
      });

      logActivity(handle, 'code_redeemed', { code, tier: row.tier, days: Number(row.days||0), grantType });
      const u2 = userByHandle(handle);
      res.json({ ok:true, sub: subscriptionInfo({ ...u2, handle }) });
    } catch (e) {
      console.error("REDEEM_ERROR", e);
      res.status(500).json({ ok:false, error:"server_error" });
    }
  });



  // Bootstrap admin (one-time). If no admin is configured yet, the current authenticated user becomes admin.
  // SECURITY (P0): requires X-Admin-Key (ADMIN_SECRET) to avoid public claiming.

}
