using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace IdeaPlatform.Data;

/// <summary>Design-Time Factory für `dotnet ef`-Befehle.</summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var conn = config.GetConnectionString("Default")
                   ?? "Host=localhost;Port=5432;Database=ideaplatform;Username=ideaplatform;Password=ideaplatform";

        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(conn, npg => npg.MigrationsHistoryTable("__ef_migrations_history"))
            .Options;

        return new AppDbContext(opts);
    }
}

