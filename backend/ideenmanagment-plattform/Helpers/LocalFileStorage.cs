using IdeaPlatform.Configuration;
using IdeaPlatform.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace IdeaPlatform.Helpers;

public class LocalFileStorage : IFileStorage
{
    private readonly string _root;

    public LocalFileStorage(IOptions<FileStorageOptions> opts, IWebHostEnvironment env)
    {
        _root = Path.IsPathRooted(opts.Value.RootPath)
            ? opts.Value.RootPath
            : Path.Combine(env.ContentRootPath, opts.Value.RootPath);
        Directory.CreateDirectory(_root);
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, CancellationToken ct = default)
    {
        var safe = Path.GetFileName(fileName);
        var sub = DateTime.UtcNow.ToString("yyyy/MM");
        var dir = Path.Combine(_root, sub);
        Directory.CreateDirectory(dir);
        var unique = $"{Guid.NewGuid():N}_{safe}";
        var rel = Path.Combine(sub, unique).Replace('\\', '/');
        var full = Path.Combine(_root, rel);
        await using var fs = File.Create(full);
        await stream.CopyToAsync(fs, ct);
        return rel;
    }

    public Task<Stream> OpenReadAsync(string relativePath, CancellationToken ct = default)
    {
        var full = ResolveSafe(relativePath);
        Stream s = File.OpenRead(full);
        return Task.FromResult(s);
    }

    public Task DeleteAsync(string relativePath, CancellationToken ct = default)
    {
        var full = ResolveSafe(relativePath);
        if (File.Exists(full)) File.Delete(full);
        return Task.CompletedTask;
    }

    public bool Exists(string relativePath) => File.Exists(ResolveSafe(relativePath));

    private string ResolveSafe(string relativePath)
    {
        var full = Path.GetFullPath(Path.Combine(_root, relativePath));
        if (!full.StartsWith(Path.GetFullPath(_root), StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Invalid path");
        return full;
    }
}

