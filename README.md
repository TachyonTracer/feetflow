# feetflow

A fullstack monorepo template with **Angular 20 LTS** frontend and **.NET 10 Clean Architecture** backend.

## Features

- **Clean Architecture** — Domain, Application, Infrastructure, API layers
- **Three-Part Auth** — JWT access tokens, refresh tokens, API keys
- **RabbitMQ** — Message publishing/consuming with graceful degradation
- **SignalR** — Real-time notifications with group management
- **Serilog** — Structured logging with date-based folders and 10MB rolling files
- **Security** — Rate limiting, security headers, CORS configuration
- **PostgreSQL** — ADO.NET + Npgsql + Dapper (no EF Core)
- **Health Checks** — PostgreSQL + RabbitMQ connectivity monitoring
- **Docker** — Multi-stage builds, docker-compose with all services
- **CI/CD** — GitHub Actions with build, test, deploy, and automatic rollback
- **AI Config** — AGENTS.md, Antigravity settings, Copilot instructions

## Quick Start

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (optional, for full stack)

### Development

```bash
# Backend
cd server
dotnet run --project src/feetflow.API

# Frontend (separate terminal)
cd client
npm install
npm start
```

The Angular dev server proxies `/api` and `/hubs` requests to the backend.

### Docker

```bash
docker compose up -d
```

Access:

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5000
- **Swagger**: http://localhost:5000/swagger (development only)
- **RabbitMQ UI**: http://localhost:15672

### Database Migrations

```bash
psql -h localhost -U app_user -d feetflow -f server/migrations/001_initial_schema.sql
```

## Workspaces

Open a role-specific VS Code workspace to filter the file tree to only what you need:

| Workspace                  | Opens                                 | Use Case             |
| -------------------------- | ------------------------------------- | -------------------- |
| `frontend.code-workspace`  | `client/src`, config files            | Frontend developers  |
| `backend.code-workspace`   | `server/src`, `tests/`, `migrations/` | Backend developers   |
| `fullstack.code-workspace` | Both client and server                | Fullstack developers |

```bash
code frontend.code-workspace   # or backend / fullstack
```

## Project Structure

```
├── client/                    # Angular 20 LTS
│   ├── src/app/core/         # Services, interceptors, guards
│   ├── src/environments/     # Environment configs
│   ├── proxy.conf.json       # Dev API proxy
│   ├── Dockerfile
│   └── nginx.conf
├── server/                    # .NET 10 Clean Architecture
│   ├── src/
│   │   ├── feetflow.Domain/
│   │   ├── feetflow.Application/
│   │   ├── feetflow.Infrastructure/
│   │   └── feetflow.API/
│   ├── tests/
│   ├── migrations/
│   └── Dockerfile
├── .github/workflows/         # CI/CD pipelines
├── docker-compose.yml
├── AGENTS.md                  # AI assistant context
└── README.md
```

## Testing

```bash
# Backend
cd server && dotnet test

# Frontend
cd client && npm test
```

## License

MIT
