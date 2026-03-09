GMXReply Phase 6A

What this patch fixes:
- referral right-side block now uses the new unlock-only logic (no +10 per 20 / no promoter daily growth)
- referral explanatory copy is overridden in app.js after language switch, so stale siteI18n text no longer wins
- referral copy is localized with a runtime bundle for: en, de, fr, es, pt, it, nl, tr, pl, id, ru, uk, hi, ja, zh
- promoter summary note is rebuilt from the same runtime bundle, so switching site language refreshes the summary text too
- public/app.html default fallback text was updated to the new truthful unlock model

Files included:
- public/app.js
- public/app.html

Apply over the current project folder.
Then restart the frontend and hard refresh the page.
