# PATCH_06_I18N_RESTORE

- Replaces the broken `frontend/src/legacy/legacyApp.ts` from PATCH_04.
- Restores the original translation content from the uploaded archive.
- Re-dedupes duplicate keys inside each I18N language object correctly (keep last value, no blank keys).
- This targets the React/Vite bridge UI (`http://127.0.0.1:5173/` and mapped routes).
