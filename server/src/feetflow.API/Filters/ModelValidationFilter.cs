using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using feetflow.API.Models;

namespace feetflow.API.Filters;

public class ModelValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.ModelState.IsValid)
            return;

        var errors = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                e => ToCamelCase(e.Key),
                e => e.Value!.Errors.Select(err => err.ErrorMessage).ToArray());

        var response = new ApiResponse<object>
        {
            Status = StatusCodes.Status400BadRequest,
            ErrorMessage = "Validation failed",
            Result = errors
        };

        context.Result = new ObjectResult(response)
        {
            StatusCode = StatusCodes.Status400BadRequest
        };
    }

    public void OnActionExecuted(ActionExecutedContext context) { }

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name) || char.IsLower(name[0]))
            return name;
        return char.ToLowerInvariant(name[0]) + name[1..];
    }
}
