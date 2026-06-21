# Removes the durable frontend setup created by install-frontend-service.ps1:
# deletes the Startup launcher and stops the supervisor + Vite/node processes.

$ErrorActionPreference = 'Continue'

$launcher = Join-Path ([Environment]::GetFolderPath('Startup')) 'geistesblitz-frontend.cmd'
if (Test-Path $launcher) { Remove-Item $launcher -Force; Write-Host "Removed $launcher" }

Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like '*scripts\run-frontend*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
# Vite runs as node; match the project's vite process.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*Ideenmanagement-Plattform\frontend*' -or $_.CommandLine -like '*vite*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Write-Host 'Durable frontend setup removed.'
