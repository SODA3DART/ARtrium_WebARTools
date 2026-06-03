#Requires -Version 5.1
param(
    [string]$ZipPath = ""
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$RootDir = Split-Path -Parent $PSScriptRoot
$ProjectsDir = Join-Path $RootDir "projects"
$Port = 3000

function Write-Step($msg) {
    Write-Host ""
    Write-Host "  $msg" -ForegroundColor Cyan
}

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Select-ZipFile {
    if (-not (Test-Path $ProjectsDir)) {
        New-Item -ItemType Directory -Path $ProjectsDir | Out-Null
    }

    $zips = Get-ChildItem -Path $ProjectsDir -Filter "*.zip" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending

    if ($zips.Count -eq 1) {
        Write-Host ""
        Write-Host "  projects フォルダ内の ZIP を使用します:" -ForegroundColor Yellow
        Write-Host "  $($zips[0].Name)"
        $use = Read-Host "  このファイルでよいですか？ (Y/n)"
        if ($use -eq "" -or $use -eq "y" -or $use -eq "Y") {
            return $zips[0].FullName
        }
    } elseif ($zips.Count -gt 1) {
        Write-Host ""
        Write-Host "  projects フォルダに複数の ZIP があります:" -ForegroundColor Yellow
        for ($i = 0; $i -lt $zips.Count; $i++) {
            Write-Host "    [$($i + 1)] $($zips[$i].Name)"
        }
        $pick = Read-Host "  番号を入力 (1-$($zips.Count))"
        $idx = [int]$pick - 1
        if ($idx -ge 0 -and $idx -lt $zips.Count) {
            return $zips[$idx].FullName
        }
    }

    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = "AR プロジェクトの ZIP を選択"
    $dialog.Filter = "ZIP ファイル (*.zip)|*.zip"
    $dialog.InitialDirectory = $ProjectsDir
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.FileName
    }
    return $null
}

function Expand-ZipProject($zip, $dest) {
    if (Test-Path $dest) {
        Write-Host "  既存フォルダを上書き展開: $dest"
        Remove-Item -Path $dest -Recurse -Force
    }
    Expand-Archive -Path $zip -DestinationPath $dest -Force
    if (-not (Test-Path (Join-Path $dest "index.html"))) {
        throw "ZIP 内に index.html が見つかりません。ARtrium Editor で作成した ZIP か確認してください。"
    }
}

