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
                    (SELECT COUNT(*) FROM drivers WHERE status = 'on_duty' AND is_deleted = FALSE) AS on_duty_drivers";
            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            return new DashboardSnapshot(
                reader.GetInt32(0),
                reader.GetInt32(1),
                reader.GetInt32(2),
                reader.GetInt32(3));
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
}
