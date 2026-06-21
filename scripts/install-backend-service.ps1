# Makes the Geistesblitz backend run durably WITHOUT admin rights:
#   1. Drops a launcher in the current user's Startup folder so the supervisor
#      (scripts/run-backend.ps1) auto-starts at every logon.
#   2. Starts the supervisor now (detached, hidden) if 8080 isn't already serving.
# The supervisor itself keeps the Spring Boot jar alive, restarting it on any exit.
#
# Safe to re-run.  Remove with scripts/uninstall-backend-service.ps1.
#
# (Optional, more robust but needs an *elevated* shell: register a scheduled task —
#  see the README. This no-admin Startup approach is what runs by default.)

$ErrorActionPreference = 'Stop'
$supervisor = Join-Path $PSScriptRoot 'run-backend.ps1'
$startup  = [Environment]::GetFolderPath('Startup')
$launcher = Join-Path $startup 'geistesblitz-backend.cmd'

# 1. Logon persistence (user Startup folder — no admin needed).
@"
@echo off
start "" powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -NoProfile -File "$supervisor"
"@ | Set-Content -Path $launcher -Encoding ASCII
Write-Host "Logon launcher installed: $launcher"

# 2. Start now if nothing is already serving on 8080.
$listening = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
  Write-Host 'Backend already listening on 8080 - leaving it running.'
} else {
  Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @(
    '-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-NoProfile','-File',"`"$supervisor`""
  )
  Write-Host 'Backend supervisor started (detached).'
}
