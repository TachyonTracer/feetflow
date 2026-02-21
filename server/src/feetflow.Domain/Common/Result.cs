namespace feetflow.Domain.Common;

public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private Result(T? value, bool isSuccess, string? error, int statusCode)
    {
        Value = value;
        IsSuccess = isSuccess;
        Error = error;
        StatusCode = statusCode;
    }

    public static Result<T> Success(T value)
        => new(value, true, null, 200);

    public static Result<T> Created(T value)
        => new(value, true, null, 201);

    public static Result<T> Failure(string error, int statusCode = 400)
        => new(default, false, error, statusCode);

    public static Result<T> NotFound(string error = "Resource not found")
        => new(default, false, error, 404);

    public static Result<T> Unauthorized(string error = "Unauthorized")
        => new(default, false, error, 401);
}
