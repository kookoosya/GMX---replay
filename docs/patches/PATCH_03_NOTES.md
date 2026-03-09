# PATCH 03 — Legacy UI i18n duplicate-key cleanup

Included files:
- frontend/src/legacy/legacyApp.ts

What changed:
- Removed duplicate top-level translation keys inside the `I18N` language objects.
- Kept the **last** version of each duplicate key (the one the app already effectively used at runtime).
- This specifically cleans the Vite duplicate-key warnings for keys like:
  - `gn_right_list`
  - `ref_desc`
  - `r_list`
  - `wallet_desc`
  - `w_pay_desc`
  - `w_status_desc`
  - `w_status_list`
  - `gm_right`, `gn_right`
  - `t_home`, `t_gm`, `t_gn`, `t_ref`, `t_themes`, `t_wallet`, `t_admin`

Why this matters:
- Frontend console is cleaner.
- Less risk of confusing “which translation wins” edits later.
- No runtime behavior change intended beyond removing duplicate declarations.
