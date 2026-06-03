param(
    [string]$SubPath = "",
    [string]$Title = "ARtrium"
)

$maxRetry = 20
$url = $null

for ($i = 0; $i -lt $maxRetry; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
        $url = ($response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
        if ($url) { break }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $url) {
    Write-Host ""
    Write-Host "  [エラー] ngrok の URL を取得できませんでした。" -ForegroundColor Red
    Write-Host "  ・ngrok にログイン（無料アカウント）していますか？"
    Write-Host "  ・「初回セットアップ（ngrok）.bat」の authtoken 設定は済んでいますか？"
    Write-Host ""
    exit 1
}

$sub = $SubPath.Trim("/")
if ($sub) {
    $pageUrl = "$url/$sub/"
} else {
    $pageUrl = "$url/"
}

Write-Host ""
Write-Host "  ========================================================" -ForegroundColor Cyan
Write-Host "    $Title — スマホでアクセスする URL" -ForegroundColor Cyan
Write-Host "  ========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  $pageUrl" -ForegroundColor Green
Write-Host ""
Write-Host "  ↑ この URL をスマホの Chrome / Safari に入力してください"
Write-Host "  （同じ Wi-Fi でなくても、外出先からでも OK です）"
Write-Host ""

try {
    Set-Clipboard -Value $pageUrl
    Write-Host "  ※ URL をクリップボードにコピーしました" -ForegroundColor Yellow
    Write-Host ""
} catch {}

Write-Host "  【ngrok 管理画面】 http://127.0.0.1:4040"
Write-Host ""
Write-Host "  ※ この黒い画面を閉じると URL は使えなくなります"
Write-Host ""

exit 0
