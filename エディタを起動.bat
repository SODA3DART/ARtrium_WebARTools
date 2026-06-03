@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

title ARtrium WebAR Editor

echo.
echo  ========================================================
echo    ARtrium WebAR Editor を起動しています...
echo  ========================================================
echo.
echo   ※ この黒い画面は、エディタを使っている間閉じないでください
echo   ※ 終わったら、この画面の右上の × を押して閉じてください
echo.

REM Node.js が入っているか確認
where node >nul 2>&1
if errorlevel 1 (
    echo  [エラー] Node.js が見つかりません。
    echo.
    echo   初めて使う方は、先に「初回セットアップ（Node.js）.bat」を
    echo   ダブルクリックして、Node.js をインストールしてください。
    echo.
    echo   インストール後は PC の再起動をおすすめします。
    echo.
    pause
    exit /b 1
)

echo   Node.js ... OK
echo   ブラウザを自動で開きます（3秒ほどお待ちください）
echo.

REM サーバー起動後にブラウザを開く
start "" cmd /c "ping -n 4 127.0.0.1 >nul && start http://localhost:3000/editor/"

echo   サーバーを起動中...
echo   ブラウザが開かない場合は、次のURLをコピーして開いてください:
echo   http://localhost:3000/editor/
echo.
echo  --------------------------------------------------------
echo.

npx --yes serve . -l 3000

echo.
echo   サーバーが停止しました。
pause
