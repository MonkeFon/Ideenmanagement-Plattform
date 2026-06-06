#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Snapshot the current local database — including embedding vectors — into a
# committed seed file: scripts/seeds/seed.sql
#
# Why this exists alongside the Flyway migrations:
#   • Migrations (V1..V10) recreate the schema + curated text content from scratch.
#   • Embeddings are generated at runtime by the model (Ollama) and are NOT in the
#     migrations. This snapshot captures the *exact* current state — every idea, vote,
#     comment, campaign, AND its 768-dim vector — so a teammate WITHOUT Ollama can
#     restore a fully working semantic-search/graph demo in seconds.
#
# Trade-off: the snapshot also bakes in volatile data (vote tallies, timestamps) and
# ties the vectors to the embedding model that produced them. For a clean, model-agnostic
# setup use the migrations + the on-boot EmbeddingBootstrapper instead; use this snapshot
# for fast, identical-for-everyone restores.
#
# Usage:
#   bash scripts/seed-snapshot.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CONTAINER="${PG_CONTAINER:-geistesblitz-postgres}"
DB="${PG_DB:-geistesblitz}"
USER="${PG_USER:-geistesblitz}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/scripts/seeds"
OUT="${OUT_DIR}/seed.sql"

mkdir -p "${OUT_DIR}"

if ! docker exec "${CONTAINER}" pg_isready -U "${USER}" >/dev/null 2>&1; then
  echo "✗ Postgres container '${CONTAINER}' is not ready. Start it first (docker start ${CONTAINER})." >&2
  exit 1
fi

echo "→ Dumping ${DB} from container '${CONTAINER}' → ${OUT}"
# --no-owner / --no-privileges keep the dump portable across machines/roles.
# --clean --if-exists makes the dump self-resetting so a restore is repeatable.
docker exec "${CONTAINER}" pg_dump \
    -U "${USER}" \
    --no-owner --no-privileges \
    --clean --if-exists \
    "${DB}" > "${OUT}"

BYTES=$(wc -c < "${OUT}" | tr -d ' ')
IDEAS=$(grep -c "INSERT INTO public.ideas " "${OUT}" 2>/dev/null || true)
echo "✓ Wrote ${OUT} (${BYTES} bytes)."
echo "  Tip: review with 'git diff scripts/seeds/seed.sql' before committing."
