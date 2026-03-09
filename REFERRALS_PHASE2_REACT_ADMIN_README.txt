GMXReply · Referrals V1 Phase 2 (React + Vite + Admin codes)

What changed
- index.js
  - Free daily inserts no longer grow from referrals. Free stays at GMX_FREE_DAILY (default 70).
  - Referral anti-fraud fingerprint now prefers X-GMX-Device-Id and falls back to ip+ua.
  - Added reward-ledger usage on top of existing referral_rewards table:
    - starter_bg_slot
    - eligible_credit
  - Added admin_codes schema support for grant_type + grant_value.
  - /api/billing/redeem now supports unlock-credit codes (grant_type=eligible_credit).
  - /api/admin/codes now supports two flows:
    - grantType=eligible_credit with preset values 1,3,5,7,15,30
    - grantType=subscription with days (frontend presets 90,180,365)
  - /api/referral/stats now returns unlocks / starter / rewards payloads.
  - /api/referral/list now returns status + notCountedReason.
  - /api/usage and /api/me now expose limits.referralUnlocks and adjusted saveCapFree.

- frontend/src/App.tsx
  - React/Vite bridge converted into a real control panel with Overview / Referrals / Admin views.

- frontend/src/pages/ReferralsPage.tsx
  - Loads /api/referral/stats and /api/referral/list.
  - Shows counters, current unlocks, ladder, referral link, invited users list.

- frontend/src/pages/AdminPage.tsx
  - Admin login (uses /api/admin/login).
  - Generates unlock-credit codes and paid access codes.
  - Lists latest codes.

- frontend/src/api.ts
  - Added admin token session storage and X-Admin-Token support.

- frontend/src/styles.css
  - Added styles for tables, ladder, stat cards, active buttons.

Important notes
- The default site root in this repo still boots LegacyApp. The new React panel is available on /bridge.
- Pro trial / discount are surfaced as unlock-state in referral stats, but billing auto-apply is still intentionally not wired.
- Existing legacy /app still sees dailyBonus=0. That is expected in the new unlock-only model.

Verification performed here
- node --check index.js -> OK
- frontend npm run build -> could not fully verify in container because local vite type definitions are missing (frontend dependencies are not installed here).
