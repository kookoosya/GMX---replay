# Wallpapers: пути и источники

## Единственный источник обоев

**Backend/assets/wallpapers/** — откуда бэкенд раздаёт `/assets/wallpapers/*`

```
index.js: ASSETS_DIR = path.join(__dirname, "assets")
         → /assets и /bridge/assets маппятся на Backend/assets/
```

## Где что лежит

| Папка | Назначение | Раздаётся? |
|-------|------------|------------|
| **assets/wallpapers/** | Основной источник | ✅ Да, через /assets |
| public/assets/wallpapers/ | НЕ используется бэкендом | ❌ |
| frontend/public/assets/wallpapers/ | Fallback когда Vite без proxy | Только при падении proxy |
| public/bridge/assets/wallpapers/ | React bridge build | Через /bridge/assets |

## Что видит приложение

- **free01, free02** — встроенные пресеты
- **w01–w158** — пресеты (имена циклически из списка + для w59+ тег темы в `preset-names.json`)
- **custom_*** — из assets/wallpapers/custom/ (Add wallpaper → API)

Добавить 100 процедурных JPG (w59–w158): `npm run wallpapers:generate-extra`, затем `npm run wallpapers:rebuild-manifest` и `npm run wallpapers:thumbs`. Полный импорт своих файлов: `tools/import-preset-wallpapers.mjs` (до 160 слотов).

Исправление применения обоев: `mode.js` и встроенный fallback в `app.js` знают реальные расширения (`free01.png` и т.д.), чтобы не подставлялся неверный `.svg`/`.jpg` до загрузки `preset-manifest.json`.

## Твои загрузки

Чтобы обои попали в приложение, файлы должны лежать в:
- **assets/wallpapers/custom/** — для site wallpapers (Custom #1, #2, …)

Формат: PNG, JPG, JPEG, WEBP. Имя файла → id `custom_имя.расширение`.

## Синхронизация

Перед `npm run dev` запусти:
```bash
node tools/sync-app-and-assets.mjs
```

Копирует public/ и assets/wallpapers в frontend/public для одинакового fallback.
