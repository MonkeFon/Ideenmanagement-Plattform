using Microsoft.AspNetCore.Authorization;

namespace IdeaPlatform.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }
    public PermissionRequirement(string permission) => Permission = permission;
}

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var has = context.User.Claims.Any(c =>
            c.Type == "perm" &&
            string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));
        if (has) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class HasPermissionAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "PERM:";
    public HasPermissionAttribute(string permission) => Policy = PolicyPrefix + permission;
}

