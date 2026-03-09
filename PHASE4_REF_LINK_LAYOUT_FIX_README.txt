GMXReply Phase 4 patch

Included fixes:
- Referral link stays hidden until the user explicitly clicks Load stats / Copy link.
- Referral link layout no longer collapses when site language changes and button labels become longer.
- Copy button stays disabled until a link is generated.
- Manual link reveal still works; later refreshes preserve the current visible/hidden state.
- Referrals tab no longer auto-generates the link on open.

Files changed:
- frontend/src/legacy/legacyBody.html
- frontend/src/legacy/legacyApp.ts
- frontend/src/legacy/app.css
- public/app.html
- public/app.js
- public/app.css
