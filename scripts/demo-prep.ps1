# Geistesblitz - demo readiness in one command.
#
#   powershell -ExecutionPolicy Bypass -File scripts\demo-prep.ps1
#       Ensure Postgres + backend + frontend + Ollama are up, pre-warm the
#       semantic search, and print the demo accounts + tested queries.
#
#   ...\demo-prep.ps1 -Reset
#       Wipe the DB to the clean seed state (migrations + German seed), restart
#       the backend, and let embeddings rebuild. ~1-2 min - run BETWEEN rehearsals,
#       not right before the real demo.
#
# See docs/DEMO.md for the run-of-show.

param([switch]$Reset)

$ErrorActionPreference = 'Continue'
$Root     = Split-Path -Parent $PSScriptRoot          # repo root
$Compose  = Join-Path $Root 'scripts\docker-compose.yml'
$Api      = 'http://localhost:8080'
$Web      = 'http://localhost:5173'
$Ollama   = 'http://127.0.0.1:11434'
$BackSup  = Join-Path $Root 'scripts\run-backend.ps1'
$FrontSup = Join-Path $Root 'scripts\run-frontend.ps1'

function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){   Write-Host "    [OK]  $m" -ForegroundColor Green }
function Warn($m){ Write-Host "    [!]   $m" -ForegroundColor Yellow }
function Bad($m){  Write-Host "    [X]   $m" -ForegroundColor Red }

function Test-Listen($port){ [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) }

function Wait-For([scriptblock]$cond, $timeoutSec){
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  do { if (& $cond) { return $true }; Start-Sleep -Seconds 3 } while ((Get-Date) -lt $deadline)
  return $false
}

function Health-Up {
  try { (Invoke-RestMethod "$Api/actuator/health" -TimeoutSec 5).status -eq 'UP' } catch { $false }
}

function Start-Supervisor($path){
  Start-Process powershell -ArgumentList '-ExecutionPolicy','Bypass','-File',$path -WindowStyle Hidden
}

# ----------------------------------------------------------------------------
# 1. Docker engine + Postgres
# ----------------------------------------------------------------------------
Step 'Docker engine'
$dv = docker version --format '{{.Server.Version}}' 2>$null
if ($LASTEXITCODE -ne 0 -or -not $dv) {
  Warn 'engine down - launching Docker Desktop (this can take a minute)...'
  $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dd) { Start-Process $dd }
  if (Wait-For { docker version --format '{{.Server.Version}}' 2>$null; $LASTEXITCODE -eq 0 } 180) {
    Ok "engine up ($(docker version --format '{{.Server.Version}}' 2>$null))"
  } else { Bad 'Docker engine did not come up - start Docker Desktop manually.' }
} else { Ok "engine up ($dv)" }

if ($Reset) {
  Step 'RESET - wiping DB to clean seed state'
  Warn 'stopping backend supervisor...'
  Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'run-backend\.ps1' -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  $owners = (Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
  foreach ($o in $owners) { if ($o -and $o -ne $PID) { Stop-Process -Id $o -Force -ErrorAction SilentlyContinue } }
  docker compose -f $Compose down -v | Out-Null
  Ok 'volume removed'
}

Step 'Postgres'
docker compose -f $Compose up -d postgres | Out-Null
if (Wait-For { (docker inspect -f '{{.State.Health.Status}}' geistesblitz-postgres 2>$null) -eq 'healthy' } 90) {
  Ok 'postgres healthy on :5432'
} else { Bad 'postgres not healthy' }

# ----------------------------------------------------------------------------
# 2. Ollama (native, must already serve :11434)
# ----------------------------------------------------------------------------
Step 'Ollama'
try {
  $models = (Invoke-RestMethod "$Ollama/api/tags" -TimeoutSec 5).models.name
  if ($models -match 'bge-m3') { Ok 'reachable; bge-m3 present' }
  else { Warn "reachable but bge-m3 NOT found (run: ollama pull bge-m3). Models: $($models -join ', ')" }
} catch { Bad "not reachable at $Ollama - start Ollama (semantic search/graph will be empty)." }

# ----------------------------------------------------------------------------
# 3. Backend
# ----------------------------------------------------------------------------
Step 'Backend API'
if (-not (Health-Up)) {
  Warn 'starting backend supervisor...'
  if (Test-Path $BackSup) { Start-Supervisor $BackSup } else { Bad "missing $BackSup" }
  if (Wait-For { Health-Up } 120) { Ok 'backend UP on :8080' } else { Bad 'backend did not report healthy' }
} else { Ok 'backend already UP on :8080' }

# ----------------------------------------------------------------------------
# 4. Frontend
# ----------------------------------------------------------------------------
Step 'Frontend (Vite)'
if (-not (Test-Listen 5173)) {
  Warn 'starting frontend supervisor...'
  if (Test-Path $FrontSup) { Start-Supervisor $FrontSup } else { Bad "missing $FrontSup" }
  if (Wait-For { Test-Listen 5173 } 90) { Ok 'frontend listening on :5173' } else { Bad 'frontend not listening' }
} else { Ok 'frontend already listening on :5173' }

# ----------------------------------------------------------------------------
# 5. Warm up the semantic path (first call is the slow one)
# ----------------------------------------------------------------------------
Step 'Warm-up'
try {
  $body = @{ email = 'admin@testmandant.test'; password = 'demo1234' } | ConvertTo-Json
  $tok  = (Invoke-RestMethod -Method Post "$Api/api/auth/login" -ContentType 'application/json' -Body $body).token
  $q    = [uri]::EscapeDataString('Pausen und Konzentration bei der Arbeit verbessern')
  $hdr  = @{ Authorization = "Bearer $tok" }
  # First call warms the cold Ollama query path (can return a partial set); the
  # second is the one we trust and report.
  $null = Invoke-RestMethod "$Api/api/search?q=$q" -Headers $hdr -TimeoutSec 60
  $hits = Invoke-RestMethod "$Api/api/search?q=$q" -Headers $hdr -TimeoutSec 60
  $n    = ($hits | Measure-Object).Count
  if ($n -ge 4) { Ok "login + semantic search warm - $n Treffer auf den Demo-Query" }
  else { Warn "semantic search returned only $n Treffer - run once more if the live demo looks thin" }
} catch { Warn "warm-up call failed: $($_.Exception.Message)" }

# ----------------------------------------------------------------------------
# Cheat sheet
# ----------------------------------------------------------------------------
Write-Host "`n--------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " DEMO BEREIT - siehe docs/DEMO.md fuer das Drehbuch" -ForegroundColor White
Write-Host "--------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  App        : $Web   (Login-Auswahl, Passwort: demo1234)"
Write-Host "  Duplikat   : Ruhezone fuer fokussiertes Arbeiten und Pausen   (-> ~90% Treffer)"
Write-Host "  Suche      : Pausen und Konzentration bei der Arbeit verbessern   (-> 5 Treffer)"
Write-Host "  Konten     : alice=Michel  reviewer=Jan  manager=Lifon  sponsor=Michael  admin=Timo"
Write-Host "               owner@globex.test = zweiter Mandant (Free, fuer 402-Demo)"
Write-Host "  NICHT zeigen: /dev (God-Mode)`n"
