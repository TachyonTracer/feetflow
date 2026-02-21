using System.Data;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.FleetFlow;
using Npgsql;

namespace feetflow.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IUnitOfWork _unitOfWork;

    public UserRepository(IDbConnectionFactory connectionFactory, IUnitOfWork unitOfWork)
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

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "SELECT user_id, full_name, email, password_hash, password_reset_token, password_reset_expires_at, role::text, is_deleted, created_at FROM users WHERE user_id = @user_id AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("user_id", id);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            return MapUser(reader);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "SELECT user_id, full_name, email, password_hash, password_reset_token, password_reset_expires_at, role::text, is_deleted, created_at FROM users WHERE email = @email AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("email", email);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            return MapUser(reader);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<Guid> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO users (user_id, full_name, email, password_hash, role)
                  VALUES (@user_id, @full_name, @email, @password_hash, @role::user_role)
                  RETURNING user_id", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("user_id", user.Id);
            cmd.Parameters.AddWithValue("full_name", user.FullName);
            cmd.Parameters.AddWithValue("email", user.Email);
            cmd.Parameters.AddWithValue("password_hash", user.PasswordHash);
            cmd.Parameters.AddWithValue("role", FleetFlowEnumMapper.ToDb(user.Role));
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return (Guid)result!;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "SELECT EXISTS(SELECT 1 FROM users WHERE email = @email AND is_deleted = FALSE)", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("email", email);
            var result = await cmd.ExecuteScalarAsync(cancellationToken);
            return (bool)result!;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<IReadOnlyList<User>> GetAllAsync(bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            var sql = includeDeleted
                ? "SELECT user_id, full_name, email, password_hash, password_reset_token, password_reset_expires_at, role::text, is_deleted, created_at FROM users ORDER BY created_at DESC"
                : "SELECT user_id, full_name, email, password_hash, password_reset_token, password_reset_expires_at, role::text, is_deleted, created_at FROM users WHERE is_deleted = FALSE ORDER BY created_at DESC";

            await using var cmd = new NpgsqlCommand(sql, connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;

            var result = new List<User>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                result.Add(MapUser(reader));
            return result;
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"UPDATE users SET full_name = @full_name, role = @role::user_role
                  WHERE user_id = @user_id AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("user_id", user.Id);
            cmd.Parameters.AddWithValue("full_name", user.FullName);
            cmd.Parameters.AddWithValue("role", FleetFlowEnumMapper.ToDb(user.Role));
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
                "UPDATE users SET is_deleted = TRUE WHERE user_id = @user_id AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("user_id", id);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    private static User MapUser(NpgsqlDataReader reader)
    {
        return new User
        {
            Id = reader.GetGuid(0),
            FullName = reader.GetString(1),
            Email = reader.GetString(2),
            PasswordHash = reader.GetString(3),
            PasswordResetToken = reader.IsDBNull(4) ? (Guid?)null : reader.GetGuid(4),
            PasswordResetTokenExpiresAt = reader.IsDBNull(5) ? (DateTime?)null : reader.GetDateTime(5),
            Role = FleetFlowEnumMapper.ToUserRole(reader.GetString(6)),
            IsDeleted = reader.GetBoolean(7),
            CreatedAt = reader.GetDateTime(8)
        };
    }

    public async Task<int> SetPasswordResetTokenAsync(Guid userId, Guid token, DateTime expiresAt, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                @"UPDATE users SET password_reset_token = @token, password_reset_expires_at = @expires
                  WHERE user_id = @user_id AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("user_id", userId);
            cmd.Parameters.AddWithValue("token", token);
            cmd.Parameters.AddWithValue("expires", expiresAt);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<User?> GetByResetTokenAsync(Guid token, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "SELECT user_id, full_name, email, password_hash, password_reset_token, password_reset_expires_at, role::text, is_deleted, created_at FROM users WHERE password_reset_token = @token AND password_reset_expires_at > NOW() AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("token", token);
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;
            return MapUser(reader);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> ClearPasswordResetTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "UPDATE users SET password_reset_token = NULL, password_reset_expires_at = NULL WHERE user_id = @user_id AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("user_id", userId);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }

    public async Task<int> UpdatePasswordHashAsync(Guid userId, string hash, CancellationToken cancellationToken = default)
    {
        var connection = await GetConnectionAsync(cancellationToken);
        var fromUow = _unitOfWork.GetConnection() != null;
        try
        {
            await using var cmd = new NpgsqlCommand(
                "UPDATE users SET password_hash = @hash WHERE user_id = @user_id AND is_deleted = FALSE", connection);
            if (_unitOfWork.GetTransaction() is NpgsqlTransaction trans)
                cmd.Transaction = trans;
            cmd.Parameters.AddWithValue("user_id", userId);
            cmd.Parameters.AddWithValue("hash", hash);
            return await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (!fromUow)
                await connection.DisposeAsync();
        }
    }
}
