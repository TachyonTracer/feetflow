using System.Data;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.FleetFlow;
using Npgsql;
using NpgsqlTypes;

namespace feetflow.Infrastructure.Repositories;

public class VehicleRepository : IVehicleRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IUnitOfWork _unitOfWork;

    public VehicleRepository(IDbConnectionFactory connectionFactory, IUnitOfWork unitOfWork)
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

    public async Task<Vehicle?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT vehicle_id, name, license_plate, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost,
                         status::text, is_deleted, created_at, (xmin)::text::integer
                  FROM vehicles WHERE vehicle_id = @vehicle_id AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", id);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            return MapVehicle(reader);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<Vehicle>> GetPagedAsync(int page, int pageSize, VehicleStatus? statusFilter, bool includeDeleted, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = @"SELECT v.vehicle_id, v.name, v.license_plate, v.vehicle_type, v.max_capacity_kg, v.odometer_km, v.acquisition_cost,
                               v.status::text, v.is_deleted, v.created_at, (v.xmin)::text::integer,
                               (SELECT t.origin_state FROM trips t WHERE t.vehicle_id = v.vehicle_id AND t.status = 'dispatched'::trip_status AND t.is_deleted = FALSE LIMIT 1) as origin_state,
                               (SELECT t.destination_state FROM trips t WHERE t.vehicle_id = v.vehicle_id AND t.status = 'dispatched'::trip_status AND t.is_deleted = FALSE LIMIT 1) as destination_state
                        FROM vehicles v
                        WHERE 1=1";
            if (!includeDeleted)
                sql += " AND v.is_deleted = FALSE";
            if (statusFilter.HasValue)
                sql += " AND v.status = @status::vehicle_status";
            sql += " ORDER BY v.created_at DESC LIMIT @limit OFFSET @offset";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("limit", pageSize);
            cmd.Parameters.AddWithValue("offset", (page - 1) * pageSize);
            if (statusFilter.HasValue)
                cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(statusFilter.Value));

            var list = new List<Vehicle>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                list.Add(MapVehicle(reader));
            return list;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> CountAsync(VehicleStatus? statusFilter, bool includeDeleted, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = "SELECT COUNT(*) FROM vehicles WHERE 1=1";
            if (!includeDeleted)
                sql += " AND is_deleted = FALSE";
            if (statusFilter.HasValue)
                sql += " AND status = @status::vehicle_status";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            if (statusFilter.HasValue)
                cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(statusFilter.Value));
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<Guid> AddAsync(Vehicle vehicle, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO vehicles (vehicle_id, name, license_plate, vehicle_type, max_capacity_kg, odometer_km, acquisition_cost, status)
                  VALUES (@vehicle_id, @name, @license_plate, @vehicle_type, @max_capacity_kg, @odometer_km, @acquisition_cost, @status::vehicle_status)
                  RETURNING vehicle_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", vehicle.Id);
            cmd.Parameters.AddWithValue("name", vehicle.Name);
            cmd.Parameters.AddWithValue("license_plate", vehicle.LicensePlate);
            cmd.Parameters.AddWithValue("vehicle_type", vehicle.VehicleType);
            cmd.Parameters.AddWithValue("max_capacity_kg", vehicle.MaxCapacityKg);
            cmd.Parameters.AddWithValue("odometer_km", vehicle.OdometerKm);
            cmd.Parameters.AddWithValue("acquisition_cost", vehicle.AcquisitionCost);
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(vehicle.Status));
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return (Guid)result!;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> UpdateAsync(Vehicle vehicle, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"UPDATE vehicles SET name = @name, license_plate = @license_plate, vehicle_type = @vehicle_type,
                         max_capacity_kg = @max_capacity_kg, odometer_km = @odometer_km, acquisition_cost = @acquisition_cost, status = @status::vehicle_status
                  WHERE vehicle_id = @vehicle_id AND xmin = @xmin AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("name", vehicle.Name);
            cmd.Parameters.AddWithValue("license_plate", vehicle.LicensePlate);
            cmd.Parameters.AddWithValue("vehicle_type", vehicle.VehicleType);
            cmd.Parameters.AddWithValue("max_capacity_kg", vehicle.MaxCapacityKg);
            cmd.Parameters.AddWithValue("odometer_km", vehicle.OdometerKm);
            cmd.Parameters.AddWithValue("acquisition_cost", vehicle.AcquisitionCost);
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(vehicle.Status));
            cmd.Parameters.AddWithValue("vehicle_id", vehicle.Id);
            cmd.Parameters.Add(new NpgsqlParameter("xmin", NpgsqlDbType.Xid) { Value = (uint)vehicle.Xmin });
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> SoftDeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "UPDATE vehicles SET is_deleted = TRUE WHERE vehicle_id = @vehicle_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", id);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> SetStatusAsync(Guid id, VehicleStatus status, uint xmin, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "UPDATE vehicles SET status = @status::vehicle_status WHERE vehicle_id = @vehicle_id AND xmin = @xmin AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(status));
            cmd.Parameters.AddWithValue("vehicle_id", id);
            cmd.Parameters.Add(new NpgsqlParameter("xmin", NpgsqlDbType.Xid) { Value = xmin });
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> SetOdometerAndStatusAsync(Guid id, decimal odometerKm, VehicleStatus status, uint xmin, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "UPDATE vehicles SET odometer_km = @odometer_km, status = @status::vehicle_status WHERE vehicle_id = @vehicle_id AND xmin = @xmin AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("odometer_km", odometerKm);
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(status));
            cmd.Parameters.AddWithValue("vehicle_id", id);
            cmd.Parameters.Add(new NpgsqlParameter("xmin", NpgsqlDbType.Xid) { Value = xmin });
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<(decimal TotalFuel, decimal TotalMaintenance, decimal TotalMisc)> GetOperationalCostsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            const string sql = @"
                SELECT 
                    COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = @vehicle_id), 0) as total_fuel,
                    COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = @vehicle_id), 0) as total_maintenance,
                    COALESCE((SELECT SUM(misc_expense) FROM fuel_logs WHERE vehicle_id = @vehicle_id), 0) as total_misc";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", id);
            
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return (0, 0, 0);

            return (
                reader.GetDecimal(0),
                reader.GetDecimal(1),
                reader.GetDecimal(2)
            );
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    private static Vehicle MapVehicle(NpgsqlDataReader reader)
    {
        var vehicle = new Vehicle
        {
            Id = reader.GetGuid(0),
            Name = reader.GetString(1),
            LicensePlate = reader.GetString(2),
            VehicleType = reader.GetString(3),
            MaxCapacityKg = reader.GetDecimal(4),
            OdometerKm = reader.GetDecimal(5),
            AcquisitionCost = reader.GetDecimal(6),
            Status = FleetFlowEnumMapper.ToVehicleStatus(reader.GetString(7)),
            IsDeleted = reader.GetBoolean(8),
            CreatedAt = reader.GetDateTime(9),
            Xmin = reader.IsDBNull(10) ? 0u : (uint)reader.GetInt32(10)
        };

        if (reader.FieldCount > 11)
        {
            vehicle.ActiveTripOriginState = reader.IsDBNull(11) ? null : reader.GetString(11);
            vehicle.ActiveTripDestinationState = reader.IsDBNull(12) ? null : reader.GetString(12);
        }

        return vehicle;
    }
}
