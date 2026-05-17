# Architecture

## Layers

```
┌──────────────────────────────────────────────────────────────────┐
│ React + TS  (Vite, Tailwind class-dark, TanStack Query, Zustand) │
│  - JWT held in memory + persisted Zustand store                  │
│  - Role-aware routing via <RoleGate>                             │
│  - Theme + ContentLang stores wire dark mode + X-Content-Lang    │
└──────────────────────────────────────────────────────────────────┘
                              │ REST/JSON  (+ X-Content-Lang)
┌──────────────────────────────────────────────────────────────────┐
│ Spring Boot API                                                  │
│  Controllers → Services → DataStore interface                    │
│                                ├── JpaDataStore (Postgres)       │
│                                └── SupabaseDataStore (PostgREST) │
│  Security: JwtAuthFilter ── MockKeycloakAdapter ── @PreAuthorize │
│  License:  LicenseInterceptor (HandlerInterceptor)               │
│  Tenancy:  TenantFilter  → TenantContext ThreadLocal             │
│  Locale:   LocaleFilter  → LocaleContext ThreadLocal             │
│  RAG:      EmbeddingProvider iface → Ollama / OpenAI / Mock      │
└──────────────────────────────────────────────────────────────────┘
                              │ JDBC / HTTPS
┌─────────────────┐                     ┌──────────────────────────┐
│ Postgres 16     │                     │ Supabase (alt mode)      │
│  + pgvector     │                     │  + vector extension      │
└─────────────────┘                     └──────────────────────────┘
                              │ HTTP
┌─────────────────────────────────────────────┐
│ Ollama (127.0.0.1:11434)                    │
│  - nomic-embed-text   (768d, prefix-aware)  │
│  - qwen3.5:2b-q4_K_M  (refine + chat)       │
└─────────────────────────────────────────────┘
```

## Why an interface for the datastore?
The user requested switchable Postgres ↔ Supabase. JPA is the natural Postgres path, but JPA cannot run against Supabase's PostgREST. Services depend on `DataStore` so we can swap implementations via Spring profile without changing call sites. `JpaDataStore.saveIdea` uses `saveAndFlush` because the embedding insert runs as raw JDBC in the same transaction and needs the `ideas` row to exist in the database (not just the persistence context) before the FK is checked.

## Tenancy
- Single shared schema, `tenant_id` on every table.
- `TenantFilter` (servlet filter) extracts `tenant_id` from the JWT and stores it in `TenantContext` ThreadLocal.
- Repositories take `tenantId` explicitly (`findByTenantIdAndId`, `findByTenantIdOrderByCreatedAtDesc`). There is no Hibernate filter at the moment — scoping is by convention plus code review.
- Cross-tenant access requires `SUPERADMIN`.

## Locale (bilingual seed content)
- The frontend persists a per-user content language (`en` or `de`) in the Zustand `useLocale` store and the Axios interceptor sends it on every request as `X-Content-Lang`.
- `LocaleFilter` (mirrors `TenantFilter`) reads the header into `LocaleContext`. Default is English; unknown values fall back to English.
- `toResponse` mappers (e.g. `IdeaService.toResponse`, `CampaignService.toResponse`) check `LocaleContext.isGerman()` and return `title_de` / `description_de` / `name_de` when present, else the canonical English column.
- Only seeded rows carry DE columns; user-submitted ideas keep whatever language the author typed in.

## RAG flow
1. `IdeaService.create()` / `update()` → `EmbeddingService.indexIdeaSafe(idea)`.
2. `EmbeddingProvider.embed(text)` returns a float vector. For Ollama's `nomic-embed-text`, the implementation prepends `search_document: ` so the vector lives in the document region of the semantic space.
3. The vector is upserted into `idea_embeddings(idea_id PRIMARY KEY, tenant_id, vector(768), provider_name)`.
4. `RecommendationService.similarTo(ideaId)` and `searchByText(query)` call `EmbeddingService.findSimilar(...)`, which uses `EmbeddingProvider.embedQuery(text)` — for Ollama this prepends `search_query: ` instead. Postgres then runs `ORDER BY embedding <=> :query LIMIT k`.
5. Two thresholds are applied:
   - `0.55` for the **similar-ideas sidebar** on the detail page (tuned for "highly similar").
   - `0.45` for **free-text search** (`SearchController` → `RecommendationService.searchByText`) — low enough that short queries return useful matches, high enough to keep unrelated noise out.
6. `RefineService.refine(ideaId)` builds a prompt with the top-k siblings and calls `EmbeddingProvider.complete(systemPrompt, userPrompt, contextSnippets)`.
7. `RefineService.chat(ideaId, messages)` reuses the same context and calls `EmbeddingProvider.chat(systemPrompt, messages)` — multi-turn conversation history is passed in full on every call (the API is stateless on the server).

### Ollama-specific tuning
- `"think": false` disables Qwen-3 reasoning mode — refine produces structured bullets, not a chain of thought, and "thinking" tokens otherwise eat the `num_predict` budget.
- `num_predict: 256` for refine, `384` for chat — caps generation so a 2B model on a CPU stays under ~10 s.
- `temperature: 0.5` (refine) / `0.6` (chat) — lower than default to reduce rambling on small models.

## Semantic graph
- `RecommendationService.graph(threshold)` returns nodes (visible non-DRAFT ideas) and edges (similar pairs above the threshold, capped at `MAX_GRAPH_EDGES = 1500`).
- The frontend page `IdeaGraph` runs a force-directed simulation, runs union-find on the edges to find connected components, then draws a convex hull (Andrew's monotone-chain) around each component as the cluster outline.
- Drag is debounced with a 4 px movement threshold so panning the graph doesn't fire the node's click handler and accidentally navigate.

## Theming (dark mode)
- Tailwind `darkMode: 'class'` — the `dark` class on `<html>` toggles every `dark:` variant.
- The persisted `useTheme` store holds one of `light` / `dark` / `system`.
- A small inline script in `index.html` reads the persisted value before the React bundle mounts so the first paint matches the user's preference (no light-mode flash).
- The Settings page is the single source of truth for theme selection.

## License enforcement
`LicenseInterceptor.preHandle()`:
- Loads `Tenant.plan` (cached).
- For mutating endpoints, checks `seatLimit`, `featureFlags`, `expiresAt`.
- Returns 402 *Payment Required* with `X-License-Reason` header on violation.
- The `@RequiresFeature("rag_refine")` aspect guards refine + chat endpoints with a feature-flag check on the tenant's plan.

## Error handling
- Global `@ControllerAdvice` maps known exceptions to 400 / 403 / 404 / 409 / 500 with a stable `{ "error": "...", "message": "..." }` envelope.
- Permission failures use `@PreAuthorize` so Spring Security returns **403 Forbidden**. Services should not throw `IllegalStateException` for permission failures because the global mapper turns those into **409 Conflict** — see [`CampaignController`](../backend/src/main/java/com/ideaplatform/api/controller/CampaignController.java) for the correct pattern.
