# Supervisor for the Geistesblitz backend.
#
# Keeps the Spring Boot jar running and restarts it a few seconds after it ever
# exits (crash, or Postgres not ready yet at boot). Launched and kept alive by
# the "GeistesblitzBackend" scheduled task — see scripts/install-backend-service.ps1
# and the README ("Run the backend as a durable service").
#
# Run manually for a foreground supervisor:  powershell -ExecutionPolicy Bypass -File scripts\run-backend.ps1

$ErrorActionPreference = 'Continue'
$jar = 'C:\Users\lifon\Ideenmanagement-Plattform\backend\target\ideaplatform-api-0.1.0.jar'
$log = 'C:\Users\lifon\Ideenmanagement-Plattform\backend\backend.log'

# Resolve a JDK: prefer JAVA_HOME, then the known JDK 21 install, then PATH.
$java = 'java'
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
  $java = "$env:JAVA_HOME\bin\java.exe"
} elseif (Test-Path 'C:\Program Files\Java\jdk-21\bin\java.exe') {
  $java = 'C:\Program Files\Java\jdk-21\bin\java.exe'
}

while ($true) {
  # Guard against duplicate supervisors: if something already serves 8080, wait
  # rather than launching a second jar that would just fail to bind the port.
  if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
    Start-Sleep -Seconds 10
    continue
  }
  "[$(Get-Date -Format o)] starting backend ($java)" | Out-File -FilePath $log -Append -Encoding utf8
  & $java '-jar' $jar '--spring.profiles.active=postgres' *>> $log
  "[$(Get-Date -Format o)] backend exited (code $LASTEXITCODE) - restarting in 5s" | Out-File -FilePath $log -Append -Encoding utf8
  Start-Sleep -Seconds 5
}
