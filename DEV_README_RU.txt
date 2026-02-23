GMXReply (локальный dev) — быстрый старт

Важно про адрес:
- На Windows "localhost" иногда резолвится в IPv6 (::1) и даёт ERR_CONNECTION_REFUSED.
- Поэтому используй именно: http://127.0.0.1:5173

0) Установи зависимости (после удаления node_modules):
   1) В корне Backend:
      npm i
   2) В Backend/frontend:
      npm i

1) Запуск в 2 окнах/терминалах (самый стабильный вариант):

   Окно 1 (Backend):
     cd Backend
     npm run dev:backend

   Окно 2 (Frontend / Vite):
     cd Backend/frontend
     npm run dev

   Открыть:
     http://127.0.0.1:5173

2) Авторизация (важно):
- Legacy /app и React bridge используют gmx_handle + gmx_token.
- Теперь backend ставит shared cookie "gmx_token" (HttpOnly), поэтому:
  * если ты подключился в /app на :10000 — React bridge на :5173 всё равно увидит authenticated=true
  * если ты открыл /app из React bridge (через Vite proxy) — они ещё и localStorage общий на :5173

3) Диагностика auth (только локально):
- GET /api/dev/auth-debug
  Показывает, откуда взят токен: Authorization / x-gmx-token / cookie.

4) Ошибка "Failed to load translation … Cannot find module 'hEyG3'":
- Это почти всегда шум от сторонних расширений кошельков (chrome-extension://...).
- В legacy /app добавлен фильтр, чтобы такие ошибки НЕ включали fatal overlay.

Если хочешь запускать одной кнопкой на Windows — смотри DEV_WINDOWS_START.bat
