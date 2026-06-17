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

**В план (следующие):**
- Wallpaper thumbs в сетке (полная картинка только при apply) — §2
- Skeleton / lazy-load для тяжёлых списков (`SITE_RECOMMENDATIONS.md`)
- Уменьшить cascade `refreshUsage` → ref stats → renderThemes
- i18n: не гонять full `applyLang()` без смены языка
- Модульный boot (~110 deferred scripts) — долгосрочно упростить bundle

### 2. Thumbs для обоев
- Загрузка превью (thumbs) в сетке вместо полных картинок — меньше лаг на слабых машинах
- Полное изображение только при применении

### 3. Arcade
- **Монетизация**: полный Pro checkout flow (сейчас только UI gate)
- **Real cover images**: категорийные .webp для action, racing, puzzle и т.д. (arcadeCovers.ts)
- **Quick insert** в Arcade: URL / GameMonetize ID / embed — уже частично есть

### 4. Referrals
- Unlock gating в site + extension (Phase 5)
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
