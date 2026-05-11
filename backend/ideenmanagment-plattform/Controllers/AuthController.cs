using IdeaPlatform.Common.Responses;
using IdeaPlatform.DTOs;
using IdeaPlatform.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IdeaPlatform.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>Registriert einen neuen Mitarbeiter-Account.</summary>
    [HttpPost("register"), AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var user = await _auth.RegisterAsync(req, ct);
        return Created($"/api/users/{user.Id}", ApiResponse<UserResponse>.Ok(user, "User registered."));
    }

    /// <summary>Login mit Email oder UserName.</summary>
    [HttpPost("login"), AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), 200)]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var auth = await _auth.LoginAsync(req, ip, ct);
        return Ok(ApiResponse<AuthResponse>.Ok(auth));
    }

    /// <summary>Erneuert das Access-Token via RefreshToken.</summary>
    [HttpPost("refresh"), AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), 200)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var auth = await _auth.RefreshAsync(req.RefreshToken, ip, ct);
        return Ok(ApiResponse<AuthResponse>.Ok(auth));
    }

    /// <summary>Logout: widerruft das übergebene RefreshToken.</summary>
    [HttpPost("logout"), Authorize]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest req, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _auth.LogoutAsync(req.RefreshToken, ip, ct);
        return NoContent();
    }

    /// <summary>Ändert das eigene Passwort.</summary>
    [HttpPost("change-password"), Authorize]
    [ProducesResponseType(204)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, ICurrentUserService cu, CancellationToken ct)
    {
        var userId = cu.UserId!.Value;
        await _auth.ChangePasswordAsync(userId, req, ct);
        return NoContent();
    }

    /// <summary>Passwort vergessen – startet Reset-Flow.</summary>
    [HttpPost("forgot-password"), AllowAnonymous]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        await _auth.ForgotPasswordAsync(req, ct);
        return NoContent();
    }

    /// <summary>Passwort zurücksetzen via Reset-Token.</summary>
    [HttpPost("reset-password"), AllowAnonymous]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        await _auth.ResetPasswordAsync(req, ct);
        return NoContent();
    }
}

