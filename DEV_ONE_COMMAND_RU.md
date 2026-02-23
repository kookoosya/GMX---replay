# Dev запуск одной командой (VS Code)

## Установка (один раз)
В корне `Backend/`:
- `npm install`
- `npm --prefix frontend install`

## Запуск
В корне `Backend/`:
- `npm run dev`

Откроется:
- legacy: http://127.0.0.1:5173/app
- bridge: http://127.0.0.1:5173/

Если видишь ECONNREFUSED на /api/* — значит backend не поднялся. В этом режиме `npm run dev` поднимает оба процесса вместе.
