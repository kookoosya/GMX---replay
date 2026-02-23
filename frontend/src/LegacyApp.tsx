import React, { useEffect, useState } from "react";
import legacyBody from "./legacy/legacyBody.html?raw";
import "./legacy/app.css";
import { startLegacyApp } from "./legacy/legacyApp";

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

function tabFromPath(pathname: string) {
  const p = (pathname || "/").replace(/\/$/, "") || "/";
  if (p === "/gm") return "gm";
  if (p === "/gn") return "gn";
  if (p === "/referrals") return "referrals";
  if (p === "/leaderboard") return "leaderboard";
  if (p === "/themes") return "themes";
  if (p === "/extension-themes") return "extthemes";
  if (p === "/upgrade" || p === "/wallet") return "wallet";
  if (p === "/admin") return "admin";
  return "home";
}

export default function LegacyApp() {
  const [boot, setBoot] = useState<"booting" | "ready" | "error">("booting");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (window as any).__GMX_API_ORIGIN = (import.meta as any).env?.VITE_API_ORIGIN || "";

    // Keep the old Wallet UI working (it expects window.solanaWeb3 from the IIFE build).
    injectScript(
      "https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js",
      "solana-web3-iife"
    );

    // Optional: fast-paint mode/background helper (also available as a static file in /public/mode.js)
    injectScript("/mode.js", "gmx-mode-js");

    // Legacy entitlement helpers (same as /app)
    injectScript("/entitlements.js", "gmx-entitlements-js");

    const t = window.setTimeout(async () => {
      try {
        // Sanity marker: if you can see the UI skeleton, HTML injection works.
        (window as any).__GMX_LEGACY_HTML_OK = true;

        await startLegacyApp();

        try {
          const tab = tabFromPath(window.location.pathname);
          (window as any).__gmxShowTab?.(tab);
        } catch {}

        setBoot("ready");
      } catch (e: any) {
        console.error("[GMX Legacy] boot failed:", e);
        setErr(String(e?.stack || e?.message || e));
        setBoot("error");
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: 99999,
          padding: "8px 10px",
          borderRadius: 10,
          fontSize: 12,
          background: "rgba(0,0,0,.55)",
          color: "#fff",
          maxWidth: 520,
          lineHeight: 1.35,
          border: "1px solid rgba(255,255,255,.12)",
        }}
      >
        {boot === "booting" && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>GMXReply UI</div>
            <div>Booting legacy UI…</div>
            <div style={{ opacity: 0.85, marginTop: 4 }}>
              If the page is blank, tell me what 404 URL you see in DevTools Console.
            </div>
          </div>
        )}
        {boot === "error" && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>GMXReply UI</div>
            <div style={{ color: "#ffb4b4" }}>Boot failed</div>
            <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{err}</pre>
          </div>
        )}
        {boot === "ready" && (
          <div style={{ opacity: 0.8 }}>GMXReply UI loaded</div>
        )}
      </div>

      <div id="gmx-legacy-root" dangerouslySetInnerHTML={{ __html: legacyBody }} />
    </>
  );
}
