<#
Startet die Anwendung
#>

[CmdletBinding()]
param(
  [switch]$Rebuild,
  [switch]$RestartDocker,
  [int]$TimeoutSec = 150
)

$ErrorActionPreference = 'Stop'
# Konsole auf UTF-8 stellen, damit Umlaute in jeder Shell korrekt erscheinen.
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$root       = Split-Path -Parent $PSScriptRoot          # Projektwurzel
$compose    = Join-Path $PSScriptRoot 'docker-compose.yml'
$jar        = Join-Path $root 'backend\target\ideaplatform-api-0.1.0.jar'
$runBackend = Join-Path $PSScriptRoot 'run-backend.ps1'
$runFrontend= Join-Path $PSScriptRoot 'run-frontend.ps1'
$dockerExe  = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$pgName     = 'geistesblitz-postgres'

function Step($m) { Write-Host "`n=> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "   [ OK ] $m" -ForegroundColor Green }
function Info($m) { Write-Host "   [ .. ] $m" -ForegroundColor DarkGray }
function Warn($m) { Write-Host "   [WARN] $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "   [FAIL] $m" -ForegroundColor Red; exit 1 }

function Test-Port([int]$p) {
  [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)
}

function Wait-Until([scriptblock]$Check, [int]$Timeout, [string]$What) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $Timeout) {
    try { if (& $Check) { return $true } } catch {}
    Start-Sleep -Seconds 2
  }
  return $false
}

function Backend-Healthy {
  try { return (Invoke-WebRequest -Uri 'http://localhost:8080/actuator/health' -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 }
  catch { return $false }
}

function Supervisor-Running([string]$scriptName) {
  [bool](Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$scriptName*" -and $_.ProcessId -ne $PID })
}

function Restart-DockerDesktop {
  Warn 'Docker-Engine reagiert nicht — starte Docker Desktop neu ...'
  foreach ($n in 'Docker Desktop','com.docker.backend','com.docker.build','com.docker.dev-envs','com.docker.extensions') {
    Get-Process $n -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 3
  if (Test-Path $dockerExe) { Start-Process $dockerExe }
}

function Docker-Reachable {
  try { docker ps -q 2>$null | Out-Null; return ($LASTEXITCODE -eq 0) } catch { return $false }
}

function Invoke-Quiet([scriptblock]$cmd) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $cmd 2>&1 | Out-Null } finally { $ErrorActionPreference = $prev }
}

$started = @()   # was neu gestartet wurde (für die Zusammenfassung)

Write-Host "Geistesblitz — Start" -ForegroundColor White

# ── 1) Docker-Engine ─────────────────────────────────────────────────────────
Step 'Docker-Engine'
if (Docker-Reachable) {
  Ok 'Engine erreichbar'
} else {
  if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
    Info 'Docker Desktop nicht gestartet — starte es ...'
    if (Test-Path $dockerExe) { Start-Process $dockerExe } else { Die "Docker Desktop nicht gefunden: $dockerExe" }
    $started += 'Docker Desktop'
  }
  Info "warte auf Engine (max. $TimeoutSec s) ..."
  if (-not (Wait-Until { Docker-Reachable } $TimeoutSec 'engine')) {
    if ($RestartDocker) {
      Restart-DockerDesktop
      if (-not (Wait-Until { Docker-Reachable } $TimeoutSec 'engine')) { Die 'Engine auch nach Neustart nicht erreichbar.' }
    } else {
      Die 'Docker-Engine nicht erreichbar. Erneut mit -RestartDocker versuchen.'
    }
  }
  Ok 'Engine erreichbar'
}

# ── 2) Postgres ──────────────────────────────────────────────────────────────
Step 'PostgreSQL (pgvector)'
function Pg-Ready {
  try { docker exec $pgName pg_isready -U geistesblitz 2>$null | Out-Null; return ($LASTEXITCODE -eq 0) } catch { return $false }
}
if (Pg-Ready) {
  Ok 'Postgres bereit (:5432)'
} else {
  Info 'starte Postgres-Container ...'
  Invoke-Quiet { docker compose -f $compose up -d postgres }
  if (-not (Wait-Until { Pg-Ready } $TimeoutSec 'postgres')) {
    if ($RestartDocker) {
      Restart-DockerDesktop
      if (-not (Wait-Until { Docker-Reachable } $TimeoutSec 'engine')) { Die 'Engine nach Neustart nicht erreichbar.' }
      Invoke-Quiet { docker compose -f $compose up -d postgres }
      if (-not (Wait-Until { Pg-Ready } $TimeoutSec 'postgres')) { Die 'Postgres wurde nicht bereit.' }
    } else {
      Die 'Postgres wurde nicht bereit. Container-Start hängt evtl. — erneut mit -RestartDocker.'
    }
  }
  $started += 'Postgres'
  Ok 'Postgres bereit (:5432)'
}

