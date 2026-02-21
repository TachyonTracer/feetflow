using feetflow.Domain.Entities;

namespace feetflow.Domain.Interfaces;

public record MaintenanceLogDto(
    Guid MaintenanceId,
    Guid VehicleId,
    string VehicleName,
    string LicensePlate,
    string Description,
    decimal Cost,
    DateOnly ServiceDate,
    bool IsClosed,
    DateTime CreatedAt);

public interface IMaintenanceLogRepository
{
    Task<MaintenanceLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(MaintenanceLog log, CancellationToken cancellationToken = default);
    Task<int> CloseAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceLogDto>> GetPagedDtoAsync(int page, int pageSize, bool? isClosed = null, Guid? vehicleId = null, CancellationToken cancellationToken = default);
    Task<int> CountAsync(bool? isClosed = null, Guid? vehicleId = null, CancellationToken cancellationToken = default);
}
