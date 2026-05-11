namespace IdeaPlatform.Common.Exceptions;

public abstract class AppException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }
    protected AppException(string message, int statusCode, string errorCode) : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message = "Resource not found") : base(message, 404, "not_found") { }
    public NotFoundException(string entity, object key)
        : base($"{entity} with key '{key}' was not found.", 404, "not_found") { }
}

public class ValidationException : AppException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }
    public ValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base("Validation failed.", 400, "validation_error") => Errors = errors;
    public ValidationException(string field, string message)
        : this(new Dictionary<string, string[]> { [field] = new[] { message } }) { }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, 409, "conflict") { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Access denied.") : base(message, 403, "forbidden") { }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Unauthorized.") : base(message, 401, "unauthorized") { }
}

