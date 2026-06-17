# GMXReply — deploy & local install

## Production site

**https://www.gmxreply.com**

Main app: **https://www.gmxreply.com/app**  
Bridge build: **https://www.gmxreply.com/bridge**  
Arcade: **https://www.gmxreply.com/arcade.html**

## Local dev (grab extension + test site)

```bash
npm run install:all   # first time
npm run dev
```

| Service | URL |
|---------|-----|
| Backend + legacy app | http://127.0.0.1:10000/app |
| Vite frontend (if used) | http://127.0.0.1:5173 |
| Health | http://127.0.0.1:10000/api/health |

### Chrome extension (unpacked)

1. Run `npm run dev` (or `npm start` on port 10000).
2. Open `chrome://extensions` → Developer mode → **Load unpacked**.
3. Select the repo folder **`extension/`**.
4. In the popup, **Open site** → connect your @handle on the local app.
5. **Use site session** in the extension to sync token/plan.

Extension defaults API base to production; for local API set storage key `gmx_ext_api_base_v2` to `http://127.0.0.1:10000` via devtools or temporarily in `extension/popup.js` (`DEFAULT_BASE`).

Product copy specs: `docs/GENERATION_MODES.en.txt`, `docs/EXTENSION_COPY.en.txt`.

## GitHub → Render

1. Render Dashboard → New → Web Service → connect repo, branch `main`.
2. Uses `render.yaml`. Set secrets:
   - `ADMIN_PASSWORD` (required)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (if `DB_MODE=supabase`)
   - `SOLANA_RPC`, `SOL_RECEIVER` (billing)
3. Push to `main` → auto-deploy.

## Supabase (optional cloud DB)

Default on Render: **SQLite** on disk (`DB_MODE=sqlite`).

To use Supabase:

```env
DB_MODE=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Run SQL in order (see `supabase/README.md`):

1. `supabase/01_core.sql`
2. `supabase/02_cloud_favorites.sql`
3. `supabase/03_referrals.sql`

Smoke: `GET /api/health` → `"supabaseActive": true`.

Rotate the service role key if it was ever exposed.

## i18n

```bash
node tools/i18n_apply_mode_keys.mjs   # when adding mode/tab keys
npm run i18n:sync
```

Locales live in `shared/i18n/locales/*.json` (same pipeline for every language).

## Push workflow (production = Render)

```bash
git add -A
git commit -m "fix: …"
git push origin main
```

GitHub Actions runs build on push. **Render auto-deploys `main`** (`render.yaml`).

Confirm prod caught up after push:

```bash
npm run verify:prod
```

This checks `https://www.gmxreply.com` and that health `build` matches local `git rev-parse HEAD`.

**Production stays on Render** — do not use `deploy:vps`.
