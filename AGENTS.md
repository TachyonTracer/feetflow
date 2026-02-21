# AGENTS.md — feetflow

## Architecture

This is a fullstack monorepo with:

- **`client/`** — Angular 20 LTS (standalone components, signals, functional guards/interceptors)
- **`server/`** — .NET 10 Clean Architecture with 4 layers

### Backend Layers (dependency flows inward)

```
API → Application → Domain
API → Infrastructure → Application → Domain
```

| Layer          | Responsibility                                                           |
| -------------- | ------------------------------------------------------------------------ |
| Domain         | Entities, interfaces (IRepository, IDbConnectionFactory), Result pattern |
| Application    | GlobalHelper, interfaces for messaging/notifications                     |
| Infrastructure | Npgsql/Dapper repos, RabbitMQ publisher/consumer, SignalR hub/service    |
| API            | Controllers, JWT/API-Key auth, rate limiting, Serilog, middleware        |

### Frontend Structure

```
src/app/core/     — services (API, auth, SignalR, logging), interceptors, guards
src/environments/ — environment configs (dev/prod)
```

## Key Principles

1. **Clean Architecture** — Domain has zero external dependencies. Application defines interfaces. Infrastructure implements them.
2. **No EF Core** — Raw SQL via Dapper + Npgsql. All queries in repository implementations.
3. **Result Pattern** — No exceptions for flow control. `Result<T>` with `IsSuccess`, `Value`, `Error`, `StatusCode`.
4. **Manual Migrations** — SQL files in `server/migrations/`, numbered sequentially, run manually via `psql`.

## Authentication

Three-part model:

- **JWT Access Token** (15min, `Authorization: Bearer <token>`)
- **Refresh Token** (7 days, stored client-side)
- **API Keys** (`X-Api-Key` header for service-to-service)

## Code Rules

- `snake_case` for DB columns, `PascalCase` for C# properties, `camelCase` for TypeScript
- All new entities extend `BaseEntity` (Id, CreatedAt, UpdatedAt)
- Repository methods always accept `CancellationToken`
- Controllers use MediatR `Send()` — no business logic in controllers
- Angular services use `providedIn: 'root'` for tree-shaking
- Use functional interceptors and guards (no class-based)

## Branching

- `main` — production, protected, requires PR with passing CI
- `develop` — integration branch
- `feature/*`, `fix/*`, `chore/*` — branch types

## Logging (Serilog)

Logs stored in `feetflowLogs/{Date}/` with separate files:

- `requests.log` — HTTP request/response logs
- `errors.log` — Error-level and above
- `queries.log` — SQL query logs

Rolling 10MB file size limit, unlimited retention.

## Running Locally

```bash
# Backend
cd server && dotnet run --project src/feetflow.API

# Frontend (proxies /api and /hubs to backend)
cd client && npm start

# Full stack with Docker
docker compose up -d
```
