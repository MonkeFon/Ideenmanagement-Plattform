# Geistesblitz — Enterprise Idea Management Platform

A multi-tenant, license-gated platform where employees submit innovation ideas, vote on them, route them through a configurable evaluation workflow, and discover related work via RAG + semantic search.

> **Status**: Working prototype. End-to-end functional with seed data; replace mock providers and tighten security before production use.

---

## Stack

| Layer            | Choice                                                                            |
|------------------|-----------------------------------------------------------------------------------|
| Frontend         | React 18 + TypeScript, Vite 5, Tailwind, React Router, Zustand, TanStack Query    |
| Backend          | Spring Boot 3.3 (Java 21), Spring Security, Spring Data JPA, Flyway, Spring AOP   |
| Primary DB       | PostgreSQL 16 + `pgvector` (cosine similarity via `<=>`)                          |
| Alternative DB   | Supabase (PostgREST), switched via Spring profile `supabase`                      |
| Auth             | JWT (HS384) with a **mock Keycloak introspection adapter**                        |
| Embeddings       | Pluggable `EmbeddingProvider`: **Ollama** (default, free, 768d) → OpenAI → Mock   |
| LLM (refine)     | Same `EmbeddingProvider` interface — Ollama `qwen3.5:2b` by default               |
| Tenancy          | Per-row `tenant_id`, explicit scoping in repositories                             |
| Licensing        | `Plan` (Free / Pro / Enterprise) with seat caps, idea quotas, feature flags       |

---

## Features

### Role model
Six roles, each with distinct UI surface and API permissions:

| Role                 | Can do                                                                 |
|----------------------|------------------------------------------------------------------------|
| `EMPLOYEE`           | Submit, edit own DRAFT, comment, vote                                  |
| `REVIEWER`           | All of EMPLOYEE + score ideas on Impact / Feasibility / Strategic Fit  |
| `INNOVATION_MANAGER` | Move stages, see reviewer scores, run AI refine                        |
| `SPONSOR`            | Approve/reject at PRIORITIZATION, toggle sponsor boost                 |
| `ADMIN`              | Manage users, see license usage, all of the above within tenant        |
| `SUPERADMIN`         | Cross-tenant (vendor staff)                                            |

### Workflow state machine
```
DRAFT → SUBMITTED → UNDER_REVIEW → PRIORITIZATION → APPROVED → IN_IMPLEMENTATION → DONE
                                  ↘ REJECTED / ARCHIVED
```
Declared in [`IdeaWorkflow.java`](backend/src/main/java/com/ideaplatform/api/workflow/IdeaWorkflow.java). Every transition is gated by (from-stage, to-stage, actor-role). `PRIORITIZATION` requires at least one reviewer evaluation.

### Composite priority scoring
```
score = 0.40 · sigmoid(net_votes / 5)
      + 0.35 · (avg_reviewer_score / 5)
      + 0.15 · 0.5^(age_days / half_life_days)
      + 0.10 · sponsor_boost
```
Weights live in `application.yml`; per-tenant overrides are an obvious next step.

### Voting & evaluation
- Idempotent up/down voting (`+1`, `-1`, or `0` to clear).
- Reviewers rate ideas 1–5 on **Impact**, **Feasibility**, **Strategic Fit**; `average = (i+f+s)/3`.
- Both inputs feed back into the priority score on each change.

### RAG & semantic search
- On every create/edit the title+description is embedded by the configured provider and stored as `vector(768)` in `idea_embeddings`.
- **Top-k similar ideas** sidebar on the idea detail page (cosine, threshold `0.55` by default).
- **Free-text semantic search** on the ideas list page — type a concept, get ranked semantic matches with a similarity %.
- **AI refine** button (gated by the `rag_refine` plan feature) retrieves the top-k siblings and asks the LLM for sharpening suggestions, duplicate detection, and a rationale.

