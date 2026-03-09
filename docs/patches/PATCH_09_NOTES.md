PATCH_09_LANG_DYNAMIC_FIX

What changed:
- Reworked patchDynamicCopy() in frontend/src/legacy/legacyApp.ts
- It no longer forces EN/RU copy into translated tabs
- Wallet/Upgrade panel now uses existing i18n keys for the selected language
- Extension Themes right panel now uses existing i18n keys for the selected language
- themes_rules now keeps the selected language text instead of being overwritten by EN/RU
- h_guide now keeps the selected language list instead of forcing EN/RU

What this fixes:
- Large chunks of English that kept reappearing in non-English languages across multiple tabs

Honest note:
- If some English still remains after this patch, that means the source language pack itself contains English or is missing a key. This patch removes the hardcoded EN/RU overwrite layer.
