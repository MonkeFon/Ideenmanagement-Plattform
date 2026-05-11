using System.Security.Claims;
using IdeaPlatform.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace IdeaPlatform.Authentication;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _ctx;
    public CurrentUserService(IHttpContextAccessor ctx) => _ctx = ctx;

    private ClaimsPrincipal? User => _ctx.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var v = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return Guid.TryParse(v, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public IReadOnlyList<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? new List<string>();

    public IReadOnlyList<string> Permissions =>
        User?.FindAll("perm").Select(c => c.Value).ToList() ?? new List<string>();

    public string? IpAddress => _ctx.HttpContext?.Connection.RemoteIpAddress?.ToString();
    public string? UserAgent => _ctx.HttpContext?.Request.Headers.UserAgent.ToString();

    public bool HasPermission(string permission) => Permissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
    public bool IsInRole(string role) => Roles.Contains(role, StringComparer.OrdinalIgnoreCase);
}

public class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}

public class BcryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password) => BCrypt.Net.BCrypt.EnhancedHashPassword(password, 11);
    public bool Verify(string password, string hash)
    {
        try { return BCrypt.Net.BCrypt.EnhancedVerify(password, hash); }
        catch { return false; }
    }
}

