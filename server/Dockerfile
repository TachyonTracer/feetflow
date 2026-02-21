FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY feetflow.slnx .
COPY src/feetflow.Domain/feetflow.Domain.csproj src/feetflow.Domain/
COPY src/feetflow.Application/feetflow.Application.csproj src/feetflow.Application/
COPY src/feetflow.Infrastructure/feetflow.Infrastructure.csproj src/feetflow.Infrastructure/
COPY src/feetflow.API/feetflow.API.csproj src/feetflow.API/

RUN dotnet restore src/feetflow.API/feetflow.API.csproj

COPY src/ src/
WORKDIR /src/src/feetflow.API
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=build /app/publish .

RUN mkdir -p /app/feetflowLogs && chown -R appuser:appuser /app

USER appuser

EXPOSE 5180
ENV ASPNETCORE_URLS=http://+:5180
ENV ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5180/health || exit 1

ENTRYPOINT ["dotnet", "feetflow.API.dll"]
