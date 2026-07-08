# Launches Expo with a Node >= 20.19.4 without changing the global nvm default.
# Expo SDK 54 / Metro require Node 20.19.4+; this machine's default may be Node 18,
# which crashes Metro with "configs.toReversed is not a function".
# Usage:  ./dev.ps1              (runs: expo start)
#         ./dev.ps1 run:android  (runs: expo run:android)

$ErrorActionPreference = 'Stop'
$minVersion = [version]'20.19.4'
$nvmRoot = Join-Path $env:APPDATA 'nvm'

$best = Get-ChildItem $nvmRoot -Directory -Filter 'v*' -ErrorAction SilentlyContinue |
  Where-Object { Test-Path (Join-Path $_.FullName 'node.exe') } |
  ForEach-Object {
    $v = $null
    if ([version]::TryParse($_.Name.TrimStart('v'), [ref]$v)) {
      [pscustomobject]@{ Version = $v; Path = $_.FullName }
    }
  } |
  Where-Object { $_.Version -ge $minVersion } |
  Sort-Object Version -Descending |
  Select-Object -First 1

if (-not $best) {
  Write-Error "No installed Node >= $minVersion found under $nvmRoot. Install one with: nvm install 22.16.0"
  exit 1
}

Write-Host "Using Node $($best.Version) from $($best.Path)" -ForegroundColor Green
$env:Path = "$($best.Path);$env:Path"

$expoArgs = if ($args.Count -gt 0) { $args } else { @('start') }
& npx expo @expoArgs
