using IdeaPlatform.Authorization;
using IdeaPlatform.Configuration;
using IdeaPlatform.Data;
using IdeaPlatform.Domain.Entities;
using IdeaPlatform.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IdeaPlatform.Data.Seed;

public static class SeedData
{
    public static async Task RunAsync(AppDbContext db, IPasswordHasher hasher, SeedOptions seed, CancellationToken ct = default)
    {
        await SeedPermissionsAsync(db, ct);
        await SeedRolesAsync(db, ct);
        await SeedCategoriesAsync(db, ct);
        await SeedAdminAsync(db, hasher, seed, ct);
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedPermissionsAsync(AppDbContext db, CancellationToken ct)
    {
        var existing = await db.Permissions.Select(p => p.Code).ToListAsync(ct);
        foreach (var code in Permissions.All.Except(existing))
            db.Permissions.Add(new Permission { Code = code, Description = code });
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedRolesAsync(AppDbContext db, CancellationToken ct)
    {
        var allPerms = await db.Permissions.ToListAsync(ct);
        var permByCode = allPerms.ToDictionary(p => p.Code, p => p.Id);

        async Task<Role> EnsureRoleAsync(string name, string description)
        {
            var r = await db.Roles.FirstOrDefaultAsync(x => x.Name == name, ct);
            if (r is null) { r = new Role { Name = name, Description = description }; db.Roles.Add(r); await db.SaveChangesAsync(ct); }
            return r;
        }
        async Task EnsurePermsAsync(Role role, IEnumerable<string> codes)
        {
            var current = await db.RolePermissions.Where(rp => rp.RoleId == role.Id).Select(rp => rp.PermissionId).ToListAsync(ct);
            foreach (var code in codes)
            {
                if (!permByCode.TryGetValue(code, out var pid)) continue;
                if (!current.Contains(pid))
                    db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = pid });
            }
        }

        var emp = await EnsureRoleAsync(RoleNames.Mitarbeiter, "Standard-Mitarbeiter");
        var mod = await EnsureRoleAsync(RoleNames.Moderator, "Moderator für Ideen und Kommentare");
        var adm = await EnsureRoleAsync(RoleNames.Administrator, "Voller Admin-Zugriff");

        await EnsurePermsAsync(emp, new[]
        {
            Permissions.IdeasCreate, Permissions.IdeasRead, Permissions.IdeasUpdateOwn, Permissions.IdeasDeleteOwn,
            Permissions.CommentsCreate, Permissions.CommentsUpdateOwn, Permissions.CommentsDeleteOwn,
            Permissions.VotesCast, Permissions.AttachmentsUpload, Permissions.NotificationsRead
        });

        await EnsurePermsAsync(mod, new[]
        {
            Permissions.IdeasCreate, Permissions.IdeasRead, Permissions.IdeasUpdateOwn, Permissions.IdeasDeleteOwn,
            Permissions.IdeasModerate, Permissions.IdeasDeleteAny,
            Permissions.CommentsCreate, Permissions.CommentsUpdateOwn, Permissions.CommentsDeleteOwn, Permissions.CommentsDeleteAny,
            Permissions.VotesCast, Permissions.AttachmentsUpload, Permissions.AttachmentsDeleteAny,
            Permissions.CategoriesManage, Permissions.NotificationsRead, Permissions.UsersRead
        });

        await EnsurePermsAsync(adm, Permissions.All);

        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedCategoriesAsync(AppDbContext db, CancellationToken ct)
    {
        string[] defaults = { "Produktivität", "Prozesse", "Arbeitsumfeld", "Innovation", "Sonstiges" };
        var existing = await db.IdeaCategories.Select(c => c.Name).ToListAsync(ct);
        foreach (var name in defaults.Except(existing))
            db.IdeaCategories.Add(new IdeaCategory { Name = name, IsActive = true, Description = $"Default Kategorie: {name}" });
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedAdminAsync(AppDbContext db, IPasswordHasher hasher, SeedOptions seed, CancellationToken ct)
    {
        var exists = await db.Users.AnyAsync(u => u.Email == seed.AdminEmail || u.UserName == seed.AdminUserName, ct);
        if (exists) return;

        var adminRole = await db.Roles.FirstAsync(r => r.Name == RoleNames.Administrator, ct);
        var admin = new User
        {
            Email = seed.AdminEmail,
            UserName = seed.AdminUserName,
            FirstName = "System",
            LastName = "Administrator",
            PasswordHash = hasher.Hash(seed.AdminPassword),
            IsActive = true
        };
        admin.UserRoles.Add(new UserRole { RoleId = adminRole.Id, AssignedAt = DateTime.UtcNow });
        db.Users.Add(admin);
        await db.SaveChangesAsync(ct);
    }
}

