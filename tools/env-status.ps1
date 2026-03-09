$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

$keys = @(
  "DB_MODE",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PORT",
  "TRUST_PROXY",
  "GMX_FREE_DAILY",
  "GMX_SAVE_CAP_FREE"
)

function Get-EnvValue([string]$k) {
  $v = [Environment]::GetEnvironmentVariable($k, "Process")
  if ($v) { return $v }
  $v = [Environment]::GetEnvironmentVariable($k, "User")
  if ($v) { return $v }
  $v = [Environment]::GetEnvironmentVariable($k, "Machine")
  if ($v) { return $v }
  return ""
}

function Read-DotEnv([string]$file) {
  $map = @{}
  if (-not (Test-Path $file)) { return $map }
  Get-Content -Path $file -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1)
    if ($k) { $map[$k] = $v }
  }
  return $map
}

$dotenv = Read-DotEnv $envFile

foreach ($k in $keys) {
  $vEnv = Get-EnvValue $k
  if ($vEnv) {
    Write-Host ("{0} = SET (env)" -f $k)
    continue
  }

  $vDot = ""
  if ($dotenv.ContainsKey($k)) { $vDot = [string]$dotenv[$k] }
  if ($vDot.Trim()) {
    Write-Host ("{0} = SET (.env)" -f $k)
  } else {
    Write-Host ("{0} = EMPTY" -f $k)
  }
}

if (Test-Path $envFile) {
  Write-Host (".env file: {0}" -f $envFile)
} else {
  Write-Host (".env file: NOT FOUND")
}
