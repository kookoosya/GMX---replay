# GMXReply — Deploy (Render + Supabase + GitHub)

## GitHub → Render

1. Connect repo in Render Dashboard → New → Web Service
2. Link your GitHub repo, branch `main`
3. Render will use `render.yaml` (build + env + disk)
4. Set **Secret** env vars in Render:
   - `ADMIN_PASSWORD` (required)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)
   - `SOLANA_RPC`, `SOL_RECEIVER` (for billing)
5. Push to `main` → auto-deploy

## Supabase (optional)

- Default: SQLite on Render disk
- To use Supabase: set `DB_MODE=supabase` + `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Run SQL migrations in Supabase: `supabase/01_*.sql`, `03_referrals.sql`, etc.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if ever exposed

## Domain

- Render: add custom domain in service settings
- Point DNS to Render CNAME

## Push workflow

```bash
git add -A
git commit -m "fix: …"
git push origin main
```

GitHub Actions runs build on every push. Render deploys on push to `main`.
