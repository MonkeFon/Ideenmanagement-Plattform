using IdeaPlatform.Data.Configurations;
using IdeaPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IdeaPlatform.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<IdeaCategory> IdeaCategories => Set<IdeaCategory>();
    public DbSet<Idea> Ideas => Set<Idea>();
    public DbSet<IdeaComment> IdeaComments => Set<IdeaComment>();
    public DbSet<IdeaVote> IdeaVotes => Set<IdeaVote>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);
        mb.ApplyConfigurationsFromAssembly(typeof(UserConfiguration).Assembly);
    }
}

