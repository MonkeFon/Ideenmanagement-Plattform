using AutoMapper;
using IdeaPlatform.Authorization;
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

public class IdeaService : IIdeaService
{
    private readonly IIdeaRepository _ideas;
    private readonly IIdeaCategoryRepository _categories;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _audit;
    private readonly INotificationService _notifications;

    public IdeaService(IIdeaRepository ideas, IIdeaCategoryRepository categories, AppDbContext db,
        IMapper mapper, IUnitOfWork uow, ICurrentUserService currentUser, IAuditLogService audit,
        INotificationService notifications)
    {
        _ideas = ideas; _categories = categories; _db = db; _mapper = mapper;
        _uow = uow; _currentUser = currentUser; _audit = audit; _notifications = notifications;
    }

    public async Task<IdeaDetailResponse> CreateAsync(CreateIdeaRequest req, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        if (!await _categories.AnyAsync(c => c.Id == req.CategoryId && c.IsActive, ct))
            throw new ValidationException("categoryId", "Invalid or inactive category.");
        var idea = new Idea
        {
            Title = req.Title, Description = req.Description,
            CategoryId = req.CategoryId, AuthorId = userId, Status = IdeaStatus.Draft
        };
        await _ideas.AddAsync(idea, ct);
        await _audit.LogAsync(AuditAction.Create, nameof(Idea), idea.Id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(idea.Id, ct);
    }

    public async Task<IdeaDetailResponse> UpdateAsync(Guid id, UpdateIdeaRequest req, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var idea = await _ideas.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Idea), id);
        EnsureOwnerOrModerator(idea, userId);
        if (idea.Status is IdeaStatus.Approved or IdeaStatus.Archived)
            throw new ForbiddenException("Approved or archived ideas cannot be edited.");
        if (!await _categories.AnyAsync(c => c.Id == req.CategoryId && c.IsActive, ct))
            throw new ValidationException("categoryId", "Invalid or inactive category.");
        idea.Title = req.Title;
        idea.Description = req.Description;
        idea.CategoryId = req.CategoryId;
        await _audit.LogAsync(AuditAction.Update, nameof(Idea), id.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var idea = await _ideas.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Idea), id);
        var isOwner = idea.AuthorId == userId;
        var canDeleteAny = _currentUser.HasPermission(Permissions.IdeasDeleteAny);
        if (!isOwner && !canDeleteAny) throw new ForbiddenException();
        _ideas.Remove(idea);
        await _audit.LogAsync(AuditAction.Delete, nameof(Idea), id.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<IdeaDetailResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var idea = await _ideas.GetDetailAsync(id, ct) ?? throw new NotFoundException(nameof(Idea), id);
        idea.ViewCount++;
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<IdeaDetailResponse>(idea);
    }

    public async Task<PagedResult<IdeaListItemResponse>> GetPagedAsync(IdeaFilterQuery query, CancellationToken ct = default)
    {
        var q = _db.Ideas.AsNoTracking()
            .Include(i => i.Author).Include(i => i.Category)
            .Include(i => i.Votes).Include(i => i.Comments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.ToLower();
            q = q.Where(i => i.Title.ToLower().Contains(s) || i.Description.ToLower().Contains(s));
        }
        if (query.CategoryId.HasValue) q = q.Where(i => i.CategoryId == query.CategoryId.Value);
        if (query.Status.HasValue) q = q.Where(i => i.Status == query.Status.Value);
        if (query.AuthorId.HasValue) q = q.Where(i => i.AuthorId == query.AuthorId.Value);

        q = (query.SortBy?.ToLower(), query.SortDir?.ToLower()) switch
        {
            ("title", "asc") => q.OrderBy(i => i.Title),
            ("title", _) => q.OrderByDescending(i => i.Title),
            ("votes", "asc") => q.OrderBy(i => i.Votes.Sum(v => (int)v.VoteType)),
            ("votes", _) => q.OrderByDescending(i => i.Votes.Sum(v => (int)v.VoteType)),
            ("status", "asc") => q.OrderBy(i => i.Status),
            (_, "asc") => q.OrderBy(i => i.CreatedAt),
            _ => q.OrderByDescending(i => i.CreatedAt)
        };

        var total = await q.LongCountAsync(ct);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        var mapped = items.Select(_mapper.Map<IdeaListItemResponse>).ToList();
        return PagedResult<IdeaListItemResponse>.Create(mapped, query.Page, query.PageSize, total);
    }

    public async Task<IdeaDetailResponse> SubmitAsync(Guid id, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var idea = await _ideas.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Idea), id);
        if (idea.AuthorId != userId) throw new ForbiddenException();
        if (idea.Status != IdeaStatus.Draft) throw new ConflictException("Only draft ideas can be submitted.");
        idea.Status = IdeaStatus.Submitted;
        await _audit.LogAsync(AuditAction.Update, nameof(Idea), id.ToString(), null, new { Status = "Submitted" }, ct);

        // Notify moderators
        var modUserIds = await _db.UserRoles
            .Where(ur => ur.Role.Name == RoleNames.Moderator || ur.Role.Name == RoleNames.Administrator)
            .Select(ur => ur.UserId).Distinct().ToListAsync(ct);
        foreach (var mid in modUserIds)
            await _notifications.CreateAsync(mid, NotificationType.IdeaSubmitted,
                "New idea submitted", idea.Title, idea.Id, ct);

        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    private void EnsureOwnerOrModerator(Idea idea, Guid currentUserId)
    {
        if (idea.AuthorId == currentUserId) return;
        if (_currentUser.HasPermission(Permissions.IdeasModerate)) return;
        throw new ForbiddenException();
    }
}

