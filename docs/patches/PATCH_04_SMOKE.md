PATCH_04 SMOKE

1) Unzip this patch into the project root with overwrite.
2) Start dev:
   npm run dev
3) Watch the Vite terminal.
4) Expected result:
   - warnings about duplicate keys in `frontend/src/legacy/legacyApp.ts` should be gone.
5) Open http://127.0.0.1:5173 and click through tabs to confirm the UI still loads.

If Vite still prints any duplicate-key warning from `legacyApp.ts`, send me that exact warning and I will patch the remaining block directly.