# ── 3) Ollama (optional, für semantische Suche/RAG) ──────────────────────────
Step 'Ollama (Embeddings + LLM)'
if (Test-Port 11434) {
  Ok 'Ollama läuft (:11434)'
} else {
  $ollama = (Get-Command ollama -ErrorAction SilentlyContinue).Source
  if ($ollama) {
    Info 'starte Ollama ...'
    Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
    if (Wait-Until { Test-Port 11434 } 30 'ollama') { $started += 'Ollama'; Ok 'Ollama läuft (:11434)' }
    else { Warn 'Ollama nicht bereit — App startet trotzdem (Suche/RAG eingeschränkt).' }
  } else {
    Warn 'Ollama nicht installiert — semantische Suche/RAG bleiben inaktiv.'
  }
}

# ── 4) Backend ───────────────────────────────────────────────────────────────
Step 'Backend (Spring Boot :8080)'
if ((Backend-Healthy) -and -not $Rebuild) {
  Ok 'Backend gesund (:8080)'
} else {
  if ($Rebuild) {
    Info 'stoppe laufendes Backend für Rebuild ...'
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -like '*run-backend.ps1*' -and $_.ProcessId -ne $PID } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    $j = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -Expand OwningProcess
    if ($j) { Stop-Process -Id $j -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
  }
  if ($Rebuild -or -not (Test-Path $jar)) {
    Info 'baue Backend-Jar (mvn package, ohne Tests) — das dauert einen Moment ...'
    Push-Location $root
    & mvn -q -DskipTests -f backend/pom.xml package
    $mvnOk = ($LASTEXITCODE -eq 0)
    Pop-Location
    if (-not $mvnOk) { Die 'Maven-Build fehlgeschlagen.' }
    Ok 'Jar gebaut'
  }
  if (-not (Test-Port 8080)) {
    if (Supervisor-Running 'run-backend.ps1') { Info 'Supervisor läuft bereits — warte auf Port ...' }
    else { Info 'starte Backend-Supervisor ...'; Start-Process powershell -ArgumentList '-ExecutionPolicy','Bypass','-File',$runBackend -WindowStyle Hidden; $started += 'Backend' }
  }
  Info "warte auf /actuator/health (max. $TimeoutSec s) ..."
  if (-not (Wait-Until { Backend-Healthy } $TimeoutSec 'backend')) {
    Die "Backend nicht gesund. Log: backend\backend.log"
  }
  Ok 'Backend gesund (:8080)'
}

# ── 5) Frontend ──────────────────────────────────────────────────────────────
Step 'Frontend (Vite :5173)'
if (Test-Port 5173) {
  Ok 'Frontend läuft (:5173)'
} else {
  if (Supervisor-Running 'run-frontend.ps1') { Info 'Supervisor läuft bereits — warte auf Port ...' }
  else { Info 'starte Frontend-Supervisor ...'; Start-Process powershell -ArgumentList '-ExecutionPolicy','Bypass','-File',$runFrontend -WindowStyle Hidden; $started += 'Frontend' }
  if (-not (Wait-Until { Test-Port 5173 } $TimeoutSec 'frontend')) { Die "Frontend nicht erreichbar. Log: frontend\frontend.log" }
  Ok 'Frontend läuft (:5173)'
}

# ── Zusammenfassung ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "-----------------------------------------------" -ForegroundColor DarkGray
Write-Host " Geistesblitz läuft" -ForegroundColor Green
Write-Host "   App:      http://localhost:5173" -ForegroundColor White
Write-Host "   API-Docs: http://localhost:8080/swagger-ui.html" -ForegroundColor White
Write-Host "   Login:    lifon@fom.de  /  demo1234" -ForegroundColor White
if ($started.Count -gt 0) { Write-Host ("   Gestartet: " + ($started -join ', ')) -ForegroundColor DarkGray }
else { Write-Host "   (alles lief bereits - nichts zu tun)" -ForegroundColor DarkGray }
Write-Host "-----------------------------------------------" -ForegroundColor DarkGray
