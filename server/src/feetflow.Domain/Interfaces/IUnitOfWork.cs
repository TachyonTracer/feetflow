using System.Data;

namespace feetflow.Domain.Interfaces;

public interface IUnitOfWork
{
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitAsync(CancellationToken cancellationToken = default);
    Task RollbackAsync(CancellationToken cancellationToken = default);
    IDbConnection? GetConnection();
    IDbTransaction? GetTransaction();
}
