using AutoMapper;
using IdeaPlatform.Authorization;
using IdeaPlatform.Common.Exceptions;
using IdeaPlatform.Common.Pagination;
using IdeaPlatform.Configuration;
using IdeaPlatform.Data;
using IdeaPlatform.Domain.Entities;
using IdeaPlatform.Domain.Enums;
using IdeaPlatform.DTOs;
using IdeaPlatform.Repositories.Interfaces;
using IdeaPlatform.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IdeaPlatform.Services;

public class AttachmentService : IAttachmentService
{
    private readonly IAttachmentRepository _attachments;
    private readonly IIdeaRepository _ideas;
    private readonly IFileStorage _storage;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _audit;
    private readonly FileStorageOptions _fsOpts;

    public AttachmentService(IAttachmentRepository attachments, IIdeaRepository ideas, IFileStorage storage,
        AppDbContext db, IMapper mapper, IUnitOfWork uow, ICurrentUserService currentUser,
        IAuditLogService audit, IOptions<FileStorageOptions> fsOpts)
    {
        _attachments = attachments; _ideas = ideas; _storage = storage; _db = db;
        _mapper = mapper; _uow = uow; _currentUser = currentUser; _audit = audit;
        _fsOpts = fsOpts.Value;
    }

    public async Task<AttachmentResponse> UploadAsync(Guid ideaId, IFormFile file, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var idea = await _ideas.GetByIdAsync(ideaId, ct) ?? throw new NotFoundException(nameof(Idea), ideaId);
        if (idea.AuthorId != userId && !_currentUser.HasPermission(Permissions.IdeasModerate))
            throw new ForbiddenException();
        if (file.Length == 0) throw new ValidationException("file", "File is empty.");
        if (file.Length > _fsOpts.MaxFileSizeBytes)
            throw new ValidationException("file", $"File exceeds max size of {_fsOpts.MaxFileSizeBytes} bytes.");
        if (_fsOpts.AllowedContentTypes.Length > 0 &&
            !_fsOpts.AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            throw new ValidationException("file", $"Content type '{file.ContentType}' is not allowed.");

        await using var stream = file.OpenReadStream();
        var rel = await _storage.SaveAsync(stream, file.FileName, ct);

        var att = new Attachment
        {
            IdeaId = ideaId, FileName = file.FileName, ContentType = file.ContentType,
            SizeBytes = file.Length, StoragePath = rel, UploadedById = userId
        };
        await _attachments.AddAsync(att, ct);
        await _audit.LogAsync(AuditAction.Create, nameof(Attachment), att.Id.ToString(), null, new { file.FileName, file.Length }, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<AttachmentResponse>(att);
    }

    public async Task<(Stream stream, string contentType, string fileName)> DownloadAsync(Guid attachmentId, CancellationToken ct = default)
    {
        var att = await _attachments.GetByIdAsync(attachmentId, ct) ?? throw new NotFoundException(nameof(Attachment), attachmentId);
        var stream = await _storage.OpenReadAsync(att.StoragePath, ct);
        return (stream, att.ContentType, att.FileName);
    }

    public async Task DeleteAsync(Guid attachmentId, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var att = await _attachments.GetByIdAsync(attachmentId, ct) ?? throw new NotFoundException(nameof(Attachment), attachmentId);
        var canAny = _currentUser.HasPermission(Permissions.AttachmentsDeleteAny);
        if (att.UploadedById != userId && !canAny) throw new ForbiddenException();
        _attachments.Remove(att);
        await _audit.LogAsync(AuditAction.Delete, nameof(Attachment), attachmentId.ToString(), null, null, ct);
        await _uow.SaveChangesAsync(ct);
        // Optional: physische Datei löschen (soft delete -> Datei bleibt erhalten für Audit).
    }

    public async Task<IReadOnlyList<AttachmentResponse>> ListAsync(Guid ideaId, CancellationToken ct = default)
    {
        var list = await _db.Attachments.AsNoTracking().Where(a => a.IdeaId == ideaId)
            .OrderByDescending(a => a.CreatedAt).ToListAsync(ct);
        return list.Select(_mapper.Map<AttachmentResponse>).ToList();
    }
}

public class ModerationService : IModerationService
{
    private readonly IIdeaRepository _ideas;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditLogService _audit;
    private readonly INotificationService _notifications;

    public ModerationService(IIdeaRepository ideas, AppDbContext db, IMapper mapper, IUnitOfWork uow,
        ICurrentUserService currentUser, IAuditLogService audit, INotificationService notifications)
    {
        _ideas = ideas; _db = db; _mapper = mapper; _uow = uow;
        _currentUser = currentUser; _audit = audit; _notifications = notifications;
    }

    public async Task<PagedResult<IdeaListItemResponse>> GetQueueAsync(PageQuery query, CancellationToken ct = default)
    {
        var q = _db.Ideas.AsNoTracking()
            .Include(i => i.Author).Include(i => i.Category)
            .Include(i => i.Votes).Include(i => i.Comments)
            .Where(i => i.Status == IdeaStatus.Submitted || i.Status == IdeaStatus.UnderReview)
            .OrderBy(i => i.CreatedAt);
        var total = await q.LongCountAsync(ct);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return PagedResult<IdeaListItemResponse>.Create(items.Select(_mapper.Map<IdeaListItemResponse>).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<IdeaDetailResponse> ApproveAsync(Guid ideaId, CancellationToken ct = default)
    {
        var idea = await _ideas.GetByIdAsync(ideaId, ct) ?? throw new NotFoundException(nameof(Idea), ideaId);
        if (idea.Status is IdeaStatus.Approved or IdeaStatus.Archived)
            throw new ConflictException("Idea already approved or archived.");
        idea.Status = IdeaStatus.Approved;
        idea.ApprovedById = _currentUser.UserId;
        idea.ApprovedAt = DateTime.UtcNow;
        idea.RejectedReason = null;
        await _audit.LogAsync(AuditAction.Approve, nameof(Idea), ideaId.ToString(), null, null, ct);
        await _notifications.CreateAsync(idea.AuthorId, NotificationType.IdeaApproved,
            "Your idea was approved", idea.Title, idea.Id, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<IdeaDetailResponse>((await _ideas.GetDetailAsync(ideaId, ct))!);
    }

    public async Task<IdeaDetailResponse> RejectAsync(Guid ideaId, string reason, CancellationToken ct = default)
    {
        var idea = await _ideas.GetByIdAsync(ideaId, ct) ?? throw new NotFoundException(nameof(Idea), ideaId);
        if (idea.Status is IdeaStatus.Approved or IdeaStatus.Archived)
            throw new ConflictException("Idea cannot be rejected in its current state.");
        idea.Status = IdeaStatus.Rejected;
        idea.RejectedReason = reason;
        await _audit.LogAsync(AuditAction.Reject, nameof(Idea), ideaId.ToString(), null, new { reason }, ct);
        await _notifications.CreateAsync(idea.AuthorId, NotificationType.IdeaRejected,
            "Your idea was rejected", reason, idea.Id, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<IdeaDetailResponse>((await _ideas.GetDetailAsync(ideaId, ct))!);
    }

    public async Task<IdeaDetailResponse> ArchiveAsync(Guid ideaId, CancellationToken ct = default)
    {
        var idea = await _ideas.GetByIdAsync(ideaId, ct) ?? throw new NotFoundException(nameof(Idea), ideaId);
        idea.Status = IdeaStatus.Archived;
        await _audit.LogAsync(AuditAction.Archive, nameof(Idea), ideaId.ToString(), null, null, ct);
        await _notifications.CreateAsync(idea.AuthorId, NotificationType.IdeaArchived,
            "Your idea was archived", idea.Title, idea.Id, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<IdeaDetailResponse>((await _ideas.GetDetailAsync(ideaId, ct))!);
    }
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public NotificationService(INotificationRepository repo, AppDbContext db, IMapper mapper,
        IUnitOfWork uow, ICurrentUserService currentUser)
    { _repo = repo; _db = db; _mapper = mapper; _uow = uow; _currentUser = currentUser; }

    public async Task CreateAsync(Guid userId, NotificationType type, string title, string message,
        Guid? referenceId = null, CancellationToken ct = default)
    {
        var n = new Notification
        {
            UserId = userId, Type = type, Title = title, Message = message, ReferenceId = referenceId
        };
        await _repo.AddAsync(n, ct);
    }

    public async Task<PagedResult<NotificationResponse>> GetForCurrentUserAsync(PageQuery query, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var q = _db.Notifications.AsNoTracking().Where(n => n.UserId == userId).OrderByDescending(n => n.CreatedAt);
        var total = await q.LongCountAsync(ct);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return PagedResult<NotificationResponse>.Create(items.Select(_mapper.Map<NotificationResponse>).ToList(), query.Page, query.PageSize, total);
    }

    public async Task<int> UnreadCountAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        return await _repo.CountUnreadAsync(userId, ct);
    }

    public async Task MarkReadAsync(Guid id, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct)
            ?? throw new NotFoundException(nameof(Notification), id);
        if (!n.IsRead) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; await _uow.SaveChangesAsync(ct); }
    }

    public async Task MarkAllReadAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var now = DateTime.UtcNow;
        await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAt, now), ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct)
            ?? throw new NotFoundException(nameof(Notification), id);
        _db.Notifications.Remove(n);
        await _uow.SaveChangesAsync(ct);
    }
}

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repo;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public AuditLogService(IAuditLogRepository repo, IMapper mapper, ICurrentUserService currentUser)
    { _repo = repo; _mapper = mapper; _currentUser = currentUser; }

