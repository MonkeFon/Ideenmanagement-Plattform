# Architecture

## Layers

```
┌──────────────────────────────────────────────────────────────────┐
│ React + TS  (Vite, Tailwind, TanStack Query, Zustand)            │
│  - JWT in httpOnly is out-of-scope for prototype; held in memory │
│  - Role-aware routing via <RoleGate>                             │
└──────────────────────────────────────────────────────────────────┘
                              │ REST/JSON
┌──────────────────────────────────────────────────────────────────┐
│ Spring Boot API                                                  │
│  Controllers → Services → DataStore interface                    │
│                                ├── JpaDataStore (Postgres)       │
│                                └── SupabaseDataStore (PostgREST) │
│  Security: JwtAuthFilter ── MockKeycloakAdapter ── @PreAuthorize │
│  License: LicenseInterceptor (HandlerInterceptor)                │
│  Tenancy: TenantContext (ThreadLocal) + Hibernate filter         │
│  RAG: EmbeddingProvider iface → Ollama / OpenAI / Mock           │
└──────────────────────────────────────────────────────────────────┘
                              │ JDBC / HTTPS
┌─────────────────┐                     ┌──────────────────────────┐
│ Postgres 16     │                     │ Supabase (alt mode)      │
│  + pgvector     │                     │  + vector extension      │
└─────────────────┘                     └──────────────────────────┘
```

## Why an interface for the datastore?
The user requested switchable Postgres ↔ Supabase. JPA is the natural Postgres path, but JPA cannot run against Supabase's PostgREST. Services depend on `DataStore` so we can swap implementations via Spring profile without changing call sites.

## Tenancy
- Single shared schema, `tenant_id` on every table.
- `TenantFilter` Servlet filter extracts `tenant_id` from the JWT and stores it in `TenantContext`.
- Hibernate `@FilterDef("tenantFilter")` is enabled in `OncePerRequestFilter` so every query is automatically scoped.
- Cross-tenant access requires `SUPERADMIN` role.

## RAG flow
1. `IdeaService.create()` → `EmbeddingService.embedAndStore(ideaId, title + description)`.
2. Embedding is upserted into `idea_embeddings` (vector(768) for nomic; 1536 for OpenAI text-embedding-3-small).
3. `RecommendationService.similar(ideaId, k)` runs `ORDER BY embedding <=> :query LIMIT k`.
4. `RefineService.refine(ideaId)` builds a prompt with top-k siblings and calls the configured LLM.

## License enforcement
`LicenseInterceptor.preHandle()`:
- Loads `Tenant.plan` (cached).
- For mutating endpoints, checks `seatLimit`, `featureFlags`, `expiresAt`.
- Returns 402 *Payment Required* with `X-License-Reason` header on violation.
