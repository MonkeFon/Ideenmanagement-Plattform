using IdeaPlatform.Domain.Common;

namespace IdeaPlatform.Domain.Entities;

public class Role : AuditableEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class Permission : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class UserRole
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = default!;
    public DateTime AssignedAt { get; set; }
}

public class RolePermission
{
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = default!;
    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = default!;
}

