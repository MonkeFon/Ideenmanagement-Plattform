# Ideenmanagement-Plattform – Backend API

Produktionsreife **ASP.NET Core 8 Web API** für eine interne Ideenmanagement-Plattform.
Inklusive RBAC, JWT + Refresh Tokens, EF Core (PostgreSQL), AutoMapper, FluentValidation,
Serilog, Swagger, Rate Limiting, Docker, Unit- und Integrationstests.

---

## 📦 Tech-Stack

| Bereich            | Technologie                                  |
|--------------------|----------------------------------------------|
| Runtime            | .NET 8                                       |
| Framework          | ASP.NET Core Web API                         |
| ORM                | Entity Framework Core 8 (Npgsql)             |
| Datenbank          | PostgreSQL 16                                |
| Auth               | JWT Bearer + Refresh Token Rotation          |
| Mapping            | AutoMapper                                   |
| Validation         | FluentValidation                             |
| Logging            | Serilog (Console + Rolling File)             |
| Docs               | Swagger / OpenAPI                            |
| Security           | BCrypt, RateLimiter, CORS, ProblemDetails    |
| Container          | Docker, docker-compose                       |
| Tests              | xUnit, FluentAssertions, Moq, WebApplicationFactory |

---

## 🏗 Architektur

Schichtenarchitektur (Clean Architecture, Ordner-basiert, Single-Project für einfaches Deployment):

```
Controllers       →  Eingangsschicht (REST, [Authorize], DTOs)
Services          →  Geschäftslogik (Handler)
Repositories      →  Persistenzschicht (EF Core)
Data              →  DbContext, Konfigurationen, Interceptors, Seed, Migrations
Domain            →  Entities, Enums, Common (Auditable, SoftDelete)
DTOs              →  Request- und Response-Modelle
Validators        →  FluentValidation-Regeln
Middleware        →  Exception-Handling, Request-Enrichment
Authentication    →  JWT, PasswordHasher, CurrentUserService
Authorization     →  Permissions, PolicyProvider, Handler, [HasPermission]
Mapping           →  AutoMapper-Profile
Helpers           →  z. B. LocalFileStorage
Common            →  Pagination, Exceptions, Responses
Configuration     →  POCO-Options (JwtOptions, FileStorageOptions, …)
Extensions        →  ServiceCollection-Setup
```

Prinzipien: **SOLID**, **DI**, **Async/Await**, **DTO-Pattern**, **Repository + UnitOfWork**, **CQRS-light** über Services.

---

## 🗄 Datenbankschema

Vollständiges PostgreSQL-Schema in [`docs/schema.sql`](docs/schema.sql). Erzeugt wird es automatisch per **EF Core Migration** (`Migrations/`).

| Tabelle           | Zweck                                                            |
|-------------------|------------------------------------------------------------------|
| `users`           | Benutzer (Soft-Delete, Unique email/userName)                    |
| `roles`           | Rollen (Mitarbeiter, Moderator, Administrator)                   |
| `permissions`     | Granulare Berechtigungen (RBAC-Codes)                            |
| `user_roles`      | M:N User ↔ Role                                                  |
| `role_permissions`| M:N Role ↔ Permission                                            |
| `idea_categories` | Kategorisierung von Ideen                                        |
| `ideas`           | Idee mit Status, Autor, Kategorie, Approval, Soft-Delete         |
| `idea_comments`   | Kommentare (mit Replies via `parent_comment_id`)                 |
| `idea_votes`      | Up/Down-Votes (Unique `(idea_id,user_id)`)                       |
| `attachments`     | Dateianhänge (auf Idee)                                          |
| `notifications`   | In-App-Benachrichtigungen                                        |
| `audit_logs`      | Audit-Trail (JSONB diff, IP, UA, Timestamp)                      |
| `refresh_tokens`  | Refresh-Token-Hashes (Rotation + Reuse-Detection)                |

Beziehungen, Cascade-Regeln, Indizes und Unique-Constraints siehe `docs/schema.sql` und die `Data/Configurations/`-Klassen (Fluent API).

---

## 🛡 Rollen & Permissions

| Rolle          | Beschreibung                                | Permissions (Auszug)                                                 |
|----------------|---------------------------------------------|----------------------------------------------------------------------|
| Mitarbeiter    | Standard-User                               | `ideas.create/read`, `ideas.update.own`, `ideas.delete.own`, `comments.*` (own), `votes.cast`, `attachments.upload` |
| Moderator      | Reviewing-Rechte + Kategorien               | + `ideas.moderate`, `ideas.delete.any`, `comments.delete.any`, `categories.manage`, `users.read` |
| Administrator  | Vollzugriff                                 | **alle** Permissions inkl. `users.manage`, `roles.manage`, `audit.read` |

Implementierung: Policy-basiert mit `[HasPermission("ideas.moderate")]` und `PermissionPolicyProvider` (dynamische Policies).

---

## 🚀 Schnellstart

