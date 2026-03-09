# PATCH_00 — Stability foundation

This patch only hardens the backend runtime. It does **not** change billing logic, GM/GN generation rules, or extension behavior.

## Included
- safer process guards for `unhandledRejection` / `uncaughtException`
- graceful shutdown on crashes and `SIGTERM` / `SIGINT`
- request IDs on every request (`X-Request-Id`)
- structured file logging to `logs/app.log` and `logs/error.log`
- richer `/api/health` with cached dependency checks
- PM2 config for auto-restart (`ecosystem.config.cjs`)
- optional PM2 npm scripts

## Files changed
- `index.js`
- `package.json`
- `ecosystem.config.cjs`

## What to do
1. Unzip this patch over the project root.
2. Run `npm install` only if your package manager asks for it after `package.json` changed.
3. Start normally with `npm run dev` or `npm start`.
4. Optional auto-restart: install PM2 globally and run `npm run pm2:start`.

## Notes
- `/api/health` returns HTTP `503` when dependency checks fail, which is useful for Render / external monitors.
- Health checks are cached for a short time (default 15s) to avoid hammering Supabase.
- Log files are created automatically.
