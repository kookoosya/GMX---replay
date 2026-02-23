import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT:
// We do NOT proxy "all" traffic, only backend-owned paths.
// This avoids proxying Vite assets (like /vite.svg) and prevents IPv6 ECONNREFUSED surprises.
// Allow dev-run.mjs to override the backend target (useful if a port is busy).
const BACKEND = process.env.GMX_BACKEND_URL || "http://127.0.0.1:10000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.GMX_FRONTEND_PORT || "5173"),
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/api": { target: BACKEND, changeOrigin: true },
      "/app": { target: BACKEND, changeOrigin: true },
      "/assets": { target: BACKEND, changeOrigin: true },
      "/static": { target: BACKEND, changeOrigin: true },
      "/fonts": { target: BACKEND, changeOrigin: true },
      "/contents": { target: BACKEND, changeOrigin: true }
    }
  }
});
