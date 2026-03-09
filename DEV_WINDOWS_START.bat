@echo off
setlocal
set ROOT=%~dp0

echo.
echo === GMXReply: starting Backend on http://127.0.0.1:10000 ===
start "GMXReply Backend" cmd /k "cd /d \"%ROOT%\" && npm run dev:backend"

echo.
echo Waiting 2 seconds...
timeout /t 2 >nul

echo.
echo === GMXReply: starting Frontend on http://127.0.0.1:5173 ===
start "GMXReply Frontend" cmd /k "cd /d \"%ROOT%frontend\" && npm run dev"

echo.
echo Opening http://127.0.0.1:5173 ...
start "" "http://127.0.0.1:5173"

echo.
echo Done. Keep both windows open.
endlocal
