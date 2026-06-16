# Server modules

| Path | Role |
|------|------|
| `config.mjs` | CONFIG, PLANS, billing metadata, `sendError` |
| `time.mjs` | `nowIso`, `todayKeyUTC`, `sha256`, … |
| `generation.mjs` | Reply generator factory (`createGenerator`) |
| `routes/generate.mjs` | `/api/generate` and `/api/generate-bulk` |
| `routes/user.mjs` | `/api/user/init`, `/api/usage`, `/api/me`, entitlements, events |

Monolith source: `server-src/` → `npm run build:server` → `index.js`

| `routes/billing.mjs` | billing, Solana pay, redeem, custom wallpapers, arcade cover |
