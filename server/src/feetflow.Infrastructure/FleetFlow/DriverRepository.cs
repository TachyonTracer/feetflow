using System.Data;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.FleetFlow;
using Npgsql;

namespace feetflow.Infrastructure.Repositories;

public class DriverRepository : IDriverRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IUnitOfWork _unitOfWork;

    public DriverRepository(IDbConnectionFactory connectionFactory, IUnitOfWork unitOfWork)
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

    public async Task<Driver?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT driver_id, full_name, license_number, license_category, license_expiry, status::text, is_deleted, created_at, (xmin)::text::integer
                  FROM drivers WHERE driver_id = @driver_id AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("driver_id", id);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            return MapDriver(reader);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<Driver>> GetAllAsync(bool includeDeleted, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = @"SELECT driver_id, full_name, license_number, license_category, license_expiry, status::text, is_deleted, created_at, (xmin)::text::integer
                        FROM drivers";
            if (!includeDeleted)
                sql += " WHERE is_deleted = FALSE";
            sql += " ORDER BY created_at DESC";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            var list = new List<Driver>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                list.Add(MapDriver(reader));
            return list;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<Driver>> GetPagedAsync(int pageNumber, int pageSize, bool includeDeleted, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = @"SELECT driver_id, full_name, license_number, license_category, license_expiry, status::text, is_deleted, created_at, (xmin)::text::integer
                        FROM drivers";
            if (!includeDeleted)
                sql += " WHERE is_deleted = FALSE";
            sql += " ORDER BY created_at DESC LIMIT @limit OFFSET @offset";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("limit", pageSize);
            cmd.Parameters.AddWithValue("offset", (pageNumber - 1) * pageSize);

            var list = new List<Driver>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                list.Add(MapDriver(reader));
            return list;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> CountAsync(bool includeDeleted, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = "SELECT COUNT(*) FROM drivers";
            if (!includeDeleted)
                sql += " WHERE is_deleted = FALSE";

            await using var cmd = new NpgsqlCommand(sql, connection);
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

    public async Task<Guid> AddAsync(Driver driver, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO drivers (driver_id, full_name, license_number, license_category, license_expiry, status)
                  VALUES (@driver_id, @full_name, @license_number, @license_category, @license_expiry, @status::driver_status)
                  RETURNING driver_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("driver_id", driver.Id);
            cmd.Parameters.AddWithValue("full_name", driver.FullName);
            cmd.Parameters.AddWithValue("license_number", driver.LicenseNumber);
            cmd.Parameters.AddWithValue("license_category", driver.LicenseCategory);
            cmd.Parameters.AddWithValue("license_expiry", driver.LicenseExpiry);
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(driver.Status));
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return (Guid)result!;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> UpdateAsync(Driver driver, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"UPDATE drivers SET full_name = @full_name, license_number = @license_number, license_category = @license_category, license_expiry = @license_expiry, status = @status::driver_status
                  WHERE driver_id = @driver_id AND xmin = @xmin AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("full_name", driver.FullName);
            cmd.Parameters.AddWithValue("license_number", driver.LicenseNumber);
            cmd.Parameters.AddWithValue("license_category", driver.LicenseCategory);
            cmd.Parameters.AddWithValue("license_expiry", driver.LicenseExpiry);
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(driver.Status));
            cmd.Parameters.AddWithValue("driver_id", driver.Id);
            cmd.Parameters.AddWithValue("xmin", (uint)driver.Xmin);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> SetStatusAsync(Guid id, DriverStatus status, uint xmin, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "UPDATE drivers SET status = @status::driver_status WHERE driver_id = @driver_id AND xmin = @xmin AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(status));
            cmd.Parameters.AddWithValue("driver_id", id);
            cmd.Parameters.AddWithValue("xmin", xmin);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    private static Driver MapDriver(NpgsqlDataReader reader)
    {
        return new Driver
        {
            Id = reader.GetGuid(0),
            FullName = reader.GetString(1),
            LicenseNumber = reader.GetString(2),
            LicenseCategory = reader.GetString(3),
            LicenseExpiry = reader.GetFieldValue<DateOnly>(4),
            Status = FleetFlowEnumMapper.ToDriverStatus(reader.GetString(5)),
            IsDeleted = reader.GetBoolean(6),
            CreatedAt = reader.GetDateTime(7),
            Xmin = reader.IsDBNull(8) ? 0u : (uint)reader.GetInt32(8)
        };
    }
}
