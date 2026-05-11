# Ideenmanagement-Plattform – Frontend

Produktionsreifes React 18 + TypeScript SPA für die ASP.NET Core 8 REST-API der Ideenmanagement-Plattform.

## Tech-Stack
- React 18 + TypeScript (strict) + Vite 5
- React Router v6 (Data Routers), TanStack Query v5, Zustand
- React Hook Form + Zod
- Axios (JWT Interceptor + Single-Flight Refresh)
- TailwindCSS + shadcn/ui (Radix) + lucide-react
- date-fns (de), sonner, react-markdown + rehype-sanitize
- Vitest + Testing-Library + MSW

## Setup
```bash
npm install
cp .env.local .env
# Optional, für Offline-Entwicklung mit MSW:
npm run msw:init
npm run dev
```

App: http://localhost:3000  
Backend erwartet auf http://localhost:8080 (`VITE_API_BASE_URL`).

## Scripts
| Script | Zweck |
|---|---|
| `npm run dev` | Vite Dev-Server |
| `npm run build` | Type-Check + Production-Build (`dist/`) |
| `npm run preview` | Build lokal servieren |
| `npm test` | Vitest (CI-Mode) |
| `npm run test:watch` | Vitest Watch |
| `npm run lint` | ESLint |
| `npm run typecheck` | TS-Check |

## MSW (Mock Service Worker)
Offline gegen mock-Backend entwickeln:
```bash
npm run msw:init     # einmalig: Worker nach public/ kopieren
echo "VITE_ENABLE_MSW=true" >> .env.local
npm run dev
```

## Docker
```bash
docker build -t idea-frontend .
docker run -p 3000:80 idea-frontend
```

## Architektur
```
src/
  api/            Axios-Instanz + Endpoint-Module (Envelope-Unwrap, Refresh)
  components/     ui/, layout/, auth/, common/, ideas/, admin/, ...
  hooks/          queries/, mutations/, useAuth, usePermissions, ...
  lib/            permissions, validation/zod-schemas, format, utils
  mocks/          MSW handlers + db
  pages/          Eine Datei pro Route
  router/         createBrowserRouter
  stores/         authStore, themeStore, uiStore
  test/           setup
  types/          1:1 Backend-Modelle
```

### Auth-Flow
- Tokens in `localStorage` Key `idea.auth` (Zustand persist).
- Request-Interceptor hängt `Authorization: Bearer` an.
- 401 → **Single-Flight** Refresh: parallele Requests werden ge-queued; Misserfolg → Hard-Redirect `/login?expired=1`.
- Envelope `{ success, data, message }` wird im Response-Interceptor ausgepackt.

### RBAC
`<RequirePermission permission="ideas.create">`, `<RequireRole role="Administrator">`, `<RequireAuth>` – plus `useHasPermission()`-Hook und `<PermissionGate>`.

## Tests
```bash
npm test
```
Enthält u.a.:
- Axios Envelope-Unwrap & Single-Flight Refresh
- Zod-Validierung
- `<RequirePermission>` Allow/Deny
- `<VoteButtons>` optimistic update
- Login-Form ProblemDetails-Mapping
- Pagination-Komponente