### Licensing (server-side enforcement)
| Plan           | Seats     | Ideas / month | RAG refine | Custom workflow | SSO | Price (demo) |
|----------------|-----------|---------------|-----------|-----------------|------|--------------|
| **Free**       | 10        | 30            | ✗         | ✗               | ✗    | €0           |
| **Pro**        | 100       | unlimited     | ✓         | ✗               | ✓    | €9 / seat    |
| **Enterprise** | unlimited | unlimited     | ✓         | ✓               | ✓    | custom       |

Violations return **HTTP 402 Payment Required** with `X-License-Reason` header (`seat_limit_reached`, `idea_quota_reached`, `feature_not_in_plan`, `plan_expired`). The frontend surfaces an upgrade banner.

### Multi-tenancy
- One Postgres schema, `tenant_id` on every table.
- JWT carries the tenant id, picked up by a Servlet filter into a `TenantContext` ThreadLocal.
- Repositories scope by tenant explicitly (e.g. `IdeaRepository.findByTenantIdOrderByCreatedAtDesc`).
- Cross-tenant access requires `SUPERADMIN`.

### Switchable Postgres ↔ Supabase
Services depend on the [`DataStore`](backend/src/main/java/com/ideaplatform/api/service/datastore/DataStore.java) interface. Two implementations:
- [`JpaDataStore`](backend/src/main/java/com/ideaplatform/api/service/datastore/JpaDataStore.java) — primary, JPA on Postgres (default).
- [`SupabaseDataStore`](backend/src/main/java/com/ideaplatform/api/service/datastore/SupabaseDataStore.java) — REST via PostgREST. Activate with `--spring.profiles.active=supabase`.

---

## Run it locally

### Prerequisites

| Tool             | Version | Why                                                |
|------------------|---------|----------------------------------------------------|
| Java JDK         | 21+     | Backend                                            |
| Maven            | 3.9+    | Backend build (a wrapper is *not* committed)       |
| Node.js          | 20+     | Frontend                                           |
| npm              | 10+     | (ships with Node)                                  |
| Docker / Docker Compose v2 | any   | Postgres + optional containerised Ollama |
| Ollama           | latest  | Embeddings + LLM. Install: <https://ollama.com> (recommended) **or** use the bundled docker-compose service. |

The commands below work on Linux, macOS, and Windows (PowerShell or Git Bash). Run them from the project root after cloning.

### 1. Clone

```bash
git clone <your-repo-url> geistesblitz
cd geistesblitz
```

### 2. Start Postgres

```bash
docker compose -f scripts/docker-compose.yml up -d postgres
```

This pulls `pgvector/pgvector:pg16` and exposes it on `localhost:5432` with credentials `geistesblitz / geistesblitz`. State is persisted to a named volume (`scripts_pgdata`).

### 3. Provide Ollama

Geistesblitz talks to `http://127.0.0.1:11434` for both embeddings and the refine LLM. You have two options:

**Option A — native install (recommended).** Install Ollama from <https://ollama.com>, then:

```bash
ollama pull nomic-embed-text     # ~274 MB, 768-d embeddings
ollama pull qwen3.5:2b           # ~2.7 GB, small/fast chat for AI refine
```

**Option B — bundled docker-compose service:**

```bash
docker compose -f scripts/docker-compose.yml up -d ollama
```

The container pulls the two models on first start. This takes several minutes (and a few GB of disk).

> ⚠️ **Port-collision gotcha.** If you have a native Ollama running, it binds `127.0.0.1:11434` and the docker-compose service binds only IPv6 — so the backend's `WebClient` will hit the *native* daemon. Make sure whichever daemon owns `127.0.0.1:11434` (check with `ollama list`) has the two models pulled. To switch the chat model, edit `ideaplatform.embedding.ollama.chat-model` in [`backend/src/main/resources/application.yml`](backend/src/main/resources/application.yml).

### 4. Backend

```bash
cd backend
mvn spring-boot:run
```

On boot, Flyway runs three migrations (`V1__schema.sql`, `V2__plans.sql`, `V3__seed_demo.sql`) and a `CommandLineRunner` resets the seven demo passwords to `demo1234` (so the seeded BCrypt hashes never go stale). The API binds on `http://localhost:8080`.

