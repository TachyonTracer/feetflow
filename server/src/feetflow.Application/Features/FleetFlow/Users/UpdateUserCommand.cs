using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Users;

public record UpdateUserCommand(Guid UserId, string FullName, UserRole Role) : IRequest<Result<UserDto>>;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Result<UserDto>>
{
    private readonly IUserRepository _userRepository;

    public UpdateUserCommandHandler(IUserRepository userRepository) => _userRepository = userRepository;

    public async Task<Result<UserDto>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null)
            return Result<UserDto>.NotFound("User not found.");

        user.FullName = request.FullName;
        user.Role = request.Role;

        var rows = await _userRepository.UpdateAsync(user, cancellationToken);
        if (rows == 0)
            return Result<UserDto>.Failure("Failed to update user.");

        return Result<UserDto>.Success(new UserDto(user.Id, user.FullName, user.Email, user.Role, user.CreatedAt));
    }
}
