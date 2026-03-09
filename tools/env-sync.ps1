param(
  [switch]$Interactive
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

# keys we care about for Supabase DB mode
$keys = @(
  "DB_MODE",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PORT",
  "TRUST_PROXY",
  "GMX_FREE_DAILY",
  "GMX_SAVE_CAP_FREE"
)

function Get-CurrentEnvValue([string]$k) {
  $v = [Environment]::GetEnvironmentVariable($k, "Process")
  if ($v) { return $v }
  $v = [Environment]::GetEnvironmentVariable($k, "User")
  if ($v) { return $v }
  $v = [Environment]::GetEnvironmentVariable($k, "Machine")
  if ($v) { return $v }
  return ""
}

# Backup old .env if exists
if (Test-Path $envFile) {
  $bak = "$envFile.bak_" + (Get-Date -Format "yyyyMMdd_HHmmss")
  Copy-Item $envFile $bak -Force
}

$lines = @()
$lines += "# Local dev env for GMXReply backend (auto-generated)"
$lines += "# This file is NOT committed. Keep it private."
$lines += ""

foreach ($k in $keys) {
  $val = Get-CurrentEnvValue $k

  if (-not $val -and $Interactive) {
    if ($k -eq "SUPABASE_SERVICE_ROLE_KEY") {
      $sec = Read-Host "$k (paste, hidden)" -AsSecureString
      $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
      try { $val = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    } else {
      $val = Read-Host "$k (paste value)"
    }
  }

  if ($k -eq "DB_MODE" -and -not $val) { $val = "supabase" }

  # write key even if empty (so it's obvious)
  $lines += "$k=$val"
}

Set-Content -Path $envFile -Value ($lines -join "`r`n") -Encoding utf8

Write-Host "OK: wrote .env (values not printed)."
Write-Host "Path: $envFile"
