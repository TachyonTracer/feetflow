using System.Data;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.FleetFlow;
using Npgsql;

namespace feetflow.Infrastructure.Repositories;

public class AnalyticsRepository : IAnalyticsRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IUnitOfWork _unitOfWork;

    public AnalyticsRepository(IDbConnectionFactory connectionFactory, IUnitOfWork unitOfWork)
    {
        _connectionFactory = connectionFactory;
        _unitOfWork = unitOfWork;
    }

    private async Task<NpgsqlConnection> GetConnectionAsync(CancellationToken cancellationToken)
    {
        var conn = _unitOfWork.GetConnection();
        if (conn != null)
            return (NpgsqlConnection)conn;
        return (NpgsqlConnection)await _connectionFactory.CreateConnectionAsync(cancellationToken);
    }

    private NpgsqlTransaction? GetTransaction() => _unitOfWork.GetTransaction() as NpgsqlTransaction;

    public async Task<DashboardSnapshot> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            const string sql = @"
                SELECT
                    (SELECT COUNT(*) FROM vehicles WHERE is_deleted = FALSE) AS total_vehicles,
                    (SELECT COUNT(*) FROM trips WHERE status = 'dispatched' AND is_deleted = FALSE) AS active_trips,
                    (SELECT COUNT(*) FROM vehicles WHERE status = 'available' AND is_deleted = FALSE) AS available_vehicles,
                    (SELECT COUNT(*) FROM drivers WHERE status = 'on_duty' AND is_deleted = FALSE) AS on_duty_drivers,
                    (SELECT COUNT(*) FROM vehicles WHERE status = 'in_shop' AND is_deleted = FALSE) AS maintenance_alerts,
                    (SELECT COUNT(*) FROM trips WHERE status = 'draft' AND is_deleted = FALSE) AS pending_cargo";
            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            return new DashboardSnapshot(
                reader.GetInt32(0),
                reader.GetInt32(1),
                reader.GetInt32(2),
                reader.GetInt32(3),
                reader.GetInt32(4),
                reader.GetInt32(5));
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<VehicleRoiResult?> GetVehicleRoiAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            const string sql = @"
                SELECT v.acquisition_cost,
                    COALESCE(SUM(t.revenue), 0) AS total_revenue,
                    (SELECT COALESCE(SUM(f.cost), 0) FROM fuel_logs f WHERE f.vehicle_id = @vehicle_id) AS fuel_cost,
                    (SELECT COALESCE(SUM(m.cost), 0) FROM maintenance_logs m WHERE m.vehicle_id = @vehicle_id) AS maintenance_cost
                FROM vehicles v
                LEFT JOIN trips t ON t.vehicle_id = v.vehicle_id AND t.status = 'completed' AND t.is_deleted = FALSE
                WHERE v.vehicle_id = @vehicle_id AND v.is_deleted = FALSE
                GROUP BY v.vehicle_id, v.acquisition_cost";
            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", vehicleId);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            var acquisitionCost = reader.GetDecimal(0);
            var totalRevenue = reader.GetDecimal(1);
            var fuelCost = reader.GetDecimal(2);
            var maintenanceCost = reader.GetDecimal(3);
            var roi = acquisitionCost != 0
                ? (totalRevenue - fuelCost - maintenanceCost) / acquisitionCost
                : 0m;
            return new VehicleRoiResult(totalRevenue, fuelCost, maintenanceCost, acquisitionCost, roi);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<decimal?> GetFuelEfficiencyAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            const string sql = @"
                SELECT SUM(t.end_odometer - t.start_odometer) / NULLIF(SUM(fl.liters), 0) AS km_per_liter
                FROM trips t
                JOIN fuel_logs fl ON fl.trip_id = t.trip_id AND fl.vehicle_id = t.vehicle_id
                WHERE t.vehicle_id = @vehicle_id AND t.status = 'completed' AND t.is_deleted = FALSE
                  AND t.end_odometer IS NOT NULL AND t.start_odometer IS NOT NULL";
            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", vehicleId);
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            if (result == null || result == DBNull.Value)
                return null;
            return Convert.ToDecimal(result);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<FleetFinancialSummaryResult> GetFleetFinancialSummaryAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            // 1. Calculate overall Fleet totals (ROI, Total Fuel Cost)
            const string totalsSql = @"
                SELECT 
                    COALESCE(SUM(v.acquisition_cost), 0) as total_acquisition,
                    (SELECT COALESCE(SUM(revenue), 0) FROM trips WHERE status = 'completed' AND is_deleted = FALSE) as total_revenue,
                    (SELECT COALESCE(SUM(cost), 0) FROM fuel_logs) as total_fuel,
                    (SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs) as total_maintenance,
                    (SELECT COUNT(*) FROM vehicles WHERE status = 'available' AND is_deleted = FALSE) * 100.0 / 
                        NULLIF((SELECT COUNT(*) FROM vehicles WHERE status != 'retired' AND is_deleted = FALSE), 0) as utilization_rate
                FROM vehicles v WHERE v.is_deleted = FALSE;";
                
            await using var cmdTotals = new NpgsqlCommand(totalsSql, connection);
            cmdTotals.Transaction = GetTransaction();
            await using var readerTotals = await cmdTotals.ExecuteReaderAsync(cancellationToken);
            await readerTotals.ReadAsync(cancellationToken);
            
            var totalAcq = readerTotals.IsDBNull(0) ? 0m : readerTotals.GetDecimal(0);
            var totalRev = readerTotals.IsDBNull(1) ? 0m : readerTotals.GetDecimal(1);
            var totalFuel = readerTotals.IsDBNull(2) ? 0m : readerTotals.GetDecimal(2);
            var totalMaint = readerTotals.IsDBNull(3) ? 0m : readerTotals.GetDecimal(3);
            var utilization = readerTotals.IsDBNull(4) ? 0m : readerTotals.GetDecimal(4);
            
            var fleetRoi = totalAcq != 0 ? (totalRev - totalFuel - totalMaint) / totalAcq : 0m;
            
            await readerTotals.CloseAsync();

            // 2. Fetch monthly breakdown
            const string monthlySql = @"
                WITH months AS (
                    SELECT generate_series(
                        COALESCE(@start_date, date_trunc('month', current_date - interval '11 months')),
                        COALESCE(@end_date, date_trunc('month', current_date)),
                        '1 month'::interval
                    ) AS month_start
                )
                SELECT 
                    to_char(m.month_start, 'Mon YYYY') as month_name,
                    COALESCE((SELECT SUM(revenue) FROM trips t WHERE date_trunc('month', t.completed_at) = m.month_start AND t.status = 'completed' AND t.is_deleted = FALSE), 0) as revenue,
                    COALESCE((SELECT SUM(cost) FROM fuel_logs f WHERE date_trunc('month', f.fuel_date) = m.month_start), 0) as fuel_cost,
                    COALESCE((SELECT SUM(cost) FROM maintenance_logs ml WHERE date_trunc('month', ml.service_date) = m.month_start), 0) as maintenance_cost
                FROM months m
                ORDER BY m.month_start;";

            await using var cmdMonthly = new NpgsqlCommand(monthlySql, connection);
            cmdMonthly.Transaction = GetTransaction();
            cmdMonthly.Parameters.AddWithValue("start_date", (object?)startDate ?? DBNull.Value);
            cmdMonthly.Parameters.AddWithValue("end_date", (object?)endDate ?? DBNull.Value);
            await using var readerMonthly = await cmdMonthly.ExecuteReaderAsync(cancellationToken);
            
            var monthlyData = new List<MonthlyFinancialData>();
            while (await readerMonthly.ReadAsync(cancellationToken))
            {
                var month = readerMonthly.GetString(0);
                var rev = readerMonthly.GetDecimal(1);
                var fuel = readerMonthly.GetDecimal(2);
                var maint = readerMonthly.GetDecimal(3);
                var net = rev - fuel - maint;
                monthlyData.Add(new MonthlyFinancialData(month, rev, fuel, maint, net));
            }

            return new FleetFinancialSummaryResult(totalFuel, fleetRoi, utilization, monthlyData);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IEnumerable<FuelEfficiencyTrendItem>> GetFuelEfficiencyTrendAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            // Calculate avg km/L per month for the given timeframe
            const string sql = @"
                WITH months AS (
                    SELECT generate_series(
                        COALESCE(@start_date, date_trunc('month', current_date - interval '11 months')),
                        COALESCE(@end_date, date_trunc('month', current_date)),
                        '1 month'::interval
                    ) AS month_start
                )
                SELECT 
                    to_char(m.month_start, 'Mon YYYY') as month_name,
                    COALESCE(
                        (SELECT SUM(t.end_odometer - t.start_odometer) / NULLIF(SUM(fl.liters), 0)
                         FROM trips t
                         JOIN fuel_logs fl ON fl.trip_id = t.trip_id AND fl.vehicle_id = t.vehicle_id
                         WHERE date_trunc('month', t.completed_at) = m.month_start 
                           AND t.status = 'completed' AND t.is_deleted = FALSE
                           AND t.end_odometer IS NOT NULL AND t.start_odometer IS NOT NULL),
                        0
                    ) as km_per_liter
                FROM months m
                ORDER BY m.month_start;";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("start_date", (object?)startDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("end_date", (object?)endDate ?? DBNull.Value);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            
            var trend = new List<FuelEfficiencyTrendItem>();
            while (await reader.ReadAsync(cancellationToken))
            {
                trend.Add(new FuelEfficiencyTrendItem(
                    reader.GetString(0),
                    reader.GetDecimal(1)
                ));
            }
            return trend;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IEnumerable<TopCostliestVehicleItem>> GetTopCostliestVehiclesAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            // Sum of maintaining + fueling a vehicle. Top 5.
            const string sql = @"
                SELECT 
                    v.name,
                    v.license_plate,
                    (
                        COALESCE((SELECT SUM(cost) FROM fuel_logs f 
                                  WHERE f.vehicle_id = v.vehicle_id 
                                  AND (@start_date IS NULL OR f.fuel_date >= @start_date)
                                  AND (@end_date IS NULL OR f.fuel_date <= @end_date)), 0) +
                        COALESCE((SELECT SUM(cost) FROM maintenance_logs m 
                                  WHERE m.vehicle_id = v.vehicle_id
                                  AND (@start_date IS NULL OR m.service_date >= @start_date)
                                  AND (@end_date IS NULL OR m.service_date <= @end_date)), 0)
                    ) as total_cost
                FROM vehicles v
                WHERE v.is_deleted = FALSE
                ORDER BY total_cost DESC
                LIMIT 5;";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("start_date", (object?)startDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("end_date", (object?)endDate ?? DBNull.Value);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            
            var vehicles = new List<TopCostliestVehicleItem>();
            while (await reader.ReadAsync(cancellationToken))
            {
                vehicles.Add(new TopCostliestVehicleItem(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetDecimal(2)
                ));
            }
            return vehicles;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }
}
