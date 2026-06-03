@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

title ARtrium - 初回セットアップ

echo.
echo  ========================================================
echo    ARtrium WebAR Editor - 初回セットアップ
echo  ========================================================
echo.
echo   このエディタを使うには「Node.js（ノード・ジェイエス）」という
echo   無料のソフトが必要です。1回だけ入れれば、あとは不要です。
echo.
echo  --------------------------------------------------------
echo   【手順】
echo  --------------------------------------------------------
echo.
echo   1. これから Node.js の公式サイトをブラウザで開きます
echo.
echo   2. 緑色の「LTS」と書いてあるボタンをクリックして
echo      ダウンロードしてください
echo.
echo   3. ダウンロードしたファイル（.msi）をダブルクリック
echo.
echo   4. 画面の指示に従い「Next（次へ）」を押していき
echo      最後まで進めてください（全部デフォルトでOKです）
echo.
echo   5. インストールが終わったら、PC を一度再起動してください
echo.
echo   6. 再起動後、「エディタを起動.bat」をダブルクリック！
echo.
echo  --------------------------------------------------------
echo.

where node >nul 2>&1
if not errorlevel 1 (
    echo   [お知らせ] Node.js はすでにインストールされています！
    echo   「エディタを起動.bat」をダブルクリックしてください。
    echo.
    pause
    exit /b 0
)

echo   準備ができたら、何かキーを押すとサイトを開きます...
pause >nul

start https://nodejs.org/ja

echo.
echo   ブラウザを開きました。
echo   インストールが終わったら PC を再起動してください。
echo.
pause