### 5. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite serves on <http://localhost:5173> and proxies `/api/*` to the backend. Open the URL in any modern browser.

### 6. Demo accounts

All seeded users share password `demo1234`.

| Email                | Tenant         | Role                 |
|----------------------|----------------|----------------------|
| admin@acme.test      | Acme (Pro)     | `ADMIN`              |
| sponsor@acme.test    | Acme (Pro)     | `SPONSOR`            |
| manager@acme.test    | Acme (Pro)     | `INNOVATION_MANAGER` |
| reviewer@acme.test   | Acme (Pro)     | `REVIEWER`           |
| alice@acme.test      | Acme (Pro)     | `EMPLOYEE`           |
| bob@acme.test        | Acme (Pro)     | `EMPLOYEE`           |
| owner@globex.test    | Globex (Free)  | `ADMIN`              |

The login page also has a one-click picker for these accounts.

### 7. (Optional) Backfill embeddings for seeded ideas

The seed SQL doesn't go through the service layer, so the four seeded ideas start without vectors and the "similar ideas" sidebar is empty until they're indexed. Either submit a few new ideas (they auto-index) or run a no-op `PATCH` on each existing idea to trigger re-indexing:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"demo1234"}' \
  | python -c "import json,sys; print(json.load(sys.stdin)['token'])")

for id in $(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/ideas \
            | python -c "import json,sys; [print(i['id']) for i in json.load(sys.stdin)]"); do
  curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -X PATCH "http://localhost:8080/api/ideas/$id" -d '{}' > /dev/null
done
```

---

## Switching to Supabase

1. Create a Supabase project and enable the `vector` extension.
2. Copy [`backend/src/main/resources/application-supabase.yml.example`](backend/src/main/resources/application-supabase.yml.example) → `application-supabase.yml` and fill in URL + service-role key.
3. Run with:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=supabase
   ```

All services depend on the `DataStore` interface, so no other code changes are needed.

---

## Configuration reference

The only files you should normally touch:

| File                                             | What lives there                                   |
|--------------------------------------------------|----------------------------------------------------|
| `backend/src/main/resources/application.yml`     | JWT secret, scoring weights, RAG knobs, Ollama URL/models, OpenAI fallback |
| `backend/src/main/resources/application-postgres.yml` | Postgres JDBC URL / credentials               |
| `backend/src/main/resources/application-supabase.yml` | (You create this from the `.example` file)    |
| `scripts/docker-compose.yml`                     | Postgres + optional Ollama container config        |
| `frontend/vite.config.ts`                        | Dev server port and API proxy target               |

Environment variables consumed by `application.yml`:

| Var                  | When                                              |
|----------------------|---------------------------------------------------|
| `OPENAI_API_KEY`     | Only if you set `ideaplatform.embedding.provider=openai` |

---

## API cheat-sheet

| Method | Path                                | Purpose                                   |
|-------:|-------------------------------------|-------------------------------------------|
| POST   | `/api/auth/login`                   | Exchange email+password for a JWT         |
| GET    | `/api/auth/me`                      | Current user + tenant + plan              |
| GET    | `/api/ideas?stage=SUBMITTED`        | List ideas (optional stage filter)        |
| POST   | `/api/ideas`                        | Create idea (DRAFT)                       |
| PATCH  | `/api/ideas/{id}`                   | Edit idea (re-embeds)                     |
| POST   | `/api/ideas/{id}/votes`             | `{ "value": 1 \| -1 \| 0 }`               |
| POST   | `/api/ideas/{id}/comments`          | Add comment                               |
| POST   | `/api/ideas/{id}/evaluations`       | Reviewer score `{ impact, feasibility, strategicFit, notes }` |
| POST   | `/api/ideas/{id}/transitions`       | `{ "to": "PRIORITIZATION", "reason": "" }` |
| PATCH  | `/api/ideas/{id}/sponsor-boost?on=true` | Sponsor / Admin only                  |
| GET    | `/api/ideas/{id}/similar`           | Top-k semantic neighbours                 |
| POST   | `/api/ideas/{id}/refine`            | RAG + LLM refinement (requires `rag_refine`) |
| GET    | `/api/search?q=...`                 | Free-text semantic search                 |
| GET    | `/api/workflow/stages`              | Stage transition map                      |
| GET    | `/api/workflow/history/{ideaId}`    | Audit trail of transitions                |
| GET    | `/api/admin/usage`                  | Plan, seats used, ideas this month        |
| POST   | `/api/admin/users`                  | Invite a user (enforces seat cap)         |

