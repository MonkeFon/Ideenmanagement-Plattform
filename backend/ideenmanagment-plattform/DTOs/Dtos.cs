using IdeaPlatform.Common.Pagination;
using IdeaPlatform.Domain.Enums;

namespace IdeaPlatform.DTOs;

// ===== Auth =====
public record RegisterRequest(string Email, string UserName, string Password, string FirstName, string LastName);
public record LoginRequest(string EmailOrUserName, string Password);
public record RefreshRequest(string RefreshToken);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record AuthResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, UserResponse User);

// ===== User =====
public record UserResponse(Guid Id, string Email, string UserName, string FirstName, string LastName,
    bool IsActive, DateTime CreatedAt, DateTime? LastLoginAt, IReadOnlyList<string> Roles);

public record UserDetailResponse(Guid Id, string Email, string UserName, string FirstName, string LastName,
    bool IsActive, DateTime CreatedAt, DateTime? LastLoginAt,
    IReadOnlyList<string> Roles, IReadOnlyList<string> Permissions);

public record UpdateUserRequest(string FirstName, string LastName, bool IsActive);
public record UpdateProfileRequest(string FirstName, string LastName);
public record AssignRoleRequest(Guid RoleId);

public class UserFilterQuery : PageQuery
{
    public string? Search { get; set; }
    public bool? IsActive { get; set; }
    public Guid? RoleId { get; set; }
}

// ===== Roles & Permissions =====
public record RoleResponse(Guid Id, string Name, string? Description, IReadOnlyList<string> Permissions);
public record CreateRoleRequest(string Name, string? Description, IReadOnlyList<Guid>? PermissionIds);
public record UpdateRoleRequest(string Name, string? Description);
public record AssignPermissionRequest(Guid PermissionId);
public record PermissionResponse(Guid Id, string Code, string? Description);

// ===== Category =====
public record CategoryResponse(Guid Id, string Name, string? Description, bool IsActive);
public record CreateCategoryRequest(string Name, string? Description);
public record UpdateCategoryRequest(string Name, string? Description, bool IsActive);

// ===== Idea =====
public record IdeaListItemResponse(Guid Id, string Title, IdeaStatus Status, Guid AuthorId, string AuthorName,
    Guid CategoryId, string CategoryName, int VoteScore, int CommentCount, DateTime CreatedAt);

public record IdeaDetailResponse(Guid Id, string Title, string Description, IdeaStatus Status,
    Guid AuthorId, string AuthorName, Guid CategoryId, string CategoryName,
    DateTime CreatedAt, DateTime? UpdatedAt,
    DateTime? ApprovedAt, string? RejectedReason,
    int ViewCount, int VoteUp, int VoteDown, int VoteScore,
    IReadOnlyList<AttachmentResponse> Attachments);

public record CreateIdeaRequest(string Title, string Description, Guid CategoryId);
public record UpdateIdeaRequest(string Title, string Description, Guid CategoryId);

public class IdeaFilterQuery : PageQuery
{
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public IdeaStatus? Status { get; set; }
    public Guid? AuthorId { get; set; }
}

// ===== Comment =====
public record CommentResponse(Guid Id, Guid IdeaId, Guid AuthorId, string AuthorName,
    Guid? ParentCommentId, string Content, DateTime CreatedAt, DateTime? UpdatedAt);
public record CreateCommentRequest(string Content, Guid? ParentCommentId);
public record UpdateCommentRequest(string Content);

// ===== Vote =====
public record VoteRequest(VoteType VoteType);
public record VoteSummaryResponse(Guid IdeaId, int Up, int Down, int Score, VoteType? CurrentUserVote);

// ===== Attachment =====
public record AttachmentResponse(Guid Id, Guid IdeaId, string FileName, string ContentType,
    long SizeBytes, DateTime CreatedAt, Guid UploadedById);

// ===== Moderation =====
public record RejectIdeaRequest(string Reason);

// ===== Notifications =====
public record NotificationResponse(Guid Id, NotificationType Type, string Title, string Message,
    bool IsRead, DateTime? ReadAt, Guid? ReferenceId, DateTime CreatedAt);
public record UnreadCountResponse(int Count);

// ===== AuditLog =====
public record AuditLogResponse(Guid Id, Guid? UserId, string? UserName, AuditAction Action,
    string EntityName, string? EntityId, string? IpAddress, DateTime Timestamp);

public class AuditLogFilterQuery : PageQuery
{
    public Guid? UserId { get; set; }
    public string? EntityName { get; set; }
    public AuditAction? Action { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

// ===== Common =====
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);

