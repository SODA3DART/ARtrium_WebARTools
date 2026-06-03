@echo off
cd /d "%~dp0"
title ARtrium

if not exist "projects" mkdir "projects"

where node >nul 2>&1
if errorlevel 1 goto NO_NODE

where ngrok >nul 2>&1
if errorlevel 1 goto NO_NGROK

if "%~1"=="" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\zip-to-smartphone.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\zip-to-smartphone.ps1" -ZipPath "%~1"
)
goto END

:NO_NODE
echo.
echo  Node.js が必要です。
echo  「初回セットアップ（Node.js）.bat」を先に実行してください。
echo.
pause
exit /b 1

:NO_NGROK
echo.
echo  ngrok が必要です。
echo  「初回セットアップ（ngrok）.bat」を先に実行してください。
echo.
pause
exit /b 1

:END
if errorlevel 1 pause
