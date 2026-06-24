# GMXReply — идеи и что полезно доработать

## Реально полезное для сайта

### 1. Качество генерации GM/GN
- **Curated банки**: 4 банка — GM ordinary, GN ordinary, GM crypto, GN crypto
- **Разнообразие**: crypto-ответы не должны везде повторять WAGMI/moon/diamond hands
- **Scoring + anti-repeat + fingerprint dedupe** — ответы сильнее различаются между пользователями
- **Emoji по тону**: утренние для GM (☀️☕✨🌅), ночные для GN (🌙😴💤✨)

**Сделано (2026-06):** расширены warm/calmer/builder/meme банки; scoring штрафует diary-tone и повтор `we move`; unit-тесты на все style families.

### 1b. Сайт — лаги / глюки (частично в работе)
**Исправлено (2026-06):**
- `onTabActivated` больше не перерисовывает wallpaper grid на каждой вкладке
- `/api/version` fail не сбрасывает auth
- `/api/usage` fail не сбрасывает auth
- wallpaper UI: guard от рекурсивного re-render при load custom
- auto-recover: игнор Script error / chunk load (расширения)

**Сделано (2026-06, Phase 4):** skeleton loaders для Leaderboard/Referrals; Arcade iframe lazy-load (клик → embed); Render boot hardening; `applyLang()` skip без смены языка.

**Сделано (Bundle 5c):** lazy tab packs — `app.lazytabs.js` loads 14 scripts on tab activate (admin, prediction, wallet, LB, referrals, redeem); boot baseline **84** defer scripts.

**Сделано (Bundle 5d):** esbuild shell chunks — 4 packs, boot **6** eager defer scripts (i18n + chunks + app.js).

**Сделано (Sprint 4.1):** Arcade category `.webp` fallbacks — 16 covers in `assets/arcade/covers/categories/`, `categoryCoverWebp()` + SVG fallback on error.

**Сделано (Sprint 5.2):** Arcade catalog static audit — `audit-arcade-catalog.mjs`; removed orphan LOCAL_GAME_COVERS pipeline.

**Сделано (Sprint 5.1):** Arcade per-game `.webp` covers (later pruned when GameDistribution titles stayed out of catalog).

**В план (следующие):** Supabase when stable.

**Сделано (Sprint 3.4):** boot inventory — `audit:boot`, baseline 97 scripts, pruned stale `*runwire.js` mirrors.

**Сделано (Sprint 3.1):** referral progress bar — i18n `ref_progress_meter_html` + подсказка награды на метре.

**Сделано (Sprint 14.1):** referral progress bar hardened — span-based %, `refProgressNeed`, boot cache hydrate, `referral-progress-core.js`.

**Сделано (Sprint 3.2):** extension connect/sync/copy status — `ext_connect_*`, `ext_err_*`, `ext_copy_*` в `popup.js`.

**Сделано (2026-06, Phase 2):** cascade `refreshUsage` → ref stats → renderThemes убран; ref stats refresh только при смене eligible или на вкладке referrals.

**Сделано (2026-06, Phase 3):** 15 `*runwire.js` влиты в `*wire.js` — boot **97 scripts** (−15 HTTP), `tools/collapse-runwire.mjs`.

### 2. Thumbs для обоев
- ~~Загрузка превью (thumbs) в сетке вместо полных картинок~~ — **сделано (2026-06):** Pexels fetch → `thumbs/v2_*.webp` 480×270, full 1920×1080
- Полное изображение только при применении (уже так в `wallpaperui.js`)

### 3. Arcade
- **Монетизация**: Arcade Pro gate → wallet checkout (4.2 DONE)
- **Real cover images**: category `.webp` (4.1 DONE); catalog audit guards CrazyGames entries (5.2)
- **Quick insert** — DONE (7.2): CrazyGames URL / iframe / GameDistribution hash, local shelf
- **Catalog split** — DONE (7.1): `data/arcade-catalog.json` + `arcade:build`
- **Embed audit** — DONE (7.3): `arcade:audit:embeds` offline in CI
- **SEO slugs** — DONE (7.4): `/arcade/:slug` deep-links
- **Extension GOTD toast** — DONE (9.1): daily notification + popup title from catalog
- **Home guest demo** — DONE (10.1): Try GM/GN on Home without @handle

### 4. Referrals
- Unlock gating в site + extension — DONE (6.1)
- Admin unlock-credit коды уже есть в backend

### 5. Техдолг (по R69)
- Ревизия index.js generation helpers
- ~~Parity public/app.js vs frontend/public/app.js~~ — enforced: `npm run verify:parity` (входит в `npm run build`)
- Arcade source list + cover fetch chain

### 6. Документация рабочих потоков
- См. `ARCHITECTURE.md` (кто грузит `/app`, порты, sync)
- См. `docs/REPORTS_README.txt` (текстовые отчёты)

## Что уже сделано
- Custom wallpapers: API, import script, assets
- Arcade local covers для 7 игр (SVG)
- Разные стили кнопок обоев (free/premium/custom)
- Custom background: cover для любого экрана
- Проверка паритета `public/` ↔ `frontend/public/` (`verify:parity`), CI: smoke без заглушки
- `ARCHITECTURE.md`, `docs/REPORTS_README.txt`, `PLAN.md` (рабочий план аудита)
