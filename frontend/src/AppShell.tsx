import React, { useEffect, useState } from "react";
import legacyBody from "./legacy/legacyBody.html?raw";
import "./legacy/app.css";
import { startAppShell } from "./shell/appShellRuntime";
import { SITE_I18N } from "./legacy/siteI18nCatalog";

function injectScript(src: string, id: string) {
  try {
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    document.head.appendChild(s);
  } catch {}
}

const APP_TABS = new Set(["home", "gm", "gn", "referrals", "leaderboard", "themes", "extthemes", "wallet", "admin"]);

function getSavedAppTab() {
  try {
    const raw = String(localStorage.getItem("gmx_last_tab") || "").trim();
    return APP_TABS.has(raw) ? raw : "home";
  } catch {
    return "home";
  }
}

function tabFromPath(pathname: string) {
  const raw = (pathname || "/").replace(/\/$/, "") || "/";
  const p = raw.replace(/^\/app(?=\/|$)/, "") || "/";
  if (p === "/gm") return "gm";
  if (p === "/gn") return "gn";
  if (p === "/referrals") return "referrals";
  if (p === "/leaderboard") return "leaderboard";
  if (p === "/themes") return "themes";
  if (p === "/extension-themes" || p === "/extthemes") return "extthemes";
  if (p === "/upgrade" || p === "/wallet") return "wallet";
  if (p === "/admin") return "admin";
  if (raw === "/" || raw === "/app" || raw.startsWith("/app/")) return getSavedAppTab();
  return "home";
}

export default function AppShell() {
  const [boot, setBoot] = useState<"booting" | "ready" | "error">("booting");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const rawApiOrigin = String((import.meta as any).env?.VITE_API_ORIGIN || "").trim();
    const localHost = String(window.location.hostname || "").toLowerCase();
    const isLocalFrontend = localHost === "127.0.0.1" || localHost === "localhost";
    const isLocalBackendEnv = /^https?:\/\/(?:localhost|127\.0\.0\.1):10000$/i.test(rawApiOrigin);
    // Dev rule: when Vite runs locally, prefer relative /api via Vite proxy.
    // This keeps auth/session on the same origin and avoids localhost vs 127.0.0.1 drift.
    (window as any).__GMX_API_ORIGIN = (isLocalFrontend && isLocalBackendEnv) ? "" : rawApiOrigin;

    // Keep the old Wallet UI working (it expects window.solanaWeb3 from the IIFE build).
    injectScript(
      "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js",
      "solana-web3-iife"
    );

    // Optional: fast-paint mode/background helper (also available as a static file in /public/mode.js)
    injectScript("/mode.js", "gmx-mode-js");

    // Make the full site i18n catalog available to the app shell runtime inside Vite.
    try {
      (window as any).GMX_SITE_I18N = {
        createSiteI18nCatalog: () => SITE_I18N,
      };
    } catch {}

    // App entitlement helpers (same as /app)
    injectScript("/entitlements.js", "gmx-entitlements-js");

    const t = window.setTimeout(async () => {
      try {
        // Sanity marker: if you can see the UI skeleton, HTML injection works.
        (window as any).__GMX_APP_SHELL_HTML_OK = true;

        await startAppShell();

        try {
          const tab = tabFromPath(window.location.pathname);
          (window as any).__gmxShowTab?.(tab);
        } catch {}

        setBoot("ready");
      } catch (e: any) {
        console.error("[GMX App Shell] boot failed:", e);
        setErr(String(e?.stack || e?.message || e));
        setBoot("error");
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      {boot === "error" && (
        <div
          style={{
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 99999,
            padding: "8px 10px",
            borderRadius: 10,
            fontSize: 12,
            background: "rgba(0,0,0,.72)",
            color: "#fff",
            maxWidth: 520,
            lineHeight: 1.35,
            border: "1px solid rgba(255,255,255,.12)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>GMXReply UI</div>
          <div style={{ color: "#ffb4b4" }}>Boot failed</div>
          <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{err}</pre>
        </div>
      )}

      <div id="gmx-app-shell-root" dangerouslySetInnerHTML={{ __html: legacyBody }} />
    </>
  );
}
