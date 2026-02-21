using feetflow.Domain.Entities;
using feetflow.Domain.Enums;

namespace feetflow.Domain.Interfaces;

public interface IVehicleRepository
{
    Task<Vehicle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Vehicle>> GetPagedAsync(int page, int pageSize, VehicleStatus? statusFilter, bool includeDeleted, CancellationToken cancellationToken = default);
    Task<int> CountAsync(VehicleStatus? statusFilter, bool includeDeleted, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(Vehicle vehicle, CancellationToken cancellationToken = default);
    Task<int> UpdateAsync(Vehicle vehicle, CancellationToken cancellationToken = default);
    Task<int> SoftDeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SetStatusAsync(Guid id, VehicleStatus status, uint xmin, CancellationToken cancellationToken = default);
    Task<int> SetOdometerAndStatusAsync(Guid id, decimal odometerKm, VehicleStatus status, uint xmin, CancellationToken cancellationToken = default);
    Task<(decimal TotalFuel, decimal TotalMaintenance, decimal TotalMisc)> GetOperationalCostsAsync(Guid id, CancellationToken cancellationToken = default);
}
