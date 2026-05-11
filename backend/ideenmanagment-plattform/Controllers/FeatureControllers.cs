using IdeaPlatform.Authorization;
using IdeaPlatform.Common.Pagination;
using IdeaPlatform.Common.Responses;
using IdeaPlatform.DTOs;
using IdeaPlatform.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IdeaPlatform.Controllers;

[ApiController, Route("api/categories"), Authorize]
public class IdeaCategoriesController : ControllerBase
{
    private readonly ICategoryService _svc;
    public IdeaCategoriesController(ICategoryService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CategoryResponse>>>> GetAll(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<CategoryResponse>>.Ok(await _svc.GetAllAsync(ct)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CategoryResponse>>> Get(Guid id, CancellationToken ct)
        => Ok(ApiResponse<CategoryResponse>.Ok(await _svc.GetByIdAsync(id, ct)));

    [HttpPost, HasPermission(Permissions.CategoriesManage)]
    public async Task<ActionResult<ApiResponse<CategoryResponse>>> Create([FromBody] CreateCategoryRequest req, CancellationToken ct)
    { var c = await _svc.CreateAsync(req, ct); return Created($"/api/categories/{c.Id}", ApiResponse<CategoryResponse>.Ok(c)); }

    [HttpPut("{id:guid}"), HasPermission(Permissions.CategoriesManage)]
    public async Task<ActionResult<ApiResponse<CategoryResponse>>> Update(Guid id, [FromBody] UpdateCategoryRequest req, CancellationToken ct)
        => Ok(ApiResponse<CategoryResponse>.Ok(await _svc.UpdateAsync(id, req, ct)));

    [HttpDelete("{id:guid}"), HasPermission(Permissions.CategoriesManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await _svc.DeleteAsync(id, ct); return NoContent(); }
}

[ApiController, Route("api/ideas"), Authorize]
public class IdeasController : ControllerBase
{
    private readonly IIdeaService _svc;
    public IdeasController(IIdeaService svc) => _svc = svc;

    [HttpGet, HasPermission(Permissions.IdeasRead)]
    public async Task<ActionResult<ApiResponse<PagedResult<IdeaListItemResponse>>>> List([FromQuery] IdeaFilterQuery query, CancellationToken ct)
        => Ok(ApiResponse<PagedResult<IdeaListItemResponse>>.Ok(await _svc.GetPagedAsync(query, ct)));

    [HttpGet("{id:guid}"), HasPermission(Permissions.IdeasRead)]
    public async Task<ActionResult<ApiResponse<IdeaDetailResponse>>> Get(Guid id, CancellationToken ct)
        => Ok(ApiResponse<IdeaDetailResponse>.Ok(await _svc.GetByIdAsync(id, ct)));

    [HttpPost, HasPermission(Permissions.IdeasCreate)]
    public async Task<ActionResult<ApiResponse<IdeaDetailResponse>>> Create([FromBody] CreateIdeaRequest req, CancellationToken ct)
    { var i = await _svc.CreateAsync(req, ct); return Created($"/api/ideas/{i.Id}", ApiResponse<IdeaDetailResponse>.Ok(i)); }

    [HttpPut("{id:guid}"), HasPermission(Permissions.IdeasUpdateOwn)]
    public async Task<ActionResult<ApiResponse<IdeaDetailResponse>>> Update(Guid id, [FromBody] UpdateIdeaRequest req, CancellationToken ct)
        => Ok(ApiResponse<IdeaDetailResponse>.Ok(await _svc.UpdateAsync(id, req, ct)));

    [HttpDelete("{id:guid}"), Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await _svc.DeleteAsync(id, ct); return NoContent(); }

    [HttpPost("{id:guid}/submit"), HasPermission(Permissions.IdeasCreate)]
    public async Task<ActionResult<ApiResponse<IdeaDetailResponse>>> Submit(Guid id, CancellationToken ct)
        => Ok(ApiResponse<IdeaDetailResponse>.Ok(await _svc.SubmitAsync(id, ct)));
}

[ApiController, Route("api/ideas/{ideaId:guid}/comments"), Authorize]
public class IdeaCommentsController : ControllerBase
{
    private readonly ICommentService _svc;
    public IdeaCommentsController(ICommentService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CommentResponse>>>> List(Guid ideaId, [FromQuery] PageQuery query, CancellationToken ct)
        => Ok(ApiResponse<PagedResult<CommentResponse>>.Ok(await _svc.GetForIdeaAsync(ideaId, query, ct)));

    [HttpPost, HasPermission(Permissions.CommentsCreate)]
    public async Task<ActionResult<ApiResponse<CommentResponse>>> Add(Guid ideaId, [FromBody] CreateCommentRequest req, CancellationToken ct)
    { var c = await _svc.AddAsync(ideaId, req, ct); return Created($"/api/ideas/{ideaId}/comments/{c.Id}", ApiResponse<CommentResponse>.Ok(c)); }

    [HttpPut("{commentId:guid}"), HasPermission(Permissions.CommentsUpdateOwn)]
    public async Task<ActionResult<ApiResponse<CommentResponse>>> Update(Guid ideaId, Guid commentId, [FromBody] UpdateCommentRequest req, CancellationToken ct)
        => Ok(ApiResponse<CommentResponse>.Ok(await _svc.UpdateAsync(commentId, req, ct)));

    [HttpDelete("{commentId:guid}")]
    public async Task<IActionResult> Delete(Guid ideaId, Guid commentId, CancellationToken ct)
    { await _svc.DeleteAsync(commentId, ct); return NoContent(); }
}

[ApiController, Route("api/ideas/{ideaId:guid}/votes"), Authorize]
public class IdeaVotesController : ControllerBase
{
    private readonly IVoteService _svc;
    public IdeaVotesController(IVoteService svc) => _svc = svc;

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<VoteSummaryResponse>>> Summary(Guid ideaId, CancellationToken ct)
        => Ok(ApiResponse<VoteSummaryResponse>.Ok(await _svc.GetSummaryAsync(ideaId, ct)));

    [HttpPost, HasPermission(Permissions.VotesCast)]
    public async Task<ActionResult<ApiResponse<VoteSummaryResponse>>> Vote(Guid ideaId, [FromBody] VoteRequest req, CancellationToken ct)
        => Ok(ApiResponse<VoteSummaryResponse>.Ok(await _svc.VoteAsync(ideaId, req.VoteType, ct)));

    [HttpDelete, HasPermission(Permissions.VotesCast)]
    public async Task<ActionResult<ApiResponse<VoteSummaryResponse>>> Remove(Guid ideaId, CancellationToken ct)
        => Ok(ApiResponse<VoteSummaryResponse>.Ok(await _svc.RemoveAsync(ideaId, ct)));
}

[ApiController, Route("api/ideas/{ideaId:guid}/attachments"), Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly IAttachmentService _svc;
    public AttachmentsController(IAttachmentService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AttachmentResponse>>>> List(Guid ideaId, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<AttachmentResponse>>.Ok(await _svc.ListAsync(ideaId, ct)));

    [HttpPost, HasPermission(Permissions.AttachmentsUpload)]
    [RequestSizeLimit(20_000_000)]
    public async Task<ActionResult<ApiResponse<AttachmentResponse>>> Upload(Guid ideaId, IFormFile file, CancellationToken ct)
    { var a = await _svc.UploadAsync(ideaId, file, ct); return Created($"/api/ideas/{ideaId}/attachments/{a.Id}", ApiResponse<AttachmentResponse>.Ok(a)); }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid ideaId, Guid id, CancellationToken ct)
    {
        var (stream, ct2, name) = await _svc.DownloadAsync(id, ct);
        return File(stream, ct2, name);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid ideaId, Guid id, CancellationToken ct)
    { await _svc.DeleteAsync(id, ct); return NoContent(); }
}

[ApiController, Route("api/moderation"), Authorize]
public class ModerationController : ControllerBase
{
    private readonly IModerationService _svc;
    public ModerationController(IModerationService svc) => _svc = svc;

    [HttpGet("queue"), HasPermission(Permissions.IdeasModerate)]
    public async Task<ActionResult<ApiResponse<PagedResult<IdeaListItemResponse>>>> Queue([FromQuery] PageQuery q, CancellationToken ct)
        => Ok(ApiResponse<PagedResult<IdeaListItemResponse>>.Ok(await _svc.GetQueueAsync(q, ct)));

    [HttpPost("ideas/{id:guid}/approve"), HasPermission(Permissions.IdeasModerate)]
    public async Task<ActionResult<ApiResponse<IdeaDetailResponse>>> Approve(Guid id, CancellationToken ct)
        => Ok(ApiResponse<IdeaDetailResponse>.Ok(await _svc.ApproveAsync(id, ct)));

    [HttpPost("ideas/{id:guid}/reject"), HasPermission(Permissions.IdeasModerate)]
    public async Task<ActionResult<ApiResponse<IdeaDetailResponse>>> Reject(Guid id, [FromBody] RejectIdeaRequest req, CancellationToken ct)
        => Ok(ApiResponse<IdeaDetailResponse>.Ok(await _svc.RejectAsync(id, req.Reason, ct)));

    [HttpPost("ideas/{id:guid}/archive"), HasPermission(Permissions.IdeasModerate)]
    public async Task<ActionResult<ApiResponse<IdeaDetailResponse>>> Archive(Guid id, CancellationToken ct)
        => Ok(ApiResponse<IdeaDetailResponse>.Ok(await _svc.ArchiveAsync(id, ct)));
}

[ApiController, Route("api/notifications"), Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _svc;
    public NotificationsController(INotificationService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationResponse>>>> List([FromQuery] PageQuery q, CancellationToken ct)
        => Ok(ApiResponse<PagedResult<NotificationResponse>>.Ok(await _svc.GetForCurrentUserAsync(q, ct)));

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<UnreadCountResponse>>> Unread(CancellationToken ct)
        => Ok(ApiResponse<UnreadCountResponse>.Ok(new UnreadCountResponse(await _svc.UnreadCountAsync(ct))));

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> Read(Guid id, CancellationToken ct) { await _svc.MarkReadAsync(id, ct); return NoContent(); }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll(CancellationToken ct) { await _svc.MarkAllReadAsync(ct); return NoContent(); }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) { await _svc.DeleteAsync(id, ct); return NoContent(); }
}

[ApiController, Route("api/audit-logs"), Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _svc;
    public AuditLogsController(IAuditLogService svc) => _svc = svc;

    [HttpGet, HasPermission(Permissions.AuditRead)]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditLogResponse>>>> Query([FromQuery] AuditLogFilterQuery q, CancellationToken ct)
        => Ok(ApiResponse<PagedResult<AuditLogResponse>>.Ok(await _svc.QueryAsync(q, ct)));
}

