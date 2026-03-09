/* eslint-disable */
// @ts-nocheck

declare global {
  interface Window {
    __GMX_LEGACY_STARTED?: boolean;
    __GMX_LEGACY_BOOT_PROMISE?: Promise<void>;
    __gmxShowTab?: (tab: string) => void;
    __GMX_API_ORIGIN?: string;
  }
}

function injectLegacyRuntime(src: string, id: string): Promise<void> {
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
      reject(error instanceof Error ? error : new Error(String(error || "legacy runtime inject failed")));
    }
  });
}

async function waitForLegacyReady(timeoutMs = 12000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (typeof window.__gmxShowTab === "function") return;
    } catch {}
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  throw new Error("Legacy runtime did not expose __gmxShowTab in time");
}

export async function startLegacyApp() {
  if (window.__GMX_LEGACY_STARTED) return;
  if (window.__GMX_LEGACY_BOOT_PROMISE) return window.__GMX_LEGACY_BOOT_PROMISE;

  window.__GMX_LEGACY_BOOT_PROMISE = (async () => {
    await injectLegacyRuntime("/app.js", "gmx-legacy-runtime");
    await waitForLegacyReady();
    window.__GMX_LEGACY_STARTED = true;
  })();

  try {
    await window.__GMX_LEGACY_BOOT_PROMISE;
  } finally {
    window.__GMX_LEGACY_BOOT_PROMISE = undefined;
  }
}
