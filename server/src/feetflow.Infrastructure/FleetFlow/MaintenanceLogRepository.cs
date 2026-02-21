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

    public async Task<IReadOnlyList<MaintenanceLogDto>> GetPagedDtoAsync(int page, int pageSize, bool? isClosed = null, Guid? vehicleId = null, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = @"
                SELECT m.maintenance_id, m.vehicle_id, v.name as vehicle_name, v.license_plate, m.description, m.cost, m.service_date, m.is_closed, m.created_at
                FROM maintenance_logs m
                LEFT JOIN vehicles v ON v.vehicle_id = m.vehicle_id
                WHERE (@is_closed IS NULL OR m.is_closed = @is_closed)
                  AND (@vehicle_id IS NULL OR m.vehicle_id = @vehicle_id)
                ORDER BY m.created_at DESC
                LIMIT @limit OFFSET @offset";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.Add(new NpgsqlParameter("is_closed", NpgsqlTypes.NpgsqlDbType.Boolean) { Value = isClosed.HasValue ? (object)isClosed.Value : DBNull.Value });
            cmd.Parameters.Add(new NpgsqlParameter("vehicle_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = vehicleId.HasValue ? (object)vehicleId.Value : DBNull.Value });
            cmd.Parameters.AddWithValue("limit", pageSize);
            cmd.Parameters.AddWithValue("offset", (page - 1) * pageSize);

            var result = new List<MaintenanceLogDto>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new MaintenanceLogDto(
                    reader.GetGuid(0),
                    reader.GetGuid(1),
                    reader.IsDBNull(2) ? "" : reader.GetString(2),
                    reader.IsDBNull(3) ? "" : reader.GetString(3),
                    reader.GetString(4),
                    reader.GetDecimal(5),
                    reader.GetFieldValue<DateOnly>(6),
                    reader.GetBoolean(7),
                    reader.GetDateTime(8)
                ));
            }
            return result;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> CountAsync(bool? isClosed = null, Guid? vehicleId = null, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = @"
                SELECT COUNT(*)
                FROM maintenance_logs m
                WHERE (@is_closed IS NULL OR m.is_closed = @is_closed)
                  AND (@vehicle_id IS NULL OR m.vehicle_id = @vehicle_id)";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.Add(new NpgsqlParameter("is_closed", NpgsqlTypes.NpgsqlDbType.Boolean) { Value = isClosed.HasValue ? (object)isClosed.Value : DBNull.Value });
            cmd.Parameters.Add(new NpgsqlParameter("vehicle_id", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = vehicleId.HasValue ? (object)vehicleId.Value : DBNull.Value });
            
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
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
