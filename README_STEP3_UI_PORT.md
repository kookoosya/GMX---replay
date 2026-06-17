# React `/bridge` — Account Center (current)

> **Status (2026-06):** The original STEP 3 plan (full PACK6 overlay via `LegacyApp.tsx`) was **not completed**.  
> Production UI for GM/GN/Themes/Arcade remains the **legacy shell** at `/app` (`public/app.html` + `app.*.js`).  
> React at `/bridge` is a slim **Account Center** only.

## What `/bridge` provides today

Routes (see `frontend/src/App.tsx`):

| Route | Page |
|-------|------|
| `/bridge` | Home / session overview |
| `/bridge/access` | Connect handle, activate codes |
| `/bridge/referrals` | Referral stats (React) |
| `/bridge/admin` | Admin tools (React, gated by backend) |

Main product tabs (**Home, GM, GN, Themes, Wallet, Arcade, …**) live at **`/app`** — edit `public/` and `public/app.*.js`, not React.

## Build & deploy path

```bash
npm run build:frontend          # tsc + vite
node tools/sync-frontend-build.mjs   # → public/bridge/
```

Production: `https://www.gmxreply.com/bridge`

## Dev API routing

React pages call `/api/*`. In Vite dev set `frontend/.env.local`:

```
VITE_API_ORIGIN=http://127.0.0.1:10000
```

Use **`127.0.0.1`**, not `localhost`, on Windows (IPv6 issues). See `docs/DEV_KNOWN_ISSUES.md`.

## If you want a full React port later

Do **not** revive the old overlay approach. Prefer:

1. One tab at a time behind feature flags, or
2. A single esbuild bundle from `client-src/` shared by `/app` and `/bridge`.

See `ARCHITECTURE.md` for canonical edit surfaces.

## Removed / obsolete (do not recreate)

- `frontend/src/LegacyApp.tsx` — never shipped to main
- Full-tab React overlay from PACK6 HTML — superseded by modular `app.*.js` + tests
