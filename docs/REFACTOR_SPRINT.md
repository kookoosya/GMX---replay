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

## 6.1 Extension cosmetics unlock gating — DONE

**Problem:** Site enforces referral/Pro locks on extension themes and wallpapers (`app.extapply.js`, `app.extthemesui.js`); extension popup applied any synced cosmetic without checking entitlements.

**Fix:**
- `extension/lib/unlock-core.js` — same `FREE_VISIBLE_EXT_*` + `unlockedCountByRefs` as `app.unlock.js`
- `extension/lib/ext-cosmetics-gate.js` — `clampExtCosmetics()` before `applyThemeUi`
- `popup.js` — load usage + eligible refs, clamp locked theme/wallpaper to first unlocked fallback
- `tests/extension-unlock-gate.test.mjs` + client-invariants

**Verify:** `node --test tests/extension-unlock-gate.test.mjs`, `npm run test:suite`.

## 7.1 Catalog split — DONE

**Problem:** 58-game catalog lived only inside `public/arcade.js` — hard to audit/edit without touching runtime shell.

**Fix:** `data/arcade-catalog.json` source of truth; `tools/build-arcade-catalog.mjs` (`npm run arcade:build`); `load-arcade-catalog.mjs` for audits.

**Verify:** `npm run arcade:build`, `npm run arcade:audit:catalog`.

## 7.2 Quick insert — DONE

**Problem:** No UI to paste CrazyGames / embed / GameDistribution links into a personal quick shelf.

**Fix:** Quick insert panel in `arcade.js` + `tools/lib/arcade-quick-insert.mjs`; localStorage shelf (max 12); i18n in 15 locales.

**Verify:** `node --test tests/arcade-sprint7.test.mjs`.

## 7.3 Embed URL audit — DONE

**Problem:** `tools/arcade-audit.mjs` was manual/network-only and not in CI.

**Fix:** `tools/audit-arcade-embeds.mjs` offline (+ optional `--network`); wired into client-invariants; `npm run arcade:audit:embeds`.

**Verify:** `npm run arcade:audit:embeds`, `npm run test:suite`.

## 7.4 SEO slug deep-links — DONE

**Problem:** `/arcade/agario` redirected blindly to `/arcade.html` without opening the game.

**Fix:** `server/routes/static.mjs` `/arcade/:slug` → `/arcade.html?game=`; `tryOpenDeepLinkGame()` in arcade.js.

**Verify:** `node --test tests/arcade-sprint7.test.mjs`, open `/arcade/agario`.

## 8.1 Pro unlocks Arcade copy — DONE

**Problem:** Upgrade Pro / Wallet did not explicitly say Pro unlocks all Arcade games (`SITE_RECOMMENDATIONS.md`).

**Fix:**
- `wallet_desc`, `plan_modal_desc`, `w_right_list` Pro bullet, `arcade_locked_premium_note` — EN + 14 locales via `tools/patch-wallet-arcade-pro-i18n.mjs`
- `app.html` fallback Pro bullet; `tests/wallet-arcade-pro-i18n.test.mjs`

**Verify:** `npm test`, Wallet tab + locked Arcade title show Arcade in Pro copy.

## 8.2 prod-verify Arcade slug — DONE

**Problem:** Sprint 7.4 slug redirect had unit test on source only; prod smoke did not hit `/arcade/agario`.

**Fix:** `tools/prod-verify.mjs` — 302 to `/arcade.html?game=agario` + `siteI18n.js` contains wallet Arcade Pro copy.

**Verify:** `npm run verify:prod` after deploy.

## 9.1 Extension Game of the Day toast — DONE

**Problem:** Extension had a static GOTD card without today's game; no once-per-day nudge (`SITE_RECOMMENDATIONS.md`).

**Fix:**
- `extension/lib/gotd-games.json` built from `data/arcade-catalog.json` (`arcade:build`)
- `extension/lib/gotd-core.js` — same day-of-year picker as `arcade.js`
- `background.js` — daily alarm + `chrome.notifications` once per local day; click opens `/arcade/:slug`
- `popup.js` — shows today's title; Play opens deep-link

**Verify:** `node --test tests/extension-gotd.test.mjs`, reload extension, see notification once per day.

## 10.1 Home guest demo — DONE

