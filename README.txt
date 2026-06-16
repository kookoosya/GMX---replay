GMXReply — clean baseline

Local dev (обязательно из папки Backend — поднимает API + Vite :5173)
  npm run dev
  Если в браузере ERR_CONNECTION_REFUSED на http://127.0.0.1:5173 — сервер не запущен: выполните команду выше в терминале и дождитесь строки про Vite ready.

Переводы
  Эталон ключей: shared/i18n/locales/en.json — остальные языки: рядом же (de.json, fr.json, …), без отдельных «особых» пайплайнов.
  После правок: npm run i18n:sync (встроено в npm run dev и npm run build) — обновляет siteI18n и extension/i18n-bundle.js.

Канон UI в dev
  Тот же shell, что на бэкенде: http://127.0.0.1:10000/app
  Через Vite: http://127.0.0.1:5173/app — должен совпадать (см. docs/DEV_KNOWN_ISSUES.md).

Main routes
  /app  /bridge  /arcade.html

Shell source of truth (edit here, then sync)
  public/app.html  public/app.js  public/app.css
  See ARCHITECTURE.md and PLAN.md

Checks
  npm test              (smoke.js)
  npm run verify:parity (public vs frontend/public)

Notes
  Extension = copy-first: generate -> copy -> paste on X.
  GM/GN = one saved bank each. Free = caps. Pro = unlocks.
  Ideas & todo: docs/IDEAS_AND_TODO.md
  Text reports index: docs/REPORTS_README.txt

Git
  Canonical remote (change if you rename the repo): https://github.com/kookoosya/GMX---replay.git
  Set remote: git remote set-url origin https://github.com/OWNER/REPO.git
