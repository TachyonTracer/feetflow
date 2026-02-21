using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Enums;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Auth;

public record LoginCommand(string Email, string Password, UserRole Role) : IRequest<Result<LoginResult>>;

public record LoginResult(Guid UserId, string Email, string Role);

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
        RuleFor(x => x.Role).IsInEnum();
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginResult>>
{
    private readonly Domain.Interfaces.IUserRepository _userRepository;

    public LoginCommandHandler(Domain.Interfaces.IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<LoginResult>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user == null)
            return Result<LoginResult>.Unauthorized("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result<LoginResult>.Unauthorized("Invalid email or password.");

        if (user.Role != request.Role)
            return Result<LoginResult>.Unauthorized("Selected role does not match this account.");

        return Result<LoginResult>.Success(new LoginResult(user.Id, user.Email, user.Role.ToString()));
    }
}
