using IdeaPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IdeaPlatform.Data.Configurations;

public class IdeaCategoryConfiguration : IEntityTypeConfiguration<IdeaCategory>
{
    public void Configure(EntityTypeBuilder<IdeaCategory> b)
    {
        b.ToTable("idea_categories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(100);
        b.HasIndex(x => x.Name).IsUnique();
        b.Property(x => x.Description).HasMaxLength(500);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class IdeaConfiguration : IEntityTypeConfiguration<Idea>
{
    public void Configure(EntityTypeBuilder<Idea> b)
    {
        b.ToTable("ideas");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).IsRequired().HasMaxLength(150);
        b.Property(x => x.Description).IsRequired().HasMaxLength(10000);
        b.Property(x => x.RejectedReason).HasMaxLength(1000);

        b.HasOne(x => x.Author).WithMany(u => u.Ideas)
            .HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Category).WithMany(c => c.Ideas)
            .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ApprovedBy).WithMany()
            .HasForeignKey(x => x.ApprovedById).OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.CategoryId);
        b.HasIndex(x => x.AuthorId);
        b.HasIndex(x => x.CreatedAt);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class IdeaCommentConfiguration : IEntityTypeConfiguration<IdeaComment>
{
    public void Configure(EntityTypeBuilder<IdeaComment> b)
    {
        b.ToTable("idea_comments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Content).IsRequired().HasMaxLength(2000);

        b.HasOne(x => x.Idea).WithMany(i => i.Comments)
            .HasForeignKey(x => x.IdeaId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Author).WithMany(u => u.Comments)
            .HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ParentComment).WithMany(x => x.Replies)
            .HasForeignKey(x => x.ParentCommentId).OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => x.IdeaId);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class IdeaVoteConfiguration : IEntityTypeConfiguration<IdeaVote>
{
    public void Configure(EntityTypeBuilder<IdeaVote> b)
    {
        b.ToTable("idea_votes");
        b.HasKey(x => x.Id);
        b.HasOne(x => x.Idea).WithMany(i => i.Votes)
            .HasForeignKey(x => x.IdeaId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.User).WithMany(u => u.Votes)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.IdeaId, x.UserId }).IsUnique();
    }
}

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> b)
    {
        b.ToTable("attachments");
        b.HasKey(x => x.Id);
        b.Property(x => x.FileName).IsRequired().HasMaxLength(260);
        b.Property(x => x.ContentType).IsRequired().HasMaxLength(150);
        b.Property(x => x.StoragePath).IsRequired().HasMaxLength(500);
        b.HasOne(x => x.Idea).WithMany(i => i.Attachments)
            .HasForeignKey(x => x.IdeaId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.UploadedBy).WithMany()
            .HasForeignKey(x => x.UploadedById).OnDelete(DeleteBehavior.Restrict);
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).IsRequired().HasMaxLength(200);
        b.Property(x => x.Message).IsRequired().HasMaxLength(2000);
        b.HasOne(x => x.User).WithMany(u => u.Notifications)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.UserId, x.IsRead });
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("audit_logs");
        b.HasKey(x => x.Id);
        b.Property(x => x.EntityName).IsRequired().HasMaxLength(150);
        b.Property(x => x.EntityId).HasMaxLength(100);
        b.Property(x => x.IpAddress).HasMaxLength(64);
        b.Property(x => x.UserAgent).HasMaxLength(500);
        b.Property(x => x.OldValuesJson).HasColumnType("jsonb");
        b.Property(x => x.NewValuesJson).HasColumnType("jsonb");
        b.HasOne(x => x.User).WithMany()
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        b.HasIndex(x => new { x.EntityName, x.EntityId });
        b.HasIndex(x => x.Timestamp);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("refresh_tokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).IsRequired().HasMaxLength(256);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.UserId);
        b.HasOne(x => x.User).WithMany(u => u.RefreshTokens)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

