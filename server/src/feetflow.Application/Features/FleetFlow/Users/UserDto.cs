using feetflow.Domain.Enums;

namespace feetflow.Application.Features.FleetFlow.Users;

public record UserDto(
    Guid UserId,
    string FullName,
    string Email,
    UserRole Role,
    DateTime CreatedAt);
