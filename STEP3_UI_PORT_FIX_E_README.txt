STEP3_UI_PORT_FIX_E_PROXY_LEGACY_ROOT

Root cause:
- /app HTML loads via Vite proxy, but it references /app.js and /app.css (and /mode.js, /themes.json).
- Those were not proxied, so the iframe looked blank / "dead".

What this patch does:
- Adds Vite proxy entries for /app.js /app.css /mode.js /themes.json /favicon.ico.
- Keeps the iframe bridge.
- Adds a tiny status indicator and quick links to open /app directly.

Apply:
- Extract into Backend/ (overwriting frontend/src/App.tsx and frontend/vite.config.ts).
Run:
- npm run dev
Open:
- http://localhost:5173
