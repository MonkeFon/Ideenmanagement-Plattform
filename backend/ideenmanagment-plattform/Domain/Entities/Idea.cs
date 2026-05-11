using IdeaPlatform.Domain.Common;
using IdeaPlatform.Domain.Enums;

namespace IdeaPlatform.Domain.Entities;

public class IdeaCategory : AuditableEntity, ISoftDeletable
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<Idea> Ideas { get; set; } = new List<Idea>();
}

public class Idea : AuditableEntity, ISoftDeletable
{
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public IdeaStatus Status { get; set; } = IdeaStatus.Draft;

    public Guid AuthorId { get; set; }
    public User Author { get; set; } = default!;

    public Guid CategoryId { get; set; }
    public IdeaCategory Category { get; set; } = default!;

    public Guid? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectedReason { get; set; }

    public int ViewCount { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<IdeaComment> Comments { get; set; } = new List<IdeaComment>();
    public ICollection<IdeaVote> Votes { get; set; } = new List<IdeaVote>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}

public class IdeaComment : AuditableEntity, ISoftDeletable
{
    public Guid IdeaId { get; set; }
    public Idea Idea { get; set; } = default!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = default!;
    public Guid? ParentCommentId { get; set; }
    public IdeaComment? ParentComment { get; set; }
    public string Content { get; set; } = default!;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<IdeaComment> Replies { get; set; } = new List<IdeaComment>();
}

public class IdeaVote : AuditableEntity
{
    public Guid IdeaId { get; set; }
    public Idea Idea { get; set; } = default!;
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public VoteType VoteType { get; set; }
}

public class Attachment : AuditableEntity, ISoftDeletable
{
    public Guid IdeaId { get; set; }
    public Idea Idea { get; set; } = default!;
    public string FileName { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = default!;
    public Guid UploadedById { get; set; }
    public User? UploadedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

