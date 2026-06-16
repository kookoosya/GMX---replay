# Plan — закрытие аудита (паритет, CI, документация)

## Assumptions
- Единственный источник правды для shell сайта: `Backend/public/` (`app.html`, `app.js`, `app.css`, …).
- `frontend/public/` — копия после `tools/sync-app-and-assets.mjs` (fallback при Vite).
- Vite на `:5173` для запросов документа на `/` и `/app` отдаёт HTML с бэкенда (см. `ARCHITECTURE.md`).

## Steps (выполнено)
1. Добавить `tools/verify-public-frontend-parity.mjs` и скрипт `verify:parity` в `package.json`.
2. Включить проверку в цепочку `npm run build` и отдельно для ручного запуска.
3. CI: smoke без `|| true`; `verify:parity` входит в `npm run build` (отдельный job не обязателен).
4. Добавить `ARCHITECTURE.md` — кто что грузит, порты, sync.
5. Обновить `README.txt`, пометить отчёты в `docs/`.
6. Запустить `sync` + `build` + `smoke` + `verify:parity` локально.

## Acceptance criteria
- `node smoke.js` завершается с кодом 0.
- `npm run verify:parity` завершается с кодом 0 после `sync`.
- `npm run build` проходит полностью.
- GitHub Actions падает при падении smoke или parity.

---

# Роадмап продукта (порядок работ)

## Фаза A — сайт и расширение (сейчас)
- Источник текстов сайта: `shared/i18n/locales/en.json` → `npm run i18n:sync` → `public/i18n/siteI18n.js` (+ фронт).
- Расширение: копирайт в `extension/*.html`, `manifest.json`; сигналы бота — только как информационные уведомления (без инвестсовета).
- Цель: полные английские формулировки без пустых ключей, единый тон «copy-first, без автопостинга».

## Фаза B — остальные локали
- После стабилизации EN — вычитка каждого файла в `shared/i18n/locales/*.json` (без машинного «шума»), все языки равнозначны.

## Фаза C — Supabase и Render
- После стабильного UX сайта/расширения: env, миграции, деплой (см. `ARCHITECTURE.md`).

## Acceptance (фаза A)
- В `en.json` нет пустых строк у публичных ключей подзаголовков/описаний вкладок.
- `npm run i18n:sync` и `npm run build` проходят без ошибок.

### i18n: сайт + расширение + Arcade
- Каталог: `shared/i18n/locales/*.json` → `npm run i18n:sync` пишет `public/i18n/siteI18n.js`, фронт и **`extension/i18n-bundle.js`**.
- Язык сайта `localStorage gmx_site_lang` синхронизируется в расширение как `gmx_site_lang_v1` (`extension/site_sync.js`).
- `public/arcade.js` + `/i18n/siteI18n.js`; расширение: `data-i18n` + `ext_*` в `popup.js`.