public class CommentService : ICommentService
{
    private readonly IIdeaCommentRepository _comments;
    private readonly IIdeaRepository _ideas;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _audit;
    private readonly INotificationService _notifications;

    public CommentService(IIdeaCommentRepository comments, IIdeaRepository ideas, AppDbContext db,
        IMapper mapper, IUnitOfWork uow, ICurrentUserService currentUser, IAuditLogService audit,
        INotificationService notifications)
    {
        _comments = comments; _ideas = ideas; _db = db; _mapper = mapper;
        _uow = uow; _currentUser = currentUser; _audit = audit; _notifications = notifications;
    }

    public async Task<CommentResponse> AddAsync(Guid ideaId, CreateCommentRequest req, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var idea = await _ideas.GetByIdAsync(ideaId, ct) ?? throw new NotFoundException(nameof(Idea), ideaId);
        if (req.ParentCommentId.HasValue && !await _comments.AnyAsync(c => c.Id == req.ParentCommentId && c.IdeaId == ideaId, ct))
            throw new ValidationException("parentCommentId", "Invalid parent comment.");

        var c = new IdeaComment
        {
            IdeaId = ideaId, AuthorId = userId, Content = req.Content,
            ParentCommentId = req.ParentCommentId
        };
        await _comments.AddAsync(c, ct);
        await _audit.LogAsync(AuditAction.Create, nameof(IdeaComment), c.Id.ToString(), null, req, ct);

        if (idea.AuthorId != userId)
            await _notifications.CreateAsync(idea.AuthorId, NotificationType.IdeaCommented,
                "New comment on your idea", idea.Title, idea.Id, ct);
        if (req.ParentCommentId.HasValue)
        {
            var parent = await _db.IdeaComments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == req.ParentCommentId, ct);
            if (parent != null && parent.AuthorId != userId)
                await _notifications.CreateAsync(parent.AuthorId, NotificationType.CommentReplied,
                    "Reply to your comment", idea.Title, idea.Id, ct);
        }
        await _uow.SaveChangesAsync(ct);

