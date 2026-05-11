namespace IdeaPlatform.Common.Pagination;

public class PageQuery
{
    private int _pageSize = 20;
    private int _page = 1;
    public int Page { get => _page; set => _page = value < 1 ? 1 : value; }
    public int PageSize { get => _pageSize; set => _pageSize = value < 1 ? 1 : (value > 100 ? 100 : value); }
    public string? SortBy { get; set; }
    public string? SortDir { get; set; } // asc | desc
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public long Total { get; init; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;

    public static PagedResult<T> Create(IReadOnlyList<T> items, int page, int pageSize, long total) =>
        new() { Items = items, Page = page, PageSize = pageSize, Total = total };
}

