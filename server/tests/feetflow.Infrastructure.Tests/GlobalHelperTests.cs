using FluentAssertions;
using feetflow.Application.Helpers;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace feetflow.Infrastructure.Tests;

public class GlobalHelperTests
{
    private readonly GlobalHelper _helper;

    public GlobalHelperTests()
    {
        var logger = Substitute.For<ILogger<GlobalHelper>>();
        _helper = new GlobalHelper(logger);
    }

    [Fact]
    public void Slugify_ShouldConvertToSlug()
    {
        GlobalHelper.Slugify("Hello World").Should().Be("hello-world");
        GlobalHelper.Slugify("Some_Thing").Should().Be("some-thing");
    }

    [Fact]
    public void GenerateCorrelationId_ShouldReturnNonEmpty()
    {
        var id = GlobalHelper.GenerateCorrelationId();
        id.Should().NotBeNullOrEmpty();
        id.Should().Contain("-");
    }

    [Fact]
    public void FormatValidationErrors_ShouldJoinErrors()
    {
        var errors = new Dictionary<string, string[]>
        {
            { "Name", new[] { "Name is required" } },
            { "Email", new[] { "Email is invalid" } }
        };

        var result = _helper.FormatValidationErrors(errors);
        result.Should().Contain("Name: Name is required");
        result.Should().Contain("Email: Email is invalid");
    }
}
