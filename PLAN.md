# GMXReply — рабочий план (актуально 2026-06)

## Инфраструктура (что нужно, что нет)

| Компонент | Нужен для GMXReply? | Сейчас в prod |
|-----------|---------------------|---------------|
| **Render** | **Да** — единственный хост сайта/API | `https://www.gmxreply.com`, auto-deploy `main` |
| **Supabase** | **Опционально** — облачная БД вместо SQLite | `DB_MODE=sqlite` в `render.yaml` (диск `/var/data`) |
| **VPS** | **Нет** для сайта | SSH-деплой архивирован (`tools/legacy/`) |

**Render + SQLite** — рабочий прод без Supabase (пользователи, usage, referrals в SQLite на persistent disk).

**Render + Supabase** — когда нужна облачная БД (бэкапы, отдельный доступ, будущий multi-instance):

```env
DB_MODE=supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Миграции: `supabase/01_core.sql` → `02_cloud_favorites.sql` → `03_referrals.sql`. Проверка: `/api/health` → `supabaseActive: true`.

Отдельный VPS (например, торговый бот) **не связан** с деплоем GMXReply — можно оставить бота там; сайт на VPS не разворачиваем.

Деплой: `git push origin main` → `npm run verify:prod`. Подробнее: `DEPLOY.md`, `ARCHITECTURE.md`.

---

## Выполнено — аудит и паритет

- `npm run verify:parity` — `public/` ↔ `frontend/public/`
- `npm run build` включает parity; CI smoke без заглушек
- `ARCHITECTURE.md`, `DEPLOY.md`, `docs/REFACTOR_SPRINT.md`

## Выполнено — рефакторинг (фазы 1–4)

| Фаза | Содержание |
|------|------------|
| **1** | Wallpapers factory, Solana mock, extension cleanup, E2E, client-invariants |
| **2** | Legacy tools removed, server-src утоньшение, usage cascade fix |
| **3** | 15 `*runwire.js` → `*wire.js`, boot −15 HTTP |
| **4** | `applyLang()` skip, Render boot hardening, skeleton LB/Referrals, Arcade lazy iframe |

## Выполнено — Sprint 1 (client parity)

1. Arcade cover `imageUrl` collisions  
2. ru/uk Arcade i18n  
3. Duplicate `coverSrc()` в `arcade.js`  
4. Stop `bridge/app.html` auto-copy  
5. `mountLineListSkeleton` в bankui  

## Выполнено — Sprint 2 (i18n + deploy hygiene)

1. ru/uk extension popup `ext_*` i18n  
2. `arcade-covers.json` madalin + audit  
3. VPS deploy scripts → obsolete (Render-only)  
4. Этот план + `REPO_BREAKDOWN.md`  

---

## Дальше (приоритет)

**Supabase отложен** — подключаем, когда сайт и расширение стабильно работают (`DB_MODE=sqlite` на Render достаточно).

### Sprint 3 — стабильность сайта + расширения

1. **Referral progress bar** — i18n + подсказка награды — DONE (3.1)
2. **Extension connect/status** — i18n в `popup.js` — DONE (3.2)
3. **Extension ↔ site session sync** — аудит + тесты — DONE (3.3)
4. **Boot bundle** — inventory + audit (`audit:boot`) — DONE (3.4)

### После Sprint 3

- **Bundle 5c–5d** — DONE
- **Sprint 4.1** Arcade category `.webp` covers — DONE
- **Sprint 4.2** Pro checkout flow — DONE
- **Sprint 5.1** Arcade per-game `.webp` covers — DONE (superseded by catalog cleanup in 5.2)
- **Sprint 5.2** Arcade catalog static audit — DONE

## i18n pipeline

`shared/i18n/locales/*.json` → `npm run i18n:sync` → `public/i18n/siteI18n.js`, `extension/i18n-bundle.js`, bridge copy.

## Acceptance (регресс)

```bash
npm test
npm run test:suite
npm run verify:prod   # после push
```
