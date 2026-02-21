using feetflow.Domain.Entities;
using feetflow.Domain.Enums;

namespace feetflow.Domain.Interfaces;

public interface IDriverRepository
{
    Task<Driver?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Driver>> GetAllAsync(bool includeDeleted, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(Driver driver, CancellationToken cancellationToken = default);
    Task<int> UpdateAsync(Driver driver, CancellationToken cancellationToken = default);
    Task<int> SetStatusAsync(Guid id, DriverStatus status, uint xmin, CancellationToken cancellationToken = default);
}
