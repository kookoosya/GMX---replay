import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT:
// We do NOT proxy "all" traffic, only backend-owned paths.
// This avoids proxying Vite assets (like /vite.svg) and prevents IPv6 ECONNREFUSED surprises.
// Allow dev-run.mjs to override the backend target (useful if a port is busy).
const BACKEND = process.env.GMX_BACKEND_URL || "http://127.0.0.1:10000";

export default defineConfig(({ command }) => ({
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
      server.middlewares.use((req, res, next) => {
        const url = String(req.url || "");
        if (url === "/app" || url.startsWith("/app?")) {
          res.statusCode = 302;
          res.setHeader("Location", "/");
          res.end();
          return;
        }
        next();
      });
    },
    port: Number(process.env.GMX_FRONTEND_PORT || "5173"),
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/api": { target: BACKEND, changeOrigin: true },
      "/assets": { target: BACKEND, changeOrigin: true },
      "/static": { target: BACKEND, changeOrigin: true },
      "/fonts": { target: BACKEND, changeOrigin: true },
      "/contents": { target: BACKEND, changeOrigin: true },
      "/app.js": { target: BACKEND, changeOrigin: true },
      "/app.css": { target: BACKEND, changeOrigin: true },
      "/mode.js": { target: BACKEND, changeOrigin: true },
      "/entitlements.js": { target: BACKEND, changeOrigin: true },
      "/themes.json": { target: BACKEND, changeOrigin: true },
      "/extension-config.json": { target: BACKEND, changeOrigin: true },
      "/i18n": { target: BACKEND, changeOrigin: true },
      "/favicon.ico": { target: BACKEND, changeOrigin: true }
    }
  }
}));
