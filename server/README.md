# Server modules

| Path | Role |
|------|------|
| `config.mjs` | CONFIG, PLANS, billing metadata, `sendError` |
| `time.mjs` | `nowIso`, `todayKeyUTC`, `sha256`, … |
| `generation.mjs` | Reply generator factory (`createGenerator`) |
| `routes/generate.mjs` | `/api/generate` and `/api/generate-bulk` |

Monolith source: `server-src/` → `npm run build:server` → `index.js`
