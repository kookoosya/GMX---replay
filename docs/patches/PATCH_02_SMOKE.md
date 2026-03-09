# PATCH 02 Smoke Check

1) Existing handle should NOT rotate automatically
```powershell
curl -s -X POST http://127.0.0.1:10000/api/user/init -H "Content-Type: application/json" -d "{\"handle\":\"yourhandle\"}"
```
Expected for an already existing user without a valid current token:
- `401`
- `error: "existing_session_required"`

2) New handle still works
```powershell
curl -s -X POST http://127.0.0.1:10000/api/user/init -H "Content-Type: application/json" -d "{\"handle\":\"newtesthandle123\"}"
```
Expected:
- `ok:true`
- returns `token`

3) Usage consistency (Supabase mode)
After a few inserts, compare:
```powershell
curl -s -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:10000/api/usage
curl -s -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:10000/api/me
```
Expected:
- `usage.gm.used` / `usage.gn.used` in `/api/me` match `/api/usage`

4) Popup connect UX
- In extension popup, enter an existing handle that already exists on the backend.
- Expected message:
  - EN: open the site once and sign in there
  - RU: clear equivalent text
