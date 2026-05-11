using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using IdeaPlatform.Authentication;
using IdeaPlatform.Authorization;
using IdeaPlatform.Configuration;
using IdeaPlatform.Data;
using IdeaPlatform.Data.Interceptors;
using IdeaPlatform.Mapping;
using IdeaPlatform.Repositories;
using IdeaPlatform.Repositories.Interfaces;
using IdeaPlatform.Services;
using IdeaPlatform.Services.Interfaces;
using IdeaPlatform.Validators;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace IdeaPlatform.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppOptions(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<JwtOptions>(config.GetSection("Jwt"));
        services.Configure<CorsOptions>(config.GetSection("Cors"));
        services.Configure<FileStorageOptions>(config.GetSection("FileStorage"));
        services.Configure<SeedOptions>(config.GetSection("Seed"));
        return services;
    }

    public static IServiceCollection AddAppPersistence(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<AuditingInterceptor>();
        services.AddDbContext<AppDbContext>((sp, opts) =>
        {
            opts.UseNpgsql(config.GetConnectionString("Default"),
                npg => npg.MigrationsHistoryTable("__ef_migrations_history"));
            opts.AddInterceptors(sp.GetRequiredService<AuditingInterceptor>());
        });
        return services;
    }

    public static IServiceCollection AddAppRepositories(this IServiceCollection services)
    {
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IIdeaCategoryRepository, IdeaCategoryRepository>();
        services.AddScoped<IIdeaRepository, IdeaRepository>();
        services.AddScoped<IIdeaCommentRepository, IdeaCommentRepository>();
        services.AddScoped<IIdeaVoteRepository, IdeaVoteRepository>();
        services.AddScoped<IAttachmentRepository, AttachmentRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        return services;
    }

    public static IServiceCollection AddAppServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IFileStorage, Helpers.LocalFileStorage>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IIdeaService, IdeaService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IVoteService, VoteService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddScoped<IModerationService, ModerationService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IAuditLogService, AuditLogService>();

        services.AddAutoMapper(typeof(MappingProfile).Assembly);
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        return services;
    }

    public static IServiceCollection AddAppAuth(this IServiceCollection services, IConfiguration config)
    {
        var jwt = config.GetSection("Jwt").Get<JwtOptions>()!;
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.RequireHttpsMetadata = false; // in Prod via Proxy/HSTS sicherstellen
                o.SaveToken = true;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    ClockSkew = TimeSpan.FromSeconds(jwt.ClockSkewSeconds),
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                    NameClaimType = System.Security.Claims.ClaimTypes.Name
                };
            });

        services.AddAuthorization();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
        return services;
    }

    public static IServiceCollection AddAppCors(this IServiceCollection services, IConfiguration config)
    {
        var cors = config.GetSection("Cors").Get<CorsOptions>() ?? new CorsOptions();
        services.AddCors(o => o.AddPolicy("DefaultCors", p =>
        {
            if (cors.AllowedOrigins.Length == 0) p.AllowAnyOrigin();
            else p.WithOrigins(cors.AllowedOrigins).AllowCredentials();
            p.AllowAnyHeader().AllowAnyMethod();
        }));
        return services;
    }

    public static IServiceCollection AddAppRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.User.Identity?.Name ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 200,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
            o.AddPolicy("auth", ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
        });
        return services;
    }

    public static IServiceCollection AddAppSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Ideenmanagement-Plattform API",
                Version = "v1",
                Description = "Interne Ideenmanagement-Plattform – REST API"
            });

            var jwtScheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT-Access-Token eintragen (ohne 'Bearer '-Präfix)"
            };
            c.AddSecurityDefinition("Bearer", jwtScheme);
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }]
                    = Array.Empty<string>()
            });

            var xml = Path.Combine(AppContext.BaseDirectory, $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml");
            if (File.Exists(xml)) c.IncludeXmlComments(xml);
        });
        return services;
    }

    public static IServiceCollection AddAppControllers(this IServiceCollection services)
    {
        services.AddControllers()
            .ConfigureApiBehaviorOptions(o =>
            {
                o.InvalidModelStateResponseFactory = ctx =>
                {
                    var errors = ctx.ModelState
                        .Where(kvp => kvp.Value!.Errors.Count > 0)
                        .ToDictionary(
                            kvp => char.ToLowerInvariant(kvp.Key[0]) + kvp.Key[1..],
                            kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());
                    var problem = new ValidationProblemDetails(errors!)
                    {
                        Title = "Validation failed",
                        Status = StatusCodes.Status400BadRequest
                    };
                    return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
                };
            })
            .AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            });
        return services;
    }
}


