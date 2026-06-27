# Geistesblitz - one command to set everything up.
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
#
# First-time bootstrap from a fresh clone (and safe to re-run - it skips work
# that's already done):
#   1. Checks required tools (Java 21, Maven, Node, npm, Docker).
#   2. Builds the backend jar (if missing, or with -Rebuild).
#   3. Installs frontend dependencies (if missing, or with -Reinstall).
#   4. Pulls the Ollama embedding model bge-m3 (if missing; -SkipModels to skip).
#   5. Starts Postgres + backend + frontend and warms the semantic search
#      (delegated to demo-prep.ps1), then prints the ready-to-use cheat sheet.
#
# Flags: -Rebuild  force a fresh jar    -Reinstall  reinstall npm deps
#        -SkipModels  don't pull Ollama models

param([switch]$Rebuild, [switch]$Reinstall, [switch]$SkipModels)

$ErrorActionPreference = 'Continue'
$Root     = Split-Path -Parent $PSScriptRoot
$Backend  = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$Jar      = Join-Path $Backend 'target\ideaplatform-api-0.1.0.jar'
$Ollama   = 'http://127.0.0.1:11434'
$DemoPrep = Join-Path $PSScriptRoot 'demo-prep.ps1'

function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){   Write-Host "    [OK]  $m" -ForegroundColor Green }
function Warn($m){ Write-Host "    [!]   $m" -ForegroundColor Yellow }
function Bad($m){  Write-Host "    [X]   $m" -ForegroundColor Red }
function Have($cmd){ [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Test-Listen($port){ [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) }
function Stop-Backend {
  Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'run-backend\.ps1' -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  $owners = (Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
  foreach ($o in $owners) { if ($o -and $o -ne $PID) { Stop-Process -Id $o -Force -ErrorAction SilentlyContinue } }
  Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'ideaplatform-api-0\.1\.0\.jar' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

# ----------------------------------------------------------------------------
# 1. Preflight - required tools
# ----------------------------------------------------------------------------
Step 'Preflight - required tools'
$missing = @()
foreach ($t in 'java','mvn','node','npm','docker') { if (-not (Have $t)) { $missing += $t } }
if (Have 'node')   { Ok ("node " + (node -v)) }
if (Have 'npm')    { Ok ("npm  " + (npm -v)) }
if (Have 'mvn')    { Ok (((mvn -v) | Select-Object -First 1)) }
if (Have 'java')   { Ok ("java at " + (Get-Command java).Source) }
if (Have 'docker') { Ok 'docker CLI present' }
if (Have 'ollama') { Ok 'ollama CLI present' } else { Warn 'ollama CLI not found (native install recommended: https://ollama.com)' }
if ($missing.Count -gt 0) {
  Bad ("Missing required tools: " + ($missing -join ', '))
  Write-Host "    Install them (see README 'Prerequisites'), then re-run. Aborting." -ForegroundColor Red
  exit 1
}

# ----------------------------------------------------------------------------
# 2. Build backend jar
# ----------------------------------------------------------------------------
Step 'Backend build (Maven)'
if ((Test-Path $Jar) -and -not $Rebuild) {
  Ok 'jar already built (use -Rebuild to force a fresh build)'
} else {
  if (Test-Listen 8080) { Warn 'stopping running backend so the jar is unlocked...'; Stop-Backend; Start-Sleep 2 }
  Write-Host '    running: mvn -DskipTests package (first run downloads dependencies, can take a few minutes)' -ForegroundColor DarkGray
  mvn -q -f (Join-Path $Backend 'pom.xml') -DskipTests package
  if ($LASTEXITCODE -eq 0 -and (Test-Path $Jar)) { Ok 'jar built' } else { Bad 'Maven build failed - see output above.'; exit 1 }
}

# ----------------------------------------------------------------------------
# 3. Frontend dependencies
# ----------------------------------------------------------------------------
Step 'Frontend dependencies (npm)'
if ((Test-Path (Join-Path $Frontend 'node_modules')) -and -not $Reinstall) {
  Ok 'node_modules present (use -Reinstall to force)'
} else {
  if ($Reinstall -and (Test-Listen 5173)) {
    Warn 'stopping running frontend before reinstall...'
    Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'run-frontend\.ps1' -and $_.ProcessId -ne $PID } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    $o = (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    foreach ($p in $o) { if ($p -and $p -ne $PID) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } }
    Start-Sleep 2
  }
  Push-Location $Frontend
  npm install
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -eq 0) { Ok 'dependencies installed' } else { Bad 'npm install failed - see output above.'; exit 1 }
}

# ----------------------------------------------------------------------------
# 4. Ollama embedding model
# ----------------------------------------------------------------------------
Step 'Ollama models'
if ($SkipModels) {
  Warn 'skipped (-SkipModels)'
} elseif (-not (Have 'ollama') -and -not (Test-Listen 11434)) {
  Warn 'Ollama not available - semantic search/graph need bge-m3. Install Ollama or run: docker compose -f scripts/docker-compose.yml up -d ollama'
} else {
  $models = @()
  try { $models = (Invoke-RestMethod "$Ollama/api/tags" -TimeoutSec 5).models.name } catch {}
  if ($models -match 'bge-m3') {
    Ok 'bge-m3 present'
  } elseif (Have 'ollama') {
    Write-Host '    pulling bge-m3 (~1.2 GB)...' -ForegroundColor DarkGray
    ollama pull bge-m3
    if ($LASTEXITCODE -eq 0) { Ok 'bge-m3 pulled' } else { Warn 'bge-m3 pull failed - pull it manually before the demo' }
  } else { Warn 'bge-m3 missing and ollama CLI not found - pull it on the host serving :11434' }
  # Chat model (only needed for AI refine/chat) - best effort.
  if (($models -notmatch 'qwen3.5:2b') -and (Have 'ollama') -and -not $SkipModels) {
    Write-Host '    pulling chat model qwen3.5:2b-q4_K_M (optional, for AI refine)...' -ForegroundColor DarkGray
    ollama pull qwen3.5:2b-q4_K_M 2>$null
    if ($LASTEXITCODE -eq 0) { Ok 'chat model pulled' } else { Warn 'chat model pull skipped/failed (AI refine optional)' }
  }
}

# ----------------------------------------------------------------------------
# 5. Start everything + warm up (delegate to demo-prep.ps1)
# ----------------------------------------------------------------------------
Step 'Starting services + warm-up'
if (Test-Path $DemoPrep) {
  & $DemoPrep
} else {
  Bad "missing $DemoPrep"
  exit 1
}

Write-Host "`nSetup complete. App: http://localhost:5173   API docs: http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "Run-of-show for a demo: docs/DEMO.md`n" -ForegroundColor White
