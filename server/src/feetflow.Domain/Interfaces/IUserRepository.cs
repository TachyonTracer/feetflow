using feetflow.Domain.Entities;

namespace feetflow.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<User>> GetAllAsync(bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(User user, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<int> UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task<int> SoftDeleteAsync(Guid id, CancellationToken cancellationToken = default);

    // password reset helpers
    Task<int> SetPasswordResetTokenAsync(Guid userId, Guid token, DateTime expiresAt, CancellationToken cancellationToken = default);
    Task<User?> GetByResetTokenAsync(Guid token, CancellationToken cancellationToken = default);
    Task<int> ClearPasswordResetTokenAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> UpdatePasswordHashAsync(Guid userId, string hash, CancellationToken cancellationToken = default);
}
