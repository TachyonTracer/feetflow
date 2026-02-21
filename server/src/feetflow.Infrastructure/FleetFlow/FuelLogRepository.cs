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
                @"SELECT f.fuel_log_id, f.vehicle_id, f.trip_id, f.liters, f.cost, f.fuel_date, f.created_at
                  FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE
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
                @"SELECT f.fuel_log_id, f.vehicle_id, f.trip_id, f.liters, f.cost, f.fuel_date, f.created_at
                  FROM fuel_logs f
                  JOIN vehicles v ON v.vehicle_id = f.vehicle_id AND v.is_deleted = FALSE
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

    public async Task<Guid> AddAsync(FuelLog log, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO fuel_logs (fuel_log_id, vehicle_id, trip_id, liters, cost, fuel_date)
                  VALUES (@fuel_log_id, @vehicle_id, @trip_id, @liters, @cost, @fuel_date)
                  RETURNING fuel_log_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("fuel_log_id", log.Id);
            cmd.Parameters.AddWithValue("vehicle_id", log.VehicleId);
            cmd.Parameters.AddWithValue("trip_id", (object?)log.TripId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("liters", log.Liters);
            cmd.Parameters.AddWithValue("cost", log.Cost);
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

    private static FuelLog Map(NpgsqlDataReader reader)
    {
        return new FuelLog
        {
            Id = reader.GetGuid(0),
            VehicleId = reader.GetGuid(1),
            TripId = reader.IsDBNull(2) ? null : reader.GetGuid(2),
            Liters = reader.GetDecimal(3),
            Cost = reader.GetDecimal(4),
            FuelDate = reader.GetFieldValue<DateOnly>(5),
            CreatedAt = reader.GetDateTime(6)
        };
    }
}
