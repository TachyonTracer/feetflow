namespace feetflow.API.Models;

public class ApiResponse<T>
{
    public int Status { get; init; }
    public string? ErrorMessage { get; init; }
    public T? Result { get; init; }
    public string Timestamp { get; init; } = DateTime.UtcNow.ToString("o");

    public static ApiResponse<T> Success(T data, int statusCode = 200) => new()
    {
        Status = statusCode,
        ErrorMessage = null,
        Result = data
    };

    public static ApiResponse<T> Fail(string message, int statusCode = 400) => new()
    {
        Status = statusCode,
        ErrorMessage = message,
        Result = default
    };
}

public static class ApiResponse
{
    public static ApiResponse<T> Success<T>(T data, int statusCode = 200)
        => ApiResponse<T>.Success(data, statusCode);

    public static ApiResponse<object> Fail(string message, int statusCode = 400)
        => ApiResponse<object>.Fail(message, statusCode);
}
