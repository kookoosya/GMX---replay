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
