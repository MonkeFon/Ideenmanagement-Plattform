using AutoMapper;
using IdeaPlatform.Domain.Entities;
using IdeaPlatform.Domain.Enums;
using IdeaPlatform.DTOs;

namespace IdeaPlatform.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserResponse>()
            .ForCtorParam(nameof(UserResponse.Roles),
                o => o.MapFrom(u => u.UserRoles.Select(ur => ur.Role.Name).ToList()));

        CreateMap<User, UserDetailResponse>()
            .ForCtorParam(nameof(UserDetailResponse.Roles),
                o => o.MapFrom(u => u.UserRoles.Select(ur => ur.Role.Name).ToList()))
            .ForCtorParam(nameof(UserDetailResponse.Permissions),
                o => o.MapFrom(u =>
                    u.UserRoles.SelectMany(ur => ur.Role.RolePermissions.Select(rp => rp.Permission.Code))
                              .Distinct().ToList()));

        CreateMap<Role, RoleResponse>()
            .ForCtorParam(nameof(RoleResponse.Permissions),
                o => o.MapFrom(r => r.RolePermissions.Select(rp => rp.Permission.Code).ToList()));

        CreateMap<Permission, PermissionResponse>();
        CreateMap<IdeaCategory, CategoryResponse>();
        CreateMap<Attachment, AttachmentResponse>();

        CreateMap<IdeaComment, CommentResponse>()
            .ForCtorParam(nameof(CommentResponse.AuthorName),
                o => o.MapFrom(c => c.Author.UserName));

        CreateMap<Idea, IdeaListItemResponse>()
            .ForCtorParam(nameof(IdeaListItemResponse.AuthorName), o => o.MapFrom(i => i.Author.UserName))
            .ForCtorParam(nameof(IdeaListItemResponse.CategoryName), o => o.MapFrom(i => i.Category.Name))
            .ForCtorParam(nameof(IdeaListItemResponse.VoteScore),
                o => o.MapFrom(i => i.Votes.Sum(v => (int)v.VoteType)))
            .ForCtorParam(nameof(IdeaListItemResponse.CommentCount),
                o => o.MapFrom(i => i.Comments.Count));

        CreateMap<Idea, IdeaDetailResponse>()
            .ForCtorParam(nameof(IdeaDetailResponse.AuthorName), o => o.MapFrom(i => i.Author.UserName))
            .ForCtorParam(nameof(IdeaDetailResponse.CategoryName), o => o.MapFrom(i => i.Category.Name))
            .ForCtorParam(nameof(IdeaDetailResponse.VoteUp),
                o => o.MapFrom(i => i.Votes.Count(v => v.VoteType == VoteType.Up)))
            .ForCtorParam(nameof(IdeaDetailResponse.VoteDown),
                o => o.MapFrom(i => i.Votes.Count(v => v.VoteType == VoteType.Down)))
            .ForCtorParam(nameof(IdeaDetailResponse.VoteScore),
                o => o.MapFrom(i => i.Votes.Sum(v => (int)v.VoteType)));

        CreateMap<Notification, NotificationResponse>();

        CreateMap<AuditLog, AuditLogResponse>()
            .ForCtorParam(nameof(AuditLogResponse.UserName),
                o => o.MapFrom(a => a.User != null ? a.User.UserName : null));
    }
}

