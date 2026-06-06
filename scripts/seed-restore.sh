#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Restore the committed snapshot (scripts/seeds/seed.sql) into the local database,
# giving everyone the exact same starting data set — ideas, campaigns, votes,
# comments, AND embedding vectors (so semantic search + graph work immediately,
# even without Ollama running).
#
# ⚠️  DESTRUCTIVE: the snapshot is a --clean dump, so it DROPs and recreates the
#     schema objects, replacing whatever is currently in the database.
#
# Usage:
#   bash scripts/seed-restore.sh
#
# Prereqs: the Postgres container is running and the pgvector extension is available
# (it is, in the project's pgvector/pgvector image). Regenerate the snapshot with
# scripts/seed-snapshot.sh.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CONTAINER="${PG_CONTAINER:-geistesblitz-postgres}"
DB="${PG_DB:-geistesblitz}"
USER="${PG_USER:-geistesblitz}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEED="${ROOT}/scripts/seeds/seed.sql"

if [ ! -f "${SEED}" ]; then
  echo "✗ No snapshot at ${SEED}. Generate one first: bash scripts/seed-snapshot.sh" >&2
  exit 1
fi

if ! docker exec "${CONTAINER}" pg_isready -U "${USER}" >/dev/null 2>&1; then
  echo "✗ Postgres container '${CONTAINER}' is not ready. Start it first (docker start ${CONTAINER})." >&2
  exit 1
fi

echo "⚠️  This will REPLACE all data in '${DB}' on container '${CONTAINER}'."
printf "   Continue? [y/N] "
read -r reply
case "${reply}" in
  y|Y|yes|YES) ;;
  *) echo "Aborted."; exit 0 ;;
esac

echo "→ Restoring ${SEED} → ${DB}"
# ON_ERROR_STOP so a partial/corrupt dump fails loudly instead of half-loading.
docker exec -i "${CONTAINER}" psql -v ON_ERROR_STOP=1 -U "${USER}" -d "${DB}" < "${SEED}"

echo "✓ Restore complete."
docker exec "${CONTAINER}" psql -U "${USER}" -d "${DB}" -c \
  "SELECT (SELECT count(*) FROM ideas) AS ideas, (SELECT count(*) FROM idea_embeddings) AS embeddings, (SELECT count(*) FROM campaigns) AS campaigns;"
