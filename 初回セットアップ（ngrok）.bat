@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

title ARtrium - ngrok 初回セットアップ

echo.
echo  ========================================================
echo    ngrok 初回セットアップ
echo  ========================================================
echo.
echo   ngrok は、PC で動かしている AR を
echo   スマホから HTTPS で見られるようにする無料サービスです。
echo.
echo  --------------------------------------------------------
echo   【手順】
echo  --------------------------------------------------------
echo.
echo   1. ngrok のサイトで無料アカウントを作成
echo      （Google アカウントでログインできます）
echo.
echo   2. ダウンロードページから Windows 版をダウンロード
echo.
echo   3. ダウンロードした ngrok.zip を解凍
echo      ngrok.exe を次のどちらかに置く:
echo        ・このフォルダ（ARtrium_WebARTools）の中
echo        ・または C:\Windows\System32 （上級者向け）
echo.
echo   4. サイトの「Your Authtoken」をコピー
echo.
echo   5. 黒い画面（コマンドプロンプト）を開き、次を入力:
echo        ngrok config add-authtoken ここにトークンを貼り付け
echo      （この画面の後で入力をお手伝いします）
echo.
echo   6. 「スマホで試す（ngrok）.bat」をダブルクリック
echo.
echo  --------------------------------------------------------
echo.

where ngrok >nul 2>&1
if not errorlevel 1 (
    echo   [OK] ngrok はインストール済みです。
    ngrok version 2>nul
    echo.
)

echo   準備ができたらキーを押すと、ngrok のサイトを開きます...
pause >nul

start https://dashboard.ngrok.com/signup
timeout /t 2 /nobreak >nul
start https://ngrok.com/download

echo.
echo  --------------------------------------------------------
echo   Authtoken の設定
echo  --------------------------------------------------------
echo.
echo   1. https://dashboard.ngrok.com/get-started/your-authtoken を開く
echo   2. 表示されたトークンをコピー
echo   3. 下の入力欄に貼り付けて Enter
echo.

where ngrok >nul 2>&1
if errorlevel 1 (
    echo   [注意] ngrok.exe がまだ見つかりません。
    echo   ダウンロードして、このフォルダに ngrok.exe を置いてから
    echo   もう一度この bat を実行してください。
    echo.
    start https://dashboard.ngrok.com/get-started/your-authtoken
    pause
    exit /b 1
)

set /p TOKEN="   Authtoken を貼り付け: "
if "%TOKEN%"=="" (
    echo   キャンセルしました。
    pause
    exit /b 0
)

ngrok config add-authtoken %TOKEN%
if errorlevel 1 (
    echo.
    echo   [エラー] 設定に失敗しました。トークンを確認してください。
    pause
    exit /b 1
)

echo.
echo   [完了] ngrok の設定が終わりました！
echo   「スマホで試す（ngrok）.bat」でスマホから試せます。
echo.
pause
