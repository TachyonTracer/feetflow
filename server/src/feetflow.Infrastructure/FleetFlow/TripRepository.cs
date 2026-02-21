using System.Data;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.FleetFlow;
using Npgsql;
using NpgsqlTypes;

namespace feetflow.Infrastructure.Repositories;

public class TripRepository : ITripRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IUnitOfWork _unitOfWork;

    public TripRepository(IDbConnectionFactory connectionFactory, IUnitOfWork unitOfWork)
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

    public async Task<Trip?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"SELECT t.trip_id, t.vehicle_id, t.driver_id, t.cargo_weight_kg, t.origin_state, t.destination_state, t.start_odometer, t.end_odometer, t.revenue, t.status::text, t.is_deleted, t.created_at, t.completed_at, (t.xmin)::text::integer
                  FROM trips t
                  WHERE t.trip_id = @trip_id AND t.is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("trip_id", id);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            return MapTrip(reader);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<Trip>> GetPagedAsync(int page, int pageSize, TripStatus? statusFilter, Guid? vehicleId, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = @"SELECT t.trip_id, t.vehicle_id, t.driver_id, t.cargo_weight_kg, t.origin_state, t.destination_state, t.start_odometer, t.end_odometer, t.revenue, t.status::text, t.is_deleted, t.created_at, t.completed_at, (t.xmin)::text::integer,
                               v.name AS vehicle_name, d.full_name AS driver_name
                        FROM trips t
                        LEFT JOIN vehicles v ON v.vehicle_id = t.vehicle_id
                        LEFT JOIN drivers d ON d.driver_id = t.driver_id
                        WHERE t.is_deleted = FALSE";
            if (statusFilter.HasValue)
                sql += " AND t.status = @status::trip_status";
            if (vehicleId.HasValue)
                sql += " AND t.vehicle_id = @vehicle_id";
            sql += " ORDER BY t.created_at DESC LIMIT @limit OFFSET @offset";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("limit", pageSize);
            cmd.Parameters.AddWithValue("offset", (page - 1) * pageSize);
            if (statusFilter.HasValue)
                cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(statusFilter.Value));
            if (vehicleId.HasValue)
                cmd.Parameters.AddWithValue("vehicle_id", vehicleId.Value);

            var list = new List<Trip>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                list.Add(MapTrip(reader));
            return list;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> CountAsync(TripStatus? statusFilter, Guid? vehicleId, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = "SELECT COUNT(*) FROM trips WHERE is_deleted = FALSE";
            if (statusFilter.HasValue)
                sql += " AND status = @status::trip_status";
            if (vehicleId.HasValue)
                sql += " AND vehicle_id = @vehicle_id";

            await using var cmd = new NpgsqlCommand(sql, connection);
            cmd.Transaction = GetTransaction();
            if (statusFilter.HasValue)
                cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(statusFilter.Value));
            if (vehicleId.HasValue)
                cmd.Parameters.AddWithValue("vehicle_id", vehicleId.Value);
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<Guid> AddAsync(Trip trip, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO trips (trip_id, vehicle_id, driver_id, cargo_weight_kg, origin_state, destination_state, start_odometer, end_odometer, revenue, status)
                  VALUES (@trip_id, @vehicle_id, @driver_id, @cargo_weight_kg, @origin_state, @destination_state, @start_odometer, @end_odometer, @revenue, @status::trip_status)
                  RETURNING trip_id", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("trip_id", trip.Id);
            cmd.Parameters.AddWithValue("vehicle_id", (object?)trip.VehicleId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("driver_id", (object?)trip.DriverId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("cargo_weight_kg", trip.CargoWeightKg);
            cmd.Parameters.AddWithValue("origin_state", trip.OriginState);
            cmd.Parameters.AddWithValue("destination_state", trip.DestinationState);
            cmd.Parameters.AddWithValue("start_odometer", (object?)trip.StartOdometer ?? DBNull.Value);
            cmd.Parameters.AddWithValue("end_odometer", (object?)trip.EndOdometer ?? DBNull.Value);
            cmd.Parameters.AddWithValue("revenue", (object?)trip.Revenue ?? DBNull.Value);
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(trip.Status));
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return (Guid)result!;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> UpdateStatusAsync(Guid id, TripStatus status, uint xmin, decimal? endOdometer, decimal? revenue, DateTime? completedAt, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"UPDATE trips SET status = @status::trip_status, end_odometer = COALESCE(@end_odometer, end_odometer), revenue = COALESCE(@revenue, revenue), completed_at = COALESCE(@completed_at, completed_at)
                  WHERE trip_id = @trip_id AND xmin = @xmin AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(status));
            cmd.Parameters.AddWithValue("end_odometer", (object?)endOdometer ?? DBNull.Value);
            cmd.Parameters.AddWithValue("revenue", (object?)revenue ?? DBNull.Value);
            cmd.Parameters.AddWithValue("completed_at", (object?)completedAt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("trip_id", id);
            cmd.Parameters.Add(new NpgsqlParameter("xmin", NpgsqlDbType.Xid) { Value = xmin });
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> UpdateAsync(Trip trip, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"UPDATE trips SET vehicle_id = @vehicle_id, driver_id = @driver_id, cargo_weight_kg = @cargo_weight_kg, origin_state = @origin_state, destination_state = @destination_state,
                         start_odometer = @start_odometer, end_odometer = @end_odometer, revenue = @revenue, status = @status::trip_status, completed_at = @completed_at
                  WHERE trip_id = @trip_id AND xmin = @xmin AND is_deleted = FALSE", connection);
            cmd.Transaction = GetTransaction();
            cmd.Parameters.AddWithValue("vehicle_id", (object?)trip.VehicleId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("driver_id", (object?)trip.DriverId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("cargo_weight_kg", trip.CargoWeightKg);
            cmd.Parameters.AddWithValue("origin_state", trip.OriginState);
            cmd.Parameters.AddWithValue("destination_state", trip.DestinationState);
            cmd.Parameters.AddWithValue("start_odometer", (object?)trip.StartOdometer ?? DBNull.Value);
            cmd.Parameters.AddWithValue("end_odometer", (object?)trip.EndOdometer ?? DBNull.Value);
            cmd.Parameters.AddWithValue("revenue", (object?)trip.Revenue ?? DBNull.Value);
            cmd.Parameters.AddWithValue("status", FleetFlowEnumMapper.ToDb(trip.Status));
            cmd.Parameters.AddWithValue("completed_at", (object?)trip.CompletedAt ?? DBNull.Value);
            cmd.Parameters.AddWithValue("trip_id", trip.Id);
            cmd.Parameters.Add(new NpgsqlParameter("xmin", NpgsqlDbType.Xid) { Value = (uint)trip.Xmin });
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    private static Trip MapTrip(NpgsqlDataReader reader)
    {
        var trip = new Trip
        {
            Id = reader.GetGuid(0),
            VehicleId = reader.IsDBNull(1) ? null : reader.GetGuid(1),
            DriverId = reader.IsDBNull(2) ? null : reader.GetGuid(2),
            CargoWeightKg = reader.GetDecimal(3),
            OriginState = reader.GetString(4),
            DestinationState = reader.GetString(5),
            StartOdometer = reader.IsDBNull(6) ? null : reader.GetDecimal(6),
            EndOdometer = reader.IsDBNull(7) ? null : reader.GetDecimal(7),
            Revenue = reader.IsDBNull(8) ? null : reader.GetDecimal(8),
            Status = FleetFlowEnumMapper.ToTripStatus(reader.GetString(9)),
            IsDeleted = reader.GetBoolean(10),
            CreatedAt = reader.GetDateTime(11),
            CompletedAt = reader.IsDBNull(12) ? null : reader.GetDateTime(12),
            Xmin = reader.IsDBNull(13) ? 0u : (uint)reader.GetInt32(13)
        };

        // Read optional JOINed name columns (only present in paged queries)
        if (reader.FieldCount > 14)
        {
            trip.VehicleName = reader.IsDBNull(14) ? null : reader.GetString(14);
            trip.DriverName = reader.IsDBNull(15) ? null : reader.GetString(15);
        }

        return trip;
    }
}
