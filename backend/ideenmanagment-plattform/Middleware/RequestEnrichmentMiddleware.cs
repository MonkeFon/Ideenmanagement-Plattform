using System.Diagnostics;
using IdeaPlatform.Services.Interfaces;
using Serilog.Context;

namespace IdeaPlatform.Middleware;

/// <summary>Reichert jede Anfrage mit Kontext (UserId, IP, TraceId) für Serilog an.</summary>
public class RequestEnrichmentMiddleware
{
    private readonly RequestDelegate _next;
    public RequestEnrichmentMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext ctx, ICurrentUserService current)
    {
        using (LogContext.PushProperty("UserId", current.UserId?.ToString() ?? "anonymous"))
        using (LogContext.PushProperty("IpAddress", ctx.Connection.RemoteIpAddress?.ToString()))
        using (LogContext.PushProperty("TraceId", ctx.TraceIdentifier))
        {
            var sw = Stopwatch.StartNew();
            await _next(ctx);
            sw.Stop();
            ctx.Response.Headers["X-Response-Time-Ms"] = sw.ElapsedMilliseconds.ToString();
        }
    }
}

