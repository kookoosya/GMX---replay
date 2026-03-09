GMXReply PHASE6B

Fixes the actual live Referrals runtime in Vite dev (frontend/src/legacy/legacyApp.ts), not just public/app.js.

What changed:
- Referrals right block is now rewritten after every applyLang() with unlock-only copy.
- Old "+10 inserts per 20 referrals" text is no longer used in the live Vite LegacyApp runtime.
- Promoter details note now renders unlock-summary instead of bonus-per-20 logic.
- On language switch while Referrals tab is open, the app refreshes referral stats so the details block stays in sync.
- public/app.js is patched too for parity with backend-served /app.

Files:
- frontend/src/legacy/legacyApp.ts
- public/app.js
