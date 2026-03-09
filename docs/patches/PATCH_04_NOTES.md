PATCH_04 — REAL I18N DEDUPE (supersedes PATCH_03)

What changed
- Rebuilt the main `I18N` object in `frontend/src/legacy/legacyApp.ts` so duplicate top-level keys are removed inside each language block.
- This keeps the LAST value for each repeated key and drops earlier duplicates.
- This directly targets the Vite warnings about duplicate keys (including `gm_right`, `gn_right`, `ref_desc`, `wallet_desc`, `w_pay_desc`, `w_status_desc`, `w_status_list`, `t_home`, `t_gm`, `t_gn`, `t_ref`, `t_themes`, `t_wallet`, `t_admin`, etc.).

Important
- This patch replaces PATCH_03 for `legacyApp.ts`.
- Apply it after PATCH_03 (or instead of PATCH_03). It is safe to overwrite the same file.

What I verified
- Ran an exact duplicate-key scan against the main `I18N` object after rewriting it.
- Result: no duplicate top-level keys remain in the main `I18N` object.

What I did NOT verify here
- I did not run a full Vite build, because the uploaded archive does not include `node_modules`.
