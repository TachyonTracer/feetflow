using feetflow.Domain.Entities;

namespace feetflow.Domain.Interfaces;

public interface IFuelLogRepository
{
    Task<FuelLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FuelLog>> GetByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FuelLog>> GetByVehicleIdPagedAsync(Guid vehicleId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FuelLog>> GetAllPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountAllAsync(CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(FuelLog log, CancellationToken cancellationToken = default);
    Task UpdateAsync(FuelLog log, CancellationToken cancellationToken = default);
    Task<(decimal TotalFuelCost, decimal TotalMiscExpense, int TripsCount)> GetGlobalTotalsAsync(CancellationToken cancellationToken = default);
}
