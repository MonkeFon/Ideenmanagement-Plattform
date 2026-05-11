namespace IdeaPlatform.Services.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<string> Permissions { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }
    bool HasPermission(string permission);
    bool IsInRole(string role);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IJwtTokenService
{
    (string accessToken, DateTime expiresAt) GenerateAccessToken(
        Guid userId, string email, string userName, IEnumerable<string> roles, IEnumerable<string> permissions);
    string GenerateRefreshToken();
    string HashRefreshToken(string token);
}

public interface IFileStorage
{
    Task<string> SaveAsync(Stream stream, string fileName, CancellationToken ct = default);
    Task<Stream> OpenReadAsync(string relativePath, CancellationToken ct = default);
    Task DeleteAsync(string relativePath, CancellationToken ct = default);
    bool Exists(string relativePath);
}

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}

