@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

title ARtrium — ZIP からスマホで AR を見る

echo.
echo  ========================================================
echo    ZIP からスマホで AR を見る
echo  ========================================================
echo.
echo   【使い方】
echo   1. Editor でダウンロードした .zip を
echo      このフォルダの「projects」に入れる
echo      または、この bat に ZIP をドラッグ＆ドロップ
echo   2. 自動で解凍 → URL 発行 → QR コード表示
echo   3. スマホで QR を読み取って AR 体験
echo.
echo   ※ 初回は Node.js と ngrok のセットアップが必要です
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo  [エラー] Node.js がありません。
    echo  「初回セットアップ（Node.js）.bat」を実行してください。
    pause
    exit /b 1
)

where ngrok >nul 2>&1
if errorlevel 1 (
    echo  [エラー] ngrok がありません。
    echo  「初回セットアップ（ngrok）.bat」を実行してください。
    pause
    exit /b 1
)

if not exist "%~dp0projects" mkdir "%~dp0projects"

if "%~1"=="" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\zip-to-smartphone.ps1"
) else (
    echo   ZIP: %~1
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\zip-to-smartphone.ps1" -ZipPath "%~1"
)

if errorlevel 1 pause
