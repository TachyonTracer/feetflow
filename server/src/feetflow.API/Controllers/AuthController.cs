using System.IdentityModel.Tokens.Jwt;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.API.Auth;
using feetflow.Application.Features.FleetFlow.Auth;

namespace feetflow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IMediator mediator, TokenService tokenService, ILogger<AuthController> logger)
    {
        _mediator = mediator;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("signup")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new RegisterCommand(
            request.FullName,
            request.Email,
            request.Password,
            request.Role), cancellationToken);

        if (!result.IsSuccess)
            return StatusCode(result.StatusCode, result.Error);

        _logger.LogInformation("User registered: {Email}", request.Email);
        return StatusCode(StatusCodes.Status201Created, new { id = result.Value });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new LoginCommand(request.Email, request.Password), cancellationToken);

        if (!result.IsSuccess)
            return StatusCode(result.StatusCode, result.Error);

        var login = result.Value!;
        var accessToken = _tokenService.GenerateAccessToken(
            login.UserId.ToString(),
            login.Email,
            new[] { login.Role });
        var refreshToken = _tokenService.GenerateRefreshToken();

        _logger.LogInformation("User {Email} logged in", login.Email);

        return Ok(new
        {
            accessToken,
            refreshToken,
            expiresIn = 900
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public IActionResult Refresh([FromBody] RefreshRequest request)
    {
        var principal = _tokenService.ValidateToken(request.AccessToken);
        if (principal is null)
            return Unauthorized("Invalid token");

        var email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value ?? "";
        var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "";
        var role = principal.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Manager";

        var newAccessToken = _tokenService.GenerateAccessToken(userId, email, new[] { role });
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        return Ok(new
        {
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            expiresIn = 900
        });
    }
}

public record RegisterRequest(string FullName, string Email, string Password, feetflow.Domain.Enums.UserRole Role);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string AccessToken, string RefreshToken);
