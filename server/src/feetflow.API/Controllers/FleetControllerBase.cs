using Microsoft.AspNetCore.Mvc;
using feetflow.API.Models;
using feetflow.Domain.Common;

namespace feetflow.API.Controllers;

/// <summary>
/// Shared base for all fleet API controllers.
/// Provides a standardized ToActionResult that always returns ApiResponse&lt;T&gt;
/// so the ApiResponseWrapperFilter will skip re-wrapping and every error
/// response is guaranteed to match the shape the frontend expects:
///
///   { status, errorMessage, result, timestamp }
/// </summary>
public abstract class FleetControllerBase : ControllerBase
{
    protected IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
            return result.StatusCode == 201
                ? StatusCode(201, ApiResponse<T>.Success(result.Value!, 201))
                : Ok(ApiResponse<T>.Success(result.Value!));

        return StatusCode(
            result.StatusCode,
            ApiResponse<object>.Fail(result.Error ?? "An error occurred.", result.StatusCode));
    }

    protected IActionResult CreatedResult<T>(Result<T> result, string actionName)
    {
        if (!result.IsSuccess)
            return StatusCode(
                result.StatusCode,
                ApiResponse<object>.Fail(result.Error ?? "An error occurred.", result.StatusCode));

        return CreatedAtAction(
            actionName,
            new { id = (result.Value as dynamic)?.Id },
            ApiResponse<T>.Success(result.Value!, 201));
    }
}
