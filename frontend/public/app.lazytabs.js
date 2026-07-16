(function (global) {
  const ASSET_Q = "?v=SAFE17";

  const TAB_PACKS = {
    leaderboard: ["lib/leaderboard-core.js", "app.leaderboard.js", "app.leaderboardwire.js"],
    prediction: ["app.prediction.js", "app.predictionwire.js"],
    referrals: ["app.referrals.js", "app.referralswire.js"],
    redeem: ["app.redeem.js", "app.redeemwire.js"],
    admin: ["app.admin.js", "app.adminwire.js"],
    wallet: ["app.wallethelpers.js", "app.walletpay.js", "app.walletui.js", "app.walletwire.js"],
  };

  const loaded = new Set();
  const inflight = new Map();

  function loadScript(rel) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-gmx-lazy="${rel}"]`);
      if (existing) {
        if (existing.dataset.gmxLoaded === "1") return resolve();
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`lazy load failed: ${rel}`)), {
          once: true,
        });
        return;
      }
      const el = document.createElement("script");
      el.src = `/${rel}${ASSET_Q}`;
      el.defer = true;
      el.dataset.gmxLazy = rel;
      el.onload = () => {
        el.dataset.gmxLoaded = "1";
        resolve();
      };
      el.onerror = () => reject(new Error(`lazy load failed: ${rel}`));
      document.head.appendChild(el);
    });
  }

  async function ensureTabPack(name) {
    const pack = TAB_PACKS[name];
    if (!pack) throw new Error(`unknown tab pack: ${name}`);
    if (loaded.has(name)) return;
    if (inflight.has(name)) return inflight.get(name);

    const run = (async () => {
      for (const rel of pack) await loadScript(rel);
      loaded.add(name);
      inflight.delete(name);
      const hooks = global.__gmxLazyTabHooks;
      const hook = hooks && typeof hooks[name] === "function" ? hooks[name] : null;
      if (hook) await hook();
    })();

    inflight.set(name, run);
    return run;
  }

  global.__gmxEnsureTabPack = ensureTabPack;
  global.__gmxLazyTabPackNames = Object.keys(TAB_PACKS);
  global.__gmxLazyTabScripts = Object.values(TAB_PACKS).flat();
})(window);
