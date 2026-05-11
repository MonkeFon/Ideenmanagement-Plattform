using System.Linq.Expressions;
using IdeaPlatform.Domain.Entities;

namespace IdeaPlatform.Repositories.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    IQueryable<T> Query(bool tracking = false);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
}

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByUserNameAsync(string userName, CancellationToken ct = default);
    Task<User?> GetWithRolesAsync(Guid id, CancellationToken ct = default);
    Task<User?> GetWithRolesAndPermissionsAsync(Guid id, CancellationToken ct = default);
}

public interface IRoleRepository : IRepository<Role>
{
    Task<Role?> GetByNameAsync(string name, CancellationToken ct = default);
    Task<Role?> GetWithPermissionsAsync(Guid id, CancellationToken ct = default);
}

public interface IPermissionRepository : IRepository<Permission>
{
    Task<Permission?> GetByCodeAsync(string code, CancellationToken ct = default);
}

public interface IIdeaCategoryRepository : IRepository<IdeaCategory> { }

public interface IIdeaRepository : IRepository<Idea>
{
    Task<Idea?> GetDetailAsync(Guid id, CancellationToken ct = default);
}

public interface IIdeaCommentRepository : IRepository<IdeaComment> { }

public interface IIdeaVoteRepository : IRepository<IdeaVote>
{
    Task<IdeaVote?> GetByIdeaAndUserAsync(Guid ideaId, Guid userId, CancellationToken ct = default);
}

public interface IAttachmentRepository : IRepository<Attachment> { }
public interface INotificationRepository : IRepository<Notification>
{
    Task<int> CountUnreadAsync(Guid userId, CancellationToken ct = default);
}

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken ct = default);
    IQueryable<AuditLog> Query();
}

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default);
    Task AddAsync(RefreshToken token, CancellationToken ct = default);
    void Update(RefreshToken token);
    Task RevokeAllForUserAsync(Guid userId, string? ip, CancellationToken ct = default);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

