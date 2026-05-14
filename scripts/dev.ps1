# Quick-start helper for Windows PowerShell.
# Spins up docker dependencies, runs the backend, and opens the frontend in dev mode.
$ErrorActionPreference = 'Stop'

Write-Host "Starting Postgres + Ollama via docker compose..."
Push-Location (Split-Path $MyInvocation.MyCommand.Path)
docker compose up -d
Pop-Location

Write-Host "Building backend..."
Push-Location (Join-Path (Split-Path $MyInvocation.MyCommand.Path) "..\backend")
mvn -DskipTests spring-boot:run
Pop-Location
