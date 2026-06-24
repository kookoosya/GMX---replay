(function (window) {
  if (window.__GMXWalletHelpersFactory) return;

  const B58_ALPH = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const BILLING_MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  const WS_CHAIN = "solana:mainnet";

  window.__GMXWalletHelpersFactory = function createGMXWalletHelpers() {
    function b58encode(bytes) {
      try {
        const src = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        if (!src.length) return "";
        let digits = [0];
        for (let i = 0; i < src.length; i++) {
          let carry = src[i];
          for (let j = 0; j < digits.length; j++) {
            const x = (digits[j] << 8) + carry;
            digits[j] = x % 58;
            carry = (x / 58) | 0;
          }
          while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
          }
        }
        let str = "";
        for (let k = 0; k < src.length && src[k] === 0; k++) str += "1";
        for (let q = digits.length - 1; q >= 0; q--) str += B58_ALPH[digits[q]];
        return str;
      } catch {
        return "";
      }
    }

    function walletSigBytes(out) {
      const raw = out?.signature || out?.signedMessage || out?.signatureBytes || out;
      if (raw instanceof Uint8Array) return raw;
      if (ArrayBuffer.isView(raw)) {
        return new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
      }
      if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
      if (Array.isArray(raw)) return new Uint8Array(raw);
      return null;
    }

    function shortPk(pk) {
      try {
        const s = String(pk?.toString?.() || pk || "");
        if (!s) return "";
        return s.slice(0, 4) + "..." + s.slice(-4);
      } catch {
        return "";
      }
    }

    function walletNameKey(name) {
      return String(name || "").trim().toLowerCase();
    }

    function safeIconSrc(icon) {
      const s0 = String(icon || "").trim();
      if (!s0) return "";
      if (s0.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + s0.slice(7);
      const ok = [
        "data:",
        "https://",
        "http://",
        "/assets/",
        "chrome-extension://",
        "moz-extension://",
        "safari-extension://",
        "blob:",
      ];
      if (ok.some((p) => s0.startsWith(p))) return s0;
      return "";
    }

    function defaultWalletIcon(name) {
      const k = walletNameKey(name);
      if (k === "solflare") return "/assets/wallets/solflare.svg";
      if (k === "phantom") return "/assets/wallets/phantom.svg";
      if (k === "backpack") return "/assets/wallets/backpack.svg";
      const txt = String(name || "W").slice(0, 1).toUpperCase();
      const s = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect rx="18" ry="18" width="64" height="64" fill="rgba(14,165,233,1)"/><text x="32" y="40" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-weight="800" font-size="22" fill="white">${txt}</text></svg>`;
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    }

    function getWalletStandardWallets(win) {
      win = win || window;
      try {
        const w = win.navigator?.wallets;
        if (!w) return [];
        if (Array.isArray(w)) return w;
        if (typeof w.get === "function") return w.get() || [];
        if (typeof w.values === "function") return Array.from(w.values());
        if (typeof w[Symbol.iterator] === "function") return Array.from(w);
      } catch {}
      return [];
    }

    function listWalletChoices(win) {
      win = win || window;
      const out = [];
      try {
        const ws = getWalletStandardWallets(win);
        for (const w of ws) {
          if (!w?.features?.["standard:connect"]) continue;
          const chains = w?.chains || [];
          const isSol = chains.some((c) => String(c || "").startsWith("solana:"));
          if (!isSol) continue;
          out.push({
            kind: "standard",
            name: String(w.name || "Wallet"),
            icon: safeIconSrc(w.icon) || defaultWalletIcon(w.name),
            wallet: w,
          });
        }
      } catch {}
      try {
        const p = win.solflare || (win.solana?.isSolflare ? win.solana : null);
        if (p?.connect && (p?.signAndSendTransaction || p?.signTransaction)) {
          out.push({ kind: "legacy", name: "Solflare", icon: defaultWalletIcon("Solflare"), provider: p });
        }
      } catch {}
      try {
        const p = win.solana;
        if (p?.isPhantom && p?.connect && (p?.signAndSendTransaction || p?.signTransaction)) {
          out.push({ kind: "legacy", name: "Phantom", icon: defaultWalletIcon("Phantom"), provider: p });
        }
      } catch {}
      try {
        const p = win.backpack?.solana || (win.solana?.isBackpack ? win.solana : null);
        if (p?.connect && (p?.signAndSendTransaction || p?.signTransaction)) {
          out.push({ kind: "legacy", name: "Backpack", icon: defaultWalletIcon("Backpack"), provider: p });
        }
      } catch {}
      try {
        const p = win.solana;
        if (p?.connect && (p?.signAndSendTransaction || p?.signTransaction) && !p?.isPhantom && !p?.isSolflare && !p?.isBackpack) {
          const nm = String(p?.name || p?.walletName || "Injected Wallet");
          out.push({ kind: "legacy", name: nm, icon: defaultWalletIcon(nm), provider: p });
        }
      } catch {}
      const byName = new Map();
      for (const w of out) {
        const k = walletNameKey(w.name);
        const prev = byName.get(k);
        if (!prev || (prev.kind !== "standard" && w.kind === "standard")) byName.set(k, w);
      }
      const list = Array.from(byName.values());
      const order = ["solflare", "phantom", "backpack"];
      list.sort((a, b) => {
        const ak = walletNameKey(a.name);
        const bk = walletNameKey(b.name);
        const ai = order.indexOf(ak);
        const bi = order.indexOf(bk);
        if (ai !== -1 || bi !== -1) {
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        }
        return String(a.name).localeCompare(String(b.name));
      });
      return list;
    }

    async function signMessageBytes(wallet, messageBytes) {
      const bytes = messageBytes instanceof Uint8Array ? messageBytes : new Uint8Array(messageBytes || []);
      if (!bytes.length) throw new Error("wallet_bind_required");
      if (wallet?.kind === "standard") {
        const w = wallet.wallet;
        const acc = wallet.account;
        const feat = w?.features?.["solana:signMessage"]?.signMessage;
        if (typeof feat !== "function") throw new Error("wallet_no_message_sign");
        const out = await feat({ account: acc, message: bytes });
        const sig = b58encode(walletSigBytes(out) || []);
        if (!sig) throw new Error("wallet_bind_required");
        return sig;
      }
      const p = wallet?.provider;
      if (typeof p?.signMessage === "function") {
        let out = null;
        try {
          out = await p.signMessage(bytes, "utf8");
        } catch {
          out = await p.signMessage(bytes);
        }
        const sig = b58encode(walletSigBytes(out) || []);
        if (!sig) throw new Error("wallet_bind_required");
        return sig;
      }
      throw new Error("wallet_no_message_sign");
    }

    function addIntentMemoInstruction(tx, intentId, web3) {
      const id = String(intentId || "").trim();
      if (!tx || !id || !web3?.TransactionInstruction || !web3?.PublicKey) return;
      tx.add(
        new web3.TransactionInstruction({
          programId: new web3.PublicKey(BILLING_MEMO_PROGRAM_ID),
          keys: [],
          data: new TextEncoder().encode(`GMXReply|${id}`),
        })
      );
    }

    function getRpcUrl(billing) {
      const v = String(billing?.rpcPublic || "").trim();
      if (v && /^https?:\/\//i.test(v)) return v;
      try {
        if (typeof window.solanaWeb3?.clusterApiUrl === "function") {
          return window.solanaWeb3.clusterApiUrl("mainnet-beta");
        }
      } catch {}
      return "https://api.mainnet-beta.solana.com";
    }

    function rpcCandidates(billing) {
      const out = [];
      const push = (url) => {
        const v = String(url || "").trim();
        if (!v || !/^https?:\/\//i.test(v)) return;
        if (!out.includes(v)) out.push(v);
      };
      push(billing?.rpcPublic || "");
      try {
        if (typeof window.solanaWeb3?.clusterApiUrl === "function") {
          push(window.solanaWeb3.clusterApiUrl("mainnet-beta"));
        }
      } catch {}
      push("https://api.mainnet-beta.solana.com");
      return out;
    }

    function shouldRetryRpc(err) {
      const m = String(err?.message || err || "");
      return /403|401|429|access forbidden|blockhash|failed to fetch|network request failed/i.test(m);
    }

    function fmtSol(x) {
      const n = Number(x || 0);
      if (!Number.isFinite(n) || n <= 0) return "";
      if (n < 0.01) return n.toFixed(4);
      if (n < 0.1) return n.toFixed(3);
      return n.toFixed(2);
    }

    function planPricePrimary(plan, currency) {
      if (currency === "SOL") {
        const sol = fmtSol(plan.solApprox || 0);
        return sol ? `${sol} SOL` : "SOL quote unavailable";
      }
      return `$${plan.usd} ${currency}`;
    }

    function planPerMonthUsd(plan) {
      const days = Number(plan?.days || 0);
      const usd = Number(plan?.usd || 0);
      if (!days || !usd) return "";
      if (days >= 365) return (usd / 12).toFixed(2);
      if (days >= 30) return (usd / (days / 30)).toFixed(2);
      return "";
    }

    function planPriceSecondary(plan, currency) {
      const perMo = planPerMonthUsd(plan);
      const perMoTxt = perMo ? `~$${perMo}/mo` : "";
      if (currency === "SOL") {
        const parts = [`$${plan.usd}`];
        if (perMoTxt) parts.push(perMoTxt);
        return parts.join(" · ");
      }
      const sol = fmtSol(plan.solApprox || 0);
      const solTxt = sol ? `≈ ${sol} SOL` : "";
      return [solTxt, perMoTxt].filter(Boolean).join(" · ");
    }

    return {
      BILLING_MEMO_PROGRAM_ID,
      WS_CHAIN,
      b58encode,
      walletSigBytes,
      shortPk,
      walletNameKey,
      safeIconSrc,
      defaultWalletIcon,
      getWalletStandardWallets,
      listWalletChoices,
      signMessageBytes,
      addIntentMemoInstruction,
      getRpcUrl,
      rpcCandidates,
      shouldRetryRpc,
      fmtSol,
      planPricePrimary,
      planPriceSecondary,
    };
  };
})(window);
