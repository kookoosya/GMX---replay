import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// IMPORTANT:
// We do NOT proxy "all" traffic, only backend-owned paths.
// This avoids proxying Vite assets (like /vite.svg) and prevents IPv6 ECONNREFUSED surprises.
// Backend URL: GMX_BACKEND_URL (from tools/dev-run.mjs / shell) wins, then VITE_API_ORIGIN from .env.local
// so the HTML injection middleware and `fetch()` in the React app target the same host.
function resolveBackendUrl(mode: string): string {
  const fileEnv = loadEnv(mode, __dirname, "");
  const merged =
    String(process.env.GMX_BACKEND_URL || "").trim() ||
    String(fileEnv.VITE_API_ORIGIN || "").trim();
  return merged || "http://127.0.0.1:10000";
}

export default defineConfig(({ command, mode }) => {
  const BACKEND = resolveBackendUrl(mode);

  return {
    base: command === "build" ? "/bridge/" : "/",
    plugins: [react()],
    esbuild: {
      logOverride: {
        "duplicate-object-key": "silent"
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalized = String(id || "").replace(/\\/g, "/");

            if (normalized.includes("/node_modules/")) {
              if (normalized.includes("/react/") || normalized.includes("/react-dom/")) {
                return "react-vendor";
              }
              return "vendor";
            }

            if (normalized.includes("/legacy/siteI18nCatalog")) {
              return "i18n-catalog";
            }

            if (normalized.includes("/src/AppShell.tsx") || normalized.includes("/src/legacy/") || normalized.includes("/src/shell/")) {
              return "app-shell";
            }

            if (normalized.includes("/src/pages/AccessPage")) {
              return "page-access";
            }

            if (normalized.includes("/src/pages/ReferralsPage")) {
              return "page-referrals";
            }

            if (normalized.includes("/src/pages/AdminPage")) {
              return "page-admin";
            }

            return undefined;
          }
        }
      }
    },
    server: {
      configureServer(server) {
        // Proxy / and /app to backend so Vite dev shows the same UI as local (backend-only)
        server.middlewares.use(async (req, res, next) => {
          const rawUrl = String(req.url || "");
          const url = rawUrl.split("?")[0];
          const accept = String(req.headers.accept || "");
          const secFetchDest = String(req.headers["sec-fetch-dest"] || "");
          // Navigation must never fall through to Vite's index.html (React AppShell ≠ public/app.html).
          // Some clients send Accept: */* without "text/html" — that used to skip this middleware.
          const wantsHtml =
            req.method === "GET" &&
            (secFetchDest === "document" ||
              accept.includes("text/html") ||
              !accept.trim() ||
              accept.trim() === "*/*");
          const isAppRoute =
            url === "/" || url === "/app" || url === "/app.html" || url.startsWith("/app/");
          // Match backend: /arcade → arcade.html (not Vite's React ArcadePage — same canon as :10000).
          const isArcadeRoute =
            url === "/arcade" || url === "/arcade.html" || url.startsWith("/arcade/");
          if (wantsHtml && (isAppRoute || isArcadeRoute)) {
            try {
              // Backend GET / redirects to /app — follow one hop so we always inject the real app.html body.
              let pathAndQuery = rawUrl;
              if (url === "/" || url === "") {
                const q = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";
                pathAndQuery = `/app${q}`;
              }
              const target = `${BACKEND}${pathAndQuery}`;
              const r = await fetch(target, { redirect: "follow" });
              const text = await r.text();
              res.statusCode = r.status;
              const skipHeader = new Set([
                "transfer-encoding",
                "content-encoding",
                "content-length",
                "connection"
              ]);
              r.headers.forEach((v, k) => {
                const lk = k.toLowerCase();
                if (skipHeader.has(lk)) return;
                res.setHeader(k, v);
              });
              res.end(text);
            } catch (e) {
              try {
                res.statusCode = 502;
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(
                  `<!doctype html><html><head><meta charset="utf-8"><title>Backend unavailable</title></head><body style="font:15px system-ui;padding:24px">
                <p><b>Dev backend not reachable</b> at <code>${BACKEND}</code>.</p>
                <p>Start it from the repo root: <code>npm run dev:backend</code> (or <code>npm start</code> on port 10000), then reload.</p>
                </body></html>`
                );
              } catch {
                next();
              }
            }
            return;
          }
          next();
        });
      },
      port: Number(process.env.GMX_FRONTEND_PORT || "5173"),
      // If 5173 is taken, try the next free port (still 127.0.0.1). Canon URL is 5173 when free.
      strictPort: false,
      host: "127.0.0.1",
      proxy: {
        "/app": { target: BACKEND, changeOrigin: true },
        "/api": { target: BACKEND, changeOrigin: true },
        "/assets": { target: BACKEND, changeOrigin: true },
        "/static": { target: BACKEND, changeOrigin: true },
        "/fonts": { target: BACKEND, changeOrigin: true },
        "/contents": { target: BACKEND, changeOrigin: true },
        "/app.js": { target: BACKEND, changeOrigin: true },
        "/app.css": { target: BACKEND, changeOrigin: true },
        "/app.auth.js": { target: BACKEND, changeOrigin: true },
        "/app.authwire.js": { target: BACKEND, changeOrigin: true },
        "/app.storage.js": { target: BACKEND, changeOrigin: true },
        "/app.format.js": { target: BACKEND, changeOrigin: true },
        "/app.i18nui.js": { target: BACKEND, changeOrigin: true },
        "/app.sitei18nui.js": { target: BACKEND, changeOrigin: true },
        "/app.sitei18ndynamic.js": { target: BACKEND, changeOrigin: true },
        "/app.chrome.js": { target: BACKEND, changeOrigin: true },
        "/app.sitemode.js": { target: BACKEND, changeOrigin: true },
        "/app.modals.js": { target: BACKEND, changeOrigin: true },
        "/app.shellerrors.js": { target: BACKEND, changeOrigin: true },
        "/app.langui.js": { target: BACKEND, changeOrigin: true },
        "/app.sitelangmenu.js": { target: BACKEND, changeOrigin: true },
        "/app.tabstate.js": { target: BACKEND, changeOrigin: true },
        "/app.unlock.js": { target: BACKEND, changeOrigin: true },
        "/app.wallpapers.js": { target: BACKEND, changeOrigin: true },
        "/app.wallpaperhelpers.js": { target: BACKEND, changeOrigin: true },
        "/app.wallpaperstore.js": { target: BACKEND, changeOrigin: true },
        "/app.customwallpapers.js": { target: BACKEND, changeOrigin: true },
        "/app.themes.js": { target: BACKEND, changeOrigin: true },
        "/app.themeapply.js": { target: BACKEND, changeOrigin: true },
        "/app.ui.js": { target: BACKEND, changeOrigin: true },
        "/app.generate.js": { target: BACKEND, changeOrigin: true },
        "/app.banks.js": { target: BACKEND, changeOrigin: true },
        "/app.antirepeat.js": { target: BACKEND, changeOrigin: true },
        "/app.genparams.js": { target: BACKEND, changeOrigin: true },
        "/app.cleanfill.js": { target: BACKEND, changeOrigin: true },
        "/app.cleanfillrun.js": { target: BACKEND, changeOrigin: true },
        "/app.styles.js": { target: BACKEND, changeOrigin: true },
        "/app.procontrols.js": { target: BACKEND, changeOrigin: true },
        "/app.toggles.js": { target: BACKEND, changeOrigin: true },
        "/app.custombg.js": { target: BACKEND, changeOrigin: true },
        "/app.tabtheme.js": { target: BACKEND, changeOrigin: true },
        "/app.logs.js": { target: BACKEND, changeOrigin: true },
        "/app.paywall.js": { target: BACKEND, changeOrigin: true },
        "/app.help.js": { target: BACKEND, changeOrigin: true },
        "/app.usage.js": { target: BACKEND, changeOrigin: true },
        "/app.wallpaperapply.js": { target: BACKEND, changeOrigin: true },
        "/app.wallpaperui.js": { target: BACKEND, changeOrigin: true },
        "/app.wallpaperupload.js": { target: BACKEND, changeOrigin: true },
        "/app.themesui.js": { target: BACKEND, changeOrigin: true },
        "/app.health.js": { target: BACKEND, changeOrigin: true },
        "/app.setbg.js": { target: BACKEND, changeOrigin: true },
        "/app.extview.js": { target: BACKEND, changeOrigin: true },
        "/app.extwallpaperstore.js": { target: BACKEND, changeOrigin: true },
        "/app.extapply.js": { target: BACKEND, changeOrigin: true },
        "/app.extthemesui.js": { target: BACKEND, changeOrigin: true },
        "/app.extcustombgui.js": { target: BACKEND, changeOrigin: true },
        "/app.nav.js": { target: BACKEND, changeOrigin: true },
        "/app.tabwire.js": { target: BACKEND, changeOrigin: true },
        "/app.gmgnwire.js": { target: BACKEND, changeOrigin: true },
        "/app.extwallpaperui.js": { target: BACKEND, changeOrigin: true },
        "/app.accountui.js": { target: BACKEND, changeOrigin: true },
        "/mode.js": { target: BACKEND, changeOrigin: true },
        "/entitlements.js": { target: BACKEND, changeOrigin: true },
        "/themes.json": { target: BACKEND, changeOrigin: true },
        "/extension-config.json": { target: BACKEND, changeOrigin: true },
        "/i18n": { target: BACKEND, changeOrigin: true },
        "/favicon.ico": { target: BACKEND, changeOrigin: true },
        "/arcade": { target: BACKEND, changeOrigin: true },
        "/arcade.html": { target: BACKEND, changeOrigin: true },
        "/arcade.js": { target: BACKEND, changeOrigin: true },
        "/app.html": { target: BACKEND, changeOrigin: true }
      }
    }
  };
});
