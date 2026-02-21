using System.Text.Json;
using FluentValidation;
using feetflow.API.Models;
using Npgsql;

namespace feetflow.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning("Validation failed: {PropertyNames}",
                string.Join(", ", ex.Errors.Select(e => e.PropertyName)));

            var errors = ex.Errors
                .GroupBy(e => ToCamelCase(e.PropertyName))
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.ErrorMessage).Distinct().ToArray());

            await WriteResponse(context, StatusCodes.Status400BadRequest, "Validation failed", errors);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access: {Message}", ex.Message);
            await WriteResponse(context, StatusCodes.Status401Unauthorized, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning("Resource not found: {Message}", ex.Message);
            await WriteResponse(context, StatusCodes.Status404NotFound, ex.Message);
        }
        catch (PostgresException ex)
        {
            if (ex.SqlState == PostgresErrorCodes.UniqueViolation)
            {
                _logger.LogWarning("Database unique constraint violation: {ConstraintName}", ex.ConstraintName);
                await WriteResponse(context, StatusCodes.Status409Conflict, MapUniqueConstraintMessage(ex.ConstraintName));
                return;
            }

            _logger.LogError(ex, "Database exception with SQL state {SqlState}", ex.SqlState);
            await WriteResponse(context, StatusCodes.Status500InternalServerError, "A database error occurred.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            var message = _env.IsDevelopment() ? ex.Message : "An unexpected error occurred.";
            await WriteResponse(context, StatusCodes.Status500InternalServerError, message);
        }
    }

    private static async Task WriteResponse(HttpContext context, int statusCode, string errorMessage, object? result = null)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new ApiResponse<object>
        {
            Status = statusCode,
            ErrorMessage = errorMessage,
            Result = result
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name) || char.IsLower(name[0]))
            return name;
        return char.ToLowerInvariant(name[0]) + name[1..];
    }

    private static string MapUniqueConstraintMessage(string? constraintName)
    {
        return constraintName switch
        {
            "vehicles_license_plate_key" => "A vehicle with this license plate already exists.",
            _ => "Duplicate value violates a uniqueness constraint."
        };
    }
}
