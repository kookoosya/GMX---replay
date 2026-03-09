# PATCH 02 — Session Stability + Unified Usage

Included files:
- index.js
- extension/popup.js

What changed:
- `/api/user/init` no longer rotates or discloses a token for an existing handle unless the current session already matches that handle.
- Token rotation is now allowed only with `rotate=1` **and** a valid existing session.
- Existing users without a matching current session now get `existing_session_required` instead of silent token rotation.
- Extension popup shows a clear message: open the site once, sign in there, then the extension will sync the session automatically.
- `getUsageFor()` is now Supabase-aware and async.
- `/api/user/init`, `/api/usage`, and `/api/me` now use the same usage source for GM/GN counters in Supabase mode.

Why this matters:
- Fixes unstable extension sessions caused by unexpected token rotation.
- Closes the easy “reconnect by handle only” takeover path.
- Keeps `/api/me` in sync with `/api/usage` when `DB_MODE=supabase`.
