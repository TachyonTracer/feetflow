using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;
using feetflow.API.Auth;

namespace feetflow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(TokenService tokenService, ILogger<AuthController> logger)
    {
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // TODO: Replace with actual user validation against your data store
        // This is a placeholder for the template
        if (request.Email == "admin@feetflow.com" && request.Password == "admin")
        {
            var accessToken = _tokenService.GenerateAccessToken(
                userId: Guid.NewGuid().ToString(),
                email: request.Email,
                roles: ["Admin"]);

            var refreshToken = _tokenService.GenerateRefreshToken();

            _logger.LogInformation("User {Email} logged in", request.Email);

            return Ok(new
            {
                accessToken,
                refreshToken,
                expiresIn = 900 // 15 minutes in seconds
            });
        }

        return Unauthorized(new { message = "Invalid credentials" });
    }

    [HttpPost("refresh")]
    public IActionResult Refresh([FromBody] RefreshRequest request)
    {
        var principal = _tokenService.ValidateToken(request.AccessToken);
        if (principal is null)
            return Unauthorized(new { message = "Invalid token" });

        // TODO: Validate refresh token against stored tokens in data store
        var email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value ?? "";
        var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "";

        var newAccessToken = _tokenService.GenerateAccessToken(userId, email);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        return Ok(new
        {
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            expiresIn = 900
        });
    }
}

public record LoginRequest(string Email, string Password);
public record RefreshRequest(string AccessToken, string RefreshToken);
