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

## 2.4 docs refresh — pending
