using FluentAssertions;
using FluentValidation.TestHelper;
using feetflow.Application.Features.Samples.Commands;

namespace feetflow.Application.Tests;

public class CreateSampleCommandValidatorTests
{
    private readonly CreateSampleCommandValidator _validator = new();

    [Fact]
    public void Should_Pass_WithValidData()
    {
        var command = new CreateSampleCommand("Valid Name", "A description");
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Should_Fail_WhenNameIsEmpty()
    {
        var command = new CreateSampleCommand("", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_Fail_WhenNameExceeds200Characters()
    {
        var command = new CreateSampleCommand(new string('a', 201), null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Should_Fail_WhenDescriptionExceeds1000Characters()
    {
        var command = new CreateSampleCommand("Name", new string('a', 1001));
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }
}
