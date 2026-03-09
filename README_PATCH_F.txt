STEP3_UI_PORT_FIX_F_PROXY_WILDCARD
---------------------------------
What it does:
- Fixes blank iframe on http://localhost:5173 by proxying legacy /app and its required root assets
  from backend (http://localhost:10000) through Vite dev server.

Files:
- frontend/vite.config.ts  (comment: PROXY_LEGACY_WILDCARD_V1)

Apply:
- Stop dev (Ctrl+C)
- Expand-Archive this zip over your Backend folder
- npm run dev
