PATCH_05 quick checks

1) Start dev
   npm run dev

2) Check health
   http://127.0.0.1:10000/api/health
   Expect: ok/status/build/startedAt/uptimeSec/checks

3) Existing session safety
   - if handle already exists and you call /api/user/init without a valid token, expect 401 existing_session_required
   - with a valid session token/cookie, expect normal init response
   - rotate only works with rotate=1 and a valid current token for the same handle

4) Usage consistency
   - compare /api/usage and /api/me after login
   - GM/GN used counters should match the same values

5) Stop the server with Ctrl+C
   Expect WARN lines for SIGINT_RECEIVED / PROCESS_SHUTDOWN, not an ERROR-level shutdown
