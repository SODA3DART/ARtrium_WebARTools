@echo off
cd /d "%~dp0"
title ARtrium ngrok

where node >nul 2>&1
if errorlevel 1 goto NO_NODE

where ngrok >nul 2>&1
if errorlevel 1 goto NO_NGROK

call "%~dp0scripts\start-ngrok-editor.bat"
goto END

:NO_NODE
echo.
echo  Node.js が必要です
echo  初回セットアップ Node.js bat を実行してください
pause
exit /b 1

:NO_NGROK
echo.
echo  ngrok が必要です
echo  初回セットアップ ngrok bat を実行してください
pause
exit /b 1

:END
