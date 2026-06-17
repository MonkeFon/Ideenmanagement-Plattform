# Supervisor for the Geistesblitz frontend (Vite dev server).
# Keeps `npm run dev` alive on :5173, restarting it if it ever exits. Mirrors
# run-backend.ps1. Launched by scripts/install-frontend-service.ps1 (Startup folder).

$ErrorActionPreference = 'Continue'
$dir = 'C:\Users\lifon\Ideenmanagement-Plattform\frontend'
$log = 'C:\Users\lifon\Ideenmanagement-Plattform\frontend\frontend.log'
Set-Location $dir

while ($true) {
  # Guard against duplicate supervisors: if 5173 is already served, just wait.
  if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) {
    Start-Sleep -Seconds 10
    continue
  }
  "[$(Get-Date -Format o)] starting frontend (npm run dev)" | Out-File -FilePath $log -Append -Encoding utf8
  & npm.cmd 'run' 'dev' '--' '--port' '5173' '--strictPort' *>> $log
  "[$(Get-Date -Format o)] frontend exited (code $LASTEXITCODE) - restarting in 5s" | Out-File -FilePath $log -Append -Encoding utf8
  Start-Sleep -Seconds 5
}
