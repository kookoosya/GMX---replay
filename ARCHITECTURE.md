# GMXReply — архитектура dev / prod

## Единый источник shell-сайта (GM/GN, Themes, `/app`)

| Роль | Путь |
|------|------|
| **Источник правды** | `public/app.html`, `public/app.js`, `public/app.css`, `app.auth.js`, `app.storage.js`, `arcade.*`, `entitlements.js`, `mode.js`, `themes.json` |
| Копия для Vite fallback | `frontend/public/*` — зеркало после `node tools/sync-app-and-assets.mjs` |

Правки UI для основного сайта делайте в **`public/`**, затем:

```bash
node tools/sync-app-and-assets.mjs
```

Или `npm run dev` / `npm run build` (оба запускают sync в начале цепочки).

## Локальный dev (`npm run dev`)

- Бэкенд: `http://127.0.0.1:10000`
- Vite: `http://127.0.0.1:5173`

В `frontend/vite.config.ts` middleware для документных GET на `/`, `/app`, `/app.html`, `/app/*` и на **`/arcade`, `/arcade.html`, `/arcade/*`** подставляет **HTML с бэкенда** (тот же `public/app.html` или цепочку редиректов в `arcade.html`), а не `frontend/index.html`. Для `/` запрос к бэкенду идёт на **`/app`** (с сохранением query), чтобы не полагаться на редирект 302. Учитываются и клиенты с `Accept: */*` / `Sec-Fetch-Dest: document` — иначе Vite отдавал бы React AppShell / React Arcade и вёрстка расходилась с каноном на `:10000`. Подробнее: `docs/DEV_KNOWN_ISSUES.md`.

`frontend/src/legacy/*` (React + сырой `legacyBody.html`) — отдельная оболочка; для маршрута `/app` через описанный proxy она **не** подменяет этот HTML. Не путать с правками в `public/`.

Extension popup/quick panel loads shared modules from `extension/lib/`:

| File | Role |
|------|------|
| `lib/ext-config.js` | Constants: storage keys, wallpaper catalog, fallback lines |
| `lib/ext-i18n.js` | `extT()`, static `data-i18n` binding, language from `chrome.storage` |

Loaded in `popup.html` / `quick.html` before `popup.js`. Site i18n bundle: `extension/i18n-bundle.js` (from `npm run i18n:sync`).

## React / bridge

- Сборка: `npm run build:frontend` → `frontend/dist` → копируется в `public/bridge` (`tools/sync-frontend-build.mjs`).
- Точки входа React: см. `frontend/src/main.tsx` (`/bridge` → App; иначе `AppShell`). Путь **`/arcade` в `npm run dev`** обрабатывается Vite middleware (см. выше), а не только этим резолвером.

## Проверки

- `node smoke.js` — быстрая проверка наличия ключевых id в shell.
- `npm run verify:parity` — `public/` и `frontend/public/` совпадают по синхронизируемым файлам (после sync).

## База данных

- По умолчанию SQLite (`DB_MODE` не задан или `sqlite`).
- `DB_MODE=supabase` требует `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`; иначе предупреждение и работа через SQLite.
