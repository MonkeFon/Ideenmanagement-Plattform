# Geistesblitz — Enterprise Idea Management Platform

A multi-tenant, license-gated platform where employees submit innovation ideas, vote on them, route them through a configurable evaluation workflow, and discover related work via RAG + semantic search.

> **Status**: Working prototype. End-to-end functional with bilingual seed data; replace mock providers and tighten security before production use.

---

## Stack

| Layer            | Choice                                                                            |
|------------------|-----------------------------------------------------------------------------------|
| Frontend         | React 18 + TypeScript, Vite 5, Tailwind (class-based dark mode), React Router, Zustand (persisted), TanStack Query |
| Backend          | Spring Boot 3.3 (Java 21), Spring Security, Spring Data JPA, Flyway, Spring AOP   |
| Primary DB       | PostgreSQL 16 + `pgvector` (cosine similarity via `<=>`)                          |
| Alternative DB   | Supabase (PostgREST), switched via Spring profile `supabase`                      |
| Auth             | JWT (HS384) with a **mock Keycloak introspection adapter**                        |
| Embeddings       | Pluggable `EmbeddingProvider`: **Ollama** (default, free, 768d) → OpenAI → Mock   |
| LLM (refine + chat) | Same `EmbeddingProvider` interface — Ollama `qwen3.5:2b-q4_K_M` by default     |
| Tenancy          | Per-row `tenant_id`, explicit scoping in repositories                             |
| Licensing        | `Plan` (Free / Pro / Enterprise) with seat caps, idea quotas, feature flags       |
| Localization     | Bilingual seed content (EN/DE) selected per request via `X-Content-Lang`          |

---

## Features

### Role model
Six roles, each with distinct UI surface and API permissions:

