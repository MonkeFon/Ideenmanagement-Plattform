using IdeaPlatform.Domain.Common;

namespace IdeaPlatform.Domain.Entities;

public class User : AuditableEntity, ISoftDeletable
{
    public string Email { get; set; } = default!;
    public string UserName { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<Idea> Ideas { get; set; } = new List<Idea>();
    public ICollection<IdeaComment> Comments { get; set; } = new List<IdeaComment>();
    public ICollection<IdeaVote> Votes { get; set; } = new List<IdeaVote>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

