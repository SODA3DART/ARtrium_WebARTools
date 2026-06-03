@echo off
cd /d "%~dp0\.."
title ARtrium ngrok

where node >nul 2>&1
if errorlevel 1 goto NO_NODE

where ngrok >nul 2>&1
if errorlevel 1 goto NO_NGROK

set PORT=3000

start "ARtrium-serve" /MIN cmd /c "cd /d %~dp0.. && npx --yes serve . -l %PORT%"
timeout /t 4 /nobreak >nul

start "ARtrium-ngrok" /MIN cmd /c "ngrok http %PORT%"
timeout /t 3 /nobreak >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get-ngrok-url.ps1" -SubPath "editor" -Title "WebAR Editor"

for /f "delims=" %%u in ('powershell -NoProfile -Command "(Invoke-RestMethod 'http://127.0.0.1:4040/api/tunnels').tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url"') do set NGROK_URL=%%u
if defined NGROK_URL start "" "%NGROK_URL%/editor/"

echo.
echo  終わったら何かキーを押してください
pause >nul

taskkill /FI "WINDOWTITLE eq ARtrium-serve*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ARtrium-ngrok*" /F >nul 2>&1
taskkill /IM ngrok.exe /F >nul 2>&1
goto END

:NO_NODE
echo Node.js が必要です
pause
exit /b 1

:NO_NGROK
echo ngrok が必要です
pause
exit /b 1

:END
