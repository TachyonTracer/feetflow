namespace feetflow.Domain.Interfaces;

public interface IAnalyticsRepository
{
    Task<DashboardSnapshot> GetDashboardAsync(CancellationToken cancellationToken = default);
    Task<VehicleRoiResult?> GetVehicleRoiAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<decimal?> GetFuelEfficiencyAsync(Guid vehicleId, CancellationToken cancellationToken = default);
}

public record DashboardSnapshot(
    int TotalVehicles,
    int ActiveTrips,
    int AvailableVehicles,
    int OnDutyDrivers);

public record VehicleRoiResult(
    decimal TotalRevenue,
    decimal TotalFuelCost,
    decimal TotalMaintenanceCost,
    decimal AcquisitionCost,
    decimal Roi);
