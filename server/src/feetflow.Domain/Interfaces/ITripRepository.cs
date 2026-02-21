using feetflow.Domain.Entities;
using feetflow.Domain.Enums;

namespace feetflow.Domain.Interfaces;

public interface ITripRepository
{
    Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Trip>> GetPagedAsync(int page, int pageSize, TripStatus? statusFilter, Guid? vehicleId, CancellationToken cancellationToken = default);
    Task<int> CountAsync(TripStatus? statusFilter, Guid? vehicleId, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(Trip trip, CancellationToken cancellationToken = default);
    Task<int> UpdateStatusAsync(Guid id, TripStatus status, uint xmin, decimal? endOdometer, decimal? revenue, DateTime? completedAt, CancellationToken cancellationToken = default);
    Task<int> UpdateAsync(Trip trip, CancellationToken cancellationToken = default);
}
