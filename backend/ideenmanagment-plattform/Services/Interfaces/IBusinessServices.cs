using IdeaPlatform.Common.Pagination;
using IdeaPlatform.Domain.Enums;
using IdeaPlatform.DTOs;
using Microsoft.AspNetCore.Http;

namespace IdeaPlatform.Services.Interfaces;

public interface IAuthService
{
    Task<UserResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest req, string? ip, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(string refreshToken, string? ip, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, string? ip, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest req, CancellationToken ct = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct = default);
}

public interface IUserService
{
    Task<UserDetailResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserDetailResponse> GetCurrentAsync(CancellationToken ct = default);
    Task<UserResponse> UpdateCurrentAsync(UpdateProfileRequest req, CancellationToken ct = default);
    Task<UserResponse> UpdateAsync(Guid id, UpdateUserRequest req, CancellationToken ct = default);
    Task<PagedResult<UserResponse>> GetPagedAsync(UserFilterQuery query, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<UserResponse> AssignRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default);
    Task RemoveRoleAsync(Guid userId, Guid roleId, CancellationToken ct = default);
    Task<UserResponse> SetActiveAsync(Guid id, bool active, CancellationToken ct = default);
}

public interface IRoleService
{
    Task<IReadOnlyList<RoleResponse>> GetAllAsync(CancellationToken ct = default);
    Task<RoleResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<RoleResponse> CreateAsync(CreateRoleRequest req, CancellationToken ct = default);
    Task<RoleResponse> UpdateAsync(Guid id, UpdateRoleRequest req, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<RoleResponse> AssignPermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default);
    Task RemovePermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default);
    Task<IReadOnlyList<PermissionResponse>> GetAllPermissionsAsync(CancellationToken ct = default);
}

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryResponse>> GetAllAsync(CancellationToken ct = default);
    Task<CategoryResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest req, CancellationToken ct = default);
    Task<CategoryResponse> UpdateAsync(Guid id, UpdateCategoryRequest req, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IIdeaService
{
    Task<IdeaDetailResponse> CreateAsync(CreateIdeaRequest req, CancellationToken ct = default);
    Task<IdeaDetailResponse> UpdateAsync(Guid id, UpdateIdeaRequest req, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<IdeaDetailResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<IdeaListItemResponse>> GetPagedAsync(IdeaFilterQuery query, CancellationToken ct = default);
    Task<IdeaDetailResponse> SubmitAsync(Guid id, CancellationToken ct = default);
}

public interface ICommentService
{
    Task<CommentResponse> AddAsync(Guid ideaId, CreateCommentRequest req, CancellationToken ct = default);
    Task<CommentResponse> UpdateAsync(Guid commentId, UpdateCommentRequest req, CancellationToken ct = default);
    Task DeleteAsync(Guid commentId, CancellationToken ct = default);
    Task<PagedResult<CommentResponse>> GetForIdeaAsync(Guid ideaId, PageQuery query, CancellationToken ct = default);
}

public interface IVoteService
{
    Task<VoteSummaryResponse> VoteAsync(Guid ideaId, VoteType type, CancellationToken ct = default);
    Task<VoteSummaryResponse> RemoveAsync(Guid ideaId, CancellationToken ct = default);
    Task<VoteSummaryResponse> GetSummaryAsync(Guid ideaId, CancellationToken ct = default);
}

public interface IAttachmentService
{
    Task<AttachmentResponse> UploadAsync(Guid ideaId, IFormFile file, CancellationToken ct = default);
    Task<(Stream stream, string contentType, string fileName)> DownloadAsync(Guid attachmentId, CancellationToken ct = default);
    Task DeleteAsync(Guid attachmentId, CancellationToken ct = default);
    Task<IReadOnlyList<AttachmentResponse>> ListAsync(Guid ideaId, CancellationToken ct = default);
}

public interface IModerationService
{
    Task<PagedResult<IdeaListItemResponse>> GetQueueAsync(PageQuery query, CancellationToken ct = default);
    Task<IdeaDetailResponse> ApproveAsync(Guid ideaId, CancellationToken ct = default);
    Task<IdeaDetailResponse> RejectAsync(Guid ideaId, string reason, CancellationToken ct = default);
    Task<IdeaDetailResponse> ArchiveAsync(Guid ideaId, CancellationToken ct = default);
}

public interface INotificationService
{
    Task CreateAsync(Guid userId, NotificationType type, string title, string message, Guid? referenceId = null, CancellationToken ct = default);
    Task<PagedResult<NotificationResponse>> GetForCurrentUserAsync(PageQuery query, CancellationToken ct = default);
    Task<int> UnreadCountAsync(CancellationToken ct = default);
    Task MarkReadAsync(Guid id, CancellationToken ct = default);
    Task MarkAllReadAsync(CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IAuditLogService
{
    Task LogAsync(AuditAction action, string entityName, string? entityId,
        object? oldValues = null, object? newValues = null, CancellationToken ct = default);
    Task<PagedResult<AuditLogResponse>> QueryAsync(AuditLogFilterQuery query, CancellationToken ct = default);
}