**Problem:** `h_try_*` / `homeTryGm` i18n existed but Home had no Try GM/GN UI; guests could not sample replies before connect (`SITE_RECOMMENDATIONS.md` priority #1).

**Fix:** Home try panel in `app.html`; `app.connect.js` calls `/api/public/random-bulk` (3 mid lines) + copy; `prod-verify` spot-check.

**Verify:** `node --test tests/home-demo.test.mjs`, open Home logged out → Try GM.

## 10.2 Home hero motion — DONE

**Problem:** Home lacked a visual hook for «Reply on X, play games» (`SITE_RECOMMENDATIONS.md` priority #1).

**Fix:** `#homeHero` card above grid — 12s animated SVG loop (`/assets/hero/gmx-hero-loop.svg`), poster, optional `<video>` when `gmx-hero.mp4` exists; `app.homehero.js` respects `prefers-reduced-motion`; CTA scrolls to guest demo.

**Verify:** `node --test tests/home-hero.test.mjs`, `prod-verify` hero asset + `#homeHero` in `/app`.

## 11.1 Wallet yearly plan marketing — DONE

**Problem:** `y1` plan existed ($80/365d) but Wallet had no savings messaging (`SITE_RECOMMENDATIONS.md` priority #2).

**Fix:** `#w_yearly_save` note, featured `y1` card, i18n badges, `~$6.67/mo` secondary quote, `plan_modal_desc` yearly line.

**Verify:** `node --test tests/wallet-yearly.test.mjs`, `prod-verify` billing `y1` + `w_yearly_save`.

## 12.1 Arcade achievements — DONE

**Problem:** No gamification on Arcade (`SITE_RECOMMENDATIONS.md` priority #4).

**Fix:** `lib/arcade-achievements-core.js` + achievements panel on `/arcade.html`; progress in `localStorage` on iframe launch.

**Verify:** `node --test tests/arcade-achievements.test.mjs`, `prod-verify` achievements core + panel.

## 13.1 GM/GN quick presets — DONE

**Problem:** Quick tone buttons existed in HTML but lacked i18n, Professional naming, and locked-option safety (`SITE_RECOMMENDATIONS.md` priority #5).

**Fix:** `applyQuickPreset()` in `app.gmgnwire.js` sets mode/style/pack; GM & GN get labeled Casual / Professional / Fun + help copy.

**Verify:** `node --test tests/gmgn-quick-presets.test.mjs`, `prod-verify` `gm_preset_professional` in `/app`.

## 14.1 Referral progress bar — DONE

**Problem:** Basic meter existed (Sprint 3.1 i18n) but progress counted from zero (not span between unlocks), no “need N more” hint, bar hidden until API refresh (`SITE_RECOMMENDATIONS.md` priority #7).

**Fix:** `lib/referral-progress-core.js` + span-based `referralProgressPct`; `#refProgressPct` / `#refProgressNeed`; hydrate from `localStorage` eligible cache on boot; `applyRefCountEligible` syncs meter.

**Verify:** `node --test tests/referral-progress.test.mjs`, `prod-verify` referral progress core + `refProgressNeed` in `/app`.

## 15.1 PWA install shell — DONE

**Problem:** No web app manifest or install path for mobile home-screen retention (`SITE_RECOMMENDATIONS.md` priority #8).

**Fix:** `manifest.webmanifest` + `sw.js` static cache; `#pwa_install` button with `beforeinstallprompt` / iOS hint; `app.pwainstall.js` in boot chunk.

**Verify:** `node --test tests/pwa.test.mjs`, `prod-verify` manifest + sw + `pwa_install` in `/app`.

## 16.1 Referral viral hook + one-click copy — DONE

**Problem:** Referrals tab lacked a clear growth hook and copy required a separate button click (`SITE_RECOMMENDATIONS.md` Referrals).

**Fix:** `#ref_viral_hook_html` banner (3 → cosmetics, 30 → Pro trial 7d); tap `#refLink` to copy; primary `#refCopy`; optional `#refShare` via Web Share API.

**Verify:** `node --test tests/referral-share.test.mjs`, `prod-verify` `ref_viral_hook_html` in `/app`.

## 17.1 Leaderboard medals + your rank — DONE

**Problem:** Leaderboard rows looked flat; rank outside top-50 showed as `>50` with no server rank (`SITE_RECOMMENDATIONS.md` Leaderboard).

**Fix:** `lib/leaderboard-core.js` medals for top-3; `.lbYourRank` strip above table; API `me.rank` via SQL; lazy tab pack loads core.

**Verify:** `node --test tests/leaderboard-ui.test.mjs`, `prod-verify` `lbYourRank` + `/lib/leaderboard-core.js`.

## 18.1 Themes hover preview + grouping — DONE

**Problem:** Theme picker was a flat grid with no live preview, buckets, or Pro upsell on locked cards (`SITE_RECOMMENDATIONS.md` Themes).

**Fix:** `lib/theme-group-core.js` buckets Dark/Light/Colorful; hover/focus live `applyTheme` preview; `.themeProHint` on locked cards; boot defer baseline → 8.

**Verify:** `node --test tests/themes-ui.test.mjs`, `prod-verify` theme-group core + `app.themesui.js` groups.

## 19.1 GM/GN batch history + Ctrl+Enter — DONE

**Problem:** No way to re-copy recent batch runs; Ctrl+Enter only worked with focus inside tab (`SITE_RECOMMENDATIONS.md` GM/GN).

**Fix:** `lib/gmgn-gen-history-core.js` stores last 5 batches; `#gmGenHistory` / `#gnGenHistory` with Copy again; Ctrl+Enter on active GM/GN tab; `.editHint` above lists.

**Verify:** `node --test tests/gmgn-gen-history.test.mjs`, `prod-verify` `gmGenHistory` + gen-history core.

## 20.1 Mobile bottom nav + GM/GN swipe — DONE

**Problem:** Horizontal tabs overflow on phones; no quick GM ↔ GN gesture (`SITE_RECOMMENDATIONS.md` Мобилка).

**Fix:** `lib/mobile-nav-core.js` + `app.mobilenav.js` — fixed bottom nav (Home/GM/GN/Pro/More), more sheet for secondary tabs, swipe between GM/GN; boot defer baseline → 10.

**Verify:** `node --test tests/mobile-nav.test.mjs`, `prod-verify` mobile-nav core + shell.

## 21.1 Prediction newbie intro + learn-more links — DONE

**Problem:** Prediction tab had no plain-language explainer or pointers to real markets (`SITE_RECOMMENDATIONS.md` Prediction Market).

**Fix:** `#pm_newbie_block` intro copy + `#pm_learn_more` external links (Polymarket, Kalshi, Manifold) with i18n across locales.

**Verify:** `node --test tests/prediction-onboarding.test.mjs`, `prod-verify` prediction onboarding shell.

## 22.1 Extension sync hub + store CTA — DONE

**Problem:** Extension tab lacked plain sync explainer, UI previews, and store install path (`SITE_RECOMMENDATIONS.md` Extension).

**Fix:** `#ext_sync_hub` with sync list, SVG popup/inline previews, `/get-extension` Chrome Web Store CTA + i18n.

**Verify:** `node --test tests/extension-tab-ux.test.mjs`, `prod-verify` extension sync hub.

## 23.1 Wallet Free vs Pro compare + testimonial — DONE

**Problem:** Upgrade Pro lacked an at-a-glance Free vs Pro table and social proof (`SITE_RECOMMENDATIONS.md` Upgrade Pro).

**Fix:** `#wallet_plan_compare` inline table with ✓/— cells, `#wallet_testimonial`, upgraded `#plan_modal_table` with i18n + checkmarks.

**Verify:** `node --test tests/wallet-plan-compare.test.mjs`, `prod-verify` wallet plan compare UI.

## 24.1 Home connected-today counter — DONE

**Problem:** Home lacked live social proof from real connection metrics (`SITE_RECOMMENDATIONS.md` Home).

**Fix:** `/api/public/stats` (`connectedToday` from `users.last_seen`), `#home_connected_wrap` pill + `app.homestats.js`.

**Verify:** `node --test tests/home-connected-counter.test.mjs`, `prod-verify` home connected today UI.

## 25.1 SEO meta + og:image — DONE

**Problem:** Home, Arcade, and Upgrade lacked unique share/SEO meta and og:image (`SITE_RECOMMENDATIONS.md` global SEO).

**Fix:** `/assets/og/gmx-share.svg`, `app.seometa.js` tab-aware title/description, arcade.html meta tags, i18n `seo_*` keys.

**Verify:** `node --test tests/seo-meta.test.mjs`, `prod-verify` seo meta and og:image.

## 26.1 App breadcrumbs — DONE

**Problem:** Deep tabs lacked wayfinding (`SITE_RECOMMENDATIONS.md` global UX breadcrumbs).

**Fix:** `#app_breadcrumbs` with Home link + current section label; updates on tab switch via `app.breadcrumbs.js`.

**Verify:** `node --test tests/breadcrumbs.test.mjs`, `prod-verify` app breadcrumbs UI.

## 27.1 Arcade preload on hover — DONE

**Problem:** Navigating to Arcade from `/app` paid full cold-load cost (`SITE_RECOMMENDATIONS.md` performance).

**Fix:** `app.arcadepreload.js` injects `rel=prefetch` for `/arcade.html` and `/arcade.js` on pointerenter/focus of tab, home CTA, and mobile more link. Skips `saveData` and when already on Arcade.

**Note:** Game iframe lazy-load (`iframeReady` + launch button) already ships in `arcade.js`.

**Verify:** `node --test tests/arcade-preload.test.mjs`, `prod-verify` arcade preload on hover.

## 28.1 Skeleton loaders — DONE

**Problem:** GM/GN lists only skeletoned above 20 lines; Arcade catalog showed tiles before plan check finished.

**Fix:** `skeleton-core` lib; GM/GN `renderList` skeleton from 3+ lines; Arcade GOTD + grid skeleton while `state.plan === 'loading'`.

**Verify:** `node --test tests/skeleton-loaders.test.mjs`, `prod-verify` skeleton loaders.

## 29.1 Service Worker offline shell — DONE

**Problem:** SW only precached 3 assets and skipped navigation; offline revisit to `/app` failed (`SITE_RECOMMENDATIONS.md` performance).

**Fix:** `gmx-shell-v2` + doc cache for `/app` and `/arcade.html` (network-first, cache fallback); precache `app.css` + og image; runtime cache for `/lib/`, `/assets/`, `/chunks/`.

**Verify:** `node --test tests/pwa-offline-shell.test.mjs`, `prod-verify` PWA service worker v2.

## 30.1 Blog SEO guides — DONE

**Problem:** No content pages for organic traffic (`SITE_RECOMMENDATIONS.md` SEO/blog).

**Fix:** `/blog.html` index + two articles with unique meta/og; clean `/blog/:slug` routes; Home guides teaser with i18n.

**Verify:** `node --test tests/blog.test.mjs`, `prod-verify` blog guides SEO.

## 31.1 Extension GOTD polish — DONE

**Problem:** GOTD toast/card shipped in 9.1 but popup showed title only; notification opened SEO slug instead of instant play (`SITE_RECOMMENDATIONS.md` priority #3).

**Fix:** `gotd-games.json` includes category/access/cover from catalog build; popup cover + meta row; toast + Play use `/arcade.html?game=` deep-link; manifest `1.1.5`.

**Verify:** `node --test tests/extension-gotd.test.mjs`, reload extension → GOTD card with cover.

## 32.1 Arcade slug SEO landing pages — DONE

**Problem:** `/arcade/:slug` only 302-redirected to `arcade.html?game=` — no indexable HTML (`SITE_RECOMMENDATIONS.md` priority #6).

**Fix:** Server-rendered SEO page per catalog game (meta, og:image, canonical, cover, Play CTA); unknown slugs fall back to `/arcade.html`.

**Verify:** `node --test tests/arcade-slug-seo.test.mjs`, `prod-verify` arcade slug seo page.

## 33.1 Blog content expansion — DONE

**Problem:** Only two blog guides (30.1); organic SEO needed per-game and GN content (`SITE_RECOMMENDATIONS.md`).

**Fix:** Three new articles (Agar.io, Geometry Dash, GN evening routine); blog index + home teaser link; `blog-core` registry at 5 posts; i18n `blog_home_link_agario`.

**Verify:** `node --test tests/blog.test.mjs`, `prod-verify` blog guides SEO + `/blog/how-to-play-agario`.

## 34.0 Remove blog guides — DONE

**Problem:** Game/GM blog guides not needed for product; SEO for games covered by `/arcade/{slug}` landing pages.

**Fix:** Delete blog HTML; `/blog` + `/blog.html` + `/blog/:slug` → 301 `/app`; remove home teaser; drop blog from PWA shell cache.

**Verify:** `node --test tests/perf-tab-activation.test.mjs`, `prod-verify` blog guides removed.

## 34.1 Tab activation perf — DONE

**Problem:** Site felt sluggish switching tabs — redundant wallpaper grid rebuild (58 cards) on Extension tab; prediction refetched every visit.

**Fix:** `renderWallpaperUI` only on Themes tab; wallpaper/themes render signature skip; prediction `force` only on first tab visit.

**Verify:** `node --test tests/perf-tab-activation.test.mjs`, manual tab switch GM → Themes → Extension.
