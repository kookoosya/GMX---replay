# PATCH_07_SAFE_LEGACY_ROLLBACK

This patch restores `frontend/src/legacy/legacyApp.ts` from the original archive to recover the Vite frontend after the broken i18n patch.

## Purpose
- fix the current esbuild syntax error in `legacyApp.ts`
- restore the site/bridge UI so Vite can compile again
- keep the fix low-risk by using the original working file from the uploaded archive

## Important
- this is a safe rollback of the frontend legacy bridge file
- duplicate-key warnings from the original source may come back later, but the site should load again
- do **not** keep the older broken i18n patch file after applying this
