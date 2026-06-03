@echo off
cd /d "%~dp0"
title ARtrium Editor

where node >nul 2>&1
if errorlevel 1 goto NO_NODE

echo.
echo  ARtrium Editor を起動します
echo  この黒い画面は閉じないでください
echo.

start "" cmd /c "ping -n 4 127.0.0.1 >nul && start http://localhost:3000/editor/"

echo  http://localhost:3000/editor/
echo.

npx --yes serve . -l 3000

echo.
echo  終了しました
pause
goto END

:NO_NODE
echo.
echo  Node.js が必要です
echo  初回セットアップ Node.js bat を先に実行してください
echo.
pause
exit /b 1

:END
