# GMXReply — канон, журнал правок, восстановление

Файл ведётся вручную и агентом: кратко фиксируем **что сделано**, **что не трогали**, чтобы не повторять ошибки и уметь откатиться.

## 1. Канон (кратко)

| Тема | Источник правды |
|------|-----------------|
| Shell сайта `/app` | `public/app.html`, `public/app.js`, `public/app.css`, `mode.js` → синк в `frontend/public/` |
| Dev URL эталона | `http://127.0.0.1:10000/app` |
| Vite dev | `http://127.0.0.1:5173/app` — тот же HTML с бэкенда (см. `frontend/vite.config.ts`, `docs/DEV_KNOWN_ISSUES.md`) |
| Обои | `assets/wallpapers/`, манифест `preset-manifest.json`, пресеты `w01`–`w158` + free01/02 |
| i18n | `shared/i18n/locales/*.json`, `npm run i18n:sync` |
| Генерация GM/GN | `index.js`: шаблоны, `replyQualityScore`, бан-слова, `/api/random` |

## 2. Журнал сессий

### 2026-04-12 — i18n: статусы обоев / Extension Themes

- **Сделано:** В `public/app.js` убран захардкоженный английский для загрузки сетки обоев, строки статуса (разблокировано / следующий реф), блока своего фона расширения и статусов выбора темы/обоев расширения — всё через `t()` и новые ключи в `shared/i18n/locales/en.json` (`wp_loading`, `wp_status_*_html`, `ext_custom_*_inline_html`, `ext_theme_status_*`, `ext_wp_status_*`). Подключены уже существовавшие, но неиспользованные `ext_custom_active_html`, `ext_custom_none_html`, слоты/рефы.
- **RU:** В `ru.json` исправлены повреждённые значения `ext_custom_*` (раньше в ключах оказался текст из другого блока) и добавлены переводы для новых ключей; `ext_rules_list_html` приведён к смыслу `en` (скины расширения), а не к постороннему тексту.
- **Проверки:** `npm run i18n:sync`, `node tools/sync-app-and-assets.mjs`, `node smoke.js`, `npm run verify:parity`.

### 2026-04-12 — `.cursorrules`: кто правит код

- **Сделано:** В `.cursorrules` добавлен блок **Who edits the repo**: пользователь код не правит; все правки и команды (sync/smoke/parity) делает агент. Не отсылать пользователя «почини сам».

### 2026-04-12 — канон в репозитории + генерация текста (док)

- **Сделано:** Переписан `.cursorrules` под GMXReply (убраны чужие шаблоны вроде Polymarket-only). Добавлен этот файл. Обновлён `docs/GENERATION_TARGET_R48_RU.txt`: приведены в соответствие с текущим движком `index.js` (баны WAGMI/frens/sunshine и т.д.).
- **Не меняли:** Логику `composeReply` / скоринг в `index.js` (только проверка согласованности с доками). В примерах дока убраны эмодзи из `RE_BANNED_MARKET_EMOJI` (например 🚀💎).
- **Зачем:** Один источник правды для агента и людей; док примеров не должен рекомендовать строки, которые движок режет скорингом.

### 2026-04-12 — язык UI и обои

- **Сделано:** `t()` / `trWp()` берут язык из **`#siteLang`** (как на экране), затем `localStorage`; `applyLang()` использует тот же `getResolvedSiteLang()` и синкает ключ. Бейджи сетки обоев (`FREE` / `UNLOCKED` / ref) через ключи `ui_tag_*` в i18n. Обои: `--site_wall_opacity: 1`, чуть ярче слой в `app.html`; панели в режиме обоев — матовое стекло `rgba(8,10,18,.42)` + blur (inline `app.html` + `app.css`), чтобы фон читался, а не «белый лист».
- **Не трогали:** логику разблокировок по рефералам / Pro.

### 2026-04-12 — workflow + light wallpaper UI

- **Сделано:** В `.cursorrules` явно: агент по умолчанию сам правит код и гоняет smoke/parity/sync; пользователь не обязан руками править репозиторий. В `app.css` для `body.hasWallBg.wallLight` добавлены отдельные полупрозрачные светлые панели (белое матовое стекло), чтобы светлые обои (кофе/небо) оставались видны при включённом «Wallpaper is light».
- **Не трогали:** логику `wallLight` в JS (только стили).

*(Добавляйте ниже новыми блоками с датой.)*

## 3. Восстановление (git)

Просмотр изменений:

```bash
git status
git diff
```

Откат **всех** незакоммиченных правок в каталоге:

```bash
git checkout -- .
```

Откат конкретных файлов:

```bash
git checkout -- path/to/file
```

Восстановить файл из коммита:

```bash
git show HEAD:path/to/file > path/to/file
```

После отката ассетов обоев при необходимости:

```bash
npm run wallpapers:rebuild-manifest
npm run wallpapers:thumbs
node tools/sync-app-and-assets.mjs
```

## 4. Проверки после правок

- `node smoke.js`
- `npm run verify:parity` (если трогали `public/` vs `frontend/public/` синхронизируемые файлы)
- `npm run build:frontend` (если меняли `frontend/`)
