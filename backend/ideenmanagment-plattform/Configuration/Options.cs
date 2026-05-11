namespace IdeaPlatform.Configuration;

public class JwtOptions
{
    public string Issuer { get; set; } = default!;
    public string Audience { get; set; } = default!;
    public string SigningKey { get; set; } = default!;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
    public int ClockSkewSeconds { get; set; } = 30;
}

public class CorsOptions
{
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

public class FileStorageOptions
{
    public string RootPath { get; set; } = "uploads";
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;
    public string[] AllowedContentTypes { get; set; } = Array.Empty<string>();
}

public class SeedOptions
{
    public string AdminEmail { get; set; } = "admin@local";
    public string AdminUserName { get; set; } = "admin";
    public string AdminPassword { get; set; } = "Admin#12345";
}

