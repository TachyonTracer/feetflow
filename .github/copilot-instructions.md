# Copilot Instructions — feetflow

## Architecture

Fullstack monorepo: Angular 20 (`client/`) + .NET 10 Clean Architecture (`server/`).

## Backend

- Clean Architecture: Domain → Application → Infrastructure → API
- ADO.NET + Npgsql + Dapper for data access (no EF Core)
- Serilog for structured logging
- JWT + Refresh Token + API Key authentication
- RabbitMQ for messaging, SignalR for real-time

## Frontend

- Angular 20 LTS with standalone components
- Functional interceptors and guards
- Core services: ApiService, AuthService, SignalrService, LoggingService
- Proxy config routes /api and /hubs to backend in development

## Conventions

- Result<T> pattern for error handling (no exceptions for flow control)
- All entities extend BaseEntity
- Repository pattern with CancellationToken
- Controllers delegate to MediatR handlers — no business logic
- snake_case for DB, PascalCase for C#, camelCase for TypeScript