### Voraussetzungen
- .NET 8 SDK
- Docker Desktop (für Postgres)
- (optional) `dotnet-ef` global: `dotnet tool install --global dotnet-ef --version 8.0.10`

### Variante A – Docker Compose (empfohlen)

```powershell
cd backend
Copy-Item .env.example .env
# .env mit sicherem JWT_SIGNING_KEY befüllen (mind. 32+ Zeichen)
docker compose up --build
```

API: <http://localhost:8080> · Swagger: <http://localhost:8080/swagger> · Health: <http://localhost:8080/health>

Mit pgAdmin: `docker compose --profile tools up`

### Variante B – Lokal mit nur Postgres im Container

```powershell
docker run -d --name idea-db -p 5432:5432 `
  -e POSTGRES_USER=ideaplatform -e POSTGRES_PASSWORD=ideaplatform `
  -e POSTGRES_DB=ideaplatform postgres:16-alpine

cd backend
dotnet restore
dotnet run --project ideenmanagment-plattform
```

Die Anwendung führt beim Start automatisch `Database.MigrateAsync()` und `SeedData.RunAsync()` aus
(Rollen + Permissions + Kategorien + Default-Admin).

### Default Admin

| Feld     | Wert            |
|----------|-----------------|
| Email    | `admin@local`   |
| Username | `admin`         |
| Passwort | `Admin#12345`   |

**Unbedingt nach erstem Login ändern bzw. via `.env` überschreiben!**

---

## 🔑 Auth-Flow

```
POST /api/auth/register   →  Account anlegen (Rolle "Mitarbeiter")
POST /api/auth/login      →  { accessToken, refreshToken, expiresAt, user }
POST /api/auth/refresh    →  Token-Rotation (alter RT wird revoked; Reuse-Detection)
POST /api/auth/logout     →  RefreshToken widerrufen
POST /api/auth/change-password
```

- Access-Token: 15 min (JWT, HS256)
- Refresh-Token: 7 d (zufällig 64 Byte; in DB nur SHA-256-Hash gespeichert)
- Rotation: bei `refresh` wird das alte Token markiert (`ReplacedByTokenHash`)
- Reuse-Detection: Verwendung eines bereits widerrufenen RTs ⇒ alle aktiven RTs des Users werden widerrufen

---

## 📋 Wichtigste Endpunkte

| Methode | Route                                            | Auth/Permission              |
|---------|--------------------------------------------------|------------------------------|
| POST    | `/api/auth/{register,login,refresh,logout,…}`    | anonym/auth                  |
| GET     | `/api/users/me`                                  | auth                         |
| GET     | `/api/users?page=&pageSize=&search=`             | `users.read`                 |
| POST    | `/api/users/{id}/roles`                          | `users.manage`               |
| GET/POST/PUT/DELETE | `/api/roles[/{id}[/permissions]]`    | `roles.manage`               |
| GET     | `/api/categories`                                | auth                         |
| POST/PUT/DELETE | `/api/categories[/{id}]`                 | `categories.manage`          |
| GET     | `/api/ideas?search=&categoryId=&status=&sortBy=` | `ideas.read`                 |
| POST    | `/api/ideas` · `PUT /api/ideas/{id}`             | `ideas.create` / `ideas.update.own` |
| POST    | `/api/ideas/{id}/submit`                         | Owner                        |
| POST/DELETE | `/api/ideas/{id}/votes`                      | `votes.cast`                 |
| POST    | `/api/ideas/{id}/attachments` (multipart)        | `attachments.upload`         |
| POST/PUT/DELETE | `/api/ideas/{ideaId}/comments[/{id}]`    | Owner / `comments.delete.any` |
| GET     | `/api/moderation/queue`                          | `ideas.moderate`             |
| POST    | `/api/moderation/ideas/{id}/{approve,reject,archive}` | `ideas.moderate`        |
| GET     | `/api/notifications` · `/unread-count`           | auth                         |
| GET     | `/api/audit-logs`                                | `audit.read`                 |

Vollständige Liste + Beispiele: **Swagger UI** und [`ideenmanagment-plattform/ideenmanagment-plattform.http`](ideenmanagment-plattform/ideenmanagment-plattform.http).

---

## 🧪 Tests

```powershell
dotnet test                         # alle Tests
dotnet test tests/IdeaPlatform.Tests.Unit         # nur Unit
dotnet test tests/IdeaPlatform.Tests.Integration  # nur Integration (InMemory DB)
```

- **Unit-Tests**: `JwtTokenService`, `PasswordHasher`, FluentValidation-Validators.
- **Integration-Tests**: `WebApplicationFactory<Program>` + `Microsoft.EntityFrameworkCore.InMemory` (kein Docker erforderlich); deckt Health, Login (Admin-Seed), Register-+-Login-Flow ab.

---

## 🪵 Logging (Serilog)

