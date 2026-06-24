# Refactor Sprint 1 — tracker

Rules: `.cursor/rules/sprint-workflow.mdc` (one step at a time, no parity drift).

## 1.1 Arcade cover imageUrl — DONE

**Problem:** 9 games used another game's `imageUrl` (copy-paste). Users saw wrong covers (e.g. Marble Shooter showed Cut the Rope).

**Fix:**
- `tools/audit-arcade-cover-collisions.mjs` — detects shared URLs
- `tools/fix-arcade-stolen-covers.mjs` — clears stolen URL or applies `arcade-covers.json` when verified (`hole-io`)
- 8 games → empty `imageUrl` → category SVG fallback (correct, not another game's art)
- 1 game (`hole-io`) → verified CrazyGames CDN URL from `arcade-covers.json`

**Verify:** `node tools/audit-arcade-cover-collisions.mjs` → no collisions; `npm run test:suite` → client-invariants includes collision check.

## 1.2 ru/uk Arcade i18n — DONE

**Problem:** Entire `arcade_*` block (~67 keys) in `ru.json` and `uk.json` was scrambled — values did not match keys (wallpaper/referral HTML mixed into badge keys, categories swapped with type blurbs, etc.).

**Fix:**
- Rewrote `arcade_doc_title` … `arcade_typ_survivor` in `shared/i18n/locales/ru.json` and `uk.json` aligned to `en.json` semantics
- `npm run i18n:sync` → `public/i18n/siteI18n.js`, `frontend/public/i18n/`, `extension/i18n-bundle.js`, `public/bridge/i18n/`

**Verify:** `npm test` (117 pass), `npm run audit:i18n:strict` pass, strict i18n test ok.

## 1.3 duplicate coverSrc() — DONE

**Problem:** Two `coverSrc()` definitions in `arcade.js` — second overrode first. Dead code: `liveScreenshotCover()` (never called), `categoryCoverWebp()` (`.webp` assets don't exist on disk).

**Fix:**
- Single `coverSrc`: `localGameCover → remoteCoverUrl → categoryCover` (preserves live behavior)
- Removed dead helpers
- Synced `public/arcade.js` → `frontend/public/arcade.js`, `public/bridge/arcade.js`
- Client invariant: exactly one `coverSrc`, no dead cover helpers

**Verify:** `npm test`, `npm run test:suite` → client-invariants pass on all 3 arcade copies.

## 1.4 bridge/app.html copy — DONE

**Problem:** `tools/sync-app-and-assets.mjs` copied `app.html` → `public/bridge/app.html` on every sync. Bridge is a React SPA (`bridge/index.html`); legacy shell copy was obsolete and caused accidental commits.

**Fix:**
- Removed bridge `app.html` copy from `sync-app-and-assets.mjs`
- Added prune of obsolete `bridge/app.*` shell files after sync (matches `sync-site-public.mjs`)
- Client invariant: `public/bridge/app.html` must not exist; sync script must not reintroduce copy

**Verify:** `node tools/sync-app-and-assets.mjs` → no `bridge/app.html`; `npm run test:suite` → bridge shell hygiene pass.

## 1.5 mountLineListSkeleton — DONE

**Problem:** `mountLineListSkeleton()` existed in `app.ui.js` but was never called from `app.bankui.js` `renderList()` — GM/GN saved-line lists had no loading skeleton during chunked render.

**Fix:**
- `chunkedRender` accepts optional `mountSkeleton` (shows skeleton instead of blank grid until first chunk)
- `renderList` passes `mountLineListSkeleton` when list has >20 lines
- Wired through `app.bankuiwire.js`, `app.js` (`mountLineListSkeleton` helper), flat `__gmxBankUiWireCtx` (removed broken double `buildWireCtx` call)

**Verify:** `npm test` includes `bankui: renderList uses mountLineListSkeleton for large lists`; `npm run test:suite` pass.

---

# Refactor Sprint 2 — tracker

## 2.1 ru/uk extension popup ext_* i18n — DONE

**Problem:** After Sprint 1.2 arcade fix, `ext_popup_subtitle` … `ext_stats_hint_static` (~56 keys) in `ru.json` and `uk.json` were still scrambled (arcade blurbs in button labels, session text in snapshot fields, etc.).

**Fix:** Rewrote full extension popup block aligned to `en.json` semantics; `npm run i18n:sync`.

**Verify:** `npm test`, `npm run audit:i18n:strict`.

## 2.2 arcade-covers.json madalin — DONE

**Problem:** `arcade-covers.json` mapped `madalin-stunt-cars` to smash-karts CDN URL. `public/arcade.js` already had the correct `madalin-stunt-cars-2` cover — re-running `apply-arcade-covers.mjs` would have regressed prod.

**Fix:**
- Corrected `madalin-stunt-cars` URL in `arcade-covers.json` to match `arcade.js`
- Aligned `basketball-stars` / `mahjongg` query params (`quality=100`) with `arcade.js`
- `tools/audit-arcade-covers-json.mjs` — no duplicate URLs in covers.json; parity with `arcade.js` when both define a cover
- Client-invariants runs covers.json audit

**Verify:** `node tools/audit-arcade-covers-json.mjs`; `npm run test:suite`.

## 2.3 VPS deploy scripts — DONE

**Problem:** `npm run deploy:vps` and SSH tooling implied VPS was a valid prod path. Production is Render-only (`gmxreply.com`).

**Fix:**
- `tools/deploy-vps.mjs` → Render-only stub (exits with push + `verify:prod` instructions)
- Full SSH deploy archived to `tools/legacy/deploy-vps.mjs` (requires `DEPLOY_VPS_ALLOW=1`)
- `npm run deploy:legacy:*` opt-in wrappers via `tools/legacy/run-deploy-vps.mjs`
- `tools/legacy/README.md`, `DEPLOY.md` updated
- Client invariant: root `deploy-vps.mjs` must not import ssh2

**Verify:** `npm run deploy:vps` exits 1 with Render message; `npm run test:suite` → deploy render-only pass.

## 2.4 docs refresh — DONE

**Problem:** `PLAN.md` and `REPO_BREAKDOWN.md` described pre-refactor state (VPS deploy, stale phases).

**Fix:**
- `PLAN.md` — infra table (Render / Supabase optional / VPS not for site), phases 1–4, Sprint 1–2 done, next priorities
- `docs/REPO_BREAKDOWN.md` — prod stack, parity, tests, Render-only deploy
- `ARCHITECTURE.md` — VPS vs Render section

**Verify:** docs consistent with `render.yaml` (`DB_MODE=sqlite`) and `DEPLOY.md`.

---

# Refactor Sprint 3 — tracker

Focus: **site + extension stability** (Supabase deferred).

## 3.1 Referral progress bar i18n — DONE

**Problem:** Progress meter logic existed (`refProgressWrap` / fill) but label was hardcoded English; no reward hint on the bar.

**Fix:**
- `ref_progress_meter_html` in all 15 locales
- `syncRefProgressMeter()` in `app.sitei18ndynamic.js` — localized label + `nextReferralUnlockLabel` reward
- Wired through `i18nbridge` → `generatewire` → `refstats`
- `refProgressLabel` empty in `app.html` (filled on stats refresh)

**Verify:** `npm test`, `npm run audit:i18n:strict`.

## 3.2 Extension connect/status i18n — DONE

**Problem:** `extension/popup.js` showed hardcoded English for connect/sync session flow, API errors, and copy status messages — broken UX for ru/uk users after Sprint 2.1 static popup i18n.

**Fix:**
- 22 new `ext_connect_*`, `ext_err_*`, `ext_copy_*` keys in all 15 locales
- `popup.js` uses `extT()` for `setConnectStatus`, `setCopyStatus`, `friendlyError`, clipboard errors
- `connectHandle` checks API error codes directly (not translated string match)

**Verify:** `npm test` (118 pass), `audit:i18n:strict`.

## 3.3 Extension ↔ site session sync — DONE

**Problem:** `syncFromSite` applied every open tab in order — a logged-out tab could win over a logged-in one; popup reported “site session” when only extension storage had a token. No unit tests for session resolution.

**Fix:**
- `extension/lib/site-sync-core.js` — `resolveSyncedSession()` (site login, force logout, extension-only fallback)
- `site_sync.js` returns `hasSiteSession`; uses shared resolver
- `popup.js` — prefer first tab with `hasSiteSession`; explicit sync requires site session; silent init keeps extension-only auth
- `tests/extension-site-sync.test.mjs` + client-invariants / logic-audit checks
- Manifest loads `lib/site-sync-core.js` before `site_sync.js`

**Verify:** `npm test` (126 pass), `npm run test:suite`.

## 3.4 Boot bundle inventory — DONE

**Problem:** ~97 deferred scripts documented informally; 15 stale `*runwire.js` mirrors lingered in `frontend/public/` after Phase 3 collapse; no automated inventory or bundle roadmap.

**Fix:**
- `tools/audit-app-boot.mjs` — counts defer scripts (baseline 97), categories, payload size, orphan/stale detection
- `npm run audit:boot`; wired into `client-invariants` + `tests/app-boot-inventory.test.mjs`
- Pruned 15 stale `frontend/public/*runwire.js`; `sync-app-and-assets.mjs` auto-prunes on sync

**Inventory (2026-06):** 97 defer scripts ≈ 1.19 MiB — 65 modules, 21 feature-wires, 5 bootstrap-wires, 4 i18n-runtime, 1 i18n bundle, 1 entry (`app.js`).

**Verify:** `npm run audit:boot`, `npm test`, `npm run test:suite`.

## Bundle Phase 5c — lazy tab packs — DONE

**Problem:** ~14 tab-specific module+wire scripts loaded on every page boot (~97 defer scripts total), slowing first paint for users who never open Admin, Prediction, Wallet, Leaderboard, Referrals, or Redeem.

**Fix:**
- `public/app.lazytabs.js` — `__gmxEnsureTabPack(tab)` injects scripts sequentially; six packs (14 files)
- Removed eager `<script defer>` for lazy packs from `app.html` (baseline **84** defer scripts)
- `site-src/07–12` — lazy init via `__gmxLazyTabHooks`; wallet/redeem ensure on first use; `pruneLegacyAdminPanels` boot stub without loading admin module
- `tests/app-lazytabs.test.mjs`; `logic-audit` + `audit-app-boot` updated

**Next bundle work (not started):** none — Phase 5d complete.

**Verify:** `npm run audit:boot`, `npm test`, `npm run verify:site`.

## Bundle Phase 5d — esbuild shell chunks — DONE

**Problem:** After 5c, boot still issued **84** sequential defer requests for shell modules+wires; HTTP overhead dominated first paint.

**Fix:**
- `tools/app-chunk-manifest.json` — four ordered packs (82 source files)
- `tools/build-app-chunks.mjs` — esbuild minify → `public/chunks/app.shell.*.js`
- `app.html` eager boot: **i18n + 4 chunks + app.js = 6** defer scripts
- Source `app.*.js` files kept for unit tests, lazy tabs, and `prod-verify` spot checks
- `verify-app-chunks.mjs` + updated `audit:boot` / `logic-audit`

**Verify:** `npm run verify:site`, `npm run audit:boot`, `npm test`.

---

# Refactor Sprint 4 — Arcade

## 4.1 Category `.webp` fallback covers — DONE

**Problem:** Games without `imageUrl` or local SVG used inline SVG data-URIs for every tile — no cacheable assets, inconsistent with the “real cover images” goal in `IDEAS_AND_TODO.md`.

**Fix:**
- `tools/arcade-category-covers.json` + `generate-arcade-category-covers.mjs` — 16 category `.webp` files (900×540) in `assets/arcade/covers/categories/`
- `arcade.js`: `categoryCoverWebp()` → disk asset; `categoryCoverSvg()` kept as `data-fallback-cover` on `<img>` error
- `audit-arcade-category-covers.mjs` + client-invariants; `sync-app-and-assets` mirrors `assets/arcade/` for Vite fallback
- Added `casual`, `io`, `rpg` palette entries

**Verify:** `npm run arcade:covers:categories`, `node tools/audit-arcade-category-covers.mjs`, `npm run test:suite`.

## 4.2 Pro checkout flow — DONE

Wire Arcade Pro gate to real wallet checkout (reuse site wallet tab flow).

**Changes:**
- `arcade.js`: `goUpgradePro()` → `/app?tab=wallet&from=arcade` (+ optional `game=`); locked panel + plan card CTA
- `gmx_arcade_return_game` localStorage — auto-resume locked game after Pro activates
- `app.siteboot.js`: honor `?tab=` query on boot (before `gmx_last_tab` fallback)
- client-invariants: arcade checkout + siteboot tab deep-link guards

**Verify:** `npm run test:suite`, open locked Pro game → Upgrade → wallet tab with Solana checkout.

## 5.1 Per-game `.webp` covers — DONE

**Problem:** Seven GameDistribution titles used inline SVG paths — not cacheable like category `.webp` assets.

**Fix:**
- Rasterize existing `assets/arcade/covers/games/*.svg` → `.webp` (900×540) via `generate-arcade-game-covers.mjs`
- `localGameCover()` → `.webp`; `localGameCoverSvg()` kept as `data-fallback-cover` on error
- `audit-arcade-game-covers.mjs` + client-invariants; `prod-verify` spot-check

**Verify:** `npm run arcade:covers:games`, `node tools/audit-arcade-game-covers.mjs`, `npm run test:suite`.

## 5.2 Catalog static audit — DONE

**Problem:** No offline guard on `RAW_GAMES` integrity; `LOCAL_GAME_COVERS` still referenced seven GameDistribution titles removed from the catalog (dead assets + 5.1 drift).

**Fix:**
- `tools/audit-arcade-catalog.mjs` + `tools/lib/parse-arcade-games.mjs` — unique ids, CrazyGames embed/launch parity, access/badge/provider rules, min 58 games
- Removed orphan `LOCAL_GAME_COVERS` / per-game cover helpers from `arcade.js` (`coverSrc` → remote → category webp)
- Pruned unused game-cover generator/audit + `assets/arcade/covers/games/*`
- client-invariants + `npm run arcade:audit:catalog`

**Verify:** `node tools/audit-arcade-catalog.mjs`, `npm run test:suite`.
