# ARtrium - ZIP to smartphone (simple)
param([string]$ZipPath = "")

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$ProjectsDir = Join-Path $RootDir "projects"
$Port = 3000

function Has-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Say($text, $color) {
    if ($color) { Write-Host "  $text" -ForegroundColor $color }
    else { Write-Host "  $text" }
}

function Pick-Zip {
    if (-not (Test-Path $ProjectsDir)) {
        New-Item -ItemType Directory -Path $ProjectsDir | Out-Null
    }

    $zips = @(Get-ChildItem -Path $ProjectsDir -Filter "*.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)

    if ($zips.Count -eq 1) {
        Say "projects フォルダの ZIP を使います: $($zips[0].Name)" "Yellow"
        return $zips[0].FullName
    }

    if ($zips.Count -gt 1) {
        Say "ZIP が $($zips.Count) 個あります。いちばん新しいものを使います:" "Yellow"
        Say $zips[0].Name "Yellow"
        return $zips[0].FullName
    }

    Say "ZIP ファイルを選んでください（画面が開きます）" "Yellow"
    Add-Type -AssemblyName System.Windows.Forms
    $d = New-Object System.Windows.Forms.OpenFileDialog
    $d.Title = "Select ZIP"
    $d.Filter = "ZIP files (*.zip)|*.zip"
    $d.InitialDirectory = $ProjectsDir
    if ($d.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { return $null }
    return $d.FileName
}

function Unzip-Project($zip, $dest) {
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
    if (-not (Test-Path (Join-Path $dest "index.html"))) {
        throw "index.html not found in ZIP"
    }
}

function Start-Server($dir) {
    $c = "cd /d `"$dir`" && npx --yes serve . -l $Port"
    Start-Process cmd.exe -ArgumentList "/c", $c -WindowStyle Minimized | Out-Null
    Start-Sleep -Seconds 5
}

function Start-Ngrok {
    Start-Process ngrok -ArgumentList "http", $Port -WindowStyle Minimized | Out-Null
    Start-Sleep -Seconds 4
}

function Get-PublicUrl {
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $r = Invoke-RestMethod "http://127.0.0.1:4040/api/tunnels"
            $u = ($r.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
            if ($u) { return $u }
        } catch {}
        Start-Sleep -Seconds 1
    }
    return $null
}

function Stop-All {
    Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match "serve" } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

function Make-QrHtml($url, $path, $name) {
    $enc = [uri]::EscapeDataString($url)
    $qr = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=$enc"
    $html = @"
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AR - QR</title>
<style>
body{margin:0;min-height:100vh;font-family:sans-serif;background:#1a1d27;color:#fff;
display:flex;align-items:center;justify-content:center;padding:20px}
.box{max-width:400px;text-align:center;background:#242836;padding:28px;border-radius:16px}
h1{font-size:1.2rem;margin:0 0 12px}
p{color:#aaa;font-size:.9rem;line-height:1.6}
img{width:260px;height:260px;background:#fff;border-radius:8px;padding:6px;margin:12px 0}
a{color:#00c6ff;word-break:break-all;font-size:.85rem}
ol{text-align:left;color:#ccc;font-size:.85rem;padding-left:1.2em}
</style>
</head>
<body>
<div class="box">
<h1>スマホで AR を開く</h1>
<p>下の QR をスマホのカメラで読み取ってね</p>
<img src="$qr" alt="QR">
<p><a href="$url">$url</a></p>
<ol>
<li>QRを読み取る（ngrokの「Visit Site」が出たらタップ）</li>
<li>カメラを「許可」</li>
<li>「マーカーを表示」と同じ画像を映す（PCの絵では不可）</li>
<li>明るい場所で、マーカー全体が画面に入るように</li>
</ol>
</div>
</body>
</html>
"@
    [IO.File]::WriteAllText($path, $html, (New-Object Text.UTF8Encoding $false))
}

# --- main ---
Clear-Host
Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "    ARtrium - ZIP kara sumaho de AR" -ForegroundColor Green
Write-Host "    ZIP からスマホで AR を見る" -ForegroundColor Green
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""

if (-not (Has-Command "node")) {
    Say "Node.js がありません。初回セットアップ Node.js bat を実行してください。" "Red"
    exit 1
}
if (-not (Has-Command "ngrok")) {
    Say "ngrok がありません。初回セットアップ ngrok bat を実行してください。" "Red"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ZipPath)) {
    $ZipPath = Pick-Zip
}
if ([string]::IsNullOrWhiteSpace($ZipPath) -or -not (Test-Path -LiteralPath $ZipPath)) {
    Say "ZIP が選ばれませんでした。" "Yellow"
    exit 0
}

$ZipPath = (Resolve-Path -LiteralPath $ZipPath).Path
$name = [IO.Path]::GetFileNameWithoutExtension($ZipPath)
$outDir = Join-Path $ProjectsDir $name

Say "[1/4] ZIP を解凍..." "Cyan"
Unzip-Project $ZipPath $outDir

Say "[2/4] サーバー起動..." "Cyan"
Stop-All
Start-Server $outDir

Say "[3/4] スマホ用 URL を作成..." "Cyan"
Start-Ngrok
$base = Get-PublicUrl
if (-not $base) {
    Say "URL を取得できませんでした。ngrok の設定を確認してください。" "Red"
    Stop-All
    exit 1
}
$pageUrl = "$base/"

Say "[4/4] QR コードを表示..." "Cyan"
$qrPath = Join-Path $outDir "open-on-smartphone-qr.html"
Make-QrHtml $pageUrl $qrPath $name
[IO.File]::WriteAllText((Join-Path $outDir "url-for-smartphone.txt"), $pageUrl, (New-Object Text.UTF8Encoding $false))

try { Set-Clipboard $pageUrl } catch {}

Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Say "できた！ スマホで次の URL または QR を開いてね" "Green"
Write-Host ""
Write-Host "  $pageUrl" -ForegroundColor Yellow
Write-Host ""
Say "QR のページを開きました。終わったら Enter を押してください。" "Cyan"
Say "Enter を押すと停止します。" "Cyan"
Write-Host ""

Start-Process $qrPath
Read-Host | Out-Null
Stop-All
Say "停止しました。" "Green"
Start-Sleep -Seconds 2
