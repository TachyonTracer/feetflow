using feetflow.Domain.Entities;

namespace feetflow.Domain.Interfaces;

public interface IMaintenanceLogRepository
{
    Task<MaintenanceLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(MaintenanceLog log, CancellationToken cancellationToken = default);
    Task<int> CloseAsync(Guid id, CancellationToken cancellationToken = default);
}
