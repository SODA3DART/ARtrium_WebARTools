@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

title ARtrium - この AR をスマホで試す

echo.
echo  ========================================================
echo    この AR をスマホで試す（ngrok）
echo  ========================================================
echo.
echo   ダウンロードした AR フォルダ内の index.html を
echo   スマホのカメラで試せる URL を発行します。
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo  [エラー] Node.js が必要です。
    echo  ARtrium Editor 付属の「初回セットアップ（Node.js）.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

where ngrok >nul 2>&1
if errorlevel 1 (
    echo  [エラー] ngrok が見つかりません。
    echo  ARtrium Editor 付属の「初回セットアップ（ngrok）.bat」を実行してください。
    echo.
    pause
    exit /b 1
)

set PORT=3000

echo   サーバー起動中...
start "ARtrium-serve" /MIN cmd /c "cd /d %~dp0 && npx --yes serve . -l %PORT%"
timeout /t 4 /nobreak >nul

echo   ngrok 起動中...
start "ARtrium-ngrok" /MIN cmd /c "ngrok http %PORT%"
timeout /t 3 /nobreak >nul

REM 同梱 scripts が無い ZIP 用に PowerShell を直接実行
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$max=20; $url=$null; for($i=0;$i -lt $max;$i++){ try { $r=Invoke-RestMethod 'http://127.0.0.1:4040/api/tunnels'; $url=($r.tunnels|? proto -eq 'https'|select -First 1).public_url; if($url){break} } catch{}; Start-Sleep 1 }; if(-not $url){ Write-Host '  [エラー] URL取得失敗。ngrok設定を確認してください。' -ForegroundColor Red; exit 1 }; $pageUrl=$url+'/'; Write-Host ''; Write-Host '  ========================================================' -ForegroundColor Cyan; Write-Host '    スマホで AR を体験する URL' -ForegroundColor Cyan; Write-Host '  ========================================================' -ForegroundColor Cyan; Write-Host ''; Write-Host \"  $pageUrl\" -ForegroundColor Green; Write-Host ''; Write-Host '  ↑ スマホのブラウザに入力 → カメラを許可 → マーカーを映す'; Write-Host ''; try { Set-Clipboard $pageUrl; Write-Host '  ※ URL をクリップボードにコピーしました' -ForegroundColor Yellow; Write-Host '' } catch {}"

echo.
echo  --------------------------------------------------------
echo   終了するときは何かキーを押してください
echo  --------------------------------------------------------
pause >nul

taskkill /FI "WINDOWTITLE eq ARtrium-serve*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ARtrium-ngrok*" /F >nul 2>&1
taskkill /IM ngrok.exe /F >nul 2>&1