| Role                 | Can do                                                                 |
|----------------------|------------------------------------------------------------------------|
| `EMPLOYEE`           | Submit, edit own DRAFT, comment, vote                                  |
| `REVIEWER`           | All of EMPLOYEE + score ideas on Impact / Feasibility / Strategic Fit  |
| `INNOVATION_MANAGER` | Move stages, manage campaigns, run AI refine + chat                    |
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
- On every create/edit, title + description is embedded by the configured provider and stored as `vector(768)` in `idea_embeddings`.
- **Prefix-aware embeddings.** For `nomic-embed-text` the document path prepends `search_document: ` and the query path prepends `search_query: ` so vectors live in the right region of the semantic space. Without these prefixes, short queries match generic noise almost as well as relevant ideas. The `EmbeddingProvider` interface exposes `embed()` for stored content and `embedQuery()` for free-text searches; OpenAI and Mock providers leave `embedQuery` as the default delegation.
- **Top-k similar ideas** sidebar on the idea detail page (cosine, threshold `0.55` for the sidebar — tuned for "highly similar").
- **Free-text semantic search** on the ideas list page — type a concept, get ranked semantic matches. Uses a lower threshold (`0.45`) than the sidebar so reasonable matches surface even for short queries.
- **AI refine** button (gated by the `rag_refine` plan feature) retrieves the top-k siblings and asks the LLM for sharpening suggestions, duplicate detection, and a rationale.
- **Refine chat** — multi-turn follow-ups on the same idea, with the same RAG context kept in the prompt and conversation history passed back on every turn.
- **Semantic graph view** of all visible ideas: nodes are ideas, edges are pairs above the chosen threshold, and connected components are colored as clusters (convex hulls drawn via Andrew's monotone-chain algorithm). Drag-aware so panning the graph doesn't accidentally navigate.

### Campaigns
- `INNOVATION_MANAGER` / `ADMIN` group ideas around a theme, deadline, or strategic initiative.
- Employees can attach a new idea to a campaign at submit time (or from a campaign's detail page).
- Deleting a campaign sets each linked idea's `campaign_id` to `NULL` via the `ON DELETE SET NULL` FK — ideas are never lost.
- Manage endpoints are gated with `@PreAuthorize`, returning **403 Forbidden** for non-managers (not 409).

### Leaderboard
Ranks the highest-priority ideas and the most active contributors in the tenant — submissions, votes cast, comments, evaluations. Sourced from `/api/leaderboard`.

### Bilingual content (EN ↔ DE)
- Seed ideas and campaigns ship with both `title` / `title_de` (and `description` / `description_de`, `name_de`) columns from migration `V7`.
- A `LocaleFilter` reads the `X-Content-Lang` request header (`en` or `de`) into a `LocaleContext` ThreadLocal that mirrors `TenantContext`.
- Services that produce `IdeaResponse` / `CampaignResponse` check `LocaleContext.isGerman()` and return the translated field when present; otherwise they fall back to the canonical English column.
- The frontend `Settings` page exposes a Content Language toggle. Switching invalidates all React-Query caches so lists refetch in the new language. The Axios client always sets the header from the persisted Zustand `useLocale` store.

### Theme: dark mode
- Class-based Tailwind dark mode (`dark` on `<html>`).
- Flash-free init script in `index.html` reads `localStorage` before the React bundle mounts, so the first paint matches the user's preference.
- Toggle lives in the `Settings` page (`light` / `dark` / `system`).

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
- [`JpaDataStore`](backend/src/main/java/com/ideaplatform/api/service/datastore/JpaDataStore.java) — primary, JPA on Postgres (default). Uses `saveAndFlush` on idea creation so the raw-JDBC embedding insert in the same transaction sees the new row's FK target.
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

Geistesblitz talks to `http://127.0.0.1:11434` for both embeddings and the refine/chat LLM. You have two options:

**Option A — native install (recommended).** Install Ollama from <https://ollama.com>, then:

```bash
ollama pull nomic-embed-text          # ~274 MB, 768-d embeddings
ollama pull qwen3.5:2b-q4_K_M         # ~1.5 GB Q4-quantized 2B chat — fits in low-VRAM laptops
```

The default chat model is the Q4 quantized variant for speed on low-VRAM machines. Refine calls pass `"think": false` to Qwen so its reasoning-mode tokens don't eat the `num_predict` budget.

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

On boot, Flyway runs the seven migrations (`V1` schema → `V7` i18n columns + DE translations) and a `CommandLineRunner` resets the seven demo passwords to `demo1234` (so the seeded BCrypt hashes never go stale). The API binds on `http://localhost:8080`.

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

The login page has a one-click picker for these accounts.

### 7. (Optional) Backfill embeddings for seeded ideas

Seed SQL doesn't go through the service layer, so the ~23 seeded ideas start without vectors and the "similar ideas" sidebar is empty until they're indexed. Either submit a few new ideas (they auto-index) or run a no-op `PATCH` on each existing idea to trigger re-indexing. The script below stays Python-only to avoid shell-escaping bugs on titles that contain quotes/em-dashes:

```bash
python - <<'PY'
import json, urllib.request
def req(m, p, b=None, t=None):
    r = urllib.request.Request(f"http://localhost:8080{p}",
        data=json.dumps(b).encode() if b else None, method=m)
    r.add_header("Content-Type", "application/json")
    if t: r.add_header("Authorization", f"Bearer {t}")
    return urllib.request.urlopen(r, timeout=120).read()
tok = json.loads(req("POST","/api/auth/login",
        {"email":"admin@acme.test","password":"demo1234"}))["token"]
for i in json.loads(req("GET","/api/ideas",t=tok)):
    full = json.loads(req("GET", f"/api/ideas/{i['id']}", t=tok))
    req("PATCH", f"/api/ideas/{full['id']}",
        {"title":full["title"],"description":full["description"]}, t=tok)
print("reindex done")
PY
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
| `frontend/tailwind.config.js`                    | `darkMode: 'class'` + token palette                |

Notable `ideaplatform.*` knobs in `application.yml`:

| Key                                              | Default                       | Purpose |
|--------------------------------------------------|-------------------------------|---------|
| `embedding.provider`                             | `ollama`                      | `ollama` \| `openai` \| `mock` |
| `embedding.dimensions`                           | `768`                         | Must match pgvector column (`nomic`=768, OpenAI 3-small=1536) |
| `embedding.ollama.chat-model`                    | `qwen3.5:2b-q4_K_M`           | Switch to a larger model on machines with more VRAM |
| `scoring.weight-*`                               | 0.40 / 0.35 / 0.15 / 0.10     | Votes / reviewer / recency / sponsor — must sum to 1 |
| `scoring.recency-half-life-days`                 | `30`                          | Half-life for the recency decay term |
| `rag.top-k`                                      | `5`                           | Neighbours pulled for similar / refine / chat context |
| `rag.similarity-threshold`                       | `0.55`                        | Sidebar threshold (free-text search uses `0.45` internally) |

Environment variables consumed by `application.yml`:

| Var                  | When                                              |
|----------------------|---------------------------------------------------|
| `OPENAI_API_KEY`     | Only if you set `ideaplatform.embedding.provider=openai` |

---

## API cheat-sheet

| Method | Path                                       | Purpose                                   |
|-------:|--------------------------------------------|-------------------------------------------|
| POST   | `/api/auth/login`                          | Exchange email+password for a JWT         |
| GET    | `/api/auth/me`                             | Current user + tenant + plan              |
| GET    | `/api/ideas?stage=SUBMITTED`               | List ideas (optional stage filter)        |
| POST   | `/api/ideas`                               | Create idea (DRAFT; accepts `campaignId`) |
| GET    | `/api/ideas/{id}`                          | Single idea (locale-aware)                |
| PATCH  | `/api/ideas/{id}`                          | Edit idea (re-embeds)                     |
| GET    | `/api/ideas/graph?threshold=0.55`          | Nodes + edges for the semantic graph      |
| POST   | `/api/ideas/{id}/votes`                    | `{ "value": 1 \| -1 \| 0 }`               |
| GET    | `/api/ideas/{id}/comments`                 | List comments                             |
| POST   | `/api/ideas/{id}/comments`                 | Add comment                               |
| POST   | `/api/ideas/{id}/evaluations`              | Reviewer score `{ impact, feasibility, strategicFit, notes }` |
| GET    | `/api/ideas/{id}/evaluations`              | List evaluations on this idea             |
| POST   | `/api/ideas/{id}/transitions`              | `{ "to": "PRIORITIZATION", "reason": "" }` |
| PATCH  | `/api/ideas/{id}/sponsor-boost?on=true`    | Sponsor / Admin only                      |
| GET    | `/api/ideas/{id}/similar`                  | Top-k semantic neighbours                 |
| POST   | `/api/ideas/{id}/refine`                   | RAG + LLM refinement (requires `rag_refine`) |
| POST   | `/api/ideas/{id}/chat`                     | Multi-turn follow-up on the same idea (requires `rag_refine`) |
| GET    | `/api/campaigns`                           | List tenant's campaigns                   |
| GET    | `/api/campaigns/{id}`                      | Campaign details + linked ideas           |
| POST   | `/api/campaigns`                           | `INNOVATION_MANAGER` / `ADMIN` only       |
| PATCH  | `/api/campaigns/{id}`                      | Update campaign (manager / admin)         |
| DELETE | `/api/campaigns/{id}`                      | Delete (linked ideas get `campaign_id=NULL`) |
| GET    | `/api/leaderboard`                         | Top ideas + top contributors              |
| GET    | `/api/search?q=...`                        | Free-text semantic search (uses `search_query:` prefix) |
| GET    | `/api/workflow/stages`                     | Stage transition map                      |
| GET    | `/api/workflow/history/{ideaId}`           | Audit trail of transitions                |
| GET    | `/api/admin/users`                         | List tenant users                         |
| GET    | `/api/admin/usage`                         | Plan, seats used, ideas this month        |
| POST   | `/api/admin/users`                         | Invite a user (enforces seat cap)         |

All routes except `/api/auth/login`, `/actuator/health`, `/actuator/info` require a `Bearer` JWT. Locale-aware endpoints honour `X-Content-Lang: en|de` (default: `en`).

---

## Repository layout

```
geistesblitz/
├── backend/
│   └── src/main/java/com/ideaplatform/api/
│       ├── config/        Exception handler, demo password resetter
│       ├── controller/    Auth, Idea, Campaign, Leaderboard, Search, Workflow, Admin
│       ├── domain/        JPA entities (incl. titleDe/descriptionDe) + enums
│       ├── dto/           Request/response records
│       ├── license/       LicenseService, @RequiresFeature aspect
│       ├── repo/          Spring Data repositories + raw-JDBC pgvector repo
│       ├── security/      JwtService, JwtAuthFilter, MockKeycloakAdapter
│       ├── service/       Idea, Vote, Evaluation, Comment, Workflow, Scoring,
│       │   │              Campaign, Leaderboard, Recommendation, Refine
│       │   ├── datastore/ DataStore interface + JpaDataStore + SupabaseDataStore
│       │   └── embedding/ EmbeddingProvider + Ollama / OpenAI / Mock
│       ├── tenant/        TenantContext + LocaleContext + servlet filters
│       └── workflow/      IdeaWorkflow state machine
│   └── src/main/resources/db/migration/   V1..V7 (V5 campaigns, V7 i18n)
├── frontend/
│   └── src/
│       ├── api/           Axios client (sets X-Content-Lang) + endpoint wrappers
│       ├── components/    Layout, IdeaCard, StageBadge, RoleGate, Spinner
│       ├── pages/         Dashboard, IdeaList, IdeaDetail, IdeaGraph,
│       │                  Leaderboard, Campaigns, CampaignDetail, SubmitIdea,
│       │                  Workflow, Settings, Admin, Login
│       ├── store/         Zustand: auth, theme, locale (all persisted)
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
- **Semantic search returns the same 1–2 unrelated results for every query** — embeddings were stored without the `search_document: ` prefix (older builds, or content imported outside the service layer). Re-run the backfill script in step 7 to refresh vectors with the prefixed text.
- **AI refine takes 30+ seconds and produces only a single sentence** — you're on a Qwen reasoning model without `think: false`. The default `qwen3.5:2b-q4_K_M` plus the existing `"think": false` flag and `num_predict: 256` cap keeps a refine call under ~5–10 s on a CPU-only laptop.
- **`Embedding indexing failed`** in backend logs — RAG is best-effort; the idea is saved either way. Run the backfill PATCH loop (step 7) once Ollama is healthy.
- **Login returns 401** — the demo password resetter only fires under the `postgres` profile. Either run with that profile (the default) or set `ideaplatform.demo.reset-passwords: false` and seed your own hashes.
- **`403 Forbidden` on `/api/auth/login` itself** — you posted to `/auth/login` instead of `/api/auth/login`. Spring Security's request matcher only opens the `/api/auth/**` prefix.
- **Pages render blank after a long idle** — your JWT TTL (480 min) expired. Clear `localStorage` and re-login.

---

## Known limitations / next steps

- **Tests** — none yet. The service layer has clean seams; JUnit + Testcontainers is the natural pairing.
- **Idea delete endpoint** — not yet exposed; `DataStore` supports it but `IdeaController` doesn't.
- **`/api/ideas/{id}/transitions`** — the UI currently shows all reachable stages; it should additionally filter by what the current role can perform.
- **Supabase datastore** — functionally complete but uses per-row sums instead of PostgREST RPCs for `netVotes`. Fine for the prototype; replace with a stored function in production.
- **`AdminService` duplicate-email check** queries globally, which leaks "email exists" across tenants. Switch to `findByEmailAndTenantId`.
- **Frontend** — no toast/notification system, no optimistic vote updates, no skeleton loaders.
- **Campaigns** — no UI to detach an idea from a campaign after the fact (the FE select on Submit only sets the value; `PATCH /api/ideas/{id}` with `campaignId: null` is currently a no-op because the service guards on `!= null`).
- **Bilingual data** — only the seed rows have DE translations; user-submitted ideas are stored in the language the author typed in and shown as-is regardless of the `X-Content-Lang` preference.

---

## License & attribution

Prototype, not licensed for production use without your own security review (real Keycloak/OIDC, proper secrets management, real LLM provider credentials, hardened CORS, audit logging, rate limits).
