using System.Data;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.FleetFlow;
using Npgsql;

namespace feetflow.Infrastructure.Repositories;

public class MaintenanceLogRepository : IMaintenanceLogRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IUnitOfWork _unitOfWork;

    public MaintenanceLogRepository(IDbConnectionFactory connectionFactory, IUnitOfWork unitOfWork)
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

    public async Task<MaintenanceLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT m.maintenance_id, m.vehicle_id, m.description, m.cost, m.service_date, m.is_closed, m.created_at
                  FROM maintenance_logs m
                  JOIN vehicles v ON v.vehicle_id = m.vehicle_id AND v.is_deleted = FALSE
                  WHERE m.maintenance_id = @maintenance_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("maintenance_id", id);
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

    public async Task<Guid> AddAsync(MaintenanceLog log, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO maintenance_logs (maintenance_id, vehicle_id, description, cost, service_date, is_closed)
                  VALUES (@maintenance_id, @vehicle_id, @description, @cost, @service_date, @is_closed)
                  RETURNING maintenance_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("maintenance_id", log.Id);
            cmd.Parameters.AddWithValue("vehicle_id", log.VehicleId);
            cmd.Parameters.AddWithValue("description", log.Description);
            cmd.Parameters.AddWithValue("cost", log.Cost);
            cmd.Parameters.AddWithValue("service_date", log.ServiceDate);
            cmd.Parameters.AddWithValue("is_closed", log.IsClosed);
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return (Guid)result!;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> CloseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "UPDATE maintenance_logs SET is_closed = TRUE WHERE maintenance_id = @maintenance_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("maintenance_id", id);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    private static MaintenanceLog Map(NpgsqlDataReader reader)
    {
        return new MaintenanceLog
        {
            Id = reader.GetGuid(0),
            VehicleId = reader.GetGuid(1),
            Description = reader.GetString(2),
            Cost = reader.GetDecimal(3),
            ServiceDate = reader.GetFieldValue<DateOnly>(4),
            IsClosed = reader.GetBoolean(5),
            CreatedAt = reader.GetDateTime(6)
        };
    }
}
