using System.Linq.Expressions;
using Dapper;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;

namespace feetflow.Infrastructure.Repositories;

public class SampleRepository : IRepository<SampleEntity>
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SampleRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<SampleEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        const string sql = "SELECT id as Id, name as Name, description as Description, is_active as IsActive, created_at as CreatedAt, updated_at as UpdatedAt FROM samples WHERE id = @Id";
        return await connection.QuerySingleOrDefaultAsync<SampleEntity>(sql, new { Id = id });
    }

    public async Task<IEnumerable<SampleEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        const string sql = "SELECT id as Id, name as Name, description as Description, is_active as IsActive, created_at as CreatedAt, updated_at as UpdatedAt FROM samples ORDER BY created_at DESC";
        return await connection.QueryAsync<SampleEntity>(sql);
    }

    public async Task<IEnumerable<SampleEntity>> FindAsync(Expression<Func<SampleEntity, bool>> predicate, CancellationToken cancellationToken = default)
    {
        // For ADO.NET/Dapper, complex expression-based queries should be implemented
        // as specific repository methods with parameterized SQL.
        // This is a simplified fallback that returns all and filters in-memory.
        var all = await GetAllAsync(cancellationToken);
        return all.Where(predicate.Compile());
    }

    public async Task<Guid> AddAsync(SampleEntity entity, CancellationToken cancellationToken = default)
    {
        using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        const string sql = """
            INSERT INTO samples (id, name, description, is_active, created_at)
            VALUES (@Id, @Name, @Description, @IsActive, @CreatedAt)
            RETURNING id
            """;
        return await connection.ExecuteScalarAsync<Guid>(sql, entity);
    }

    public async Task UpdateAsync(SampleEntity entity, CancellationToken cancellationToken = default)
    {
        using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        const string sql = """
            UPDATE samples
            SET name = @Name, description = @Description, is_active = @IsActive, updated_at = NOW()
            WHERE id = @Id
            """;
        await connection.ExecuteAsync(sql, entity);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        const string sql = "DELETE FROM samples WHERE id = @Id";
        await connection.ExecuteAsync(sql, new { Id = id });
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        const string sql = "SELECT EXISTS(SELECT 1 FROM samples WHERE id = @Id)";
        return await connection.ExecuteScalarAsync<bool>(sql, new { Id = id });
    }
}
