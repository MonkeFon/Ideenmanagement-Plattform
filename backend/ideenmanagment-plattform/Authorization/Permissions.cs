namespace IdeaPlatform.Authorization;

/// <summary>Zentral definierte Berechtigungscodes (RBAC).</summary>
public static class Permissions
{
    public const string UsersRead = "users.read";
    public const string UsersManage = "users.manage";
    public const string RolesManage = "roles.manage";
    public const string CategoriesManage = "categories.manage";

    public const string IdeasCreate = "ideas.create";
    public const string IdeasRead = "ideas.read";
    public const string IdeasUpdateOwn = "ideas.update.own";
    public const string IdeasDeleteOwn = "ideas.delete.own";
    public const string IdeasDeleteAny = "ideas.delete.any";
    public const string IdeasModerate = "ideas.moderate";

    public const string CommentsCreate = "comments.create";
    public const string CommentsUpdateOwn = "comments.update.own";
    public const string CommentsDeleteOwn = "comments.delete.own";
    public const string CommentsDeleteAny = "comments.delete.any";

    public const string VotesCast = "votes.cast";
    public const string AttachmentsUpload = "attachments.upload";
    public const string AttachmentsDeleteAny = "attachments.delete.any";

    public const string NotificationsRead = "notifications.read";
    public const string AuditRead = "audit.read";

    public static IReadOnlyList<string> All { get; } = new[]
    {
        UsersRead, UsersManage, RolesManage, CategoriesManage,
        IdeasCreate, IdeasRead, IdeasUpdateOwn, IdeasDeleteOwn, IdeasDeleteAny, IdeasModerate,
        CommentsCreate, CommentsUpdateOwn, CommentsDeleteOwn, CommentsDeleteAny,
        VotesCast, AttachmentsUpload, AttachmentsDeleteAny,
        NotificationsRead, AuditRead
    };
}

public static class RoleNames
{
    public const string Mitarbeiter = "Mitarbeiter";
    public const string Moderator = "Moderator";
    public const string Administrator = "Administrator";
}

