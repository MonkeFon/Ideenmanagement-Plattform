using System.Text.Json;
using IdeaPlatform.Common.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace IdeaPlatform.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IWebHostEnvironment env)
    { _next = next; _logger = logger; _env = env; }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await _next(ctx); }
        catch (Exception ex) { await HandleAsync(ctx, ex); }
    }

    private async Task HandleAsync(HttpContext ctx, Exception ex)
    {
        var problem = new ProblemDetails { Instance = ctx.Request.Path };
        var traceId = ctx.TraceIdentifier;

        switch (ex)
        {
            case Common.Exceptions.ValidationException vex:
                problem.Title = "Validation failed";
                problem.Status = vex.StatusCode;
                problem.Type = "https://httpstatuses.io/400";
                problem.Detail = vex.Message;
                problem.Extensions["errors"] = vex.Errors;
                break;
            case FluentValidation.ValidationException fv:
                problem.Title = "Validation failed";
                problem.Status = StatusCodes.Status400BadRequest;
                problem.Detail = "One or more validation errors occurred.";
                problem.Extensions["errors"] = fv.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                                  g => g.Select(e => e.ErrorMessage).ToArray());
                break;
            case AppException app:
                problem.Title = app.ErrorCode;
                problem.Status = app.StatusCode;
                problem.Detail = app.Message;
                break;
            case UnauthorizedAccessException:
                problem.Title = "unauthorized";
                problem.Status = StatusCodes.Status401Unauthorized;
                problem.Detail = ex.Message;
                break;
            default:
                _logger.LogError(ex, "Unhandled exception. TraceId={TraceId}", traceId);
                problem.Title = "internal_error";
                problem.Status = StatusCodes.Status500InternalServerError;
                problem.Detail = _env.IsDevelopment() ? ex.ToString() : "An unexpected error occurred.";
                break;
        }

        problem.Extensions["traceId"] = traceId;
        ctx.Response.StatusCode = problem.Status ?? 500;
        ctx.Response.ContentType = "application/problem+json";
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(problem,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}

