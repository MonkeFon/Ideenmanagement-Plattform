namespace IdeaPlatform.Domain.Enums;

public enum IdeaStatus
{
    Draft = 0,
    Submitted = 1,
    UnderReview = 2,
    Approved = 3,
    Rejected = 4,
    Archived = 5
}

public enum VoteType : short
{
    Down = -1,
    Up = 1
}

public enum NotificationType
{
    System = 0,
    IdeaSubmitted = 1,
    IdeaApproved = 2,
    IdeaRejected = 3,
    IdeaCommented = 4,
    IdeaVoted = 5,
    IdeaArchived = 6,
    CommentReplied = 7
}

public enum AuditAction
{
    Create = 0,
    Update = 1,
    Delete = 2,
    Login = 3,
    Logout = 4,
    LoginFailed = 5,
    Approve = 6,
    Reject = 7,
    Archive = 8,
    RoleAssigned = 9,
    RoleRemoved = 10,
    PasswordChanged = 11
}

