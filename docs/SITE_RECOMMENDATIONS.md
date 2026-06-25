# Рекомендации по улучшению GMX Replay: весь сайт и разделы

## Структура сайта

| Раздел | Описание | Текущее состояние |
|--------|----------|-------------------|
| **Home** | Connect, активация кода, Quick guide | Есть trust badges, кнопка Arcade |
| **GM** | Генерация GM replies | Основной продукт |
| **GN** | Генерация GN replies | Основной продукт |
| **Prediction Market** | Сигналы для предсказаний | Специализированный |
| **Upgrade Pro** | Подписка, кошелёк | Монетизация |
| **Referrals** | Рефералы | Рост |
| **Leaderboard** | Рейтинг рефералов | Социальное |
| **Themes** | Теми и обои | Косметика |
| **Extension** | Настройки расширения | Синхронизация |
| **Arcade** | Игры | Game of the Day добавлен |

---

## Рекомендации по разделам

### Home
- [x] Trust badges: «50K+ replies», «Games from CrazyGames»
- [x] Кнопка «Play Arcade»
- [x] Пункт «Arcade» в What you get
- [x] **Hero video** (10–15 сек) — «Reply on X, play games» (SVG loop + optional MP4)
- [x] **Demo без регистрации** — один клик → короткое реплей-демо
- [ ] Счётчик «X people connected today» (если есть метрики)

### GM / GN
- [x] **Quick presets** — Casual / Professional / Fun — один клик на тон
- [x] **История генераций** — последние 5 batch’ей с возможностью копировать снова
- [x] **Keyboard shortcut** — Ctrl+Enter для Batch
- [x] Подсказка «Edit any line by clicking» более заметна

### Prediction Market
- [x] Краткое описание «What is prediction market» для новичков
- [x] Ссылки на внешние маркеты (Polymarket, etc.) как «Learn more»

### Upgrade Pro
- [x] **Годовой план со скидкой** — «2 months free» при yearly ($80/год)
- [x] **Сравнительная таблица** Free vs Pro с галочками
- [x] **Testimonial** — 1–2 коротких отзыва (если есть)
- [x] Явно: «Pro unlocks all Arcade games»

### Referrals
- [x] **Прогресс-бар** до следующего unlock (темы/обои)
- [x] **Виральный хук** — 3 eligible → cosmetics, 30 → Pro trial 7d
- [x] **Копируемая ссылка** — tap input + Share API + primary Copy

### Leaderboard
- [x] **Топ-3** визуально выделить (медали/бейджи)
- [x] «Your rank» всегда виден, даже вне топ-10

### Themes
- [x] **Превью на hover** — быстрый preview темы
- [x] Группировка: «Dark», «Light», «Colorful»
- [x] «Pro unlocks all» рядом с locked items

### Extension
- [x] **Скриншоты** popup и inline UI
- [x] «Syncs with site» — что именно синхронится
- [x] Ссылка на Chrome Web Store

### Arcade
- [x] **Game of the Day** — одна игра в день вверху
- [x] **Back to GMXReply** в hero
- [x] Реальные обложки, чистый каталог
- [x] **«Игра дня» в расширении** — toast раз в день
- [x] **Достижения** — 6 badges (launch count, GOTD, categories, Pro) — local device
- [ ] **Страницы /arcade/agario** для SEO — DONE (Sprint 7.4)

---

## Глобальные улучшения

### UX
- **Хлебные крошки** — «Home > GM» при глубокой навигации
- **Сохранение вкладки** — при возврате на сайт открывать последнюю вкладку (уже есть?)
- **Skeleton loaders** — при загрузке списков (GM, GN, Arcade)

### Производительность
- **Preload** популярных страниц (Arcade) при hover на таб
- **Lazy-load** iframe игр — загружать только при клике
- **Service Worker** — кэш статики, офлайн для части UI

### SEO и рост
- **meta description** уникальные для Home, Arcade, Upgrade
- **og:image** для шаринга
- **Blog** — «Top 10 .io games 2025», «How to write GM replies»

### Мобилка
- [x] **PWA** — «Add to home screen»
- [x] **Bottom nav** на мобильных вместо горизонтальных табов
- [x] **Swipe** между GM / GN

---

## Приоритеты

| # | Задача | Раздел | Эффект |
|---|--------|--------|--------|
| 1 | Hero video / demo | Home | Конверсия | DONE (10.1 + 10.2) |
| 2 | Yearly plan со скидкой | Upgrade Pro | MRR | DONE (11.1) |
| 3 | «Игра дня» в расширении | Extension | Retention |
| 4 | Достижения Arcade | Arcade | Вовлечённость | DONE (12.1) |
| 5 | Quick presets GM/GN | GM, GN | UX | DONE (13.1) |
| 6 | Страницы /arcade/{slug} | Arcade | SEO |
| 7 | Referral progress bar | Referrals | Виральность | DONE (14.1) |
| 8 | PWA | Глобально | Мобильный retention | DONE (15.1) |

---

## Уже сделано в этой сессии

1. **Arcade**
   - Game of the Day (детерминированный выбор по дню года)
   - Back to GMXReply в hero
   - Trust badges: 50K+ replies, Games from CrazyGames
   - Кнопка Play Arcade на Home
   - Пункт Arcade в What you get
2. **Каталог игр** — только игры с реальными обложками, топовые добавлены
3. **Документация** — RECOMMENDATIONS.md, SITE_RECOMMENDATIONS.md
