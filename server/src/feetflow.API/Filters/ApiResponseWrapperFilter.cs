using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using feetflow.API.Models;

namespace feetflow.API.Filters;

public class ApiResponseWrapperFilter : IResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult objectResult)
        {
            if (IsApiResponse(objectResult.Value))
                return;

            var statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;

            string errorMessage = "An error occurred.";
            if (objectResult.Value is ValidationProblemDetails vpd && vpd.Errors.Any())
            {
                errorMessage = string.Join("; ", vpd.Errors.SelectMany(kvp => kvp.Value));
            }
            else if (objectResult.Value is ProblemDetails pd)
            {
                errorMessage = pd.Detail ?? pd.Title ?? "An error occurred.";
            }
            else if (objectResult.Value != null)
            {
                errorMessage = objectResult.Value.ToString() ?? "An error occurred.";
            }

            objectResult.Value = statusCode is >= 200 and < 300
                ? ApiResponse.Success<object>(objectResult.Value!, statusCode)
                : ApiResponse.Fail(errorMessage, statusCode);

            objectResult.StatusCode = statusCode;
        }
        else if (context.Result is StatusCodeResult statusCodeResult)
        {
            var statusCode = statusCodeResult.StatusCode;

            object wrapped = statusCode is >= 200 and < 300
                ? ApiResponse.Success<object>(null!, statusCode)
                : ApiResponse.Fail("An error occurred.", statusCode);

            context.Result = new ObjectResult(wrapped) { StatusCode = statusCode };
        }
    }

    public void OnResultExecuted(ResultExecutedContext context) { }

    private static bool IsApiResponse(object? value)
    {
        if (value is null) return false;
        var type = value.GetType();
        return type.IsGenericType && type.GetGenericTypeDefinition() == typeof(ApiResponse<>);
    }
}
