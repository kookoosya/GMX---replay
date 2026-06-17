/* eslint-disable */
// @ts-nocheck

declare global {
  interface Window {
    __GMX_APP_SHELL_STARTED?: boolean;
    __GMX_APP_SHELL_BOOT_PROMISE?: Promise<void>;
    __gmxShowTab?: (tab: string) => void;
    __GMX_API_ORIGIN?: string;
  }
}

function injectAppShellRuntime(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        if ((existing as any).__gmxReady === true) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = true;
      script.onload = () => {
        try { (script as any).__gmxReady = true; } catch {}
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    } catch (error: any) {
      reject(error instanceof Error ? error : new Error(String(error || "app shell runtime inject failed")));
    }
  });
}

async function waitForAppShellReady(timeoutMs = 12000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (typeof window.__gmxShowTab === "function") return;
    } catch {}
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  throw new Error("App shell runtime did not expose __gmxShowTab in time");
}

export async function startAppShell() {
  if (window.__GMX_APP_SHELL_STARTED) return;
  if (window.__GMX_APP_SHELL_BOOT_PROMISE) return window.__GMX_APP_SHELL_BOOT_PROMISE;

  window.__GMX_APP_SHELL_BOOT_PROMISE = (async () => {
    // The legacy `/app` expects a few global scripts (mode, entitlements, auth factory)
    // that are normally loaded by `public/app.html`. When rendering via the React shell,
    // we need to inject them explicitly in a safe order.
    await injectAppShellRuntime("/mode.js", "gmx-legacy-mode");
    await injectAppShellRuntime("/entitlements.js", "gmx-legacy-entitlements");
    await injectAppShellRuntime("/app.storage.js", "gmx-legacy-storage");
    await injectAppShellRuntime("/app.format.js", "gmx-legacy-format");
    await injectAppShellRuntime("/app.i18nui.js", "gmx-legacy-i18nui");
    await injectAppShellRuntime("/app.sitei18nui.js", "gmx-legacy-sitei18nui");
    await injectAppShellRuntime("/app.sitei18ndynamic.js", "gmx-legacy-sitei18ndynamic");
    await injectAppShellRuntime("/app.chrome.js", "gmx-legacy-chrome");
    await injectAppShellRuntime("/app.sitemode.js", "gmx-legacy-sitemode");
    await injectAppShellRuntime("/app.modals.js", "gmx-legacy-modals");
    await injectAppShellRuntime("/app.shellerrors.js", "gmx-legacy-shellerrors");
    await injectAppShellRuntime("/app.recover.js", "gmx-legacy-recover");
    await injectAppShellRuntime("/app.langui.js", "gmx-legacy-langui");
    await injectAppShellRuntime("/app.sitelangmenu.js", "gmx-legacy-sitelangmenu");
    await injectAppShellRuntime("/app.i18nbridge.js", "gmx-legacy-i18nbridge");
    await injectAppShellRuntime("/app.tabstate.js", "gmx-legacy-tabstate");
    await injectAppShellRuntime("/app.unlock.js", "gmx-legacy-unlock");
    await injectAppShellRuntime("/app.wallpapers.js", "gmx-legacy-wallpapers");
    await injectAppShellRuntime("/app.wallpaperhelpers.js", "gmx-legacy-wallpaperhelpers");
    await injectAppShellRuntime("/app.wallpaperstore.js", "gmx-legacy-wallpaperstore");
    await injectAppShellRuntime("/app.customwallpapers.js", "gmx-legacy-customwallpapers");
    await injectAppShellRuntime("/app.themes.js", "gmx-legacy-themes");
    await injectAppShellRuntime("/app.themeapply.js", "gmx-legacy-themeapply");
    await injectAppShellRuntime("/app.ui.js", "gmx-legacy-ui");
    await injectAppShellRuntime("/app.uiwire.js", "gmx-legacy-uiwire");
    await injectAppShellRuntime("/app.generate.js", "gmx-legacy-generate");
    await injectAppShellRuntime("/app.bestpick.js", "gmx-legacy-bestpick");
    await injectAppShellRuntime("/app.refstats.js", "gmx-legacy-refstats");
    await injectAppShellRuntime("/app.generateflow.js", "gmx-legacy-generateflow");
    await injectAppShellRuntime("/app.generatewire.js", "gmx-legacy-generatewire");
    await injectAppShellRuntime("/app.generaterunwire.js", "gmx-legacy-generaterunwire");
    await injectAppShellRuntime("/app.banks.js", "gmx-legacy-banks");
    await injectAppShellRuntime("/app.bankswire.js", "gmx-legacy-bankswire");
    await injectAppShellRuntime("/app.bankui.js", "gmx-legacy-bankui");
    await injectAppShellRuntime("/app.bankuiwire.js", "gmx-legacy-bankuiwire");
    await injectAppShellRuntime("/app.bankuirunwire.js", "gmx-legacy-bankuirunwire");
    await injectAppShellRuntime("/app.antirepeat.js", "gmx-legacy-antirepeat");
    await injectAppShellRuntime("/app.genparams.js", "gmx-legacy-genparams");
    await injectAppShellRuntime("/app.cleanfill.js", "gmx-legacy-cleanfill");
    await injectAppShellRuntime("/app.cleanfillrun.js", "gmx-legacy-cleanfillrun");
    await injectAppShellRuntime("/app.cleanfillrunwire.js", "gmx-legacy-cleanfillrunwire");
    await injectAppShellRuntime("/app.styles.js", "gmx-legacy-styles");
    await injectAppShellRuntime("/app.themescatalogwire.js", "gmx-legacy-themescatalogwire");
    await injectAppShellRuntime("/app.procontrols.js", "gmx-legacy-procontrols");
    await injectAppShellRuntime("/app.toggles.js", "gmx-legacy-toggles");
    await injectAppShellRuntime("/app.custombg.js", "gmx-legacy-custombg");
    await injectAppShellRuntime("/app.tabtheme.js", "gmx-legacy-tabtheme");
    await injectAppShellRuntime("/app.logs.js", "gmx-legacy-logs");
    await injectAppShellRuntime("/app.shelldeps.js", "gmx-legacy-shelldeps");
    await injectAppShellRuntime("/app.shelldepswire.js", "gmx-legacy-shelldepswire");
    await injectAppShellRuntime("/app.shelldepsrunwire.js", "gmx-legacy-shelldepsrunwire");
    await injectAppShellRuntime("/app.paywall.js", "gmx-legacy-paywall");
    await injectAppShellRuntime("/app.help.js", "gmx-legacy-help");
    await injectAppShellRuntime("/app.usage.js", "gmx-legacy-usage");
    await injectAppShellRuntime("/app.wallpaperapply.js", "gmx-legacy-wallpaperapply");
    await injectAppShellRuntime("/app.wallpaperui.js", "gmx-legacy-wallpaperui");
    await injectAppShellRuntime("/app.wallpaperupload.js", "gmx-legacy-wallpaperupload");
    await injectAppShellRuntime("/app.themesui.js", "gmx-legacy-themesui");
    await injectAppShellRuntime("/app.health.js", "gmx-legacy-health");
    await injectAppShellRuntime("/app.setbg.js", "gmx-legacy-setbg");
    await injectAppShellRuntime("/app.extview.js", "gmx-legacy-extview");
    await injectAppShellRuntime("/app.extwallpaperstore.js", "gmx-legacy-extwallpaperstore");
    await injectAppShellRuntime("/app.bootstrapcorewire.js", "gmx-legacy-bootstrapcorewire");
    await injectAppShellRuntime("/app.bootstrapunlockwire.js", "gmx-legacy-bootstrapunlockwire");
    await injectAppShellRuntime("/app.bootstrapgenwire.js", "gmx-legacy-bootstrapgenwire");
    await injectAppShellRuntime("/app.bootstrapusagewire.js", "gmx-legacy-bootstrapusagewire");
    await injectAppShellRuntime("/app.bootstrapuiwire.js", "gmx-legacy-bootstrapuiwire");
    await injectAppShellRuntime("/app.extapply.js", "gmx-legacy-extapply");
    await injectAppShellRuntime("/app.extthemesui.js", "gmx-legacy-extthemesui");
    await injectAppShellRuntime("/app.extcustombgui.js", "gmx-legacy-extcustombgui");
    await injectAppShellRuntime("/app.nav.js", "gmx-legacy-nav");
    await injectAppShellRuntime("/app.tabwire.js", "gmx-legacy-tabwire");
    await injectAppShellRuntime("/app.gmgnwire.js", "gmx-legacy-gmgnwire");
    await injectAppShellRuntime("/app.sitesync.js", "gmx-legacy-sitesync");
    await injectAppShellRuntime("/app.extwallpaperui.js", "gmx-legacy-extwallpaperui");
    await injectAppShellRuntime("/app.wallpaperswire.js", "gmx-legacy-wallpaperswire");
    await injectAppShellRuntime("/app.wallpapersrunwire.js", "gmx-legacy-wallpapersrunwire");
    await injectAppShellRuntime("/app.themeswire.js", "gmx-legacy-themeswire");
    await injectAppShellRuntime("/app.accountui.js", "gmx-legacy-accountui");
    await injectAppShellRuntime("/app.admin.js", "gmx-legacy-admin");
    await injectAppShellRuntime("/app.adminwire.js", "gmx-legacy-adminwire");
    await injectAppShellRuntime("/app.leaderboard.js", "gmx-legacy-leaderboard");
    await injectAppShellRuntime("/app.leaderboardwire.js", "gmx-legacy-leaderboardwire");
    await injectAppShellRuntime("/app.referrals.js", "gmx-legacy-referrals");
    await injectAppShellRuntime("/app.referralswire.js", "gmx-legacy-referralswire");
    await injectAppShellRuntime("/app.redeem.js", "gmx-legacy-redeem");
    await injectAppShellRuntime("/app.redeemwire.js", "gmx-legacy-redeemwire");
    await injectAppShellRuntime("/app.prediction.js", "gmx-legacy-prediction");
    await injectAppShellRuntime("/app.predictionwire.js", "gmx-legacy-predictionwire");
    await injectAppShellRuntime("/app.authwire.js", "gmx-legacy-authwire");
    await injectAppShellRuntime("/app.shellwire.js", "gmx-legacy-shellwire");
    await injectAppShellRuntime("/app.chromewire.js", "gmx-legacy-chromewire");
    await injectAppShellRuntime("/app.chromerunwire.js", "gmx-legacy-chromerunwire");
    await injectAppShellRuntime("/app.connect.js", "gmx-legacy-connect");
    await injectAppShellRuntime("/app.connectwire.js", "gmx-legacy-connectwire");
    await injectAppShellRuntime("/app.siteboot.js", "gmx-legacy-siteboot");
    await injectAppShellRuntime("/app.siteinit.js", "gmx-legacy-siteinit");
    await injectAppShellRuntime("/app.siteinitwire.js", "gmx-legacy-siteinitwire");
    await injectAppShellRuntime("/app.siteinitrunwire.js", "gmx-legacy-siteinitrunwire");
    await injectAppShellRuntime("/app.wallethelpers.js", "gmx-legacy-wallethelpers");
    await injectAppShellRuntime("/app.walletpay.js", "gmx-legacy-walletpay");
    await injectAppShellRuntime("/app.walletui.js", "gmx-legacy-walletui");
    await injectAppShellRuntime("/app.walletwire.js", "gmx-legacy-walletwire");
    await injectAppShellRuntime("/app.auth.js", "gmx-legacy-auth");
    await injectAppShellRuntime("/app.js", "gmx-app-shell-runtime");
    await waitForAppShellReady();
    window.__GMX_APP_SHELL_STARTED = true;
  })();

  try {
    await window.__GMX_APP_SHELL_BOOT_PROMISE;
  } finally {
    window.__GMX_APP_SHELL_BOOT_PROMISE = undefined;
  }
}
