using FluentAssertions;
using IdeaPlatform.Authentication;
using IdeaPlatform.Configuration;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using Xunit;

namespace IdeaPlatform.Tests.Unit;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _svc = new(Options.Create(new JwtOptions
    {
        Issuer = "test-iss", Audience = "test-aud",
        SigningKey = "this-is-a-long-enough-secret-key-1234567890",
        AccessTokenMinutes = 15, RefreshTokenDays = 7
    }));

    [Fact]
    public void GenerateAccessToken_ContainsExpectedClaims()
    {
        var userId = Guid.NewGuid();
        var (token, exp) = _svc.GenerateAccessToken(userId, "u@e.com", "user", new[] { "Mitarbeiter" }, new[] { "ideas.create" });
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Claims.Should().Contain(c => c.Type == "sub" && c.Value == userId.ToString());
        jwt.Claims.Should().Contain(c => c.Type == "perm" && c.Value == "ideas.create");
        exp.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public void GenerateRefreshToken_IsUnique_AndHashIsDeterministic()
    {
        var t1 = _svc.GenerateRefreshToken();
        var t2 = _svc.GenerateRefreshToken();
        t1.Should().NotBe(t2);
        _svc.HashRefreshToken(t1).Should().Be(_svc.HashRefreshToken(t1));
        _svc.HashRefreshToken(t1).Should().NotBe(_svc.HashRefreshToken(t2));
    }
}

public class PasswordHasherTests
{
    private readonly BcryptPasswordHasher _hasher = new();

    [Fact]
    public void Hash_And_Verify_RoundTrip()
    {
        var hash = _hasher.Hash("Sup3rSecret!");
        _hasher.Verify("Sup3rSecret!", hash).Should().BeTrue();
        _hasher.Verify("wrong", hash).Should().BeFalse();
    }
}