        var loaded = await _db.IdeaComments.AsNoTracking().Include(x => x.Author).FirstAsync(x => x.Id == c.Id, ct);
        return _mapper.Map<CommentResponse>(loaded);
    }

    public async Task<CommentResponse> UpdateAsync(Guid commentId, UpdateCommentRequest req, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var c = await _comments.GetByIdAsync(commentId, ct) ?? throw new NotFoundException(nameof(IdeaComment), commentId);
        if (c.AuthorId != userId) throw new ForbiddenException();
        c.Content = req.Content;
        await _audit.LogAsync(AuditAction.Update, nameof(IdeaComment), commentId.ToString(), null, req, ct);
        await _uow.SaveChangesAsync(ct);
        var loaded = await _db.IdeaComments.AsNoTracking().Include(x => x.Author).FirstAsync(x => x.Id == c.Id, ct);
        return _mapper.Map<CommentResponse>(loaded);
    }

    public async Task DeleteAsync(Guid commentId, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var c = await _comments.GetByIdAsync(commentId, ct) ?? throw new NotFoundException(nameof(IdeaComment), commentId);
        var canAny = _currentUser.HasPermission(Permissions.CommentsDeleteAny);
        if (c.AuthorId != userId && !canAny) throw new ForbiddenException();
        _comments.Remove(c);
        await _audit.LogAsync(AuditAction.Delete, nameof(IdeaComment), commentId.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<CommentResponse>> GetForIdeaAsync(Guid ideaId, PageQuery query, CancellationToken ct = default)
    {
        var q = _db.IdeaComments.AsNoTracking().Include(x => x.Author)
            .Where(x => x.IdeaId == ideaId)
            .OrderBy(x => x.CreatedAt);
        var total = await q.LongCountAsync(ct);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return PagedResult<CommentResponse>.Create(items.Select(_mapper.Map<CommentResponse>).ToList(), query.Page, query.PageSize, total);
    }
}

public class VoteService : IVoteService
{
    private readonly IIdeaVoteRepository _votes;
    private readonly IIdeaRepository _ideas;
    private readonly AppDbContext _db;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;

    public VoteService(IIdeaVoteRepository votes, IIdeaRepository ideas, AppDbContext db,
        IUnitOfWork uow, ICurrentUserService currentUser, INotificationService notifications)
    {
        _votes = votes; _ideas = ideas; _db = db; _uow = uow; _currentUser = currentUser; _notifications = notifications;
    }

    public async Task<VoteSummaryResponse> VoteAsync(Guid ideaId, VoteType type, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var idea = await _ideas.GetByIdAsync(ideaId, ct) ?? throw new NotFoundException(nameof(Idea), ideaId);

        var existing = await _votes.GetByIdeaAndUserAsync(ideaId, userId, ct);
        if (existing == null)
        {
            await _votes.AddAsync(new IdeaVote { IdeaId = ideaId, UserId = userId, VoteType = type }, ct);
            if (idea.AuthorId != userId)
                await _notifications.CreateAsync(idea.AuthorId, NotificationType.IdeaVoted,
                    "Your idea received a vote", idea.Title, idea.Id, ct);
        }
        else if (existing.VoteType != type)
        {
            existing.VoteType = type;
        }
        await _uow.SaveChangesAsync(ct);
        return await GetSummaryAsync(ideaId, ct);
    }

    public async Task<VoteSummaryResponse> RemoveAsync(Guid ideaId, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var existing = await _votes.GetByIdeaAndUserAsync(ideaId, userId, ct);
        if (existing != null)
        {
            _votes.Remove(existing);
            await _uow.SaveChangesAsync(ct);
        }
        return await GetSummaryAsync(ideaId, ct);
    }

    public async Task<VoteSummaryResponse> GetSummaryAsync(Guid ideaId, CancellationToken ct = default)
    {
        var votes = await _db.IdeaVotes.AsNoTracking().Where(v => v.IdeaId == ideaId)
            .Select(v => new { v.UserId, v.VoteType }).ToListAsync(ct);
        var up = votes.Count(v => v.VoteType == VoteType.Up);
        var down = votes.Count(v => v.VoteType == VoteType.Down);
        VoteType? mine = null;
        if (_currentUser.UserId is { } uid)
            mine = votes.FirstOrDefault(v => v.UserId == uid)?.VoteType;
        return new VoteSummaryResponse(ideaId, up, down, up - down, mine);
    }
}

