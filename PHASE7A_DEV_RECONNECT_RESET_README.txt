GMXReply Phase 7A — Dev reconnect reset for existing_session_required

What this fixes
- In local dev/testing, existing handles could not reconnect because /api/user/init enforced existing_session_required when the old token was lost.
- This blocked admin handles too, even on localhost.

What changed
1) Backend (index.js)
- Added DEV-only session reset path for /api/user/init.
- If request includes devReset=1 and comes from localhost/127.0.0.1 (or uses a valid X-Admin-Key), the server rotates the token for an existing handle instead of returning existing_session_required.
- This is DEV-only and does not apply in production.

2) Frontend dev app (frontend/src/legacy/legacyApp.ts)
- Connect now sends devReset=1 automatically on localhost/127.0.0.1.
- initSession(force) also sends devReset=1 in local dev, so silent reconnects recover.
- Local reset now also attempts a local dev session reset for the typed handle and reconnects immediately.

3) Legacy public app (public/app.js)
- Same behavior as the Vite legacy app for parity.

How to test
- Restart backend + Vite.
- Hard refresh.
- On localhost/127.0.0.1, type an existing handle and click Connect.
- It should reconnect instead of failing with existing_session_required.
- Local reset should clear local state, then recover the typed handle session in local dev.

Next recommended step
- Phase 7B: admin activation codes / unlock-credit ladder (1/3/5/7/15/30, plus 3m/6m/1y paid codes)
- Then gating for site + extension using referral unlock entitlements.
