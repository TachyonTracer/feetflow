using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Auth;

public record ForgotPasswordCommand(string Email) : IRequest<Result<Unit>>;

public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.");
    }
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<Unit>>
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<ForgotPasswordCommandHandler> _logger;

    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(IUserRepository userRepository, ILogger<ForgotPasswordCommandHandler> logger, IEmailService emailService)
    {
        _userRepository = userRepository;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<Result<Unit>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user == null)
        {
            // Do not disclose that email does not exist; still return success
            _logger.LogInformation("Password reset requested for unknown email {Email}", request.Email);
            return Result<Unit>.Success(Unit.Value);
        }

        var token = Guid.NewGuid();
        var expires = DateTime.UtcNow.AddHours(1);
        await _userRepository.SetPasswordResetTokenAsync(user.Id, token, expires, cancellationToken);

        // Send email containing reset link with token
        var resetLink = $"http://localhost:4200/auth/resetpassword?token={token}";
        var body = $@"
            <h2>FleetFlow Password Reset</h2>
            <p>You recently requested to reset your password for your FleetFlow account.</p>
            <p>Click the link below to reset it:</p>
            <p><a href='{resetLink}'>{resetLink}</a></p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <br>
            <p>Thanks,</p>
            <p>The FleetFlow Team</p>
        ";

        await _emailService.SendEmailAsync(request.Email, "Reset Your FleetFlow Password", body, cancellationToken);
        _logger.LogInformation("Generated and sent password reset token for {Email}: {Token}", request.Email, token);

        return Result<Unit>.Success(Unit.Value);
    }
}