using System.Data;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.FleetFlow;
using Npgsql;

namespace feetflow.Infrastructure.Repositories;

public class FuelLogRepository : IFuelLogRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IUnitOfWork _unitOfWork;

    public FuelLogRepository(IDbConnectionFactory connectionFactory, IUnitOfWork unitOfWork)
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

    public async Task<FuelLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT f.fuel_log_id, f.vehicle_id, f.trip_id, f.driver_id, f.liters, f.cost, f.distance, f.misc_expense, f.status, f.fuel_date, f.created_at,
                         v.name as vehicle_name, d.full_name as driver_name
                  FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE
                  LEFT JOIN drivers d ON d.driver_id = f.driver_id
                  WHERE f.fuel_log_id = @fuel_log_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("fuel_log_id", id);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            return Map(reader);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<FuelLog>> GetByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT f.fuel_log_id, f.vehicle_id, f.trip_id, f.driver_id, f.liters, f.cost, f.distance, f.misc_expense, f.status, f.fuel_date, f.created_at,
                         v.name as vehicle_name, d.full_name as driver_name
                  FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE
                  LEFT JOIN drivers d ON d.driver_id = f.driver_id
                  WHERE f.vehicle_id = @vehicle_id
                  ORDER BY f.fuel_date DESC", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", vehicleId);
            var list = new List<FuelLog>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                list.Add(Map(reader));
            return list;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<FuelLog>> GetByVehicleIdPagedAsync(Guid vehicleId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT f.fuel_log_id, f.vehicle_id, f.trip_id, f.driver_id, f.liters, f.cost, f.distance, f.misc_expense, f.status, f.fuel_date, f.created_at,
                         v.name as vehicle_name, d.full_name as driver_name
                  FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE
                  LEFT JOIN drivers d ON d.driver_id = f.driver_id
                  WHERE f.vehicle_id = @vehicle_id
                  ORDER BY f.fuel_date DESC
                  LIMIT @limit OFFSET @offset", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", vehicleId);
            cmd.Parameters.AddWithValue("limit", pageSize);
            cmd.Parameters.AddWithValue("offset", (pageNumber - 1) * pageSize);
            var list = new List<FuelLog>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                list.Add(Map(reader));
            return list;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> CountByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT COUNT(*) FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE
                  WHERE f.vehicle_id = @vehicle_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", vehicleId);
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<FuelLog>> GetAllPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT f.fuel_log_id, f.vehicle_id, f.trip_id, f.driver_id, f.liters, f.cost, f.distance, f.misc_expense, f.status, f.fuel_date, f.created_at,
                         v.name as vehicle_name, d.full_name as driver_name
                  FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE
                  LEFT JOIN drivers d ON d.driver_id = f.driver_id
                  ORDER BY f.fuel_date DESC
                  LIMIT @limit OFFSET @offset", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("limit", pageSize);
            cmd.Parameters.AddWithValue("offset", (pageNumber - 1) * pageSize);
            var list = new List<FuelLog>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                list.Add(Map(reader));
            return list;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> CountAllAsync(CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT COUNT(*) FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<Guid> AddAsync(FuelLog log, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO fuel_logs (fuel_log_id, vehicle_id, trip_id, driver_id, liters, cost, distance, misc_expense, status, fuel_date)
                  VALUES (@fuel_log_id, @vehicle_id, @trip_id, @driver_id, @liters, @cost, @distance, @misc_expense, @status, @fuel_date)
                  RETURNING fuel_log_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("fuel_log_id", log.Id);
            cmd.Parameters.AddWithValue("vehicle_id", log.VehicleId);
            cmd.Parameters.AddWithValue("trip_id", (object?)log.TripId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("driver_id", (object?)log.DriverId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("liters", log.Liters);
            cmd.Parameters.AddWithValue("cost", log.Cost);
            cmd.Parameters.AddWithValue("distance", log.Distance);
            cmd.Parameters.AddWithValue("misc_expense", log.MiscExpense);
            cmd.Parameters.AddWithValue("status", log.Status ?? "Completed");
            cmd.Parameters.AddWithValue("fuel_date", log.FuelDate);
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return (Guid)result!;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task UpdateAsync(FuelLog log, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"UPDATE fuel_logs 
                  SET vehicle_id = @vehicle_id, trip_id = @trip_id, driver_id = @driver_id, 
                      liters = @liters, cost = @cost, distance = @distance, 
                      misc_expense = @misc_expense, status = @status, fuel_date = @fuel_date
                  WHERE fuel_log_id = @fuel_log_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("fuel_log_id", log.Id);
            cmd.Parameters.AddWithValue("vehicle_id", log.VehicleId);
            cmd.Parameters.AddWithValue("trip_id", (object?)log.TripId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("driver_id", (object?)log.DriverId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("liters", log.Liters);
            cmd.Parameters.AddWithValue("cost", log.Cost);
            cmd.Parameters.AddWithValue("distance", log.Distance);
            cmd.Parameters.AddWithValue("misc_expense", log.MiscExpense);
            cmd.Parameters.AddWithValue("status", log.Status ?? "Completed");
            cmd.Parameters.AddWithValue("fuel_date", log.FuelDate);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<(decimal TotalFuelCost, decimal TotalMiscExpense, int TripsCount)> GetGlobalTotalsAsync(CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT SUM(cost) as total_fuel, SUM(misc_expense) as total_misc, COUNT(DISTINCT trip_id) as trips_count FROM fuel_logs WHERE trip_id IS NOT NULL", connection);
            cmd.Transaction = GetTransaction();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return (0, 0, 0);
            
            return (
                reader.IsDBNull(0) ? 0 : reader.GetDecimal(0),
                reader.IsDBNull(1) ? 0 : reader.GetDecimal(1),
                reader.IsDBNull(2) ? 0 : reader.GetInt32(2)
            );
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    private static FuelLog Map(NpgsqlDataReader reader)
    {
        return new FuelLog
        {
            Id = reader.GetGuid(0),
            VehicleId = reader.GetGuid(1),
            TripId = reader.IsDBNull(2) ? null : reader.GetGuid(2),
            DriverId = reader.IsDBNull(3) ? null : reader.GetGuid(3),
            Liters = reader.GetDecimal(4),
            Cost = reader.GetDecimal(5),
            Distance = reader.GetDecimal(6),
            MiscExpense = reader.GetDecimal(7),
            Status = reader.GetString(8),
            FuelDate = reader.GetFieldValue<DateOnly>(9),
            CreatedAt = reader.GetDateTime(10),
            VehicleName = reader.IsDBNull(11) ? null : reader.GetString(11),
            DriverName = reader.IsDBNull(12) ? null : reader.GetString(12)
        };
    }
}
