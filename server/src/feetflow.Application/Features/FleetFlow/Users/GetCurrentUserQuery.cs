using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Users;

public record GetCurrentUserQuery(Guid UserId) : IRequest<Result<UserDto>>;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<UserDto>>
{
    private readonly IUserRepository _userRepository;

    public GetCurrentUserQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<UserDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

        if (user is null)
            return Result<UserDto>.NotFound("User not found.");

        var dto = new UserDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.CreatedAt);

        return Result<UserDto>.Success(dto);
    }
}
