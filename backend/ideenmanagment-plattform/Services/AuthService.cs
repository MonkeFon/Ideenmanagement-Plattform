using AutoMapper;
using IdeaPlatform.Authorization;
using IdeaPlatform.Common.Exceptions;
using IdeaPlatform.Configuration;
using IdeaPlatform.Data;
using IdeaPlatform.Domain.Entities;
using IdeaPlatform.Domain.Enums;
using IdeaPlatform.DTOs;
using IdeaPlatform.Repositories.Interfaces;
using IdeaPlatform.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IdeaPlatform.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IRoleRepository _roles;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly JwtOptions _jwtOpts;
    private readonly IAuditLogService _audit;
    private readonly ICurrentUserService _currentUser;
    private readonly AppDbContext _db;

    public AuthService(IUserRepository users, IRoleRepository roles, IRefreshTokenRepository refreshTokens,
        IPasswordHasher hasher, IJwtTokenService jwt, IUnitOfWork uow, IMapper mapper,
        IOptions<JwtOptions> jwtOpts, IAuditLogService audit, ICurrentUserService currentUser, AppDbContext db)
    {
        _users = users; _roles = roles; _refreshTokens = refreshTokens;
        _hasher = hasher; _jwt = jwt; _uow = uow; _mapper = mapper;
        _jwtOpts = jwtOpts.Value; _audit = audit; _currentUser = currentUser; _db = db;
    }

    public async Task<UserResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await _users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower(), ct))
            throw new ConflictException("Email is already in use.");
        if (await _users.AnyAsync(u => u.UserName.ToLower() == req.UserName.ToLower(), ct))
            throw new ConflictException("Username is already in use.");

        var user = new User
        {
            Email = req.Email.Trim(),
            UserName = req.UserName.Trim(),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            PasswordHash = _hasher.Hash(req.Password),
            IsActive = true
        };

        // Default role Mitarbeiter
        var role = await _roles.GetByNameAsync(RoleNames.Mitarbeiter, ct)
                   ?? throw new InvalidOperationException("Default role not seeded.");
        user.UserRoles.Add(new UserRole { Role = role, AssignedAt = DateTime.UtcNow });

        await _users.AddAsync(user, ct);
        await _uow.SaveChangesAsync(ct);
        await _audit.LogAsync(AuditAction.Create, nameof(User), user.Id.ToString(), null, new { user.Email, user.UserName }, ct);
        await _uow.SaveChangesAsync(ct);

        var loaded = await _users.GetWithRolesAsync(user.Id, ct);
        return _mapper.Map<UserResponse>(loaded!);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, string? ip, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == req.EmailOrUserName.ToLower()
                                   || u.UserName.ToLower() == req.EmailOrUserName.ToLower(), ct);

        if (user is null || !_hasher.Verify(req.Password, user.PasswordHash))
        {
            await _audit.LogAsync(AuditAction.LoginFailed, nameof(User), req.EmailOrUserName, null, null, ct);
            await _uow.SaveChangesAsync(ct);
            throw new UnauthorizedException("Invalid credentials.");
        }
        if (!user.IsActive) throw new ForbiddenException("Account is disabled.");

        user.LastLoginAt = DateTime.UtcNow;
        var auth = await IssueTokensAsync(user, ip, ct);
        await _audit.LogAsync(AuditAction.Login, nameof(User), user.Id.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
        return auth;
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, string? ip, CancellationToken ct = default)
    {
        var hash = _jwt.HashRefreshToken(refreshToken);
        var stored = await _refreshTokens.GetByHashAsync(hash, ct)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (!stored.IsActive)
        {
            // Token-Reuse-Detection: revoke all
            await _refreshTokens.RevokeAllForUserAsync(stored.UserId, ip, ct);
            await _uow.SaveChangesAsync(ct);
            throw new UnauthorizedException("Refresh token is no longer valid.");
        }

        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == stored.UserId, ct)
            ?? throw new UnauthorizedException();

        // rotate
        stored.RevokedAt = DateTime.UtcNow;
        stored.RevokedByIp = ip;
        var auth = await IssueTokensAsync(user, ip, ct, replacedFor: stored);
        await _uow.SaveChangesAsync(ct);
        return auth;
    }

    public async Task LogoutAsync(string refreshToken, string? ip, CancellationToken ct = default)
    {
        var hash = _jwt.HashRefreshToken(refreshToken);
        var stored = await _refreshTokens.GetByHashAsync(hash, ct);
        if (stored is null || !stored.IsActive) return;
        stored.RevokedAt = DateTime.UtcNow;
        stored.RevokedByIp = ip;
        await _audit.LogAsync(AuditAction.Logout, nameof(User), stored.UserId.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest req, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct) ?? throw new NotFoundException(nameof(User), userId);
        if (!_hasher.Verify(req.CurrentPassword, user.PasswordHash))
            throw new ValidationException("currentPassword", "Current password is incorrect.");
        user.PasswordHash = _hasher.Hash(req.NewPassword);
        await _refreshTokens.RevokeAllForUserAsync(userId, _currentUser.IpAddress, ct);
        await _audit.LogAsync(AuditAction.PasswordChanged, nameof(User), userId.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public Task ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct = default)
    {
        // Stub: in production trigger email with reset token. Stays generic to not leak existence.
        return Task.CompletedTask;
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct = default)
    {
        // Demo-Implementierung: nicht produktionsreif – Token-Persistierung ausgelagert.
        var user = await _users.GetByEmailAsync(req.Email, ct) ?? throw new NotFoundException(nameof(User), req.Email);
        if (string.IsNullOrWhiteSpace(req.Token))
            throw new ValidationException("token", "Token required.");
        user.PasswordHash = _hasher.Hash(req.NewPassword);
        await _refreshTokens.RevokeAllForUserAsync(user.Id, _currentUser.IpAddress, ct);
        await _audit.LogAsync(AuditAction.PasswordChanged, nameof(User), user.Id.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, string? ip, CancellationToken ct, RefreshToken? replacedFor = null)
    {
        var roleNames = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions.Select(rp => rp.Permission.Code))
            .Distinct().ToList();

        var (access, exp) = _jwt.GenerateAccessToken(user.Id, user.Email, user.UserName, roleNames, permissions);
        var refresh = _jwt.GenerateRefreshToken();
        var refreshHash = _jwt.HashRefreshToken(refresh);

        var rt = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtOpts.RefreshTokenDays),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ip
        };
        await _refreshTokens.AddAsync(rt, ct);
        if (replacedFor != null) replacedFor.ReplacedByTokenHash = refreshHash;

        var userDto = _mapper.Map<UserResponse>(user);
        return new AuthResponse(access, refresh, exp, userDto);
    }
}

