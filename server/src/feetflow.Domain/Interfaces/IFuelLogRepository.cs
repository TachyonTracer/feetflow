using feetflow.Domain.Entities;

namespace feetflow.Domain.Interfaces;

public interface IFuelLogRepository
{
    Task<FuelLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FuelLog>> GetByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(FuelLog log, CancellationToken cancellationToken = default);
}
