using System.Data;
using feetflow.Domain.Interfaces;
using Npgsql;

namespace feetflow.Infrastructure.FleetFlow;

public class UnitOfWork : IUnitOfWork
{
    private readonly IDbConnectionFactory _connectionFactory;
    private NpgsqlConnection? _connection;
    private NpgsqlTransaction? _transaction;

    public UnitOfWork(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public IDbConnection? GetConnection() => _connection;

    public IDbTransaction? GetTransaction() => _transaction;

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_connection != null)
            return;
        var conn = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        _connection = (NpgsqlConnection)conn;
        _transaction = _connection.BeginTransaction();
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null) return;
        await _transaction.CommitAsync(cancellationToken);
        await DisposeAsync();
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null) return;
        await _transaction.RollbackAsync(cancellationToken);
        await DisposeAsync();
    }

    private async ValueTask DisposeAsync()
    {
        if (_transaction != null)
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
        if (_connection != null)
        {
            await _connection.DisposeAsync();
            _connection = null;
        }
    }
}
