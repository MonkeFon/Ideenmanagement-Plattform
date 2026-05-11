using System.Linq.Expressions;
using IdeaPlatform.Data;
using IdeaPlatform.Domain.Entities;
using IdeaPlatform.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IdeaPlatform.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Db;
    protected readonly DbSet<T> Set;

    public Repository(AppDbContext db) { Db = db; Set = db.Set<T>(); }

    public virtual Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) => Set.FindAsync(new object[] { id }, ct).AsTask();
    public IQueryable<T> Query(bool tracking = false) => tracking ? Set : Set.AsNoTracking();
    public Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        Set.AsNoTracking().FirstOrDefaultAsync(predicate, ct);
    public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        Set.AnyAsync(predicate, ct);
    public async Task AddAsync(T entity, CancellationToken ct = default) => await Set.AddAsync(entity, ct);
    public void Update(T entity) => Set.Update(entity);
    public void Remove(T entity) => Set.Remove(entity);
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext db) : base(db) { }
    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        Set.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), ct);
    public Task<User?> GetByUserNameAsync(string userName, CancellationToken ct = default) =>
        Set.FirstOrDefaultAsync(u => u.UserName.ToLower() == userName.ToLower(), ct);
    public Task<User?> GetWithRolesAsync(Guid id, CancellationToken ct = default) =>
        Set.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).FirstOrDefaultAsync(u => u.Id == id, ct);
    public Task<User?> GetWithRolesAndPermissionsAsync(Guid id, CancellationToken ct = default) =>
        Set.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
}

public class RoleRepository : Repository<Role>, IRoleRepository
{
    public RoleRepository(AppDbContext db) : base(db) { }
    public Task<Role?> GetByNameAsync(string name, CancellationToken ct = default) =>
        Set.FirstOrDefaultAsync(r => r.Name == name, ct);
    public Task<Role?> GetWithPermissionsAsync(Guid id, CancellationToken ct = default) =>
        Set.Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
}

public class PermissionRepository : Repository<Permission>, IPermissionRepository
{
    public PermissionRepository(AppDbContext db) : base(db) { }
    public Task<Permission?> GetByCodeAsync(string code, CancellationToken ct = default) =>
        Set.FirstOrDefaultAsync(p => p.Code == code, ct);
}

public class IdeaCategoryRepository : Repository<IdeaCategory>, IIdeaCategoryRepository
{
    public IdeaCategoryRepository(AppDbContext db) : base(db) { }
}

public class IdeaRepository : Repository<Idea>, IIdeaRepository
{
    public IdeaRepository(AppDbContext db) : base(db) { }
    public Task<Idea?> GetDetailAsync(Guid id, CancellationToken ct = default) =>
        Set.Include(i => i.Author)
           .Include(i => i.Category)
           .Include(i => i.Attachments)
           .Include(i => i.Votes)
           .FirstOrDefaultAsync(i => i.Id == id, ct);
}

public class IdeaCommentRepository : Repository<IdeaComment>, IIdeaCommentRepository
{
    public IdeaCommentRepository(AppDbContext db) : base(db) { }
}

public class IdeaVoteRepository : Repository<IdeaVote>, IIdeaVoteRepository
{
    public IdeaVoteRepository(AppDbContext db) : base(db) { }
    public Task<IdeaVote?> GetByIdeaAndUserAsync(Guid ideaId, Guid userId, CancellationToken ct = default) =>
        Set.FirstOrDefaultAsync(v => v.IdeaId == ideaId && v.UserId == userId, ct);
}

public class AttachmentRepository : Repository<Attachment>, IAttachmentRepository
{
    public AttachmentRepository(AppDbContext db) : base(db) { }
}

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(AppDbContext db) : base(db) { }
    public Task<int> CountUnreadAsync(Guid userId, CancellationToken ct = default) =>
        Set.CountAsync(n => n.UserId == userId && !n.IsRead, ct);
}

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AppDbContext _db;
    public AuditLogRepository(AppDbContext db) => _db = db;
    public async Task AddAsync(AuditLog log, CancellationToken ct = default) => await _db.AuditLogs.AddAsync(log, ct);
    public IQueryable<AuditLog> Query() => _db.AuditLogs.AsNoTracking().Include(x => x.User);
}

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _db;
    public RefreshTokenRepository(AppDbContext db) => _db = db;
    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default) =>
        _db.RefreshTokens.Include(t => t.User).FirstOrDefaultAsync(t => t.TokenHash == tokenHash, ct);
    public async Task AddAsync(RefreshToken token, CancellationToken ct = default) => await _db.RefreshTokens.AddAsync(token, ct);
    public void Update(RefreshToken token) => _db.RefreshTokens.Update(token);
    public async Task RevokeAllForUserAsync(Guid userId, string? ip, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var tokens = await _db.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync(ct);
        foreach (var t in tokens) { t.RevokedAt = now; t.RevokedByIp = ip; }
    }
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;
    public UnitOfWork(AppDbContext db) => _db = db;
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}

