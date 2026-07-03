<#
Stoppt die Anwendung
#>

[CmdletBinding()]
param(
  [switch]$Ollama,
  [switch]$RemoveContainers
)

$ErrorActionPreference = 'SilentlyContinue'
# Konsole auf UTF-8 stellen, damit Umlaute in jeder Shell korrekt erscheinen.
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$root    = Split-Path -Parent $PSScriptRoot
$compose = Join-Path $PSScriptRoot 'docker-compose.yml'
$pgName  = 'geistesblitz-postgres'

# ── kleine Helfer ────────────────────────────────────────────────────────────
function Step($m) { Write-Host "`n=> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "   [ OK ] $m" -ForegroundColor Green }
function Info($m) { Write-Host "   [ .. ] $m" -ForegroundColor DarkGray }
function Warn($m) { Write-Host "   [WARN] $m" -ForegroundColor Yellow }

function Test-Port([int]$p) {
  [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)
}

# Beendet die Supervisor-PowerShell-Prozesse, damit sie ihre Kinder nicht neu starten.
function Stop-Supervisor([string]$scriptName) {
  $found = $false
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$scriptName*" -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $found = $true }
  return $found
}

# Beendet den Prozess, der auf einem Port lauscht.
function Stop-Port([int]$p) {
  $procId = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty OwningProcess
  if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue; return $true }
  return $false
}

$stopped = @()

Write-Host "Geistesblitz — Stop" -ForegroundColor White

# ── 1) Frontend (Vite :5173) ─────────────────────────────────────────────────
Step 'Frontend (Vite :5173)'
$fs = Stop-Supervisor 'run-frontend.ps1'
Start-Sleep -Milliseconds 500
$fp = Stop-Port 5173
if ($fs -or $fp) { $stopped += 'Frontend'; Ok 'Frontend gestoppt' } else { Info 'lief nicht' }

# ── 2) Backend (Spring Boot :8080) ───────────────────────────────────────────
Step 'Backend (Spring Boot :8080)'
$bs = Stop-Supervisor 'run-backend.ps1'
Start-Sleep -Milliseconds 500
$bp = Stop-Port 8080
if ($bs -or $bp) { $stopped += 'Backend'; Ok 'Backend gestoppt' } else { Info 'lief nicht' }

# ── 3) PostgreSQL ────────────────────────────────────────────────────────────
Step 'PostgreSQL (pgvector)'
$running = docker ps --filter "name=$pgName" --format '{{.Names}}' 2>$null
if ($running) {
  if ($RemoveContainers) {
    Info 'entferne Container (docker compose down) ...'
    docker compose -f $compose down 2>&1 | Out-Null
    $stopped += 'Postgres (entfernt)'
    Ok 'Postgres-Container entfernt (Daten-Volume bleibt erhalten)'
  } else {
    Info 'stoppe Container ...'
    docker stop $pgName 2>&1 | Out-Null
    $stopped += 'Postgres'
    Ok 'Postgres gestoppt (Daten bleiben erhalten)'
  }
} else {
  Info 'Container läuft nicht'
}

# ── 4) Ollama (nur auf Wunsch — geteilter lokaler Dienst) ────────────────────
Step 'Ollama (Embeddings + LLM)'
if ($Ollama) {
  if (Test-Port 11434) {
    Get-Process ollama -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    if (Test-Port 11434) { Warn 'Ollama läuft noch (evtl. anderer Dienst).' }
    else { $stopped += 'Ollama'; Ok 'Ollama gestoppt' }
  } else { Info 'lief nicht' }
} else {
  if (Test-Port 11434) { Info 'läuft weiter (geteilter Dienst; mit -Ollama beenden)' }
  else { Info 'lief nicht' }
}

# ── Zusammenfassung ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "-----------------------------------------------" -ForegroundColor DarkGray
if ($stopped.Count -gt 0) {
  Write-Host " Geistesblitz gestoppt" -ForegroundColor Green
  Write-Host ("   Beendet: " + ($stopped -join ', ')) -ForegroundColor White
} else {
  Write-Host " Nichts zu stoppen - alles war bereits aus." -ForegroundColor Green
}
Write-Host "   Neustart: startIdea" -ForegroundColor DarkGray
Write-Host "-----------------------------------------------" -ForegroundColor DarkGray
