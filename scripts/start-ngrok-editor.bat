@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0\.."

title ARtrium - スマホで試す（ngrok）

echo.
echo  ========================================================
echo    スマホで AR / エディタを試す（ngrok）
echo  ========================================================
echo.
echo   インターネット経由の URL を発行し、スマホから
echo   カメラ付き AR を試せます（HTTPS 対応）。
echo.
echo   ※ この黒い画面は試している間閉じないでください
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo  [エラー] Node.js がありません。「初回セットアップ（Node.js）.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

where ngrok >nul 2>&1
if errorlevel 1 (
    echo  [エラー] ngrok が見つかりません。
    echo.
    echo   「初回セットアップ（ngrok）.bat」をダブルクリックして
    echo   インストールと設定を行ってください。
    echo.
    pause
    start "" "%~dp0初回セットアップ（ngrok）.bat"
    exit /b 1
)

set PORT=3000

echo   ローカルサーバーを起動中...
start "ARtrium-serve" /MIN cmd /c "cd /d %~dp0.. && npx --yes serve . -l %PORT%"
timeout /t 4 /nobreak >nul

echo   ngrok を起動中...
start "ARtrium-ngrok" /MIN cmd /c "ngrok http %PORT%"
timeout /t 3 /nobreak >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get-ngrok-url.ps1" -SubPath "editor" -Title "WebAR Editor"

echo   PC のブラウザでもエディタを開きます...
for /f "delims=" %%u in ('powershell -NoProfile -Command "(Invoke-RestMethod 'http://127.0.0.1:4040/api/tunnels').tunnels | Where-Object proto -eq 'https' | Select-Object -First 1 -ExpandProperty public_url"') do set NGROK_URL=%%u
if defined NGROK_URL start "" "%NGROK_URL%/editor/"

echo.
echo  --------------------------------------------------------
echo   終了するときは何かキーを押してください
echo  --------------------------------------------------------
pause >nul

echo.
echo   サーバーを停止しています...
taskkill /FI "WINDOWTITLE eq ARtrium-serve*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ARtrium-ngrok*" /F >nul 2>&1
taskkill /IM ngrok.exe /F >nul 2>&1
echo   停止しました。
timeout /t 2 /nobreak >nul
