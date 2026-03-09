# GMXReply — today checklist (VS Code + Git + Render)

## Local dev (2 terminals, no .bat)

> IMPORTANT: open the site as **http://127.0.0.1:5173** (not `localhost`) to avoid IPv6 `ERR_CONNECTION_REFUSED`.

### 0) Install deps once

Terminal A (project root):

```bash
npm install
```

### 1) Start backend

Terminal A:

```bash
npm run dev:backend
```

Backend: `http://127.0.0.1:10000`

### 2) Start React (Vite) UI

Terminal B:

```bash
npm run dev:frontend
```

Frontend: `http://127.0.0.1:5173`

### 3) Connect handle and verify auth

1. Open `http://127.0.0.1:5173`
2. Click **Open /app** (it opens through Vite proxy, same origin)
3. Connect your `@handle`
4. Back in React UI, click **Refresh**

Auth is now reliable because:
- legacy `/app` uses `localStorage` token
- backend also sets **HttpOnly cookie** `gmx_token` on `/api/user/init`
- API auth accepts either `Authorization: Bearer ...` OR `gmx_token` cookie

## Production (Render) — ship both UIs from backend

This repo is ready for Render as **one** Node service:
- `/` = built React UI (from `frontend/dist`)
- `/app` = legacy UI

### Render setup (fast path)

1. Connect the Git repo in Render
2. Use `render.yaml` (it adds a disk for SQLite)
3. Set env var `ADMIN_PASSWORD` in Render (required)
4. Deploy

Notes:
- DB is SQLite but persisted via Render Disk at `/var/data/data.sqlite`.
- React build uses `ui-assets/` to avoid clashing with legacy `/assets/`.

## Supabase (important)

Right now the backend stores **users/usage/referrals** in SQLite (multiple tables). Your Supabase script that creates only `usage` is not enough to switch the whole app today without breaking endpoints.

If you pasted a **Supabase service_role** key into any chat or committed it anywhere, rotate it immediately and never store it in Git.
