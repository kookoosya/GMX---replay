@echo off
setlocal
set ROOT=%~dp0
pushd "%ROOT%" >nul 2>nul
node tools\safe_cleanup.mjs
set CODE=%ERRORLEVEL%
popd >nul 2>nul
if not "%CODE%"=="0" exit /b %CODE%
echo SAFE_PASS9 cleanup done
endlocal
