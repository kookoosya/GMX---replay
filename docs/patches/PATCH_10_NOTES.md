PATCH_10 — SAFE LANGUAGE RESTORE + SILENCE DUPLICATE WARNINGS

What this patch does:
- Restores frontend/src/legacy/legacyApp.ts from the original Bac.zip
- Stops Vite/esbuild from printing duplicate-object-key warnings for that file

Why:
- The language fixes broke translations.
- The original file had working translations, but duplicate-key warnings.
- This patch restores the working original and hides the noisy warnings without editing translation content.

Apply order:
- Unzip this patch over the project root.
- Restart npm run dev.

What to expect:
- The site should keep the original translation behavior.
- The duplicate key warnings from legacyApp.ts should stop showing in Vite.
- No changes to backend logic.
