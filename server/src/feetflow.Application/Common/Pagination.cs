namespace feetflow.Application.Common;

/// <summary>
/// Standard pagination request. Use PaginationHelper.Normalize before passing to repositories.
/// </summary>
public class PaginationRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

/// <summary>
/// Standard paged response. TotalPages is computed.
/// </summary>
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public static class PaginationHelper
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 10;

    /// <summary>
    /// Normalize page number and page size: cap pageSize at 100, default to 10 if invalid.
    /// Does NOT fail the request.
    /// </summary>
    public static (int PageNumber, int PageSize) Normalize(int pageNumber, int pageSize)
    {
        var page = pageNumber < 1 ? 1 : pageNumber;
        var size = pageSize <= 0 ? DefaultPageSize : (pageSize > MaxPageSize ? MaxPageSize : pageSize);
        return (page, size);
    }
}
