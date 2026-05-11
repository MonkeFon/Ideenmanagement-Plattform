using IdeaPlatform.Authentication;
using IdeaPlatform.Configuration;
using IdeaPlatform.Data;
using IdeaPlatform.Data.Seed;
using IdeaPlatform.Extensions;
using IdeaPlatform.Middleware;
using IdeaPlatform.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ---------- Serilog ----------
builder.Host.UseSerilog((ctx, services, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// ---------- Services ----------
builder.Services
    .AddAppOptions(builder.Configuration)
    .AddAppPersistence(builder.Configuration)
    .AddAppRepositories()
    .AddAppServices()
    .AddAppAuth(builder.Configuration)
    .AddAppCors(builder.Configuration)
    .AddAppRateLimiting()
    .AddAppSwagger()
    .AddAppControllers();

builder.Services.AddHealthChecks();

var app = builder.Build();

// ---------- Migration + Seed ----------
using (var scope = app.Services.CreateScope())
{
    var sp = scope.ServiceProvider;
    var db = sp.GetRequiredService<AppDbContext>();
    var logger = sp.GetRequiredService<ILogger<Program>>();
    try
    {
        if ((await db.Database.GetPendingMigrationsAsync()).Any())
            await db.Database.MigrateAsync();
        else
            await db.Database.EnsureCreatedAsync();

        var hasher = sp.GetRequiredService<IPasswordHasher>();
        var seed = sp.GetRequiredService<IOptions<SeedOptions>>().Value;
        await SeedData.RunAsync(db, hasher, seed);
        logger.LogInformation("Database migrated and seeded.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize database.");
        throw;
    }
}

// ---------- Pipeline ----------
app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ideenmanagement-Plattform API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("DefaultCors");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<RequestEnrichmentMiddleware>();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.Run();

/// <summary>Markerklasse für Integration-Tests (WebApplicationFactory&lt;Program&gt;).</summary>
public partial class Program { }
