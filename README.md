# Fleet Flow

A comprehensive fleet management system built with **Angular 17+** frontend and **.NET** backend. Fleet Flow allows managers to track vehicles, dispatch trips, monitor driver performance, and log maintenance and expenses all in one unified, real-time dashboard.

## Key Capabilities

- **Command Center Dashboard** — Global fleet metrics, live vehicle status, and trip overviews
- **Vehicle Registry** — Maintain fleet data, specs, conditions, and availability
- **Trip Dispatcher** — Assign routes, link vehicles with drivers, and track active deliveries
- **Service Logs** — Record and schedule preventative maintenance for fleet health
- **Fuel & Expenses** — Log fueling costs, track MPG, and manage trip expenditures
- **Driver Performance** — Review and analyze driver efficiency and safety metrics
- **Dark Mode Support** — Clean, modern interface designed with Angular 17+ and SCSS

## Backend Foundation

- **Clean Architecture** — .NET Core Domain, Application, Infrastructure, API layers
- **Security** — Three-Part Auth (JWT access tokens, refresh tokens, API keys)
- **Real-Time** — SignalR for live updates
- **PostgreSQL** — ADO.NET + Npgsql + Dapper for high-performance queries
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
