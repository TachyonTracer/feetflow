namespace feetflow.Domain.Interfaces;

public interface IAnalyticsRepository
{
    Task<DashboardSnapshot> GetDashboardAsync(CancellationToken cancellationToken = default);
    Task<VehicleRoiResult?> GetVehicleRoiAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<decimal?> GetFuelEfficiencyAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    
    // New Fleet-wide queries
    Task<FleetFinancialSummaryResult> GetFleetFinancialSummaryAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<FuelEfficiencyTrendItem>> GetFuelEfficiencyTrendAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<TopCostliestVehicleItem>> GetTopCostliestVehiclesAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
}

public record DashboardSnapshot(
    int TotalVehicles,
    int ActiveTrips,
    int AvailableVehicles,
    int OnDutyDrivers,
    int MaintenanceAlerts,
    int PendingCargo);

public record VehicleRoiResult(
    decimal TotalRevenue,
    decimal TotalFuelCost,
    decimal TotalMaintenanceCost,
    decimal AcquisitionCost,
    decimal Roi);

public record FleetFinancialSummaryResult(
    decimal TotalFuelCost,
    decimal FleetRoi,
    decimal UtilizationRate,
    IEnumerable<MonthlyFinancialData> MonthlyData);

public record MonthlyFinancialData(
    string Month,
    decimal Revenue,
    decimal FuelCost,
    decimal Maintenance,
    decimal NetProfit);

public record FuelEfficiencyTrendItem(
    string Month,
    decimal KmL);

public record TopCostliestVehicleItem(
    string VehicleName,
    string LicensePlate,
    decimal TotalCost);

