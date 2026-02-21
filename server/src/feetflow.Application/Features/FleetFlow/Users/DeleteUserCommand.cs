using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Users;

public record DeleteUserCommand(Guid UserId) : IRequest<Result<Unit>>;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, Result<Unit>>
{
    private readonly IUserRepository _userRepository;

    public DeleteUserCommandHandler(IUserRepository userRepository) => _userRepository = userRepository;

    public async Task<Result<Unit>> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (user is null)
            return Result<Unit>.NotFound("User not found.");

        var rows = await _userRepository.SoftDeleteAsync(request.UserId, cancellationToken);
        if (rows == 0)
            return Result<Unit>.Failure("Failed to delete user.");

        return Result<Unit>.Success(Unit.Value);
    }
}