- Konfiguration via `appsettings.json` → Sektion `Serilog`.
- Sinks: **Console** + **Rolling File** (`logs/ideaplatform-YYYYMMDD.log`, 14 Tage Retention).
- Anreicherung: `UserId`, `IpAddress`, `TraceId`, `MachineName`, `EnvironmentName`.
- Request-Logging: `app.UseSerilogRequestLogging()`.
- Error-Logging: zentrale `ExceptionHandlingMiddleware` → `ProblemDetails` (RFC 7807).
- Audit-Logging: persistent in Tabelle `audit_logs` (Aktionen: Create/Update/Delete/Login/Approve/Reject/…).

---

## 🛡 Sicherheit

- **JWT Bearer** (HS256), Validierung Issuer/Audience/Lifetime/Signature.
- **Refresh-Token-Rotation** + **Reuse-Detection**.
- **Password-Hashing**: BCrypt (Workfactor 11, EnhancedHashPassword).
- **Rate-Limiting**: global 200 req/min/User-or-IP, Policy `auth` 10 req/min/IP.
- **CORS**: Whitelist via `Cors:AllowedOrigins`.
- **Input-Validation**: FluentValidation + `ApiBehaviorOptions` → `ProblemDetails`.
- **SQL-Injection-Schutz**: EF Core Parametrisierung.
- **XSS-Schutz**: Output ist reines JSON; Backend rendert keinen HTML-Output.
- **Soft-Delete** via `ISoftDeletable` + Global Query Filters.
- **AuditingInterceptor**: setzt CreatedAt/UpdatedAt/CreatedBy/UpdatedBy und konvertiert Delete in Soft-Delete.

---

## ⚙ Konfiguration (`appsettings.json` / Env)

| Schlüssel                              | Env-Variante                          | Beschreibung                       |
|----------------------------------------|---------------------------------------|------------------------------------|
| `ConnectionStrings:Default`            | `ConnectionStrings__Default`          | Npgsql Connection String           |
| `Jwt:Issuer/Audience/SigningKey`       | `Jwt__SigningKey` etc.                | JWT-Konfiguration                  |
| `Jwt:AccessTokenMinutes`               | `Jwt__AccessTokenMinutes`             | Lebensdauer Access-Token           |
| `Jwt:RefreshTokenDays`                 | `Jwt__RefreshTokenDays`               | Lebensdauer Refresh-Token          |
| `Cors:AllowedOrigins`                  | `Cors__AllowedOrigins__0`             | erlaubte Origins (Array)           |
| `FileStorage:RootPath/MaxFileSizeBytes`| `FileStorage__MaxFileSizeBytes`       | Upload-Konfiguration               |
| `Seed:AdminEmail/UserName/Password`    | `Seed__AdminPassword`                 | Default-Admin beim ersten Start    |
| `Serilog:*`                            | per JSON / Env                        | Sinks, MinLevel, Enrichers         |

---

## 📁 Projektstruktur (Auszug)

```
backend/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── docs/
│   └── schema.sql
├── ideenmanagment-plattform/
│   ├── Program.cs
│   ├── appsettings.json
│   ├── Authentication/       # JwtTokenService, PasswordHasher, CurrentUserService
│   ├── Authorization/        # Permissions, PolicyProvider, [HasPermission]
│   ├── Common/               # Exceptions, Pagination, Responses
│   ├── Configuration/        # Options-POCOs
│   ├── Controllers/          # Auth, Users, Roles, Ideas, Comments, Votes, Attachments, Moderation, Notifications, AuditLogs, Categories
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   ├── AppDbContextFactory.cs
│   │   ├── Configurations/   # IEntityTypeConfiguration<T>
│   │   ├── Interceptors/     # AuditingInterceptor (Audit + SoftDelete)
│   │   ├── Seed/SeedData.cs
│   │   └── Migrations/
│   ├── Domain/               # Entities, Enums, Common
│   ├── DTOs/                 # Request/Response
│   ├── Extensions/           # ServiceCollectionExtensions
│   ├── Helpers/              # LocalFileStorage
│   ├── Mapping/              # AutoMapper Profile
│   ├── Middleware/           # ExceptionHandling, RequestEnrichment
│   ├── Repositories/         # Implementations + Interfaces
│   ├── Services/             # AuthService, IdeaService, …
│   └── Validators/           # FluentValidation
└── tests/
    ├── IdeaPlatform.Tests.Unit/
    └── IdeaPlatform.Tests.Integration/
```

---

## 🐳 Docker

```powershell
docker compose up --build              # API + Postgres
docker compose --profile tools up      # zusätzlich pgAdmin
docker compose down -v                 # inkl. Volumes löschen
```

Volumes: `pgdata` (DB), `uploads` (Attachments), `logs`.

---

## 🧭 EF Core Migrationen

```powershell
cd backend/ideenmanagment-plattform
dotnet ef migrations add <Name>
dotnet ef database update
dotnet ef migrations remove
```

(Beim normalen App-Start werden ausstehende Migrationen automatisch angewendet.)

---

## 📜 Lizenz

Interner Code – Lizenzierung nach Vorgabe Ihrer Organisation.

