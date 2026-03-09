GMXReply Phase 3 patch

Files changed:
- frontend/src/LegacyApp.tsx
- frontend/src/legacy/legacyApp.ts
- tools/i18n_audit.js

What changed:
1) Local Vite dev now prefers relative /api through the existing Vite proxy even if frontend/.env.local still contains VITE_API_ORIGIN=http://localhost:10000. This removes localhost vs 127.0.0.1 drift in dev.
2) Legacy fetch calls now send credentials: include. This keeps cookie-based auth working on same-origin proxy requests and avoids silent session drops.
3) Connect error for existing handles is now explicit instead of a raw code.
4) i18n audit now scans the whole frontend/src tree (ts/tsx/js/jsx, excluding .bak*) and extension/popup.js, not just legacyApp.ts + public/app.js.

How to verify:
- Start backend on 127.0.0.1:10000 and frontend on 127.0.0.1:5173
- Open http://127.0.0.1:5173/
- In DevTools Network, /api/user/init should hit 127.0.0.1:5173/api/user/init (proxied), not localhost:10000 directly
- If you still use an old handle without a saved token, backend can still return existing_session_required by design. Use the same saved session or a fresh test handle.
- Run: node tools/i18n_audit.js --strict
