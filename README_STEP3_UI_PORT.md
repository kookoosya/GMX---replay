# STEP 3 — Port PACK6 UI into current React frontend (overlay)

This overlay reuses the **stable PACK6** UI (HTML/CSS/JS) inside the Vite React TS frontend as a **temporary bridge**.
It gives you the exact tabs/layout immediately, while we keep legacy `/app` alive and keep `/api/*` contracts unchanged.

## What you get
Tabs: **Home | GM | GN | Referrals | Leaderboard | Themes | Extension Themes | Upgrade Pro**
Admin tab remains hidden unless backend marks you admin (handle `@Kristofer_Sol_`).

## Files added/replaced
- `frontend/src/App.tsx` (replaced) -> renders `LegacyApp`
- `frontend/src/LegacyApp.tsx` (new)
- `frontend/src/legacy/*` (new): `legacyBody.html`, `app.css`, `legacyApp.ts`
- `frontend/public/mode.js` (new)
- `frontend/public/assets/*` (new) — wallpapers, flags, wallet icons, extension backgrounds, etc.
- `frontend/src/vite-env.d.ts` (new) adds `?raw` typing

## Dev API routing
The legacy JS calls `/api/*` on the **same origin**.
In Vite dev this means you either need:
1) a Vite proxy `/api -> http://localhost:10000` (preferred), OR
2) set `VITE_API_ORIGIN=http://localhost:10000`

This overlay supports (2) out of the box via `window.__GMX_API_ORIGIN`.

Create `frontend/.env.local`:
```
VITE_API_ORIGIN=http://localhost:10000
```

If you already have a proxy, you can skip this.

---