All routes except `/api/auth/login`, `/actuator/health`, `/actuator/info` require a `Bearer` JWT.

---

## Repository layout

```
geistesblitz/
├── backend/
│   └── src/main/java/com/ideaplatform/api/
│       ├── config/        Exception handler, demo password resetter
│       ├── controller/    REST endpoints
│       ├── domain/        JPA entities + enums (Role, Stage)
│       ├── dto/           Request/response records
│       ├── license/       LicenseService, @RequiresFeature aspect
│       ├── repo/          Spring Data repositories + raw-JDBC pgvector repo
│       ├── security/      JwtService, JwtAuthFilter, MockKeycloakAdapter
│       ├── service/       Idea, Vote, Evaluation, Comment, Workflow, Scoring
│       │   ├── datastore/ DataStore interface + JpaDataStore + SupabaseDataStore
│       │   └── embedding/ EmbeddingProvider + Ollama / OpenAI / Mock
│       ├── tenant/        TenantContext + servlet filter
│       └── workflow/      IdeaWorkflow state machine
├── frontend/
│   └── src/
│       ├── api/           Axios client + endpoint wrappers
│       ├── components/    Layout, IdeaCard, StageBadge, RoleGate
│       ├── pages/         Login, Dashboard, IdeaList, IdeaDetail, Submit, Admin, Workflow
│       ├── store/         Zustand auth store (persists to localStorage)
│       └── types/         API DTO types
├── docs/                  Architecture, workflow, and licensing deep-dives
└── scripts/               docker-compose and dev helpers
```

The Java package is still `com.ideaplatform.api` for historical reasons; this is a cosmetic detail and can be refactored to `com.geistesblitz.api` if desired.

---

## Troubleshooting

- **Backend won't start, complains about schema validation** — your local DB is on a stale Flyway version. Easiest reset:
  ```bash
  docker compose -f scripts/docker-compose.yml down -v
  docker compose -f scripts/docker-compose.yml up -d postgres
  ```
- **Ollama returns 404 from the backend, even though `curl` works** — confirm `ollama list` shows `nomic-embed-text` on the same `127.0.0.1:11434` daemon the backend is calling. See the "Port-collision gotcha" above.
- **`Embedding indexing failed`** in backend logs — RAG is best-effort; the idea is saved either way. Run the backfill PATCH loop (step 7) once Ollama is healthy.
- **Login returns 401** — the demo password resetter only fires under the `postgres` profile. Either run with that profile (the default) or set `ideaplatform.demo.reset-passwords: false` and seed your own hashes.

---

## Known limitations / next steps

- **Tests** — none yet. The service layer has clean seams; JUnit + Testcontainers is the natural pairing.
- **Seeded ideas have no embeddings** — backfill via the PATCH loop above. A `CommandLineRunner` that backfills missing embeddings asynchronously is a 20-line follow-up.
- **`/api/ideas/{id}/transitions`** — the UI currently shows all reachable stages; it should additionally filter by what the current role can perform.
- **Supabase datastore** — functionally complete but uses per-row sums instead of PostgREST RPCs for `netVotes`. Fine for the prototype; replace with a stored function in production.
- **`AdminService` duplicate-email check** queries globally, which leaks "email exists" across tenants. Switch to `findByEmailAndTenantId`.
- **Frontend** — no toast/notification system, no optimistic vote updates, no skeleton loaders.

---

## License & attribution

Prototype, not licensed for production use without your own security review (real Keycloak/OIDC, proper secrets management, real LLM provider credentials, hardened CORS, audit logging, rate limits).
