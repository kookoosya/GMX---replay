STEP3_UI_PORT_FIX_D_VITE_PROXY_IFRAME

What this does
- Makes http://localhost:5173 show the fully-working legacy UI by embedding /app in an iframe.
- Adds Vite dev proxies so /app and its assets load same-origin from 5173, avoiding X-Frame/CSP issues.
- Removes the old "innerHTML legacy" attempt by overwriting frontend/src/App.tsx.

How to apply
- Extract this zip into the Backend folder (where package.json and frontend/ live), overwriting files.

How to run
- In Backend folder: npm run dev
- Open: http://localhost:5173
