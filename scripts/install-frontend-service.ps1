# Makes the Geistesblitz frontend (Vite dev server) run durably WITHOUT admin:
#   1. Drops a launcher in the user's Startup folder (auto-start at logon).
#   2. Starts the supervisor (scripts/run-frontend.ps1) now if 5173 isn't serving.
# The supervisor keeps `npm run dev` alive, restarting it on any exit.
# Mirrors install-backend-service.ps1. Safe to re-run.

$ErrorActionPreference = 'Stop'
$supervisor = Join-Path $PSScriptRoot 'run-frontend.ps1'
$startup  = [Environment]::GetFolderPath('Startup')
$launcher = Join-Path $startup 'geistesblitz-frontend.cmd'

@"
@echo off
start "" powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -NoProfile -File "$supervisor"
"@ | Set-Content -Path $launcher -Encoding ASCII
Write-Host "Logon launcher installed: $launcher"

$listening = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
  Write-Host 'Frontend already listening on 5173 - leaving it running.'
} else {
  Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @(
    '-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-NoProfile','-File',"`"$supervisor`""
  )
  Write-Host 'Frontend supervisor started (detached).'
}
