# PATCH_00 smoke

## 1) Basic health
`curl http://127.0.0.1:10000/api/health`

Expected:
- JSON payload contains `status`, `checks`, `uptimeSec`, `memoryMb`
- HTTP `200` when dependencies are healthy

## 2) Forced fresh health probe
`curl http://127.0.0.1:10000/api/health?force=1`

Expected:
- same shape as above
- for Supabase mode, `checks.supabase.ok` should be `true` when connection works

## 3) Request IDs
`curl -i http://127.0.0.1:10000/api/version`

Expected:
- response headers include `X-Request-Id`

## 4) Logs
After a few requests, verify these files exist:
- `logs/app.log`
- `logs/error.log` (created after first 5xx / crash path)

## 5) PM2 (optional)
- `npm run pm2:start`
- `npm run pm2:logs`

Expected:
- process name `gmxreply-backend`
- automatic restart enabled
