using Microsoft.Extensions.Logging;

namespace feetflow.Application.Helpers;

public class GlobalHelper
{
    private readonly ILogger<GlobalHelper> _logger;

    public GlobalHelper(ILogger<GlobalHelper> logger)
    {
        _logger = logger;
    }

    public string FormatError(Exception ex, string? context = null)
    {
        var message = context != null
            ? $"[{context}] {ex.Message}"
            : ex.Message;

        _logger.LogError(ex, "Error: {Message}", message);
        return message;
    }

    public string FormatValidationErrors(IDictionary<string, string[]> errors)
    {
        var messages = errors.SelectMany(e => e.Value.Select(v => $"{e.Key}: {v}"));
        return string.Join("; ", messages);
    }

    public void LogRequest(string method, string path, int statusCode, long elapsedMs)
    {
        _logger.LogInformation(
            "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
            method, path, statusCode, elapsedMs);
    }

    public void LogQuery(string query, long elapsedMs)
    {
        _logger.LogInformation("SQL Query executed in {ElapsedMs}ms: {Query}", elapsedMs, query);
    }

    public static string Slugify(string text)
    {
        return text
            .ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("_", "-");
    }

    public static string GenerateCorrelationId()
    {
        return $"{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8]}";
    }
}
