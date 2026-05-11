using FluentAssertions;
using FluentValidation.TestHelper;
using IdeaPlatform.DTOs;
using IdeaPlatform.Validators;
using Xunit;

namespace IdeaPlatform.Tests.Unit;

public class ValidatorTests
{
    [Fact]
    public void RegisterRequest_Fails_OnWeakPassword()
    {
        var v = new RegisterRequestValidator();
        var r = v.TestValidate(new RegisterRequest("a@b.de", "alice", "weak", "Alice", "W"));
        r.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void RegisterRequest_Passes_OnStrongPassword()
    {
        var v = new RegisterRequestValidator();
        var r = v.TestValidate(new RegisterRequest("a@b.de", "alice", "Strong#12345", "Alice", "Wonder"));
        r.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CreateIdea_Fails_OnShortFields()
    {
        var v = new CreateIdeaRequestValidator();
        var r = v.TestValidate(new CreateIdeaRequest("hi", "too short", Guid.NewGuid()));
        r.ShouldHaveValidationErrorFor(x => x.Title);
        r.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void RejectIdea_RequiresReason()
    {
        var v = new RejectIdeaRequestValidator();
        v.TestValidate(new RejectIdeaRequest("")).ShouldHaveValidationErrorFor(x => x.Reason);
        v.TestValidate(new RejectIdeaRequest("Bereits umgesetzt.")).IsValid.Should().BeTrue();
    }
}

