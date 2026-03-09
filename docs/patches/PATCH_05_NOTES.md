PATCH_05_CORE_CONSOLIDATION

What this patch does:
- consolidates the earlier backend patches so core safety + secure billing + stable session rules live in one index.js
- keeps the stronger /api/health + request-id + graceful shutdown path from the secure billing branch
- preserves stable session behavior for /api/user/init (no silent token rotation; rotate only with rotate=1 + valid current token)
- makes /api/usage and /api/me use the same async usage source in supabase mode
- normal Ctrl+C / SIGINT and SIGTERM now shut down as WARN with exitCode 0 instead of logging as an ERROR
- includes extension/popup.js so the popup keeps the safer connect/session messaging from the session patch

Apply after PATCH_04. If you already applied PATCH_02, this patch is still safe; it re-aligns backend state so earlier patches stop overwriting each other.
