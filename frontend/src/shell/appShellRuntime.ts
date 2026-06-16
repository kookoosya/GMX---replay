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
    await injectAppShellRuntime("/app.chrome.js", "gmx-legacy-chrome");
    await injectAppShellRuntime("/app.langui.js", "gmx-legacy-langui");
    await injectAppShellRuntime("/app.unlock.js", "gmx-legacy-unlock");
    await injectAppShellRuntime("/app.wallpapers.js", "gmx-legacy-wallpapers");
    await injectAppShellRuntime("/app.wallpaperstore.js", "gmx-legacy-wallpaperstore");
    await injectAppShellRuntime("/app.customwallpapers.js", "gmx-legacy-customwallpapers");
    await injectAppShellRuntime("/app.themes.js", "gmx-legacy-themes");
    await injectAppShellRuntime("/app.themeapply.js", "gmx-legacy-themeapply");
    await injectAppShellRuntime("/app.ui.js", "gmx-legacy-ui");
    await injectAppShellRuntime("/app.generate.js", "gmx-legacy-generate");
    await injectAppShellRuntime("/app.banks.js", "gmx-legacy-banks");
    await injectAppShellRuntime("/app.antirepeat.js", "gmx-legacy-antirepeat");
    await injectAppShellRuntime("/app.genparams.js", "gmx-legacy-genparams");
    await injectAppShellRuntime("/app.cleanfill.js", "gmx-legacy-cleanfill");
    await injectAppShellRuntime("/app.styles.js", "gmx-legacy-styles");
    await injectAppShellRuntime("/app.toggles.js", "gmx-legacy-toggles");
    await injectAppShellRuntime("/app.custombg.js", "gmx-legacy-custombg");
    await injectAppShellRuntime("/app.tabtheme.js", "gmx-legacy-tabtheme");
    await injectAppShellRuntime("/app.logs.js", "gmx-legacy-logs");
    await injectAppShellRuntime("/app.paywall.js", "gmx-legacy-paywall");
    await injectAppShellRuntime("/app.help.js", "gmx-legacy-help");
    await injectAppShellRuntime("/app.usage.js", "gmx-legacy-usage");
    await injectAppShellRuntime("/app.wallpaperapply.js", "gmx-legacy-wallpaperapply");
    await injectAppShellRuntime("/app.wallpaperui.js", "gmx-legacy-wallpaperui");
    await injectAppShellRuntime("/app.themesui.js", "gmx-legacy-themesui");
    await injectAppShellRuntime("/app.health.js", "gmx-legacy-health");
    await injectAppShellRuntime("/app.setbg.js", "gmx-legacy-setbg");
    await injectAppShellRuntime("/app.extview.js", "gmx-legacy-extview");
    await injectAppShellRuntime("/app.extwallpaperstore.js", "gmx-legacy-extwallpaperstore");
    await injectAppShellRuntime("/app.extapply.js", "gmx-legacy-extapply");
    await injectAppShellRuntime("/app.extthemesui.js", "gmx-legacy-extthemesui");
    await injectAppShellRuntime("/app.extcustombgui.js", "gmx-legacy-extcustombgui");
    await injectAppShellRuntime("/app.nav.js", "gmx-legacy-nav");
    await injectAppShellRuntime("/app.extwallpaperui.js", "gmx-legacy-extwallpaperui");
    await injectAppShellRuntime("/app.accountui.js", "gmx-legacy-accountui");
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
