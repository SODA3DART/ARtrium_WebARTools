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
    Write-Host "  ngrok URL ga toremasen deshita" -ForegroundColor Red
    Write-Host "  ngrok no settei bat wo mite kudasai"
    Write-Host ""
    exit 1
}

$sub = $SubPath.Trim("/")
if ($sub) { $pageUrl = "$url/$sub/" } else { $pageUrl = "$url/" }

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  $Title"
Write-Host "  sumaho de tsukau URL:" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  $pageUrl" -ForegroundColor Green
Write-Host ""
Write-Host "  kono URL wo sumaho no browser ni nyuryoku"
Write-Host ""

try {
    Set-Clipboard -Value $pageUrl
    Write-Host "  URL wo clipboard ni copy shimashita" -ForegroundColor Yellow
    Write-Host ""
} catch {}

Write-Host "  owattara kono mado wo tojite kudasai"
Write-Host ""

exit 0
