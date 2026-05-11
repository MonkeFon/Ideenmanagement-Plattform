using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace IdeaPlatform.Authorization;

/// <summary>Erzeugt dynamisch Policies für [HasPermission("...")].</summary>
public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options) { }

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        var basePolicy = await base.GetPolicyAsync(policyName);
        if (basePolicy is not null) return basePolicy;

        if (policyName.StartsWith(HasPermissionAttribute.PolicyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var permission = policyName[HasPermissionAttribute.PolicyPrefix.Length..];
            return new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(new PermissionRequirement(permission))
                .Build();
        }
        return null;
    }
}

