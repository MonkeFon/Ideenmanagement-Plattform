#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Bootstrap a fresh Supabase project so it can host Geistesblitz.
#
# Steps:
#   1. Enable the pgvector extension.
#   2. Run Flyway over the V1..V8 migrations to create the schema, seed demo
#      data, and define the PostgREST RPC functions.
#
# Required env vars:
#   SUPABASE_HOST           e.g. db.abcdefghijkl.supabase.co
#   SUPABASE_DB_PASSWORD    the database password from Settings → Database
#
# Usage:
#   export SUPABASE_HOST=db.<project-ref>.supabase.co
#   export SUPABASE_DB_PASSWORD=...
#   bash scripts/supabase-bootstrap.sh
#
# This script is idempotent: re-running it just brings Flyway up to head.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

: "${SUPABASE_HOST:?Set SUPABASE_HOST (e.g. db.<project-ref>.supabase.co)}"
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS="${ROOT}/backend/src/main/resources/db/migration"
JDBC_URL="jdbc:postgresql://${SUPABASE_HOST}:5432/postgres?sslmode=require"

echo "→ Enabling pgvector on ${SUPABASE_HOST}…"
PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
    "host=${SUPABASE_HOST} dbname=postgres user=postgres sslmode=require" \
    -c "CREATE EXTENSION IF NOT EXISTS vector;" \
    -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

echo "→ Running Flyway migrations from ${MIGRATIONS}…"
# Flyway CLI is invoked via Docker so this works without a global install.
docker run --rm \
    -v "${MIGRATIONS}:/flyway/sql:ro" \
    flyway/flyway:10 \
        -url="${JDBC_URL}" \
        -user="postgres" \
        -password="${SUPABASE_DB_PASSWORD}" \
        -locations="filesystem:/flyway/sql" \
        -baselineOnMigrate=true \
        migrate

cat <<EOF

✓ Supabase bootstrap complete.

Next steps:
  • Path A — JDBC (recommended):
      export SUPABASE_HOST=${SUPABASE_HOST}
      export SUPABASE_DB_PASSWORD=…
      cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=supabase-jdbc

  • Path B — PostgREST:
      cp backend/src/main/resources/application-supabase.yml.example \\
         backend/src/main/resources/application-supabase.yml
      export SUPABASE_URL=https://<project-ref>.supabase.co
      export SUPABASE_SERVICE_ROLE_KEY=…
      cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=supabase
EOF