    public Task LogAsync(AuditAction action, string entityName, string? entityId,
        object? oldValues = null, object? newValues = null, CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            UserId = _currentUser.UserId,
            IpAddress = _currentUser.IpAddress,
            UserAgent = _currentUser.UserAgent,
            OldValuesJson = oldValues is null ? null : System.Text.Json.JsonSerializer.Serialize(oldValues),
            NewValuesJson = newValues is null ? null : System.Text.Json.JsonSerializer.Serialize(newValues),
            Timestamp = DateTime.UtcNow
        };
        return _repo.AddAsync(log, ct);
    }

    public async Task<PagedResult<AuditLogResponse>> QueryAsync(AuditLogFilterQuery query, CancellationToken ct = default)
    {
        var q = _repo.Query();
        if (query.UserId.HasValue) q = q.Where(a => a.UserId == query.UserId);
        if (!string.IsNullOrWhiteSpace(query.EntityName)) q = q.Where(a => a.EntityName == query.EntityName);
        if (query.Action.HasValue) q = q.Where(a => a.Action == query.Action.Value);
        if (query.From.HasValue) q = q.Where(a => a.Timestamp >= query.From.Value);
        if (query.To.HasValue) q = q.Where(a => a.Timestamp <= query.To.Value);
        q = q.OrderByDescending(a => a.Timestamp);
        var total = await q.LongCountAsync(ct);
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return PagedResult<AuditLogResponse>.Create(items.Select(_mapper.Map<AuditLogResponse>).ToList(), query.Page, query.PageSize, total);
    }
}

