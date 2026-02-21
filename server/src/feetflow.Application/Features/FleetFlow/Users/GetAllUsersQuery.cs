using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Users;

public record GetAllUsersQuery(bool IncludeDeleted = false) : IRequest<Result<IReadOnlyList<UserDto>>>;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, Result<IReadOnlyList<UserDto>>>
{
    private readonly IUserRepository _userRepository;

    public GetAllUsersQueryHandler(IUserRepository userRepository) => _userRepository = userRepository;

    public async Task<Result<IReadOnlyList<UserDto>>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(request.IncludeDeleted, cancellationToken);

        var dtos = users.Select(u => new UserDto(u.Id, u.FullName, u.Email, u.Role, u.CreatedAt)).ToList();

        return Result<IReadOnlyList<UserDto>>.Success(dtos);
    }
}
