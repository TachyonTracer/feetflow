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
                "SELECT user_id, full_name, email, password_hash, role::text, is_deleted, created_at FROM users WHERE user_id = @user_id AND is_deleted = FALSE", connection);
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
                "SELECT user_id, full_name, email, password_hash, role::text, is_deleted, created_at FROM users WHERE email = @email AND is_deleted = FALSE", connection);
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

    private static User MapUser(NpgsqlDataReader reader)
    {
        return new User
        {
            Id = reader.GetGuid(0),
            FullName = reader.GetString(1),
            Email = reader.GetString(2),
            PasswordHash = reader.GetString(3),
            Role = FleetFlowEnumMapper.ToUserRole(reader.GetString(4)),
            IsDeleted = reader.GetBoolean(5),
            CreatedAt = reader.GetDateTime(6)
        };
    }
}
