using AutoMapper;
using IdeaPlatform.Common.Exceptions;
using IdeaPlatform.Common.Pagination;
using IdeaPlatform.Data;
using IdeaPlatform.Domain.Entities;
using IdeaPlatform.Domain.Enums;
using IdeaPlatform.DTOs;
using IdeaPlatform.Repositories.Interfaces;
using IdeaPlatform.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IdeaPlatform.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly IRoleRepository _roles;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _audit;

    public UserService(IUserRepository users, IRoleRepository roles, AppDbContext db, IMapper mapper,
        IUnitOfWork uow, ICurrentUserService currentUser, IAuditLogService audit)
    {
        _users = users; _roles = roles; _db = db; _mapper = mapper;
        _uow = uow; _currentUser = currentUser; _audit = audit;
    }

    public async Task<UserDetailResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _users.GetWithRolesAndPermissionsAsync(id, ct) ?? throw new NotFoundException(nameof(User), id);
        return _mapper.Map<UserDetailResponse>(user);
    }

    public async Task<UserDetailResponse> GetCurrentAsync(CancellationToken ct = default)
    {
        var id = _currentUser.UserId ?? throw new UnauthorizedException();
        return await GetByIdAsync(id, ct);
    }

    public async Task<UserResponse> UpdateCurrentAsync(UpdateProfileRequest req, CancellationToken ct = default)
    {
        var id = _currentUser.UserId ?? throw new UnauthorizedException();
        var user = await _users.GetWithRolesAsync(id, ct) ?? throw new NotFoundException(nameof(User), id);
        user.FirstName = req.FirstName;
        user.LastName = req.LastName;
        await _audit.LogAsync(AuditAction.Update, nameof(User), id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<UserResponse>(user);
    }

    public async Task<UserResponse> UpdateAsync(Guid id, UpdateUserRequest req, CancellationToken ct = default)
    {
        var user = await _users.GetWithRolesAsync(id, ct) ?? throw new NotFoundException(nameof(User), id);
        user.FirstName = req.FirstName;
        user.LastName = req.LastName;
        user.IsActive = req.IsActive;
        await _audit.LogAsync(AuditAction.Update, nameof(User), id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<UserResponse>(user);
    }

    public async Task<PagedResult<UserResponse>> GetPagedAsync(UserFilterQuery query, CancellationToken ct = default)
    {
        var q = _db.Users.AsNoTracking().Include(u => u.UserRoles).ThenInclude(ur => ur.Role).AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(u => u.Email.ToLower().Contains(s) || u.UserName.ToLower().Contains(s)
                          || u.FirstName.ToLower().Contains(s) || u.LastName.ToLower().Contains(s));
        }
        if (query.IsActive.HasValue) q = q.Where(u => u.IsActive == query.IsActive.Value);
        if (query.RoleId.HasValue) q = q.Where(u => u.UserRoles.Any(r => r.RoleId == query.RoleId.Value));

        q = (query.SortBy?.ToLower(), query.SortDir?.ToLower()) switch
        {
            ("email", "desc") => q.OrderByDescending(u => u.Email),
            ("email", _) => q.OrderBy(u => u.Email),
            ("username", "desc") => q.OrderByDescending(u => u.UserName),
            ("username", _) => q.OrderBy(u => u.UserName),
            (_, "asc") => q.OrderBy(u => u.CreatedAt),
            _ => q.OrderByDescending(u => u.CreatedAt)
        };

        var total = await q.LongCountAsync(ct);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        var mapped = items.Select(u => _mapper.Map<UserResponse>(u)).ToList();
        return PagedResult<UserResponse>.Create(mapped, query.Page, query.PageSize, total);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(User), id);
        _users.Remove(user); // soft delete via interceptor
        await _audit.LogAsync(AuditAction.Delete, nameof(User), id.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<UserResponse> AssignRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default)
    {
        var user = await _users.GetWithRolesAsync(userId, ct) ?? throw new NotFoundException(nameof(User), userId);
        var role = await _roles.GetByIdAsync(roleId, ct) ?? throw new NotFoundException(nameof(Role), roleId);
        if (user.UserRoles.Any(ur => ur.RoleId == roleId)) throw new ConflictException("Role already assigned.");
        user.UserRoles.Add(new UserRole { UserId = userId, RoleId = roleId, AssignedAt = DateTime.UtcNow });
        await _audit.LogAsync(AuditAction.RoleAssigned, nameof(User), userId.ToString(), null, new { roleId }, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<UserResponse>(user);
    }

    public async Task RemoveRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default)
    {
        var ur = await _db.UserRoles.FirstOrDefaultAsync(x => x.UserId == userId && x.RoleId == roleId, ct)
            ?? throw new NotFoundException("UserRole", $"{userId}/{roleId}");
        _db.UserRoles.Remove(ur);
        await _audit.LogAsync(AuditAction.RoleRemoved, nameof(User), userId.ToString(), null, new { roleId }, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<UserResponse> SetActiveAsync(Guid id, bool active, CancellationToken ct = default)
    {
        var user = await _users.GetWithRolesAsync(id, ct) ?? throw new NotFoundException(nameof(User), id);
        user.IsActive = active;
        await _audit.LogAsync(AuditAction.Update, nameof(User), id.ToString(), null, new { IsActive = active }, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<UserResponse>(user);
    }
}

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roles;
    private readonly IPermissionRepository _permissions;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly IAuditLogService _audit;

    public RoleService(IRoleRepository roles, IPermissionRepository permissions, AppDbContext db,
        IMapper mapper, IUnitOfWork uow, IAuditLogService audit)
    {
        _roles = roles; _permissions = permissions; _db = db; _mapper = mapper; _uow = uow; _audit = audit;
    }

    public async Task<IReadOnlyList<RoleResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _db.Roles.AsNoTracking()
            .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .OrderBy(r => r.Name).ToListAsync(ct);
        return list.Select(_mapper.Map<RoleResponse>).ToList();
    }

    public async Task<RoleResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var r = await _roles.GetWithPermissionsAsync(id, ct) ?? throw new NotFoundException(nameof(Role), id);
        return _mapper.Map<RoleResponse>(r);
    }

    public async Task<RoleResponse> CreateAsync(CreateRoleRequest req, CancellationToken ct = default)
    {
        if (await _roles.AnyAsync(r => r.Name == req.Name, ct)) throw new ConflictException("Role name already exists.");
        var role = new Role { Name = req.Name, Description = req.Description };
        if (req.PermissionIds != null)
            foreach (var pid in req.PermissionIds.Distinct())
                role.RolePermissions.Add(new RolePermission { PermissionId = pid });
        await _roles.AddAsync(role, ct);
        await _audit.LogAsync(AuditAction.Create, nameof(Role), role.Id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        var loaded = await _roles.GetWithPermissionsAsync(role.Id, ct);
        return _mapper.Map<RoleResponse>(loaded!);
    }

    public async Task<RoleResponse> UpdateAsync(Guid id, UpdateRoleRequest req, CancellationToken ct = default)
    {
        var role = await _roles.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Role), id);
        role.Name = req.Name;
        role.Description = req.Description;
        await _audit.LogAsync(AuditAction.Update, nameof(Role), id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        var loaded = await _roles.GetWithPermissionsAsync(id, ct);
        return _mapper.Map<RoleResponse>(loaded!);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var role = await _roles.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Role), id);
        _roles.Remove(role);
        await _audit.LogAsync(AuditAction.Delete, nameof(Role), id.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<RoleResponse> AssignPermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default)
    {
        var role = await _roles.GetWithPermissionsAsync(roleId, ct) ?? throw new NotFoundException(nameof(Role), roleId);
        if (role.RolePermissions.Any(rp => rp.PermissionId == permissionId))
            throw new ConflictException("Permission already assigned.");
        _ = await _permissions.GetByIdAsync(permissionId, ct) ?? throw new NotFoundException(nameof(Permission), permissionId);
        role.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
        await _audit.LogAsync(AuditAction.Update, nameof(Role), roleId.ToString(), null, new { AddPermission = permissionId }, ct);
        await _uow.SaveChangesAsync(ct);
        var loaded = await _roles.GetWithPermissionsAsync(roleId, ct);
        return _mapper.Map<RoleResponse>(loaded!);
    }

    public async Task RemovePermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default)
    {
        var rp = await _db.RolePermissions.FirstOrDefaultAsync(x => x.RoleId == roleId && x.PermissionId == permissionId, ct)
            ?? throw new NotFoundException("RolePermission", $"{roleId}/{permissionId}");
        _db.RolePermissions.Remove(rp);
        await _audit.LogAsync(AuditAction.Update, nameof(Role), roleId.ToString(), null, new { RemovePermission = permissionId }, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<PermissionResponse>> GetAllPermissionsAsync(CancellationToken ct = default)
    {
        var list = await _db.Permissions.AsNoTracking().OrderBy(p => p.Code).ToListAsync(ct);
        return list.Select(_mapper.Map<PermissionResponse>).ToList();
    }
}

public class CategoryService : ICategoryService
{
    private readonly IIdeaCategoryRepository _repo;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly IAuditLogService _audit;

    public CategoryService(IIdeaCategoryRepository repo, AppDbContext db, IMapper mapper, IUnitOfWork uow, IAuditLogService audit)
    { _repo = repo; _db = db; _mapper = mapper; _uow = uow; _audit = audit; }

    public async Task<IReadOnlyList<CategoryResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _db.IdeaCategories.AsNoTracking().OrderBy(c => c.Name).ToListAsync(ct);
        return list.Select(_mapper.Map<CategoryResponse>).ToList();
    }
    public async Task<CategoryResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(IdeaCategory), id);
        return _mapper.Map<CategoryResponse>(c);
    }
    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest req, CancellationToken ct = default)
    {
        if (await _repo.AnyAsync(c => c.Name == req.Name, ct)) throw new ConflictException("Category name already exists.");
        var c = new IdeaCategory { Name = req.Name, Description = req.Description, IsActive = true };
        await _repo.AddAsync(c, ct);
        await _audit.LogAsync(AuditAction.Create, nameof(IdeaCategory), c.Id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<CategoryResponse>(c);
    }
    public async Task<CategoryResponse> UpdateAsync(Guid id, UpdateCategoryRequest req, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(IdeaCategory), id);
        c.Name = req.Name; c.Description = req.Description; c.IsActive = req.IsActive;
        await _audit.LogAsync(AuditAction.Update, nameof(IdeaCategory), id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<CategoryResponse>(c);
    }
    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(IdeaCategory), id);
        _repo.Remove(c);
        await _audit.LogAsync(AuditAction.Delete, nameof(IdeaCategory), id.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }
}

