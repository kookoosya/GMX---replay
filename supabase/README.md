# Supabase migrations

Run in the Supabase SQL Editor (or CLI) in this order:

1. `01_core.sql` — users, usage_daily, referrals, `usage_daily_consume` RPC
2. `02_cloud_favorites.sql` — favorites + cloud_lists
3. `03_referrals.sql` — referral indexes + ref_clicks
4. `04`–`08` — arcade scaffolds (optional)

## Env (Render or local)

```
DB_MODE=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

## Smoke

- `GET /api/health` → `supabaseActive: true`
- Connect handle, consume GM/GN quota, confirm `usage_daily` row updates
- Referral invite → first generation sets `first_use_at` on invited row

Default production without Supabase uses SQLite (`DB_MODE=sqlite`).
