# Removes the durable-backend setup created by install-backend-service.ps1:
# deletes the Startup launcher, stops the running supervisor + jar, and removes
# the optional scheduled task if one was ever registered.

$ErrorActionPreference = 'Continue'

$launcher = Join-Path ([Environment]::GetFolderPath('Startup')) 'geistesblitz-backend.cmd'
if (Test-Path $launcher) { Remove-Item $launcher -Force; Write-Host "Removed $launcher" }

# Stop the supervisor (run-backend.ps1) and the jar it manages.
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like '*run-backend.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
  Where-Object { $_.CommandLine -like '*ideaplatform-api*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

try { Unregister-ScheduledTask -TaskName 'GeistesblitzBackend' -Confirm:$false -ErrorAction Stop; Write-Host 'Removed scheduled task.' } catch {}
Write-Host 'Durable backend setup removed.'
