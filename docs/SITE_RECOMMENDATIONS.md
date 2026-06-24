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
- [ ] **Hero video** (10–15 сек) — «Reply on email, play games» для новых пользователей
- [ ] **Demo без регистрации** — один клик → короткое реплей-демо
- [ ] Счётчик «X people connected today» (если есть метрики)

### GM / GN
- [ ] **Quick presets** — «Casual», «Professional», «Fun» — один клик на тон
- [ ] **История генераций** — последние 5 batch’ей с возможностью копировать снова
- [ ] **Keyboard shortcut** — Ctrl+Enter для Batch
- [ ] Подсказка «Edit any line by clicking» более заметна

### Prediction Market
- [ ] Краткое описание «What is prediction market» для новичков
- [ ] Ссылки на внешние маркеты (Polymarket, etc.) как «Learn more»

### Upgrade Pro
- [ ] **Годовой план со скидкой** — «2 months free» при yearly
- [ ] **Сравнительная таблица** Free vs Pro с галочками
- [ ] **Testimonial** — 1–2 коротких отзыва (если есть)
- [x] Явно: «Pro unlocks all Arcade games»

### Referrals
- [ ] **Прогресс-бар** до следующего unlock (темы/обои)
- [ ] «Invite 3 friends → week of Pro free»
- [ ] Копируемая ссылка с одним кликом

### Leaderboard
- [ ] **Топ-3** визуально выделить (медали/бейджи)
- [ ] «Your rank» всегда виден, даже вне топ-10

### Themes
- [ ] **Превью на hover** — быстрый preview темы
- [ ] Группировка: «Dark», «Light», «Colorful»
- [ ] «Pro unlocks all» рядом с locked items

### Extension
- [ ] **Скриншоты** popup и inline UI
- [ ] «Syncs with site» — что именно синхронится
- [ ] Ссылка на Chrome Web Store

### Arcade
- [x] **Game of the Day** — одна игра в день вверху
- [x] **Back to GMXReply** в hero
- [x] Реальные обложки, чистый каталог
- [x] **«Игра дня» в расширении** — toast раз в день
- [ ] **Достижения** — «сыграл 5 игр», «победил в Zombs Royale»
- [ ] **Страницы /arcade/agario** для SEO

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
- **PWA** — «Add to home screen»
- **Bottom nav** на мобильных вместо горизонтальных табов
- **Swipe** между GM / GN

---

## Приоритеты

| # | Задача | Раздел | Эффект |
|---|--------|--------|--------|
| 1 | Hero video / demo | Home | Конверсия |
| 2 | Yearly plan со скидкой | Upgrade Pro | MRR |
| 3 | «Игра дня» в расширении | Extension | Retention |
| 4 | Достижения Arcade | Arcade | Вовлечённость |
| 5 | Quick presets GM/GN | GM, GN | UX |
| 6 | Страницы /arcade/{slug} | Arcade | SEO |
| 7 | Referral progress bar | Referrals | Виральность |
| 8 | PWA | Глобально | Мобильный retention |

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
