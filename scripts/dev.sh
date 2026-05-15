#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Postgres + Ollama..."
(cd "$HERE" && docker compose up -d)

echo "Backend on :8080 — Ctrl+C to stop"
(cd "$HERE/../backend" && mvn -DskipTests spring-boot:run)
