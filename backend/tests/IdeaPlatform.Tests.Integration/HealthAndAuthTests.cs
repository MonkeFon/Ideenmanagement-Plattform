using System.Net.Http.Json;
using FluentAssertions;
using IdeaPlatform.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace IdeaPlatform.Tests.Integration;

/// <summary>WebApplicationFactory mit InMemory-DB für schnelle Integrationstests.</summary>
public class TestWebAppFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"itest_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = "InMemory",
                ["Jwt:Issuer"] = "test", ["Jwt:Audience"] = "test",
                ["Jwt:SigningKey"] = "this-is-a-long-enough-secret-key-1234567890",
                ["Seed:AdminEmail"] = "admin@test", ["Seed:AdminUserName"] = "admin",
                ["Seed:AdminPassword"] = "Admin#12345"
            });
        });
        builder.ConfigureServices(services =>
        {
            // DbContext-Registrierungen entfernen
            var toRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(AppDbContext)).ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        });
    }
}

public class HealthAndAuthTests : IClassFixture<TestWebAppFactory>
{
    private readonly TestWebAppFactory _factory;
    public HealthAndAuthTests(TestWebAppFactory factory) => _factory = factory;

    [Fact]
    public async Task Health_Returns_Healthy()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/health");
        res.EnsureSuccessStatusCode();
        (await res.Content.ReadAsStringAsync()).Should().Contain("Healthy");
    }

    [Fact]
    public async Task Admin_Can_Login_With_Seeded_Credentials()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/auth/login",
            new { emailOrUserName = "admin@test", password = "Admin#12345" });
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadFromJsonAsync<LoginResult>();
        json!.Data.AccessToken.Should().NotBeNullOrEmpty();
        json.Data.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_Then_Login_Works()
    {
        var client = _factory.CreateClient();
        var reg = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "bob@test", userName = "bob",
            password = "Strong#12345", firstName = "Bob", lastName = "Builder"
        });
        reg.EnsureSuccessStatusCode();

        var login = await client.PostAsJsonAsync("/api/auth/login",
            new { emailOrUserName = "bob", password = "Strong#12345" });
        login.EnsureSuccessStatusCode();
    }

    private record AuthData(string AccessToken, string RefreshToken, DateTime ExpiresAt);
    private record LoginResult(bool Success, AuthData Data);
}


