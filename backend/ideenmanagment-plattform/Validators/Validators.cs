using FluentValidation;
using IdeaPlatform.DTOs;

namespace IdeaPlatform.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.UserName).NotEmpty().Length(3, 50)
            .Matches("^[a-zA-Z0-9._-]+$").WithMessage("Only letters, digits, dot, underscore and dash are allowed.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(100)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.EmailOrUserName).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator() => RuleFor(x => x.RefreshToken).NotEmpty();
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(100)
            .Matches("[A-Z]").Matches("[a-z]").Matches("[0-9]").Matches("[^a-zA-Z0-9]")
            .NotEqual(x => x.CurrentPassword).WithMessage("New password must differ from current password.");
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
    }
}

public class AssignRoleRequestValidator : AbstractValidator<AssignRoleRequest>
{
    public AssignRoleRequestValidator() => RuleFor(x => x.RoleId).NotEmpty();
}

public class CreateRoleRequestValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class UpdateRoleRequestValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class AssignPermissionRequestValidator : AbstractValidator<AssignPermissionRequest>
{
    public AssignPermissionRequestValidator() => RuleFor(x => x.PermissionId).NotEmpty();
}

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class CreateIdeaRequestValidator : AbstractValidator<CreateIdeaRequest>
{
    public CreateIdeaRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(5, 150);
        RuleFor(x => x.Description).NotEmpty().Length(10, 10000);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public class UpdateIdeaRequestValidator : AbstractValidator<UpdateIdeaRequest>
{
    public UpdateIdeaRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().Length(5, 150);
        RuleFor(x => x.Description).NotEmpty().Length(10, 10000);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public class CreateCommentRequestValidator : AbstractValidator<CreateCommentRequest>
{
    public CreateCommentRequestValidator() => RuleFor(x => x.Content).NotEmpty().Length(1, 2000);
}

public class UpdateCommentRequestValidator : AbstractValidator<UpdateCommentRequest>
{
    public UpdateCommentRequestValidator() => RuleFor(x => x.Content).NotEmpty().Length(1, 2000);
}

public class VoteRequestValidator : AbstractValidator<VoteRequest>
{
    public VoteRequestValidator() => RuleFor(x => x.VoteType).IsInEnum();
}

public class RejectIdeaRequestValidator : AbstractValidator<RejectIdeaRequest>
{
    public RejectIdeaRequestValidator() => RuleFor(x => x.Reason).NotEmpty().Length(5, 1000);
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator() => RuleFor(x => x.Email).NotEmpty().EmailAddress();
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8)
            .Matches("[A-Z]").Matches("[a-z]").Matches("[0-9]").Matches("[^a-zA-Z0-9]");
    }
}

