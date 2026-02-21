using Microsoft.Extensions.Logging;
using feetflow.Domain.Interfaces;
using Dapper;

namespace feetflow.Infrastructure.Persistence;

public class DatabaseInitializer
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(IDbConnectionFactory connectionFactory, ILogger<DatabaseInitializer> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Initializing database schema...");

        using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);

        const string sql = """
            CREATE TABLE IF NOT EXISTS samples (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(200) NOT NULL,
                description TEXT,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
            """;

        await connection.ExecuteAsync(sql);
        _logger.LogInformation("Database schema initialized successfully");
    }
}
