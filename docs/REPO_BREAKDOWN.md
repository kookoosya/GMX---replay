# GMXReply — разбивка репозитория

Обновлено: Sprint 2 (2026-06). Tracker: `docs/REFACTOR_SPRINT.md`.

## Prod stack

| Слой | Где | Примечание |
|------|-----|------------|
| Web + API | **Render** (`render.yaml`) | `https://www.gmxreply.com` |
| DB default | **SQLite** on Render disk `/var/data` | `DB_MODE=sqlite` |
| DB optional | **Supabase** | `DB_MODE=supabase` + env в Render Dashboard |
| VPS | **Не используется** для сайта | Legacy: `tools/legacy/deploy-vps.mjs` |

## Канон (оставляем)

| Путь | Назначение |
|------|------------|
| `public/` | Shell сайта: `app.html`, `app.js`, `app.*.js`, `arcade.js` — **источник правды** |
| `site-src/` | 20 частей → `npm run build:site` → `public/app.js` |
| `server-src/` | 17 частей → `npm run build:server` → `index.js` |
| `server/routes/` | 16 route-модулей (generate, user, billing, static, …) |
| `assets/` | Обои, extbg, arcade SVG covers |
| `shared/i18n/` | Локали → `npm run i18n:sync` |
| `extension/` | Chrome MV3 popup + quick panel |
| `frontend/` | React **только** `/bridge` (Account Center) |
| `public/bridge/` | Build output React (`npm run build:frontend`) |

## Синхронизация (parity)

| Команда | Что делает |
|---------|------------|
| `node tools/sync-app-and-assets.mjs` | `public/` → `frontend/public/` |
| `npm run i18n:sync` | locales → siteI18n + extension bundle |
| `npm run verify:parity` | byte-identical shell files |
| Copy `arcade.js` | `public/` → `frontend/public/`, `public/bridge/` |

`public/bridge/app.html` **не** копируется — bridge = `index.html` SPA.

## Client boot

- `public/app.html` — ~97 deferred `<script>` (`client-manifest.json`)
- Phase 3: runwire слои влиты в `*wire.js` (−15 HTTP)
- Phase 4 bundle — в плане, не начат

## Обои

| Тип | ID | Файлы |
|-----|-----|-------|
| Site pack | `v2_001`…`v2_058` | `.webp` 1920×1080 + `thumbs/` |
| Extension pack | `extv3_01`…`extv3_58` | `.webp` 9:16 + thumbs |
| Free / lux | `free*`, `lux_*` | SVG |

`npm run wallpapers:fetch` — Pexels → pack refresh.

## Тесты и аудиты

| Команда | Покрытие |
|---------|----------|
| `npm test` | i18n, parity, app-shell modules (~118) |
| `npm run test:suite` | syntax, routes, generation, client-invariants, api-contract, e2e |
| `npm run audit:all` | logic + runtime |
| `npm run verify:prod` | prod health + smoke API |

Client-invariants: arcade cover collisions, bridge shell hygiene, deploy Render-only stub.

## Deploy (только Render)

```bash
git push origin main
npm run verify:prod
```

`npm run deploy:vps` — **отключён** (заглушка). Opt-in legacy: `npm run deploy:legacy:vps`.

Env в Render: `ADMIN_PASSWORD`, `SOL_RECEIVER`, `SOLANA_RPC`; опционально Supabase keys.

## Архив / не трогать без причины

| Путь | Статус |
|------|--------|
| `tools/legacy/deploy-vps.mjs` | Obsolete SSH deploy |
| `frontend/src/legacy/` | Старый React shell, не `/app` |
| `docs/NEW_CHAT_HANDOFF_RU.md` | Исторический handoff |

## node_modules (локально, не в git)

- Корень ~40+ MB (`better-sqlite3`, `playwright`, `sharp`, `ssh2` для legacy)
- `frontend/node_modules` ~70 MB
