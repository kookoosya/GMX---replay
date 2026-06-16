# GMXReply — разбивка репозитория (лишнее / большое)

Обновлено после мержа deep-refactor + wallpaper pass.

## Канон (оставляем)

| Путь | Размер (порядок) | Назначение |
|------|------------------|------------|
| `assets/` | ~15–25 MB | **Единственный** источник обоев, extbg, arcade covers |
| `public/app.js` | ~280 KB | Основной UI `/app` |
| `public/app.html`, `mode.js`, `arcade.js` | — | Legacy shell |
| `index.js` + `server/generation.mjs` | ~7 MB | API, биллинг, генерация |
| `extension/` | ~180 KB код + 10 SVG bundled | Chrome extension |
| `frontend/` | исходники React bridge | `/bridge` после build |
| `shared/i18n/` | локали | Переводы |

## Дубликаты (удалены prune-скриптом)

| Путь | Проблема |
|------|----------|
| `public/assets/wallpapers/`, `public/assets/extbg/` | Зеркало `assets/` (~15 MB), устаревшие `w*.svg`, `ext_*.svg` |
| `public/bridge/assets/wallpapers|extbg/` | То же после build |
| `frontend/public/assets/*` | Копия для Vite dev — не нужна, сервер отдаёт `/assets` |
| `assets/wallpapers/v3/` | Legacy pack, не в runtime |

## node_modules (не в git, но тяжёлые локально)

- Корень ~42 MB (`better-sqlite3`, `playwright-core` в devDeps)
- `frontend/node_modules` ~70 MB

## Мёртвый код (уже убрано в main)

- `frontend/src/components/arcade/*` — React arcade scaffold
- `public/assets/extbg/ext_*.svg` — заменены на `extv3_*.webp`
- Inline SVG data-URI для pack-обоев в `app.js` — заменено на реальные `.webp`

## Обои — как устроено

| Тип | ID | Файл | Размер | Где |
|-----|-----|------|--------|-----|
| Site free | `free01`, `free02` | `.svg` | 16:9 | `assets/wallpapers/` |
| Site pack | `v2_001`…`v2_058` | `.webp` 1920×1080 | 16:9 | + `thumbs/` 480×270 |
| Site lux | `lux_*` | `.svg` | premium art |
| Extension free | `ext_free_01/02` | `.svg` | bundled + CDN |
| Extension pack | `extv3_01`…`extv3_58` | `.webp` 1080×1920 | 9:16 | + thumbs 360×640 |
| Extension lux | `lux_ext_*` | `.svg` | bundled |

**CSS:** `background-size: cover` на `body` (сайт и extension) — телефон, монитор, popup.

**Генерация:** `node tools/generate-crypto-wallpapers.mjs`

## Скрипты обслуживания

| Скрипт | Действие |
|--------|----------|
| `tools/generate-crypto-wallpapers.mjs` | Пересоздать pack webp |
| `tools/prune-asset-mirrors.mjs` | Удалить зеркала assets |
| `tools/runtime_audit.mjs` | Проверка manifests + parity |
| `tools/import-wallpapers.mjs` | Custom upload → `custom/` |
| `npm run build` | React bridge → `public/bridge/` |

## Deploy

Push `main` → Render (`render.yaml`). Env: `SOL_RECEIVER`, `ADMIN_PASSWORD`.