function Start-LocalServer($workDir) {
    $cmd = "cd /d `"$workDir`" && npx --yes serve . -l $Port"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Minimized -PassThru | Out-Null
    Start-Sleep -Seconds 4
}

function Start-NgrokTunnel {
    Start-Process -FilePath "ngrok" -ArgumentList "http", $Port -WindowStyle Minimized -PassThru | Out-Null
    Start-Sleep -Seconds 3
}

function Get-NgrokHttpsUrl {
    $maxRetry = 25
    for ($i = 0; $i -lt $maxRetry; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
            $url = ($response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
            if ($url) { return $url }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    return $null
}

function New-QrPage($pageUrl, $outPath, $projectName) {
    $encoded = [uri]::EscapeDataString($pageUrl)
    $qrImg = "https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=$encoded"
    $html = @"
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$projectName — スマホで AR を開く</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh;
      font-family: "Segoe UI", "Yu Gothic UI", sans-serif;
      background: linear-gradient(160deg, #0f1117, #1a2744);
      color: #eef0f6;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 480px; width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 32px 28px;
      text-align: center;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    p { color: #9aa3b8; font-size: 0.9rem; line-height: 1.6; margin: 0 0 20px; }
    img { width: 280px; height: 280px; border-radius: 12px; background: #fff; padding: 8px; }
    .url {
      margin-top: 20px; padding: 12px;
      background: rgba(0,0,0,0.3);
      border-radius: 10px;
      font-size: 0.82rem; word-break: break-all;
      color: #00c6ff;
    }
    .steps { text-align: left; margin-top: 20px; font-size: 0.85rem; color: #bbb; }
    .steps li { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>スマホで AR を開く</h1>
    <p>下の QR コードをスマホのカメラまたは Chrome で読み取ってください</p>
    <img src="$qrImg" alt="QRコード">
    <div class="url"><a href="$pageUrl" style="color:#00c6ff">$pageUrl</a></div>
    <ol class="steps">
      <li>QR を読み取る（または URL を手入力）</li>
      <li>カメラの使用を「許可」</li>
      <li>マーカー画像を映すと 3D が表示されます</li>
      <li>PC の黒い画面を閉じると URL は無効になります</li>
    </ol>
  </div>
</body>
</html>
"@
    [System.IO.File]::WriteAllText($outPath, $html, [System.Text.UTF8Encoding]::new($false))
}

function Stop-Servers {
    Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    # npx serve は子プロセスのためウィンドウタイトルで停止を試みる
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "serve" } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

# --- メイン ---
Clear-Host
Write-Host ""
Write-Host "  ========================================================" -ForegroundColor Green
Write-Host "    ARtrium — ZIP からスマホで AR を見る"
Write-Host "  ========================================================" -ForegroundColor Green

if (-not (Test-Command "node")) {
    Write-Host ""
    Write-Host "  [エラー] Node.js がありません。" -ForegroundColor Red
    Write-Host "  「初回セットアップ（Node.js）.bat」を実行してください。"
    exit 1
}

if (-not (Test-Command "ngrok")) {
    Write-Host ""
    Write-Host "  [エラー] ngrok がありません。" -ForegroundColor Red
    Write-Host "  「初回セットアップ（ngrok）.bat」を実行してください。"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ZipPath)) {
    $ZipPath = Select-ZipFile
}
if ([string]::IsNullOrWhiteSpace($ZipPath) -or -not (Test-Path $ZipPath)) {
    Write-Host ""
    Write-Host "  ZIP が選択されませんでした。終了します。"
    exit 0
}

$ZipPath = (Resolve-Path $ZipPath).Path
$zipName = [System.IO.Path]::GetFileNameWithoutExtension($ZipPath)
$extractDir = Join-Path $ProjectsDir $zipName

Write-Step "[1/4] ZIP を解凍しています..."
Write-Host "  元: $ZipPath"
Write-Host "  先: $extractDir"
Expand-ZipProject -zip $ZipPath -dest $extractDir

Write-Step "[2/4] ローカルサーバーを起動しています..."
Stop-Servers
Start-LocalServer -workDir $extractDir

Write-Step "[3/4] ngrok で公開 URL を発行しています..."
Start-NgrokTunnel
$baseUrl = Get-NgrokHttpsUrl
if (-not $baseUrl) {
    Write-Host ""
    Write-Host "  [エラー] ngrok URL を取得できませんでした。" -ForegroundColor Red
    Write-Host "  Authtoken の設定を確認してください。"
    Stop-Servers
    exit 1
}

$pageUrl = "$baseUrl/"

Write-Step "[4/4] QR コードを作成しています..."
$qrHtmlPath = Join-Path $extractDir "_スマホで開く（QR）.html"
New-QrPage -pageUrl $pageUrl -outPath $qrHtmlPath -projectName $zipName

$urlTxtPath = Join-Path $extractDir "_スマホ用URL.txt"
"AR 体験 URL（この黒い画面を閉じるまで有効）`n$pageUrl`n" | Out-File -FilePath $urlTxtPath -Encoding utf8

try {
    Set-Clipboard -Value $pageUrl
} catch {}

Write-Host ""
Write-Host "  ========================================================" -ForegroundColor Green
Write-Host "    準備完了！"
Write-Host "  ========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  スマホ用 URL:" -ForegroundColor Yellow
Write-Host "  $pageUrl" -ForegroundColor Green
Write-Host ""
Write-Host "  QR コードページを開きました。スマホで QR を読み取ってください。"
Write-Host "  （URL はクリップボードにもコピー済み）"
Write-Host ""
Write-Host "  展開フォルダ: $extractDir"
Write-Host "  QR ページ:   $qrHtmlPath"
Write-Host ""
Write-Host "  --------------------------------------------------------"
Write-Host "  終了するには Enter キーを押してください"
Write-Host "  （サーバーと ngrok が停止し、URL は使えなくなります）"
Write-Host "  --------------------------------------------------------"

Start-Process $qrHtmlPath

Read-Host | Out-Null
Stop-Servers
Write-Host ""
Write-Host "  停止しました。"
Start-Sleep -Seconds 2
