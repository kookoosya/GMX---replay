# Server modules

| Path | Role |
|------|------|
| `config.mjs` | CONFIG, PLANS, billing metadata, `sendError` |
| `time.mjs` | `nowIso`, `todayKeyUTC`, `sha256`, … |
| `generation.mjs` | Reply generator factory (`createGenerator`) |
| `routes/generate.mjs` | `/api/generate` and `/api/generate-bulk` |
| `routes/user.mjs` | `/api/user/init`, `/api/usage`, `/api/me`, entitlements, events |
| `routes/meta.mjs` | `/api/health`, `/api/version`, `/api/config`, `/status` |
| `routes/public.mjs` | `/api/public/random`, `/api/public/random-bulk` |
| `routes/ext.mjs` | `/api/ext/selectors`, `/api/ext/event`, `/api/ext/faq` |
| `routes/cloud.mjs` | `/api/cloud/lists` (Pro) |
| `routes/admin.mjs` | `/api/admin/*` stats, metrics, codes, grants, leaderboard |
| `ext-selectors.mjs` | Extension selector overrides (shared ext + admin) |
Monolith source: `server-src/` → `npm run build:server` → `index.js`

| `routes/billing.mjs` | billing, Solana pay, redeem, custom wallpapers, arcade cover |
